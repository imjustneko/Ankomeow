/* Ankomeow — push мэдэгдэл илгээх endpoint (Vercel Serverless Function, Node runtime).
 *
 * Шаардлагатай environment variable-ууд (Vercel → Project → Settings → Environment Variables):
 *   FIREBASE_SERVICE_ACCOUNT — Firebase Console → Project settings → Service accounts →
 *                              "Generate new private key" товчоор татсан JSON-ыг бүтнээр нь наана.
 *   ALLOWED_ORIGIN           — аппын хаяг, ж: https://imjustneko.github.io
 *
 * Клиент нь Firebase ID token-оо Authorization: Bearer <token> толгойгоор илгээнэ.
 */

import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const CHAT_ROOM = "ankomeow-couple";
const ALLOWED_ACCOUNTS = ["andela", "neko"];

function admin() {
  if (!getApps().length) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!raw) throw new Error("FIREBASE_SERVICE_ACCOUNT тохируулаагүй байна");
    initializeApp({ credential: cert(JSON.parse(raw)) });
  }
}

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", process.env.ALLOWED_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.setHeader("Access-Control-Max-Age", "86400");
  res.setHeader("Vary", "Origin");
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    admin();
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  /* ── илгээгчийг баталгаажуулах ── */
  const header = req.headers.authorization || "";
  const idToken = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!idToken) return res.status(401).json({ error: "Токен алга" });

  let sender;
  try {
    const decoded = await getAuth().verifyIdToken(idToken);
    sender = (decoded.email || "").split("@")[0];
  } catch {
    return res.status(401).json({ error: "Токен буруу" });
  }
  if (!ALLOWED_ACCOUNTS.includes(sender)) return res.status(403).json({ error: "Зөвшөөрөлгүй бүртгэл" });

  /* ── хүлээн авагч ба агуулга ── */
  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const to = String(body.to || "");
  if (!ALLOWED_ACCOUNTS.includes(to)) return res.status(400).json({ error: "Хүлээн авагч буруу" });
  if (to === sender) return res.status(200).json({ sent: 0, note: "Өөрлүүгээ илгээхгүй" });

  const payload = {
    title: String(body.title || "Ankomeow").slice(0, 60),
    body: String(body.body || "").slice(0, 160),
    tag: String(body.tag || "ankomeow").slice(0, 40),
    tab: String(body.tab || "").slice(0, 20),
  };

  /* ── хүлээн авагчийн төхөөрөмжүүдийн token ── */
  const db = getFirestore();
  const ref = db.doc(`rooms/${CHAT_ROOM}/tokens/${to}`);
  const snap = await ref.get();
  const tokens = snap.exists ? snap.data().tokens || [] : [];
  if (!tokens.length) return res.status(200).json({ sent: 0, note: "Бүртгэлтэй төхөөрөмж алга" });

  /* data-only — мэдэгдлийн харагдах байдлыг service worker бүрэн удирдана */
  const result = await getMessaging().sendEachForMulticast({
    tokens,
    data: payload,
    webpush: { headers: { Urgency: "high", TTL: "3600" } },
  });

  /* ── хүчингүй болсон token-ыг цэвэрлэнэ ── */
  const dead = result.responses
    .map((r, i) => (!r.success && isDeadToken(r.error?.code) ? tokens[i] : null))
    .filter(Boolean);
  if (dead.length) await ref.update({ tokens: FieldValue.arrayRemove(...dead) });

  return res.status(200).json({ sent: result.successCount, failed: result.failureCount, removed: dead.length });
}

const isDeadToken = (code) =>
  code === "messaging/registration-token-not-registered" || code === "messaging/invalid-registration-token";
