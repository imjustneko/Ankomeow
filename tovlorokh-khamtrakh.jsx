import { useState, useEffect, useRef, useMemo } from "react";
import { ChevronLeft, Check, Trash2, Pause, Play, Upload, RotateCcw, X, MapPin, Pencil, Send, Heart, MessageCircle, Image as ImageIcon, CheckCheck, Download, Share2, LogOut, Plus, FileText, RefreshCw, Trophy, AlertTriangle, Bell, BellOff } from "lucide-react";
import { initializeApp } from "firebase/app";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, arrayUnion, increment } from "firebase/firestore";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { pushSupported, pushPermission, requestPushToken, notifyPartner, NOTIFY_ENDPOINT } from "./src/push.js";
import { useKeyboardInset } from "./src/hooks/useKeyboardInset.js";
import { useSwipeBack } from "./src/hooks/useSwipeBack.js";
import { usePullToRefresh } from "./src/hooks/usePullToRefresh.js";
import ChibiPet from "./src/chibi/ChibiPet.jsx";
import { createPokeSender } from "./src/chibi/poke.js";
import { pokeDelta, vibrationPattern, canVibrate, buzzMessage } from "./src/chibi/buzz.js";

/* ── Firebase (хос chat) ── */
const firebaseConfig = {
  apiKey: "AIzaSyAr_ryueRKTmjdFawhcqjXMag0mVS6lDzo",
  authDomain: "ankomeow-9852b.firebaseapp.com",
  projectId: "ankomeow-9852b",
  storageBucket: "ankomeow-9852b.firebasestorage.app",
  messagingSenderId: "905222050926",
  appId: "1:905222050926:web:de0f3841c701fa2c18027f",
  measurementId: "G-ZQ7BB8B1ER",
};
const fbApp = initializeApp(firebaseConfig);
/* Офлайн кэш: интернэтгүй үед уншина, бичсэн зүйл дараалалд орж дараа нь илгээгдэнэ.
   Хэрэв хөтөч дэмжихгүй бол (Private mode г.м.) энгийн санах ойн кэш рүү шилжинэ. */
let db;
try {
  db = initializeFirestore(fbApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  db = initializeFirestore(fbApp, {});
}
const auth = getAuth(fbApp);
const CHAT_ROOM = "ankomeow-couple";

/* ── хос бүртгэл (зөвхөн 2 fixed account, бүртгүүлэх боломжгүй) ── */
const ACCOUNTS = {
  andela: { email: "andela@ankomeow.app", name: "Andela" },
  neko: { email: "neko@ankomeow.app", name: "Neko" },
};
const accountKeyFromEmail = (email) => (email || "").split("@")[0];

/* ── хэрэглэгчийн зурган эх сурвалж (лого болон section icon-ууд) ──
   Зургууд public/img/ дотор жинхэнэ файлаар байрлана. Урьд нь base64-ээр JS
   bundle дотор шингэж байсан нь ~1.1MB нэмж, gzip-д шахагдахгүй, тусад нь
   кэшлэгдэхгүй, шаардлагагүй үедээ ч заавал татагддаг байлаа.
   Зам нь баримт бичгийн URL-тэй харьцангуй тул дэд зам дээр байршуулсан ч ажиллана. */
const IMG = (file) => `img/${file}`;

const LOGO = IMG("logo.webp");
const BG_MAIN = IMG("bg-main.webp");
const IC_CAT = IMG("ic-cat.webp");
const IC_WATER = IMG("ic-water.webp");
const IC_TIME = IMG("ic-time.webp");
const IC_GIF = IMG("ic-gif.webp");
const NAV_HOME = IMG("nav-home.webp");
const NAV_WATER = IMG("nav-water.webp");
const NAV_TIME = IMG("nav-time.webp");
const NAV_LIST = IMG("nav-list.webp");
const NAV_GIF = IMG("nav-gif.webp");
const IC_HOME = IMG("ic-home.webp");
const WELCOME_HERO = IMG("welcome-hero.webp");
const LOAD_0 = IMG("load-0.webp");
const LOAD_25 = IMG("load-25.webp");
const LOAD_50 = IMG("load-50.webp");
const LOAD_75 = IMG("load-75.webp");
const LOAD_90 = IMG("load-90.webp");
const LOAD_100 = IMG("load-100.webp");
const LOAD_ALMOST = IMG("load-almost.webp");
const LOAD_FINISH = IMG("load-finish.webp");
const LOAD_DONE = IMG("load-done.webp");
const IC_PROFILE = IMG("ic-profile.webp");
const AVATAR_0 = IMG("avatar-0.webp");
const AVATAR_1 = IMG("avatar-1.webp");
const AVATAR_2 = IMG("avatar-2.webp");
const AVATAR_3 = IMG("avatar-3.webp");
const AVATAR_4 = IMG("avatar-4.webp");
const AVATAR_5 = IMG("avatar-5.webp");
const AVATAR_6 = IMG("avatar-6.webp");
const AVATAR_7 = IMG("avatar-7.webp");
const AVATAR_8 = IMG("avatar-8.webp");
const AVATAR_9 = IMG("avatar-9.webp");
const AVATAR_10 = IMG("avatar-10.webp");
const AVATAR_11 = IMG("avatar-11.webp");
const AVATAR_12 = IMG("avatar-12.webp");
const AVATAR_13 = IMG("avatar-13.webp");
const AVATAR_14 = IMG("avatar-14.webp");
const AVATAR_15 = IMG("avatar-15.webp");
const AVATARS = [AVATAR_0, AVATAR_1, AVATAR_2, AVATAR_3, AVATAR_4, AVATAR_5, AVATAR_6, AVATAR_7, AVATAR_8, AVATAR_9, AVATAR_10, AVATAR_11, AVATAR_12, AVATAR_13, AVATAR_14, AVATAR_15];
const CAR_LIST = IMG("car-list.webp");
const CAR_WATER = IMG("car-water.webp");
const CAR_SCREEN = IMG("car-screen.webp");
const CAR_GIF = IMG("car-gif.webp");

const C = {
  paper: "#FDF8EF",
  paper2: "#F4EADA",
  card: "#FFFDF8",
  cardIn: "#F2E9DA",
  ink: "#5C4A3A",
  inkSoft: "#A08C77",
  line: "rgba(92,74,58,0.15)",
  line2: "rgba(92,74,58,0.32)",
  peach: "#F5AF8E",
  peachDeep: "#E8825C",
  sage: "#AFCDA6",
  sageDeep: "#7CAF71",
  water: "#8AD0EC",
  waterDeep: "#3FA3D1",
  gold: "#E3BC61",
  lilac: "#C6B0DD",
  lilacDeep: "#9E82C4",
};

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E\")";

const DAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

/* ── Улаанбаатарын цаг ── */
const TZ = "Asia/Ulaanbaatar";
const ubDay = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date());
const ubParts = () => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const g = (t) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { h: g("hour"), m: g("minute"), s: g("second") };
};
const pad = (n) => String(n).padStart(2, "0");

/* ── усны долгион ── */
const makeWave = (amp, len) => {
  const from = -260, to = 480, depth = 340;
  let d = `M ${from} 0`;
  for (let x = from; x < to; x += len)
    d += ` q ${len / 4} ${-amp} ${len / 2} 0 q ${len / 4} ${amp} ${len / 2} 0`;
  return d + ` L ${to} ${depth} L ${from} ${depth} Z`;
};
const WAVE_A = makeWave(7, 56);
const WAVE_B = makeWave(5, 44);

/* ── аяга ── */
function Glass({ ml, goal, spillKey, spilling, over }) {
  const pct = ml / goal;
  const fill = Math.min(pct, 1);
  const TOP = 32, BOT = 280;
  const level = BOT - (BOT - TOP) * fill;
  const wallX = (y) => 156 - (y - 30) * 0.0798;

  return (
    <div style={{ animation: spilling ? "wobble 700ms ease-in-out 2" : "none" }}>
      <svg viewBox="0 0 200 330" className="w-full max-w-[248px]" aria-label="Усны хэмжээ">
        <defs>
          <clipPath id="inside">
            <path d="M 44 30 L 63 268 Q 65 280 78 280 L 122 280 Q 135 280 137 268 L 156 30 Z" />
          </clipPath>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.water} />
            <stop offset="100%" stopColor={C.waterDeep} />
          </linearGradient>
          <radialGradient id="pud" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={C.water} stopOpacity="0.75" />
            <stop offset="100%" stopColor={C.waterDeep} stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* байнгын гоожилт — зорилгоос давсан үед аяга бодитоор гоожиж, шалбааг үлдээнэ */}
        <g style={{
          opacity: over ? 1 : 0, transition: "opacity 900ms cubic-bezier(.22,1,.36,1)",
          pointerEvents: "none",
        }}>
          <ellipse cx="96" cy="306" rx="46" ry="8" fill="url(#pud)" className={over ? "puddleBreathe" : ""} />
          <ellipse cx="118" cy="309" rx="20" ry="5" fill="url(#pud)" className={over ? "puddleBreathe" : ""} style={{ animationDelay: ".4s" }} />
          <circle cx="44" cy="30" r="3.2" fill={C.waterDeep} className={over ? "leakL" : ""} />
          <circle cx="156" cy="30" r="3" fill={C.waterDeep} className={over ? "leakR" : ""} style={{ animationDelay: "0.55s" }} />
        </g>

        {/* асгарсан ус — нэмэх бүрд шуух эффект */}
        {spilling && (
          <g key={spillKey}>
            <ellipse cx="100" cy="302" rx="52" ry="7" fill="url(#pud)"
              className="puddle" style={{ transformOrigin: "100px 302px" }} />
            {[
              [44, "L", 0], [42, "L", 0.18], [156, "R", 0.09], [158, "R", 0.3], [47, "L", 0.42],
            ].map(([x, side, d], i) => (
              <circle key={i} cx={x} cy={30} r={i % 2 ? 3.6 : 4.6} fill={C.waterDeep}
                className={side === "L" ? "dropL" : "dropR"} style={{ animationDelay: `${d}s` }} />
            ))}
          </g>
        )}

        {/* ус */}
        <g clipPath="url(#inside)">
          <g style={{ transform: `translateY(${level}px)`, transition: "transform 950ms cubic-bezier(.22,1,.36,1)" }}>
            <path d={WAVE_A} fill="url(#wg)" className="wv-a" />
            <path d={WAVE_B} fill={C.water} opacity="0.55" className="wv-b" />
            {ml > 0 && [[82, 0, 3.4], [104, 1.4, 2.4], [118, 2.6, 3], [93, 3.8, 2]].map(([x, dl, r], i) => (
              <circle key={i} cx={x} cy={170} r={r} fill="#fff" opacity="0"
                className="bub" style={{ animationDelay: `${dl}s` }} />
            ))}
          </g>
        </g>

        {/* контур */}
        <path d="M 38 26 L 58 272 Q 60 286 76 286 L 124 286 Q 140 286 142 272 L 162 26"
          fill="none" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="100" cy="26" rx="62" ry="8.5" fill="none" stroke={C.ink} strokeWidth="2.6" />
        <path d="M 50 60 L 66 250" stroke="#fff" strokeWidth="4.5" opacity="0.5" strokeLinecap="round" fill="none" />

        {/* хэмжээс */}
        {[0.25, 0.5, 0.75, 1].map((m) => {
          const y = BOT - (BOT - TOP) * m;
          const x = wallX(y);
          return (
            <g key={m}>
              <line x1={x - 15} y1={y} x2={x - 3} y2={y} stroke={C.line2} strokeWidth="1.8" strokeLinecap="round" />
              <text x={x + 9} y={y + 4} fontSize="11" fill={C.inkSoft} fontWeight="700">
                {Math.round((goal * m) / 50) * 50}
              </text>
            </g>
          );
        })}

        <text x="100" y="322" textAnchor="middle" fontSize="13.5" fontWeight="800"
          fill={pct > 1 ? C.peachDeep : C.inkSoft}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
    </div>
  );
}

/* ── жижиг элементүүд ── */
function Bar({ value, max, color }) {
  return (
    <div className="h-[8px] rounded-full overflow-hidden" style={{ background: C.cardIn }}>
      <div className="h-full rounded-full" style={{
        width: `${Math.min((value / max) * 100, 100)}%`, background: color,
        transition: "width 700ms cubic-bezier(.22,1,.36,1)",
      }} />
    </div>
  );
}

function Card({ children, onClick, tint, className = "" }) {
  return (
    <div onClick={onClick}
      className={`rounded-[26px] p-4 ${onClick ? "cursor-pointer active:scale-[0.97]" : ""} ${className}`}
      style={{
        background: tint ? `linear-gradient(158deg, ${tint} 0%, ${C.card} 130%)` : C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 2px 0 rgba(92,74,58,.05), 0 1px 0 rgba(255,255,255,.8) inset",
        transition: "transform 180ms ease",
      }}>
      {children}
    </div>
  );
}

function Pill({ children, onClick, active, color, className = "", ...rest }) {
  return (
    <button onClick={onClick} {...rest}
      className={`rounded-full font-bold active:scale-95 ${className}`}
      style={{
        background: active ? color : "transparent",
        color: active ? "#fff" : C.ink,
        border: `1.8px solid ${active ? color : C.line2}`,
        transition: "transform 150ms ease, background 200ms ease",
      }}>
      {children}
    </button>
  );
}

function Header({ title, sub, onBack }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      {onBack && (
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ border: `1.6px solid ${C.line2}`, color: C.ink }} aria-label="Буцах">
          <ChevronLeft size={19} strokeWidth={2} />
        </button>
      )}
      <div>
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: C.ink }}>{title}</h1>
        {sub && <p className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>{sub}</p>}
      </div>
    </div>
  );
}

function MineToggle({ mine, setMine, partnerName }) {
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-full" style={{ background: C.cardIn }}>
      {[{ k: true, l: "Миний" }, { k: false, l: partnerName || "Түншийн" }].map((o) => (
        <button key={String(o.k)} onClick={() => setMine(o.k)}
          className="flex-1 rounded-full py-2 text-[12.5px] font-extrabold active:scale-[0.97]"
          style={{
            background: mine === o.k ? C.card : "transparent",
            color: mine === o.k ? C.ink : C.inkSoft,
            boxShadow: mine === o.k ? "0 1px 3px rgba(92,74,58,.15)" : "none",
            transition: "all 180ms ease",
          }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}

/* ── Апп суулгах ── */
/* Мэдэгдлийн зөвшөөрөл асуух баннер.
   state: "granted" | "default" | "denied" | "unsupported" | "needs-install" | "unconfigured" */
function NotifyBanner({ state, busy, error, onEnable, onDismiss }) {
  if (state === "granted" || state === "unconfigured") return null;

  const copy = {
    default: { title: "Мэдэгдэл асаах", sub: "Апп хаалттай байхад ч хамтрагчийн зурвас ирнэ" },
    denied: { title: "Мэдэгдэл хаалттай байна", sub: "Хөтчийн тохиргооноос Ankomeow-д зөвшөөрөл өгнө үү" },
    "needs-install": { title: "Эхлээд утсандаа суулга", sub: "iPhone дээр мэдэгдэл зөвхөн Home Screen-д суулгасны дараа ажиллана" },
    unsupported: { title: "Энэ хөтөч мэдэгдэл дэмжихгүй", sub: "Chrome эсвэл Safari-гийн шинэ хувилбар ашиглана уу" },
  }[state];

  if (!copy) return null;

  return (
    <div className="rounded-[22px] p-4 mb-4 relative" style={{
      background: `linear-gradient(158deg, #FDF6F0 0%, ${C.card} 130%)`,
      border: `1.5px solid ${C.line}`, boxShadow: "0 2px 0 rgba(92,74,58,.05), 0 1px 0 rgba(255,255,255,.8) inset",
    }}>
      <button onClick={onDismiss} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ color: C.inkSoft }} aria-label="Хаах">
        <X size={13} strokeWidth={2.4} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.lilacDeep }}>
          {state === "denied" ? <BellOff size={18} strokeWidth={2.2} color="#fff" /> : <Bell size={18} strokeWidth={2.2} color="#fff" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>{copy.title}</div>
          <div className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>{copy.sub}</div>
        </div>
      </div>

      {state === "default" && (
        <button onClick={onEnable} disabled={busy}
          className="w-full mt-3 rounded-full py-2.5 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Bell size={15} strokeWidth={2.4} /> {busy ? "Асааж байна…" : "Мэдэгдэл асаах"}
        </button>
      )}

      {error && (
        <p className="text-[11.5px] font-semibold mt-2.5 leading-relaxed" style={{ color: C.inkSoft }}>{error}</p>
      )}
    </div>
  );
}

function InstallBanner({ canInstall, isIOS, onInstall, onDismiss }) {
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (!canInstall && !isIOS) return null;

  return (
    <div className="rounded-[22px] p-4 mb-4 relative" style={{
      background: `linear-gradient(158deg, #F8F4FC 0%, ${C.card} 130%)`,
      border: `1.5px solid ${C.line}`, boxShadow: "0 2px 0 rgba(92,74,58,.05), 0 1px 0 rgba(255,255,255,.8) inset",
    }}>
      <button onClick={onDismiss} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ color: C.inkSoft }} aria-label="Хаах">
        <X size={13} strokeWidth={2.4} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.lilacDeep }}>
          <Download size={18} strokeWidth={2.2} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Утсандаа суулгах</div>
          <div className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>Апп шиг нээгээд, offline ч ажиллана</div>
        </div>
      </div>

      {canInstall && (
        <button onClick={onInstall}
          className="w-full mt-3 rounded-full py-2.5 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Download size={15} strokeWidth={2.4} /> Одоо суулгах
        </button>
      )}

      {!canInstall && isIOS && (
        <>
          <button onClick={() => setShowIOSHelp((s) => !s)}
            className="w-full mt-3 rounded-full py-2.5 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
            <Share2 size={15} strokeWidth={2.4} /> Яаж суулгах вэ?
          </button>
          {showIOSHelp && (
            <p className="text-[11.5px] font-semibold mt-2.5 leading-relaxed" style={{ color: C.inkSoft }}>
              Доорх <Share2 size={12} strokeWidth={2.4} style={{ display: "inline", verticalAlign: "-1px" }} /> Хуваалцах товч дараад,
              жагсаалтаас "Нүүр дэлгэц рүү нэмэх" (Add to Home Screen) сонголтыг дарна уу.
            </p>
          )}
        </>
      )}
    </div>
  );
}

/* ── Ус ── */
function WaterScreen({ ml, setMl, log, setLog, weight, setWeight, goal, partner, onBack }) {
  const [spillKey, setSpillKey] = useState(0);
  const [spilling, setSpilling] = useState(false);
  const [mine, setMine] = useState(true);
  const timer = useRef(null);

  const cups = [
    { v: 100, label: "Балга" }, { v: 200, label: "Аяга" },
    { v: 330, label: "Лааз" }, { v: 500, label: "Шил" },
  ];
  const cupCounts = [
    { v: 250, label: "1 аяга" }, { v: 500, label: "2 аяга" }, { v: 750, label: "3 аяга" },
  ];

  const add = (v) => {
    const next = Math.max(0, ml + v);
    setMl(next);
    if (v > 0) {
      if (next > goal) {
        setSpillKey((k) => k + 1);
        setSpilling(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setSpilling(false), 1700);
      }
      const t = ubParts();
      setLog((l) => [{ v, t: `${pad(t.h)}:${pad(t.m)}` }, ...l]);
    }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const over = ml > goal;
  const pGoal = partner?.goal || 1;
  const pOver = !!partner && partner.ml > pGoal;

  return (
    <div>
      <Header title="Ус уух"
        sub={mine ? `${ml} / ${goal} мл · ${Math.floor(ml / 250)} аяга` : `${partner?.ml ?? 0} / ${pGoal} мл`}
        onBack={onBack} />

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      {mine ? (
        <>
          <div className="flex justify-center mb-2"><Glass {...{ ml, goal, spillKey, spilling, over }} /></div>

          {over && (
            <div className="rounded-full px-4 py-2 mb-4 text-center text-[12.5px] font-bold"
              style={{ background: C.peach, color: "#fff" }}>
              {ml > goal * 1.5
                ? "Нэлээд давлаа — жигд хуваарилж уувал биед зөв"
                : "Аяга дүүрч асгарлаа! Зорилго биелсэн 🎉"}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-2">
            {cups.map((c) => (
              <button key={c.v} onClick={() => add(c.v)}
                className="rounded-full py-3 active:scale-95"
                style={{ background: C.card, border: `1.8px solid ${C.line2}`, transition: "transform 150ms ease" }}>
                <div className="text-[13px] font-extrabold" style={{ color: C.waterDeep }}>{c.v} мл</div>
                <div className="text-[9.5px] font-semibold mt-0.5" style={{ color: C.inkSoft }}>{c.label}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {cupCounts.map((c) => (
              <Pill key={c.v} onClick={() => add(c.v)} className="py-2 text-[12px]">{c.label}</Pill>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <Pill onClick={() => add(-100)} className="flex-1 py-2.5 text-[12.5px]">−100 мл буцаах</Pill>
            <Pill onClick={() => { setMl(0); setLog([]); }} className="px-4" aria-label="Тэглэх">
              <RotateCcw size={16} strokeWidth={2.2} />
            </Pill>
          </div>

          <Card tint="#F4FBFE" className="mb-4">
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="text-[13px] font-extrabold" style={{ color: C.ink }}>Өдрийн зорилго</span>
              <span className="text-[12px] font-bold" style={{ color: C.waterDeep }}>{weight} кг → {goal} мл</span>
            </div>
            <input type="range" min="35" max="120" value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-full" />
            <p className="text-[11px] mt-2 font-medium" style={{ color: C.inkSoft }}>Биеийн жин × 33 мл-ээр тооцов.</p>
          </Card>

          <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>Өнөөдрийн бүртгэл</div>
          {log.length === 0 ? (
            <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна. Дээрх товчнуудаас нэмнэ үү.</p>
          ) : (
            <div className="space-y-1.5">
              {log.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12.5px] py-2 px-3 rounded-full"
                  style={{ background: C.card, border: `1.5px solid ${C.line}`, color: C.ink }}>
                  <img src={IC_WATER} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span className="font-semibold">{e.t}</span>
                  <span className="ml-auto font-extrabold" style={{ color: C.waterDeep }}>+{e.v} мл</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-center mb-2">
            <Glass ml={partner?.ml ?? 0} goal={pGoal} spillKey={0} spilling={false} over={pOver} />
          </div>

          <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>Өнөөдрийн бүртгэл</div>
          {!partner?.log?.length ? (
            <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна.</p>
          ) : (
            <div className="space-y-1.5">
              {partner.log.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12.5px] py-2 px-3 rounded-full"
                  style={{ background: C.card, border: `1.5px solid ${C.line}`, color: C.ink }}>
                  <img src={IC_WATER} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span className="font-semibold">{e.t}</span>
                  <span className="ml-auto font-extrabold" style={{ color: C.waterDeep }}>+{e.v} мл</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Жагсаалт ── */
function ListScreen({ items, setItems, partner, onBack }) {
  const [text, setText] = useState("");
  const [mine, setMine] = useState(true);
  const done = items.filter((i) => i.done).length;
  const pItems = partner?.items || [];
  const pDone = pItems.filter((i) => i.done).length;
  const addItem = () => {
    const t = text.trim();
    if (!t) return;
    setItems((l) => [...l, { id: Date.now(), text: t, done: false }]);
    setText("");
  };

  return (
    <div>
      <Header title="Нэг жагсаалт"
        sub={mine ? `${done}/${items.length} биелсэн` : `${pDone}/${pItems.length} биелсэн`}
        onBack={onBack} />

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      <Card tint="#F5FBF3" className="mb-4">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="flex-1">
            <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>Өнөөдрийн явц</div>
            <Bar value={mine ? done : pDone} max={Math.max(mine ? items.length : pItems.length, 1)} color={C.sageDeep} />
          </div>
        </div>
      </Card>

      {mine ? (
        <>
          <div className="flex gap-2 mb-4">
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Юу хийх вэ?"
              enterKeyHint="done" autoCapitalize="sentences" autoCorrect="off"
              className="flex-1 rounded-full px-5 py-2.5 text-[16px] font-medium outline-none"
              style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
            <button onClick={addItem}
              className="shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center active:scale-95"
              style={{ background: C.sageDeep, color: "#fff", transition: "transform 150ms ease" }} aria-label="Нэмэх">
              <Plus size={19} strokeWidth={2.6} />
            </button>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-3 rounded-full px-4 py-3"
                style={{ background: it.done ? "#F5FBF3" : C.card, border: `1.5px solid ${C.line}` }}>
                <button onClick={() => setItems((l) => l.map((x) => x.id === it.id ? { ...x, done: !x.done } : x))}
                  className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                  style={{ border: `2px solid ${it.done ? C.sageDeep : C.line2}`, background: it.done ? C.sageDeep : "transparent" }}
                  aria-label="Тэмдэглэх">
                  {it.done && <Check size={14} strokeWidth={3.2} color="#fff" />}
                </button>
                <span className="flex-1 text-[14px] font-semibold" style={{
                  color: it.done ? C.inkSoft : C.ink, textDecoration: it.done ? "line-through" : "none",
                }}>{it.text}</span>
                <button onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))}
                  style={{ color: C.inkSoft }} aria-label="Устгах">
                  <Trash2 size={15} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="space-y-2">
          {pItems.length === 0 ? (
            <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна.</p>
          ) : pItems.map((it) => (
            <div key={it.id} className="flex items-center gap-3 rounded-full px-4 py-3"
              style={{ background: it.done ? "#F5FBF3" : C.card, border: `1.5px solid ${C.line}` }}>
              <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                style={{ border: `2px solid ${it.done ? C.sageDeep : C.line2}`, background: it.done ? C.sageDeep : "transparent" }}>
                {it.done && <Check size={14} strokeWidth={3.2} color="#fff" />}
              </div>
              <span className="flex-1 text-[14px] font-semibold" style={{
                color: it.done ? C.inkSoft : C.ink, textDecoration: it.done ? "line-through" : "none",
              }}>{it.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Дэлгэцийн цаг ── */
const APP_COLORS = [C.peachDeep, "#E08A8A", C.waterDeep, C.sageDeep, C.gold, C.lilacDeep];

function ScreenTimeScreen({ screenApps, screenHistory, appMin, partner, onBack }) {
  const [mine, setMine] = useState(true);

  const activeApps = mine ? screenApps : (partner?.screenApps || []);
  const activeAppMin = mine ? appMin : (partner?.appMin || 0);
  const activeHistory = mine ? screenHistory : (partner?.screenHistory || {});
  const total = activeApps.reduce((s, a) => s + a.min, 0) + activeAppMin;

  const byApp = useMemo(() => {
    const map = new Map();
    activeApps.forEach((a) => map.set(a.name, (map.get(a.name) || 0) + a.min));
    const manual = Array.from(map, ([n, m], i) => ({ name: n, min: m, color: APP_COLORS[(i + 1) % APP_COLORS.length], auto: false }))
      .sort((a, b) => b.min - a.min);
    return activeAppMin > 0 ? [{ name: "Ankomeow", min: activeAppMin, color: APP_COLORS[0], auto: true }, ...manual] : manual;
  }, [activeApps, activeAppMin]);
  const topMin = Math.max(byApp[0]?.min ?? 1, 1);

  const week = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      out.push({ key, label: DAYS[d.getDay()][0], v: i === 0 ? total : (activeHistory[key] || 0) });
    }
    return out;
  }, [activeHistory, total]);
  const maxW = Math.max(...week.map((w) => w.v), 1);

  const last30 = useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      out.push(i === 0 ? total : (activeHistory[key] || 0));
    }
    return out.filter((v) => v > 0);
  }, [activeHistory, total]);
  const avg30 = last30.length ? Math.round(last30.reduce((s, v) => s + v, 0) / last30.length) : 0;
  const best30 = last30.length ? Math.min(...last30) : 0;
  const worst30 = last30.length ? Math.max(...last30) : 0;

  const myTotal = screenApps.reduce((s, a) => s + a.min, 0) + appMin;
  const partnerTotal = (partner?.screenApps || []).reduce((s, a) => s + a.min, 0) + (partner?.appMin || 0);
  const diff = Math.abs(myTotal - partnerTotal);

  return (
    <div>
      <div className="flex items-start justify-between">
        <Header title="Дэлгэцийн цаг" sub="Өнөөдөр" onBack={onBack} />
        <div className="shrink-0 mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink }}>
          <FileText size={13} strokeWidth={2.2} />
          <span className="text-[11.5px] font-extrabold">Тайлан</span>
        </div>
      </div>

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      <Card tint="#FEF6F1" className="mb-4">
        <div className="text-[36px] font-extrabold leading-none" style={{ color: C.peachDeep }}>
          {Math.floor(total / 60)}ц {total % 60}м
        </div>
        <p className="text-[12px] mt-1.5 font-semibold" style={{ color: C.inkSoft }}>
          Ankomeow доторх цаг бодитоор, автоматаар бүртгэгдэнэ
        </p>
        <div className="flex items-end gap-2 h-[78px] mt-4">
          {week.map((w, i) => (
            <div key={w.key} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-full" style={{
                height: `${(w.v / maxW) * 56}px`,
                background: i === 6 ? C.peachDeep : C.peach, opacity: i === 6 ? 1 : 0.5,
              }} />
              <span className="text-[9.5px] font-bold" style={{ color: C.inkSoft }}>{w.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {mine && partner && (
        <Card tint={myTotal <= partnerTotal ? "#F5FBF3" : "#FEF6F1"} className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: myTotal <= partnerTotal ? C.sageDeep : C.peachDeep }}>
              {myTotal <= partnerTotal
                ? <Trophy size={17} strokeWidth={2.2} color="#fff" />
                : <AlertTriangle size={17} strokeWidth={2.2} color="#fff" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>
                {myTotal === partnerTotal
                  ? "Хамтрагчтайгаа тэнцүү байна!"
                  : myTotal < partnerTotal
                    ? `${partner.name}-с ${diff} мин бага ашигласан 🎉`
                    : `${partner.name}-с ${diff} мин их ашигласан`}
              </div>
              <div className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>Өнөөдрийн харьцуулалт</div>
            </div>
          </div>
        </Card>
      )}

      <Card tint="#F8F4FC" className="mb-4">
        <div className="text-[12.5px] font-extrabold mb-2.5" style={{ color: C.ink }}>Сүүлийн 30 хоног</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: C.ink }}>{Math.floor(avg30 / 60)}ц{avg30 % 60}м</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: C.inkSoft }}>Дундаж</div>
          </div>
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: C.sageDeep }}>{Math.floor(best30 / 60)}ц{best30 % 60}м</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: C.inkSoft }}>Хамгийн бага</div>
          </div>
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: C.peachDeep }}>{Math.floor(worst30 / 60)}ц{worst30 % 60}м</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: C.inkSoft }}>Хамгийн их</div>
          </div>
        </div>
      </Card>

      <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Аппаар</div>
      {byApp.length === 0 ? (
        <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Одоогоор дата алга.</p>
      ) : (
        <div className="space-y-2.5">
          {byApp.map((a) => (
            <Card key={a.name}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full shrink-0" style={{ background: a.color, opacity: 0.9 }} />
                <div className="flex-1">
                  <div className="flex justify-between items-center text-[13px] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="font-extrabold" style={{ color: C.ink }}>{a.name}</span>
                      {a.auto && (
                        <span className="text-[9px] font-extrabold px-1.5 py-[1.5px] rounded-full" style={{ background: C.peach, color: C.peachDeep }}>
                          АВТОМАТ
                        </span>
                      )}
                    </span>
                    <span className="font-bold" style={{ color: C.inkSoft }}>{a.min} мин</span>
                  </div>
                  <Bar value={a.min} max={topMin} color={a.color} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

/* gif.js нь зөвхөн "GIF болгож хадгалах" үед хэрэгтэй ~60KB сан. Дээд талд нь
   статикаар импортлохгүй — товч дарсан үед л татаж, дараа нь дахин ашиглана. */
let gifLibPromise = null;
const loadGifLib = () => {
  if (!gifLibPromise) {
    gifLibPromise = Promise.all([
      import("gif.js"),
      import("gif.js/dist/gif.worker.js?url"),
    ]).then(([mod, worker]) => ({ GIF: mod.default, workerUrl: worker.default }));
  }
  return gifLibPromise;
};

/* ── GIF ── */
function GifScreen({ frames, setFrames, partner, onBack }) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(300);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [mine, setMine] = useState(true);
  const inputRef = useRef(null);

  const pFrames = useMemo(() => (partner?.gifFrames || []).map((thumb, i) => ({ id: `p${i}`, url: thumb })), [partner]);
  const activeFrames = mine ? frames : pFrames;

  useEffect(() => {
    if (!playing || activeFrames.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % activeFrames.length), speed);
    return () => clearInterval(id);
  }, [playing, speed, activeFrames.length]);

  const handleSave = () => {
    if (!activeFrames.length || saving) return;
    setSaving(true);
    setSaveProgress(0);
    const W = 480, H = 360;
    Promise.all([
      loadGifLib(),
      ...activeFrames.map((f) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = f.url;
      })),
    ]).then(([{ GIF, workerUrl }, ...imgs]) => {
      const gif = new GIF({ workers: 2, quality: 10, width: W, height: H, workerScript: workerUrl });
      imgs.forEach((img) => {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#F8F4FC";
        ctx.fillRect(0, 0, W, H);
        const ir = img.width / img.height, cr = W / H;
        let dw, dh, dx, dy;
        if (ir > cr) { dw = W; dh = dw / ir; dx = 0; dy = (H - dh) / 2; }
        else { dh = H; dw = dh * ir; dx = (W - dw) / 2; dy = 0; }
        ctx.drawImage(img, dx, dy, dw, dh);
        gif.addFrame(ctx, { delay: speed, copy: true });
      });
      gif.on("progress", (p) => setSaveProgress(p));
      gif.on("finished", (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ankomeow.gif";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setSaving(false);
        setSaveProgress(0);
      });
      gif.render();
    }).catch(() => setSaving(false));
  };

  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    const added = files.map((x) => ({ id: Math.random(), url: URL.createObjectURL(x) }));
    setFrames((f) => [...f, ...added]);
    files.forEach((file, i) => {
      compressImage(file, 220, 0.5).then((thumb) => {
        setFrames((f) => f.map((fr) => (fr.id === added[i].id ? { ...fr, thumb } : fr)));
      }).catch(() => {});
    });
  };

  return (
    <div>
      <Header title="GIF хийх" sub={`${activeFrames.length} кадр`} onBack={onBack} />

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      <div className="rounded-[26px] overflow-hidden mb-4 flex items-center justify-center"
        style={{ background: "#F8F4FC", border: `1.8px solid ${C.line}`, aspectRatio: "4/3" }}>
        {activeFrames.length ? (
          <img src={activeFrames[idx % activeFrames.length].url} alt="" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center px-8">
            <img src={IC_GIF} alt="" className="w-14 h-14 mx-auto mb-2 rounded-2xl object-cover" />
            <p className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>
              {mine ? "Зурагнууд нэмээд давталт үүсгэнэ" : "Хамтрагч одоогоор GIF хийгээгүй байна"}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {mine && (
          <button onClick={() => inputRef.current?.click()}
            className="flex-1 rounded-full py-3 text-[13.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
            <Upload size={16} strokeWidth={2.4} /> Зураг нэмэх
          </button>
        )}
        {playing ? (
          <Pill onClick={() => setPlaying(false)} disabled={activeFrames.length < 2}
            className={`${mine ? "px-5" : "flex-1 py-3"} disabled:opacity-40`} aria-label="Түр зогсоох">
            <Pause size={17} strokeWidth={2.4} />
          </Pill>
        ) : (
          <button onClick={() => setPlaying(true)} disabled={activeFrames.length < 2}
            className={`active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 rounded-full ${mine ? "shrink-0 w-[42px] h-[42px]" : "flex-1 py-3 text-[13.5px] font-extrabold"}`}
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }} aria-label="Эхлэх">
            <Play size={mine ? 17 : 16} strokeWidth={2.4} fill="#fff" /> {!mine && "Тоглуулах"}
          </button>
        )}
        {mine && <input ref={inputRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />}
      </div>

      <Card tint="#F8F4FC" className="mb-4">
        <div className="flex justify-between text-[13px] mb-2.5">
          <span className="font-extrabold" style={{ color: C.ink }}>Кадрын хугацаа</span>
          <span className="font-bold" style={{ color: C.lilacDeep }}>{speed} мс</span>
        </div>
        <input type="range" min="80" max="800" step="20" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full" />
      </Card>

      <button onClick={handleSave} disabled={!activeFrames.length || saving}
        className="w-full mb-4 rounded-full py-3 text-[13.5px] font-extrabold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
        style={{ background: C.peachDeep, color: "#fff", transition: "transform 150ms ease" }}>
        {saving ? `Хадгалж байна… ${Math.round(saveProgress * 100)}%` : <><Download size={16} strokeWidth={2.4} /> Хадгалах</>}
      </button>

      {mine && frames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {frames.map((f, i) => (
            <div key={f.id} className="relative shrink-0">
              <img src={f.url} alt="" className="w-14 h-14 object-cover rounded-2xl"
                style={{ border: `2.5px solid ${i === idx % frames.length ? C.lilacDeep : C.line}` }} />
              <button onClick={() => setFrames((l) => l.filter((x) => x.id !== f.id))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: C.ink, color: "#fff" }} aria-label="Кадр хасах">
                <X size={11} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      {!mine && pFrames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pFrames.map((f, i) => (
            <img key={f.id} src={f.url} alt="" className="w-14 h-14 object-cover rounded-2xl shrink-0"
              style={{ border: `2.5px solid ${i === idx % pFrames.length ? C.lilacDeep : C.line}` }} />
          ))}
        </div>
      )}

      <p className="text-[11px] mt-4 leading-relaxed px-1 font-medium" style={{ color: C.inkSoft }}>
        "Хадгалах" дарахад кадруудыг нэгтгэж .gif файл болгон утсанд татаж авна.
      </p>
    </div>
  );
}

/* ── Чат ── */
const REACTIONS = [
  { key: "poke", label: "Тэмтэрлээ", count: 8 },
  { key: "kiss", label: "Үнслээ", count: 8 },
  { key: "punch", label: "Цохилоо", count: 6 },
];
const REACTION_GIFS = Object.fromEntries(
  REACTIONS.map((r) => [r.key, Array.from({ length: r.count }, (_, i) => `./gifs/${r.key}/${r.key}-${i + 1}.gif`)])
);
const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢"];

const chatTime = (ts) => {
  if (!ts?.toDate) return "";
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(ts.toDate());
  const g = (t) => p.find((x) => x.type === t)?.value ?? "00";
  return `${g("hour")}:${g("minute")}`;
};

const compressImage = (file, maxDim, quality) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

const compressDataUrl = (dataUrl, maxDim, quality) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onerror = reject;
  img.onload = () => {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    resolve(canvas.toDataURL("image/jpeg", quality));
  };
  img.src = dataUrl;
});

/* Мэдэгдэлд харагдах товч тайлбар (зураг/байршлыг бүтнээр нь илгээхгүй) */
function messagePreview(payload) {
  switch (payload.type) {
    case "text": return payload.text?.slice(0, 120) || "Зурвас илгээлээ";
    case "reaction": return payload.label || "Реакц илгээлээ";
    case "image": return "📷 Зураг илгээлээ";
    case "location": return "📍 Байршлаа илгээлээ";
    default: return "Шинэ зурвас";
  }
}

function ChatScreen({ onBack, profileName, accountKey, partnerKey }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showReact, setShowReact] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [partnerSeenAt, setPartnerSeenAt] = useState(null);
  const [reactingTo, setReactingTo] = useState(null);
  const listRef = useRef(null);
  const imgFileRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "rooms", CHAT_ROOM, "messages"), orderBy("createdAt", "desc"), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse());
    }, () => {});
    return unsub;
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "reads", partnerKey), (snap) => {
      setPartnerSeenAt(snap.exists() ? snap.data().at : null);
    }, () => {});
    return unsub;
  }, [partnerKey]);

  useEffect(() => {
    setDoc(doc(db, "rooms", CHAT_ROOM, "reads", accountKey), { at: serverTimestamp() }).catch(() => {});
  }, [messages.length, accountKey]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length]);

  const send = (payload) => {
    addDoc(collection(db, "rooms", CHAT_ROOM, "messages"), {
      sender: accountKey, senderName: profileName, createdAt: serverTimestamp(), ...payload,
    }).catch(() => {});

    notifyPartner(auth, {
      to: partnerKey,
      title: profileName,
      body: messagePreview(payload),
      tag: "chat",
      tab: "chat",
    });
  };

  const onSend = () => {
    const t = text.trim();
    if (!t) return;
    send({ type: "text", text: t });
    setText("");
  };

  const react = (m, emoji) => {
    const next = { ...(m.reactions || {}) };
    if (next[accountKey] === emoji) delete next[accountKey]; else next[accountKey] = emoji;
    updateDoc(doc(db, "rooms", CHAT_ROOM, "messages", m.id), { reactions: next }).catch(() => {});
    setReactingTo(null);
  };

  const deleteMessage = (id) => {
    deleteDoc(doc(db, "rooms", CHAT_ROOM, "messages", id)).catch(() => {});
    setReactingTo(null);
  };

  const sendReaction = (r) => {
    setShowReact(false);
    const pool = REACTION_GIFS[r.key] || [];
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    send({ type: "reaction", key: r.key, label: r.label, gifUrl: pick });
  };

  const sendLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      send({ type: "location", lat: p.coords.latitude, lng: p.coords.longitude });
    });
  };

  const onImageChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      let quality = 0.6;
      let dataUrl = await compressImage(file, 900, quality);
      while (dataUrl.length > 700000 && quality > 0.25) {
        quality -= 0.15;
        dataUrl = await compressImage(file, 900, quality);
      }
      if (dataUrl.length <= 900000) send({ type: "image", image: dataUrl });
    } catch {}
    setUploading(false);
  };

  const lastMineId = [...messages].reverse().find((m) => m.sender === accountKey)?.id;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Чат" sub="Хайртай хүнтэйгээ шууд бичих" onBack={onBack} />

      <div ref={listRef} className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-2 mb-3">
        {messages.length === 0 ? (
          <p className="text-[12px] py-8 text-center font-medium" style={{ color: C.inkSoft }}>
            Одоогоор мессеж алга. Эхний мессежээ бичээрэй.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.sender === accountKey;
            const media = m.type === "image" || (m.type === "reaction" && m.gifUrl);
            const seen = mine && m.createdAt && partnerSeenAt && m.createdAt.toMillis() <= partnerSeenAt.toMillis();
            const myReaction = m.reactions?.[accountKey];
            const reactionList = Object.values(m.reactions || {});
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                {!mine && m.senderName && (
                  <div className="text-[9.5px] font-bold mb-1 px-1" style={{ color: C.inkSoft }}>{m.senderName}</div>
                )}
                <div onClick={() => setReactingTo((id) => (id === m.id ? null : m.id))}
                  className={`max-w-[75%] rounded-[18px] text-[13px] font-semibold cursor-pointer ${media ? "p-1.5" : "px-3.5 py-2.5"}`}
                  style={{
                    background: mine ? C.lilacDeep : C.card, color: mine ? "#fff" : C.ink,
                    border: mine ? "none" : `1.5px solid ${C.line}`,
                  }}>
                  {m.type === "text" && m.text}
                  {m.type === "image" && <img src={m.image} alt="" className="rounded-[14px] max-w-full block" style={{ maxHeight: 220 }} />}
                  {m.type === "reaction" && m.gifUrl && (
                    <div>
                      <img src={m.gifUrl} alt={m.label} className="rounded-[14px] max-w-full block" style={{ maxHeight: 180 }} />
                      <div className="italic text-[11px] px-1 pt-1">{m.label}</div>
                    </div>
                  )}
                  {m.type === "reaction" && !m.gifUrl && <span className="italic">*{m.label}*</span>}
                  {m.type === "location" && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} strokeWidth={2.4} /> {m.lat?.toFixed(4)}, {m.lng?.toFixed(4)}
                    </span>
                  )}
                </div>

                {reactingTo === m.id && (
                  <div className="flex items-center gap-1 mt-1 px-1.5 py-1 rounded-full" style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
                    {QUICK_REACTIONS.map((e) => (
                      <button key={e} onClick={() => react(m, e)}
                        className="w-7 h-7 rounded-full flex items-center justify-center text-[15px] active:scale-90"
                        style={{ background: myReaction === e ? C.cardIn : "transparent", transition: "transform 120ms ease" }}>
                        {e}
                      </button>
                    ))}
                    {mine && (
                      <>
                        <div className="w-[1.5px] self-stretch my-0.5" style={{ background: C.line2 }} />
                        <button onClick={() => deleteMessage(m.id)}
                          className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                          style={{ color: C.peachDeep, transition: "transform 120ms ease" }} aria-label="Устгах">
                          <Trash2 size={14} strokeWidth={2.2} />
                        </button>
                      </>
                    )}
                  </div>
                )}

                {reactionList.length > 0 && (
                  <div className="flex gap-0.5 mt-1 px-1" style={{ fontSize: 13 }}>
                    {reactionList.map((e, i) => <span key={i}>{e}</span>)}
                  </div>
                )}

                <div className="flex items-center gap-1 mt-1 px-1" style={{ color: C.inkSoft }}>
                  <span className="text-[9.5px] font-semibold">{chatTime(m.createdAt)}</span>
                  {m.id === lastMineId && (
                    seen
                      ? <CheckCheck size={11} strokeWidth={2.4} color={C.waterDeep} />
                      : <Check size={11} strokeWidth={2.4} />
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showReact && (
        <div className="flex gap-2 mb-2">
          {REACTIONS.map((r) => (
            <Pill key={r.key} onClick={() => sendReaction(r)} className="flex-1 py-2 text-[12px]">{r.label}</Pill>
          ))}
        </div>
      )}

      <div className="safe-bottom-pad flex gap-2 items-center pb-1">
        <button onClick={() => setShowReact((s) => !s)}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
          style={{
            background: showReact ? C.lilacDeep : C.card, border: `1.8px solid ${C.line2}`,
            color: showReact ? "#fff" : C.ink, transition: "transform 150ms ease",
          }} aria-label="Реакц">
          <Heart size={17} strokeWidth={2.2} />
        </button>
        <button onClick={() => imgFileRef.current?.click()} disabled={uploading}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 disabled:opacity-40"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink, transition: "transform 150ms ease" }}
          aria-label="Зураг илгээх">
          <ImageIcon size={17} strokeWidth={2.2} />
        </button>
        <input ref={imgFileRef} type="file" accept="image/*" onChange={onImageChange} className="hidden" />
        <button onClick={sendLocation}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink, transition: "transform 150ms ease" }}
          aria-label="Байршил илгээх">
          <MapPin size={17} strokeWidth={2.2} />
        </button>
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="Мессеж бичих..."
          onFocus={() => {
            /* гар нээгдэж frame агшсаны дараа гулсана */
            setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 300);
          }}
          enterKeyHint="send" autoCapitalize="sentences" autoCorrect="off"
          className="flex-1 min-w-0 rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
        <button onClick={onSend}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }} aria-label="Илгээх">
          <Send size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}

/* ── Байршил ── */
function LocationCard() {
  const [s, setS] = useState({ status: "idle" });
  const ask = () => {
    if (!navigator.geolocation) return setS({ status: "error", msg: "Төхөөрөмж байршил дэмжихгүй байна." });
    setS({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (p) => setS({ status: "ok", lat: p.coords.latitude.toFixed(4), lng: p.coords.longitude.toFixed(4), acc: Math.round(p.coords.accuracy) }),
      () => setS({ status: "error", msg: "Зөвшөөрөл өгөгдөөгүй." }),
      { timeout: 8000 }
    );
  };
  return (
    <Card tint="#FFFAF0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.gold }}>
          <MapPin size={17} strokeWidth={2.2} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Байршил</div>
          <div className="text-[11.5px] truncate font-medium" style={{ color: C.inkSoft }}>
            {s.status === "ok" && `${s.lat}, ${s.lng} · ±${s.acc}м`}
            {s.status === "loading" && "Хайж байна…"}
            {s.status === "error" && s.msg}
            {s.status === "idle" && "Одоогийн цэгээ тэмдэглэх"}
          </div>
        </div>
        <Pill onClick={ask} className="text-[12px] px-4 py-1.5 shrink-0">
          {s.status === "ok" ? "Дахин" : "Авах"}
        </Pill>
      </div>
    </Card>
  );
}

/* ── Ачааллах анимаци ── */
const LOAD_FRAMES = [
  [LOAD_0, 280], [LOAD_25, 280], [LOAD_50, 280], [LOAD_75, 280],
  [LOAD_90, 320], [LOAD_100, 320], [LOAD_ALMOST, 320], [LOAD_FINISH, 320],
  [LOAD_DONE, 520],
];

function LoadingSequence({ paused = false }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    /* Апп бэлэн болмогц анимациа зогсооно — эс тэгвэл splash нуугдсан ч
       үлдсэн фрэймүүдээ ард нь татсаар байдаг. */
    if (paused || i >= LOAD_FRAMES.length - 1) return;
    const t = setTimeout(() => setI((v) => v + 1), LOAD_FRAMES[i][1]);
    return () => clearTimeout(t);
  }, [i, paused]);
  /* Зөвхөн харагдсан фрэймүүд + дараагийнхыг л DOM-д байлгана. Урьд нь 9 фрэйм
     бүгд зэрэг ордог байсан — base64 үед үнэгүй байсан ч файл болсон одоо энэ нь
     ~500KB-ыг шууд татах байлаа. Splash ихэвчлэн эхний 1-2 фрэйм дээр хаагддаг. */
  const visible = LOAD_FRAMES.slice(0, i + 2);
  return (
    <div className="relative" style={{ width: 300, height: 202 }}>
      {visible.map(([src], idx) => (
        <img key={idx} src={src} alt="" fetchPriority={idx === 0 ? "high" : "auto"}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ opacity: idx === i ? 1 : 0, transition: "opacity 260ms ease" }} />
      ))}
    </div>
  );
}

/* ── Нүүрний carousel ── */
function carouselNearestIndex(root, refs) {
  const rootRect = root.getBoundingClientRect();
  const rootCenter = rootRect.left + rootRect.width / 2;
  let best = 0, bestDist = Infinity;
  refs.forEach((el, i) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const c = r.left + r.width / 2;
    const d = Math.abs(c - rootCenter);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function HomeCarousel() {
  const base = [CAR_LIST, CAR_WATER, CAR_SCREEN, CAR_GIF];
  const REPS = 3;
  const slides = Array.from({ length: base.length * REPS }, (_, i) => base[i % base.length]);
  const n = base.length;
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const pausedUntil = useRef(0);
  const settleTimer = useRef(null);
  const lastIndex = useRef(n);

  const goTo = (i, smooth) => {
    const el = slideRefs.current[i];
    const root = trackRef.current;
    if (!el || !root) return;
    const target = el.offsetLeft - (root.clientWidth - el.clientWidth) / 2;
    root.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => { goTo(n, false); }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const root = trackRef.current;
      if (!root) return;
      const next = carouselNearestIndex(root, slideRefs.current) + 1;
      lastIndex.current = next;
      goTo(next, true);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const onScroll = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const root = trackRef.current;
      if (!root) return;
      let cur = carouselNearestIndex(root, slideRefs.current);
      if (cur < lastIndex.current) {
        goTo(lastIndex.current, false);
        cur = lastIndex.current;
      } else {
        lastIndex.current = cur;
      }
      if (cur >= n * (REPS - 1)) {
        goTo(cur - n, false);
        lastIndex.current = cur - n;
      } else if (cur < n) {
        goTo(cur + n, false);
        lastIndex.current = cur + n;
      }
    }, 120);
  };

  const pause = () => { pausedUntil.current = Date.now() + 4000; };

  return (
    <div ref={trackRef} onScroll={onScroll} onTouchStart={pause} onPointerDown={pause} onWheel={pause}
      className="hcarousel flex gap-3 overflow-x-auto mb-4"
      style={{ scrollSnapType: "x mandatory", scrollPadding: "0 31%" }}>
      {slides.map((src, i) => (
        <img key={i} ref={(el) => (slideRefs.current[i] = el)} src={src} alt=""
          className="shrink-0 rounded-[22px] object-cover"
          style={{ width: "38%", aspectRatio: "143/602", scrollSnapAlign: "center" }} />
      ))}
    </div>
  );
}

/* ── Нууц үг солих ── */
function ChangePasswordCard() {
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!cur || !next || busy) return;
    setBusy(true);
    setMsg(null);
    try {
      const cred = EmailAuthProvider.credential(auth.currentUser.email, cur);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, next);
      setMsg({ ok: true, text: "Нууц үг солигдлоо" });
      setCur("");
      setNext("");
    } catch {
      setMsg({ ok: false, text: "Одоогийн нууц үг буруу байна" });
    }
    setBusy(false);
  };

  return (
    <Card tint="#F8F4FC" className="mb-4">
      <div className="text-[12.5px] font-extrabold mb-2.5" style={{ color: C.ink }}>Нууц үг солих</div>
      <div className="space-y-2 mb-2.5">
        <input type="password" value={cur} onChange={(e) => { setCur(e.target.value); setMsg(null); }}
          placeholder="Одоогийн нууц үг"
          autoComplete="current-password" enterKeyHint="next"
          className="w-full rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
        <input type="password" value={next} onChange={(e) => { setNext(e.target.value); setMsg(null); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Шинэ нууц үг"
          autoComplete="new-password" enterKeyHint="done"
          className="w-full rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
      </div>
      {msg && (
        <p className="text-[11px] font-bold mb-2" style={{ color: msg.ok ? C.sageDeep : C.peachDeep }}>{msg.text}</p>
      )}
      <button onClick={submit} disabled={!cur || !next || busy}
        className="w-full rounded-full py-2.5 text-[12.5px] font-extrabold active:scale-[0.97] disabled:opacity-40"
        style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
        {busy ? "Хүлээнэ үү..." : "Солих"}
      </button>
    </Card>
  );
}

/* ── Профайл ── */
function ProfileScreen({ ml, goal, items, gifCount, screenApps, appMin, avatar, setAvatar, profileName, chibiEnabled, setChibiEnabled, onBack }) {
  const [picking, setPicking] = useState(false);
  const fileRef = useRef(null);
  const done = items.filter((i) => i.done).length;
  const stTotal = screenApps.reduce((s, a) => s + a.min, 0) + appMin;

  const onUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { setAvatar(reader.result); setPicking(false); };
    reader.readAsDataURL(file);
  };

  const exitApp = () => { window.close(); };

  return (
    <div>
      <div className="flex items-start justify-between">
        <Header title="Профайл" onBack={onBack} />
        <button onClick={exitApp} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-95"
          style={{ border: `1.6px solid ${C.line2}`, color: C.peachDeep, transition: "transform 150ms ease" }} aria-label="Гарах">
          <LogOut size={16} strokeWidth={2.2} />
        </button>
      </div>

      <div className="flex flex-col items-center gap-3 mb-4">
        <button onClick={() => setPicking((p) => !p)} className="relative active:scale-95" aria-label="Зураг солих"
          style={{ transition: "transform 150ms ease" }}>
          <img src={avatar} alt="" className="w-20 h-20 rounded-[26px] object-cover"
            style={{ border: `2px solid ${C.line2}` }} />
          <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center"
            style={{ background: C.peachDeep, border: "2px solid #fff" }}>
            <Pencil size={13} strokeWidth={2.4} color="#fff" />
          </span>
        </button>
        <div className="text-center">
          <div className="text-[17px] font-extrabold" style={{ color: C.ink }}>{profileName}</div>
          <div className="text-[12px] font-semibold" style={{ color: C.inkSoft }}>Төвлөрөх Хамтрах</div>
        </div>
      </div>

      <ChangePasswordCard />

      {picking && (
        <Card tint="#FEF6F1" className="mb-4">
          <div className="text-[12.5px] font-extrabold mb-2.5" style={{ color: C.ink }}>Зураг сонгох</div>
          <div className="grid grid-cols-4 gap-2 mb-3">
            {AVATARS.map((src, i) => (
              <button key={i} onClick={() => { setAvatar(src); setPicking(false); }}
                className="rounded-2xl overflow-hidden active:scale-95"
                style={{ border: `2px solid ${avatar === src ? C.peachDeep : C.line}`, transition: "transform 150ms ease" }}>
                <img src={src} alt="" className="w-full aspect-square object-cover" />
              </button>
            ))}
          </div>
          <button onClick={() => fileRef.current?.click()}
            className="w-full rounded-full py-2.5 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink, transition: "transform 150ms ease" }}>
            <Upload size={15} strokeWidth={2.4} /> Өөрийн зураг оруулах
          </button>
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </Card>
      )}

      <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Өнөөдрийн явц</div>
      <div className="grid grid-cols-2 gap-3">
        <Card tint="#F4FBFE">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.waterDeep }}>Ус</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>{ml} / {goal} мл</div>
          <Bar value={ml} max={goal} color={C.waterDeep} />
        </Card>
        <Card tint="#F5FBF3">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.sageDeep }}>Жагсаалт</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>{done}/{items.length}</div>
          <Bar value={done} max={Math.max(items.length, 1)} color={C.sageDeep} />
        </Card>
        <Card tint="#FEF6F1">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.peachDeep }}>Дэлгэц</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>
            {Math.floor(stTotal / 60)}ц {stTotal % 60}м
          </div>
          <Bar value={stTotal} max={240} color={C.peachDeep} />
        </Card>
        <Card tint="#F8F4FC">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.lilacDeep }}>GIF</div>
          <div className="text-[15px] font-extrabold" style={{ color: C.ink }}>{gifCount} кадр</div>
        </Card>
      </div>

      <div className="text-[13px] font-extrabold mt-4 mb-2.5" style={{ color: C.ink }}>Тохиргоо</div>
      <Card tint="#F8F4FC">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold mb-0.5" style={{ color: C.ink }}>Chibi хамтрагч</div>
            <div className="text-[11.5px] font-bold leading-snug" style={{ color: C.inkSoft }}>
              Дэлгэц дээр алхаж яваа жижиг дүр
            </div>
          </div>
          <button
            onClick={() => setChibiEnabled((v) => !v)}
            aria-label="Chibi хамтрагчийг асаах/унтраах"
            aria-pressed={chibiEnabled}
            className="w-12 h-7 rounded-full shrink-0 relative active:scale-95"
            style={{
              background: chibiEnabled ? C.lilacDeep : C.line2,
              transition: "background 200ms ease, transform 150ms ease",
            }}>
            <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
              style={{ left: chibiEnabled ? 26 : 4, transition: "left 200ms cubic-bezier(.2,.8,.3,1)" }} />
          </button>
        </div>
      </Card>
    </div>
  );
}

/* ── Хамтрагчийн явц (зөвхөн харах) ── */
function PartnerScreen({ partner, accountKey, partnerKey, onBack }) {
  const items = partner?.items || [];
  const done = items.filter((i) => i.done).length;
  const stTotal = (partner?.screenApps || []).reduce((s, a) => s + a.min, 0) + (partner?.appMin || 0);
  const gifCount = (partner?.gifFrames || []).length;
  const ml = partner?.ml ?? 0;
  const goal = partner?.goal || 1;

  useEffect(() => {
    if (!partnerKey || !accountKey) return;
    setDoc(doc(db, "rooms", CHAT_ROOM, "peeks", partnerKey), { from: accountKey, at: serverTimestamp() }).catch(() => {});
    notifyPartner(auth, {
      to: partnerKey,
      title: ACCOUNTS[accountKey]?.name || "Хамтрагч",
      body: "Чиний өдрийн явцыг харлаа 👀",
      tag: "peek",
      tab: "home",
    });
  }, [partnerKey, accountKey]);

  return (
    <div>
      <Header title={partner?.name || "Хамтрагч"} sub="Өнөөдрийн явц" onBack={onBack} />

      <div className="flex flex-col items-center gap-3 mb-5">
        <img src={partner?.avatar || IC_PROFILE} alt="" className="w-20 h-20 rounded-[26px] object-cover"
          style={{ border: `2px solid ${C.line2}` }} />
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card tint="#F4FBFE">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.waterDeep }}>Ус</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>{ml} / {goal} мл</div>
          <Bar value={ml} max={goal} color={C.waterDeep} />
        </Card>
        <Card tint="#F5FBF3">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.sageDeep }}>Жагсаалт</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>{done}/{items.length}</div>
          <Bar value={done} max={Math.max(items.length, 1)} color={C.sageDeep} />
        </Card>
        <Card tint="#FEF6F1">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.peachDeep }}>Дэлгэц</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>
            {Math.floor(stTotal / 60)}ц {stTotal % 60}м
          </div>
          <Bar value={stTotal} max={240} color={C.peachDeep} />
        </Card>
        <Card tint="#F8F4FC">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.lilacDeep }}>GIF</div>
          <div className="text-[15px] font-extrabold" style={{ color: C.ink }}>{gifCount} кадр</div>
        </Card>
      </div>

      <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Жагсаалт</div>
      {items.length === 0 ? (
        <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 rounded-full px-4 py-3"
              style={{ background: it.done ? "#F5FBF3" : C.card, border: `1.5px solid ${C.line}` }}>
              <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                style={{ border: `2px solid ${it.done ? C.sageDeep : C.line2}`, background: it.done ? C.sageDeep : "transparent" }}>
                {it.done && <Check size={14} strokeWidth={3.2} color="#fff" />}
              </div>
              <span className="flex-1 text-[14px] font-semibold" style={{
                color: it.done ? C.inkSoft : C.ink, textDecoration: it.done ? "line-through" : "none",
              }}>{it.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Нэвтрэх (зөвхөн 2 fixed account, бүртгүүлэх боломжгүй) ── */
function LoginScreen() {
  const [pick, setPick] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pick || !password || loading) return;
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, ACCOUNTS[pick].email, password);
    } catch {
      setError("Нууц үг буруу байна");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 text-center">
      <img src={LOGO} alt="" className="w-14 h-14 rounded-[18px] object-cover mb-3"
        style={{ border: `1.5px solid ${C.line2}` }} />
      <h1 className="text-[19px] font-extrabold mb-1" style={{ color: C.ink }}>Нэвтрэх</h1>
      <p className="text-[12px] font-semibold mb-5" style={{ color: C.inkSoft }}>Хэн бэ? Нууц үгээ оруулна уу</p>

      <div className="grid grid-cols-2 gap-3 mb-5 w-full" style={{ maxWidth: 260 }}>
        {Object.entries(ACCOUNTS).map(([key, a]) => (
          <button key={key} onClick={() => { setPick(key); setError(""); setPassword(""); }}
            className="rounded-[20px] py-4 text-[14px] font-extrabold active:scale-95"
            style={{
              background: pick === key ? C.lilacDeep : C.card,
              border: `1.8px solid ${pick === key ? C.lilacDeep : C.line2}`,
              color: pick === key ? "#fff" : C.ink,
              transition: "all 150ms ease",
            }}>
            {a.name}
          </button>
        ))}
      </div>

      <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Нууц үг" disabled={!pick} autoFocus
        autoComplete="current-password" enterKeyHint="go"
        className="w-full max-w-[240px] rounded-full px-4 py-2.5 text-[16px] font-medium text-center outline-none mb-1 disabled:opacity-40"
        style={{ background: C.card, border: `1.8px solid ${error ? C.peachDeep : C.line2}`, color: C.ink }} />
      <p className="text-[10.5px] font-bold mb-3" style={{ color: error ? C.peachDeep : "transparent", minHeight: 14 }}>
        {error || "Нууц үг буруу байна"}
      </p>

      <button onClick={submit} disabled={!pick || !password || loading}
        className="w-full max-w-[240px] rounded-full py-3 text-[13.5px] font-extrabold active:scale-[0.97] disabled:opacity-40"
        style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
        {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
      </button>
    </div>
  );
}

/* ── Нүүр ── */
function HomeScreen({ go, ml, goal, items, gifCount, clock, justReset, avatar, profileName, screenApps, appMin, partner, partnerName, canInstall, isIOS, isStandalone, installDismissed, updateAvailable, onInstall, onDismissInstall, onApplyUpdate, pushState, pushBusy, pushError, pushDismissed, onEnablePush, onDismissPush }) {
  const now = new Date();
  const greet = (clock.h < 11 ? "Өглөөний мэнд" : clock.h < 18 ? "Өдрийн мэнд" : "Оройн мэнд") + (profileName ? `, ${profileName}` : "");
  const done = items.filter((i) => i.done).length;
  const stTotal = screenApps.reduce((s, a) => s + a.min, 0) + appMin;
  const left = 86400 - (clock.h * 3600 + clock.m * 60 + clock.s);

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 -mt-7 px-5 pt-7 pb-1 flex items-center gap-3"
        style={{ background: "rgba(253,248,239,.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
        <img src={LOGO} alt="Төвлөрөх Хамтрах" className="w-[52px] h-[52px] rounded-[18px] object-cover shrink-0"
          style={{ border: `1.5px solid ${C.line2}` }} />
        <div className="flex-1">
          <p className="text-[11px] font-bold tracking-wide" style={{ color: C.inkSoft, letterSpacing: ".06em" }}>
            {now.getMonth() + 1}-Р САРЫН {now.getDate()} · {DAYS[now.getDay()].toUpperCase()}
          </p>
          <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: C.ink }}>{greet}</h1>
        </div>
        <button onClick={() => go("profile")} className="shrink-0 active:scale-95" aria-label="Профайл"
          style={{ transition: "transform 150ms ease" }}>
          <img src={avatar} alt="" className="w-9 h-9 rounded-2xl object-cover"
            style={{ border: `1.5px solid ${C.line2}` }} />
        </button>
      </div>

      <img src={WELCOME_HERO} alt="Тавтай морил" className="w-full rounded-[22px] mb-4 object-cover"
        style={{ border: `1.5px solid ${C.line2}` }} />

      {!isStandalone && !installDismissed && (
        <InstallBanner canInstall={canInstall} isIOS={isIOS} onInstall={onInstall} onDismiss={onDismissInstall} />
      )}

      {!pushDismissed && (
        <NotifyBanner state={pushState} busy={pushBusy} error={pushError} onEnable={onEnablePush} onDismiss={onDismissPush} />
      )}

      {justReset && (
        <div className="rounded-full px-4 py-2.5 mb-3 text-[12.5px] font-bold text-center"
          style={{ background: C.sage, color: "#fff" }}>
          Шинэ өдөр эхэллээ — бүртгэл тэглэгдлээ
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card tint="#F5FBF3" onClick={() => go("list")}>
          <img src={IC_CAT} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Нэг жагсаалт</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.sageDeep }}>{done}/{items.length}</div>
          <Bar value={done} max={Math.max(items.length, 1)} color={C.sageDeep} />
        </Card>

        <Card tint="#F4FBFE" onClick={() => go("water")}>
          <img src={IC_WATER} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Ус уух</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.waterDeep }}>
            {Math.floor(ml / 250)}/{Math.round(goal / 250)} аяга
          </div>
          <Bar value={ml} max={goal} color={C.waterDeep} />
        </Card>

        <Card tint="#FEF6F1" onClick={() => go("screen")}>
          <img src={IC_TIME} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Дэлгэцийн цаг</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.peachDeep }}>
            {Math.floor(stTotal / 60)}ц {stTotal % 60}м
          </div>
          <Bar value={stTotal} max={240} color={C.peachDeep} />
        </Card>

        <Card tint="#F8F4FC" onClick={() => go("gif")}>
          <img src={IC_GIF} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>GIF хийх</div>
          <div className="text-[11.5px] font-bold" style={{ color: C.lilacDeep }}>
            {gifCount ? `${gifCount} кадр` : "Шинээр эхлэх"}
          </div>
        </Card>
      </div>

      {(partnerName || updateAvailable) && (
        <div className="flex gap-3 mb-3">
          {partner ? (
            <Card tint="#FFFAF0" className="flex-1" onClick={() => go("partner")}>
              <img src={partner.avatar || IC_PROFILE} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
                style={{ border: `1.5px solid ${C.line}` }} />
              <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>{partner.name}</div>
              <div className="text-[11.5px] font-bold" style={{ color: C.peachDeep }}>Явцыг харах →</div>
            </Card>
          ) : partnerName ? (
            /* Хамтрагч хараахан нэвтрээгүй бол чимээгүй өнгөрөхгүй — шалтгааныг хэлнэ */
            <Card tint="#FFFAF0" className="flex-1">
              <img src={IC_PROFILE} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
                style={{ border: `1.5px solid ${C.line}`, opacity: 0.45 }} />
              <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>{partnerName}</div>
              <div className="text-[11.5px] font-bold leading-snug" style={{ color: C.inkSoft }}>
                Хараахан нэвтрээгүй байна
              </div>
            </Card>
          ) : null}
          {updateAvailable && (
            <Card tint="#F5FBF3" className="flex-1" onClick={onApplyUpdate}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: C.sageDeep }}>
                <RefreshCw size={20} strokeWidth={2.2} color="#fff" />
              </div>
              <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Шинэ хувилбар</div>
              <div className="text-[11.5px] font-bold" style={{ color: C.sageDeep }}>Шинэчлэх →</div>
            </Card>
          )}
        </div>
      )}

      <HomeCarousel />

      <Card tint="#F8F4FC" className="mb-3" onClick={() => go("chat")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.lilacDeep }}>
            <MessageCircle size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Чат</div>
            <div className="text-[11.5px] truncate font-medium" style={{ color: C.inkSoft }}>Хайртай хүнтэйгээ шууд бичих</div>
          </div>
        </div>
      </Card>

      <div className="mb-3"><LocationCard /></div>

      <div className="text-center text-[11px] font-bold pb-1" style={{ color: C.inkSoft }}>
        Шинэчлэх хүртэл {pad(Math.floor(left / 3600))}:{pad(Math.floor(left / 60) % 60)}:{pad(left % 60)} · УБ цагаар
      </div>
    </div>
  );
}

/* ── апп ── */
const STORE_KEY = "ankomeow-state-v1";
const loadSaved = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
};

export default function App() {
  const saved = useMemo(loadSaved, []);
  const [booted, setBooted] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const [tab, setTab] = useState("home");
  const [navDir, setNavDir] = useState("in");

  /* Таб солихдоо шилжилтийн чиглэлийг мөн тогтооно:
     нүүр рүү буцах нь "back", бусад нь "in". setTab-ын оронд үүнийг ашиглана. */
  const go = (next) => {
    setNavDir(next === "home" ? "back" : "in");
    setTab(next);
  };

  useKeyboardInset();
  /* useRef-ийн оронд state ашигладаг нь чухал: энэ div нь authReady
     болон user шалгалтын ард байрладаг тул анхны render дээр огт
     render хийгдэлгүй, зөвхөн хэсэг хугацааны дараа mount болдог.
     useRef байсан үед element mount болоход effect дахин ажиллах баталгаа байхгүй
     (dependency array дотор ref object өөрчлөгддөггүй тул), учир нь
     useSwipeBack/usePullToRefresh дотоод listener хэзээ ч холбогдохгүй
     үлдэх эрсдэлтэй байсан. setScreenEl callback ref нь element бодитоор
     mount/unmount болох мөч бүрд дуудагддаг тул энэ асуудлыг арилгана. */
  const [screenEl, setScreenEl] = useState(null);
  useSwipeBack(screenEl, () => go("home"), tab !== "home");
  const [ml, setMl] = useState(saved.ml ?? 750);
  const [log, setLog] = useState(saved.log ?? [{ v: 500, t: "08:20" }, { v: 250, t: "11:05" }]);
  const [weight, setWeight] = useState(saved.weight ?? 60);
  const [items, setItems] = useState(saved.items ?? [
    { id: 1, text: "Өглөөний дасгал 15 мин", done: true },
    { id: 2, text: "Ном 10 хуудас унших", done: false },
    { id: 3, text: "Ээжрүү залгах", done: false },
  ]);
  const [frames, setFrames] = useState([]);
  const [day, setDay] = useState(saved.day ?? ubDay());
  const [clock, setClock] = useState(ubParts());
  const [justReset, setJustReset] = useState(false);
  const [avatar, setAvatar] = useState(saved.avatar ?? IC_PROFILE);
  const [avatarThumb, setAvatarThumb] = useState(null);
  const [peekToast, setPeekToast] = useState(null);
  const [chibiEnabled, setChibiEnabled] = useState(() => localStorage.getItem("ankomeow-chibi-off") !== "1");
  useEffect(() => {
    if (chibiEnabled) localStorage.removeItem("ankomeow-chibi-off");
    else localStorage.setItem("ankomeow-chibi-off", "1");
  }, [chibiEnabled]);
  const [chibiHappyAt, setChibiHappyAt] = useState(null);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [screenApps, setScreenApps] = useState(saved.screenApps ?? []);
  const [screenHistory, setScreenHistory] = useState(saved.screenHistory ?? {});
  const screenAppsRef = useRef(screenApps);
  screenAppsRef.current = screenApps;
  const [appSeconds, setAppSeconds] = useState(saved.appSeconds ?? 0);
  const appSecondsRef = useRef(appSeconds);
  appSecondsRef.current = appSeconds;
  const appMin = Math.round(appSeconds / 60);
  const [partnerStats, setPartnerStats] = useState(null);
  const [canInstall, setCanInstall] = useState(!!window.deferredInstallPrompt);
  const [installDismissed, setInstallDismissed] = useState(() => localStorage.getItem("ankomeow-install-dismissed") === "1");
  /* main.jsx нь React mount хийхээс өмнө төлөвийг тогтоосон байж болзошгүй */
  const [updateAvailable, setUpdateAvailable] = useState(() => !!window.ankomeowUpdateReady);
  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, []);
  const isStandalone = useMemo(
    () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true,
    []
  );

  const [pushState, setPushState] = useState("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");
  const [pushDismissed, setPushDismissed] = useState(() => localStorage.getItem("ankomeow-push-dismissed") === "1");

  const goal = useMemo(() => Math.round((weight * 33) / 50) * 50, [weight]);
  const accountKey = user ? accountKeyFromEmail(user.email) : null;
  const profileName = accountKey ? ACCOUNTS[accountKey].name : "";
  const partnerKey = accountKey === "andela" ? "neko" : accountKey === "neko" ? "andela" : null;

  /* Хамтрагчийн өгөгдөл onSnapshot-оор бодит цагт ирдэг ч, iOS дээр PWA удаан
     дэвсгэрт байгаад буцаж ирэхэд listener үхсэн хэвээр үлддэг. Доош татахад
     албадан дахин уншиж, зэрэг шинэ хувилбар байгаа эсэхийг шалгана. */
  const refreshAll = async () => {
    if (partnerKey) {
      try {
        const snap = await getDoc(doc(db, "rooms", CHAT_ROOM, "stats", partnerKey));
        setPartnerStats(snap.exists() ? snap.data() : null);
      } catch {}
    }
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    } catch {}
  };

  const { pull, refreshing, settling } = usePullToRefresh(screenEl, refreshAll, tab !== "chat");

  /* Splash нь урьд нь 2950ms хатуу таймераар хаагддаг байсан — апп хэдийнэ бэлэн
     болсон ч гэсэн 3 секунд зүгээр хүлээдэг байв. Одоо Firebase Auth шийдэгдмэгц
     хаагдана; зөвхөн анимаци нүд ирмэхээс өмнө алга болохгүйн тулд доод хугацаа
     барина. Auth ямар нэг шалтгаанаар хариу өгөхгүй бол хамгаалалтын дээд хугацаа. */
  const bootStartRef = useRef(Date.now());
  const SPLASH_MIN_MS = 650;
  const SPLASH_MAX_MS = 6000;

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), SPLASH_MAX_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const left = Math.max(0, SPLASH_MIN_MS - (Date.now() - bootStartRef.current));
    const t = setTimeout(() => setBooted(true), left);
    return () => clearTimeout(t);
  }, [authReady]);

  /* бүдгэрэх шилжилт (600ms) дууссаны дараа splash-ыг DOM-оос хасна */
  useEffect(() => {
    if (!booted) return;
    const t = setTimeout(() => setSplashGone(true), 650);
    return () => clearTimeout(t);
  }, [booted]);

  /* нэвтэрсэн эсэхийг Firebase Auth-аас сонсоно */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
    return unsub;
  }, []);

  /* төлөв бүрийг утсан дээр хадгалж, апп хаагаад дахин нээхэд алдагдахгүй */
  useEffect(() => {
    localStorage.setItem(STORE_KEY, JSON.stringify({ ml, log, weight, items, day, avatar, screenApps, screenHistory, appSeconds }));
  }, [ml, log, weight, items, day, avatar, screenApps, screenHistory, appSeconds]);

  /* Ankomeow дотор өнгөрүүлсэн бодит цагийг хэмжинэ.
     setInterval нь дэвсгэрт удааширдаг тул тоолуур биш, цагийн зөрүүгээр бодно —
     ингэснээр алдаа хуримтлагдахгүй, апп гэнэт хаагдсан ч секунд алдагдахгүй. */
  useEffect(() => {
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let carryMs = 0;

    const flush = () => {
      if (visibleSince === null) return;
      const now = Date.now();
      carryMs += now - visibleSince;
      visibleSince = now;
      const whole = Math.floor(carryMs / 1000);
      if (whole <= 0) return;
      carryMs -= whole * 1000;
      const next = appSecondsRef.current + whole;
      appSecondsRef.current = next;
      setAppSeconds(next);
    };

    /* апп хаагдах агшинд React-ийн төлөв хадгалагдаж амжихгүй байж болзошгүй тул шууд бичнэ */
    const persistNow = () => {
      try {
        const cur = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        localStorage.setItem(STORE_KEY, JSON.stringify({ ...cur, appSeconds: appSecondsRef.current }));
      } catch {}
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        visibleSince = Date.now();
      } else {
        flush();
        visibleSince = null;
        persistNow();
      }
    };

    const onHide = () => { flush(); persistNow(); };

    const id = setInterval(flush, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, []);

  /* профайл зургийг жижиг thumbnail болгож, хамтрагчид харуулах бэлэн болгоно */
  useEffect(() => {
    compressDataUrl(avatar, 120, 0.6).then(setAvatarThumb).catch(() => setAvatarThumb(avatar));
  }, [avatar]);

  /* өөрийн ус/жагсаалт/дэлгэцийн цаг/GIF-ийн явцыг Firestore-т бичиж, хамтрагч харж чадахуйц болгоно */
  useEffect(() => {
    if (!accountKey) return;
    const gifFrames = frames.map((f) => f.thumb).filter(Boolean);
    setDoc(doc(db, "rooms", CHAT_ROOM, "stats", accountKey), {
      name: profileName, day, ml, goal, log, items, screenApps, appMin, screenHistory, gifFrames,
      ...(avatarThumb ? { avatar: avatarThumb } : {}),
    }).catch(() => {});
  }, [accountKey, profileName, day, ml, goal, log, items, screenApps, appMin, screenHistory, frames, avatarThumb]);

  /* хамтрагчийн бүртгэлийг бодит цагт сонсоно */
  useEffect(() => {
    if (!partnerKey) return;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "stats", partnerKey), (snap) => {
      setPartnerStats(snap.exists() ? snap.data() : null);
    }, () => {});
    return unsub;
  }, [partnerKey]);

  /* хамтрагч чиний мэдээллийг харлаа гэдгийг мэдэгдэх */
  useEffect(() => {
    if (!accountKey) return;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "peeks", accountKey), (snap) => {
      const at = snap.data()?.at;
      if (!at) return;
      const ms = at.toMillis();
      const lastSeen = Number(localStorage.getItem("ankomeow-last-peek") || 0);
      if (ms > lastSeen) {
        localStorage.setItem("ankomeow-last-peek", String(ms));
        setPeekToast(ACCOUNTS[partnerKey]?.name || "Хамтрагч");
        setTimeout(() => setPeekToast(null), 4000);
      }
    }, () => {});
    return unsub;
  }, [accountKey, partnerKey]);

  /* Chibi товшилтыг хос руу дамжуулах илгээгч — хосын түлхүүр солигдвол шинэчлэгдэнэ */
  const pokeSender = useMemo(() => {
    if (!partnerKey) return null;
    return createPokeSender({
      partnerName: ACCOUNTS[partnerKey]?.name || "Хамтрагч",
      /* merge: true ЗААВАЛ хэрэгтэй — эс бөгөөс баримт бүтнээрээ дарагдаж,
         increment утгагүй болно. */
      writeDoc: () =>
        setDoc(doc(db, "rooms", CHAT_ROOM, "pokes", partnerKey), {
          from: accountKey, total: increment(1), at: serverTimestamp(),
        }, { merge: true }),
      sendPush: ({ title, body, tag }) =>
        notifyPartner(auth, { to: partnerKey, title, body, tag, tab: "home" }),
    });
  }, [accountKey, partnerKey]);

  /* Хос миний chibi-г товшлоо.

     Хоёр тусдаа зүйл болно:
       1. chibi баярлана — `at` хугацаанд суурилсан хуучин логик хэвээр.
          Апп нээхэд хуучин товшилт байвал ч chibi баярлана.
       2. чичиргээ / iOS-ийн мэдэгдэл — `total` тоолуурын delta-д суурилна.
          Апп нээх үеийн ПЕРВЫЙ snapshot-д ЭНЭ АЖИЛЛАХГҮЙ, эс бөгөөс өглөө бүр
          шөнийн товшилтуудаар чичрэх болно. */
  const firstPokeSnapRef = useRef(true);

  useEffect(() => {
    if (!accountKey) return;
    firstPokeSnapRef.current = true;

    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "pokes", accountKey), (snap) => {
      const data = snap.data();

      /* ── 1. chibi-гийн баяр ── */
      const at = data?.at;
      if (at) {
        const ms = at.toMillis();
        const lastSeen = Number(localStorage.getItem("ankomeow-last-poke") || 0);
        if (ms > lastSeen) {
          localStorage.setItem("ankomeow-last-poke", String(ms));
          setChibiHappyAt(ms);
        }
      }

      /* ── 2. чичиргээ ── */
      const total = Number(data?.total ?? 0);
      const prev = Number(localStorage.getItem("ankomeow-poke-total") || 0);
      localStorage.setItem("ankomeow-poke-total", String(total));

      if (firstPokeSnapRef.current) {
        firstPokeSnapRef.current = false;
        return;
      }

      const delta = pokeDelta(prev, total);
      if (delta <= 0) return;

      if (canVibrate()) {
        navigator.vibrate(vibrationPattern(delta));
        return;
      }

      /* iOS — Vibration API байхгүй. Системийн мэдэгдлээр нь чичрүүлнэ.
         Зөвшөөрөл байхгүй бол чимээгүй бүтэлгүйтнэ. */
      const name = partnerKey ? ACCOUNTS[partnerKey].name : "Хамтрагч";
      navigator.serviceWorker?.ready
        .then((reg) => reg.showNotification("Ankomeow", {
          body: buzzMessage(name, delta),
          icon: "./icon-192.png",
          tag: `poke-${total}`,
        }))
        .catch(() => {});
    }, () => {});

    return unsub;
  }, [accountKey, partnerKey]);

  /* мэдэгдлийн одоогийн төлөвийг тодорхойлно */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!NOTIFY_ENDPOINT) { if (alive) setPushState("unconfigured"); return; }
      if (isIOS && !isStandalone) { if (alive) setPushState("needs-install"); return; }
      const ok = await pushSupported();
      if (!alive) return;
      setPushState(ok ? pushPermission() : "unsupported");
    })();
    return () => { alive = false; };
  }, [isIOS, isStandalone]);

  /* зөвшөөрөл байгаа үед FCM token-ыг Firestore-т шинэчилж байна
     (token үе үе солигддог тул апп нээх бүрд дахин бичнэ) */
  useEffect(() => {
    if (pushState !== "granted" || !accountKey) return;
    requestPushToken(fbApp)
      .then((token) => {
        if (!token) return;
        return setDoc(
          doc(db, "rooms", CHAT_ROOM, "tokens", accountKey),
          { tokens: arrayUnion(token), updatedAt: serverTimestamp() },
          { merge: true }
        );
      })
      .catch(() => {});
  }, [pushState, accountKey]);

  const enablePush = async () => {
    setPushBusy(true);
    setPushError("");
    try {
      const token = await requestPushToken(fbApp);
      if (token) setPushState("granted");
      else { setPushState(pushPermission()); setPushError("Зөвшөөрөл өгөгдсөнгүй."); }
    } catch (err) {
      setPushError(err?.message || "Мэдэгдэл асаахад алдаа гарлаа.");
      setPushState(pushPermission());
    } finally {
      setPushBusy(false);
    }
  };

  const dismissPush = () => {
    localStorage.setItem("ankomeow-push-dismissed", "1");
    setPushDismissed(true);
  };

  /* мэдэгдэл дээр дарахад холбогдох таб руу шилжинэ */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e) => {
      const { type, tab: target, payload } = e.data || {};
      if (type === "NOTIFICATION_CLICK" && target) go(target);
      if (type === "PUSH_FOREGROUND" && payload?.tab === "chat" && payload?.tag) {
        /* апп нээлттэй үед аль хэдийн бодит цагт шинэчлэгддэг тул нэмэлт үйлдэл хэрэггүй */
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  /* PWA суулгах сануулгыг сонсох (Android/Chrome-д л ажиллана) */
  useEffect(() => {
    const onAvail = () => setCanInstall(true);
    window.addEventListener("pwa-install-available", onAvail);
    return () => window.removeEventListener("pwa-install-available", onAvail);
  }, []);

  /* шинэ хувилбар бэлэн эсэхийг сонсоно — байхгүй болоход товч мөн алга болно */
  useEffect(() => {
    const onUpdate = (e) => setUpdateAvailable(e.detail !== false);
    window.addEventListener("ankomeow-update-available", onUpdate);
    return () => window.removeEventListener("ankomeow-update-available", onUpdate);
  }, []);

  const applyUpdate = () => window.ankomeowApplyUpdate?.();

  const installApp = async () => {
    const promptEvent = window.deferredInstallPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    window.deferredInstallPrompt = null;
    setCanInstall(false);
  };

  const dismissInstall = () => {
    localStorage.setItem("ankomeow-install-dismissed", "1");
    setInstallDismissed(true);
  };

  /* УБ цагаар 00:00 болоход өдрийн бүртгэл тэглэгдэнэ */
  useEffect(() => {
    const id = setInterval(() => {
      setClock(ubParts());
      const d = ubDay();
      if (d !== day) {
        const yesterdayTotal = screenAppsRef.current.reduce((s, a) => s + a.min, 0) + Math.round(appSecondsRef.current / 60);
        setScreenHistory((h) => ({ ...h, [day]: yesterdayTotal }));
        setScreenApps([]);
        setAppSeconds(0);
        setDay(d);
        setMl(0);
        setLog([]);
        setItems((l) => l.map((i) => ({ ...i, done: false })));
        setJustReset(true);
        setTimeout(() => setJustReset(false), 6000);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [day]);

  const nav = [
    { id: "home", icon: NAV_HOME, label: "Нүүр", c: C.ink, c2: C.inkSoft },
    { id: "water", icon: NAV_WATER, label: "Ус", c: C.waterDeep, c2: C.water },
    { id: "list", icon: NAV_LIST, label: "Жагсаалт", c: C.sageDeep, c2: C.sage },
    { id: "screen", icon: NAV_TIME, label: "Дэлгэц", c: C.peachDeep, c2: C.peach },
    { id: "gif", icon: NAV_GIF, label: "GIF", c: C.lilacDeep, c2: C.lilac },
  ];

  return (
    <div className="w-full min-h-screen flex items-start justify-center app-shell"
      style={{
        background: `linear-gradient(160deg, ${C.paper2} 0%, #ECE0CC 100%)`,
        fontFamily: "'Manrope','Inter',system-ui,-apple-system,sans-serif",
      }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes wvA { from { transform: translateX(0) } to { transform: translateX(-56px) } }
        @keyframes wvB { from { transform: translateX(0) } to { transform: translateX(-44px) } }
        @keyframes rise { 0%{transform:translateY(0) scale(.5);opacity:0} 25%{opacity:.65} 100%{transform:translateY(-150px) scale(1);opacity:0} }
        @keyframes dropL { 0%{transform:translate(0,0) scale(.3);opacity:0} 12%{opacity:1} 100%{transform:translate(-16px,272px) scale(1);opacity:0} }
        @keyframes dropR { 0%{transform:translate(0,0) scale(.3);opacity:0} 12%{opacity:1} 100%{transform:translate(16px,272px) scale(1);opacity:0} }
        @keyframes puddle { 0%{transform:scaleX(0);opacity:0} 55%{opacity:.5} 100%{transform:scaleX(1);opacity:.28} }
        @keyframes wobble { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-1.6deg)} 75%{transform:rotate(1.6deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(26px)} to{opacity:1;transform:none} }
        @keyframes slideBack { from{opacity:0;transform:translateX(-26px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes leakL { 0%{transform:translate(0,0) scaleY(.6);opacity:0} 10%{opacity:.9} 70%{transform:translate(-14px,255px) scaleY(1.6);opacity:.7} 100%{transform:translate(-17px,278px) scaleY(1.8);opacity:0} }
        @keyframes leakR { 0%{transform:translate(0,0) scaleY(.6);opacity:0} 10%{opacity:.9} 70%{transform:translate(14px,255px) scaleY(1.6);opacity:.7} 100%{transform:translate(17px,278px) scaleY(1.8);opacity:0} }
        @keyframes puddleBreathe { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.06);opacity:.7} }
        .wv-a{animation:wvA 4.5s linear infinite} .wv-b{animation:wvB 6.5s linear infinite}
        .bub{animation:rise 4s ease-in infinite}
        .dropL{animation:dropL 1.5s cubic-bezier(.5,0,.9,.5) forwards}
        .dropR{animation:dropR 1.5s cubic-bezier(.5,0,.9,.5) forwards}
        .puddle{animation:puddle 1.6s ease-out forwards}
        .leakL{animation:leakL 1.9s cubic-bezier(.4,0,.7,.4) infinite}
        .leakR{animation:leakR 1.9s cubic-bezier(.4,0,.7,.4) infinite 0.9s}
        .puddleBreathe{animation:puddleBreathe 2.4s ease-in-out infinite}
        .scr-in{animation:slideIn 280ms cubic-bezier(.32,.72,0,1)}
        .scr-back{animation:slideBack 280ms cubic-bezier(.32,.72,0,1)}
        @media (prefers-reduced-motion: reduce){ .wv-a,.wv-b,.bub,.dropL,.dropR,.puddle,.leakL,.leakR,.puddleBreathe,.scr-in,.scr-back{animation:none} }
        input[type=range]{height:6px;border-radius:99px;background:${C.cardIn};-webkit-appearance:none;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${C.waterDeep};border:3px solid #fff;box-shadow:0 1px 4px rgba(92,74,58,.25);cursor:pointer}
        ::-webkit-scrollbar{height:5px;width:5px} ::-webkit-scrollbar-thumb{background:${C.line2};border-radius:99px}
        .hcarousel{scrollbar-width:none;scroll-behavior:smooth}
        .hcarousel::-webkit-scrollbar{display:none}
        .app-shell{padding:24px 16px}
        .app-frame{
          border-radius:46px;
          border:2.5px solid ${C.line2};
          box-shadow:0 24px 54px rgba(92,74,58,.16);
          height:min(760px, calc(100dvh - 48px));
        }
        @media (max-width:640px){
          .app-shell{padding:0;min-height:100dvh;min-height:100svh}
          .app-frame{
            max-width:100%;
            height:calc(100dvh - var(--kb-inset));
            height:calc(100svh - var(--kb-inset));
            border-radius:0;border:none;box-shadow:none;
            padding-top:env(safe-area-inset-top);
          }
          :root[data-kb-anim="1"] .app-frame{transition:height 180ms ease-out}
          /* macOS цонхны 3 цэг нь утсан дээр notch-ны хэсэгт таарах бөгөөд утгагүй */
          .mac-dots{display:none}
          /* Доод nav болон чатны бичих мөр home indicator шугам дээр таарахгүй байх */
          .safe-bottom{margin-bottom:calc(16px + env(safe-area-inset-bottom))}
          .safe-bottom-pad{padding-bottom:env(safe-area-inset-bottom)}
        }
      `}</style>

      <div className="w-full max-w-[400px] overflow-hidden flex flex-col relative app-frame"
        style={{
          /* дэвсгэр зураг ирэхээс өмнө ч цайвар өнгө шууд зурагдана — цагаан анивчихгүй */
          backgroundColor: "#F7EFE2",
          backgroundImage: `${GRAIN}, linear-gradient(180deg, rgba(253,248,239,.82) 0%, rgba(244,234,218,.88) 100%), url(${BG_MAIN})`,
          backgroundBlendMode: "multiply, normal, normal",
          backgroundSize: "auto, auto, cover",
          backgroundPosition: "0 0, 0 0, center",
          backgroundRepeat: "repeat, no-repeat, no-repeat",
        }}>

        {/* macOS traffic light — зөвхөн desktop дээр (утсан дээр .mac-dots-оор нуугдана) */}
        <div className="mac-dots absolute top-4 left-5 z-30 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
        </div>

        {/* Хосын chibi — зөвхөн нэвтэрсэн, splash дууссан үед */}
        {booted && user && partnerKey && (
          <ChibiPet
            character={partnerKey}
            enabled={chibiEnabled}
            happyAt={chibiHappyAt}
            onPoke={() => pokeSender?.poke(Date.now())}
          />
        )}

        {/* Хамтрагч чиний мэдээллийг харлаа гэсэн богино мэдэгдэл */}
        {peekToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 rounded-full px-4 py-2 text-[12px] font-extrabold shadow-lg"
            style={{ background: C.lilacDeep, color: "#fff" }}>
            👀 {peekToast} таны мэдээллийг харлаа
          </div>
        )}

        {/* Splash — бүдгэрч дууссаны дараа DOM-оос бүрмөсөн хасагдана */}
        {!splashGone && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 overflow-hidden"
          style={{
            /* дэвсгэр зургийг эцэг элемент аль хэдийн үзүүлж байгаа тул энд давхардуулахгүй */
            backgroundImage: "linear-gradient(180deg, rgba(253,248,239,.9) 0%, rgba(244,234,218,.94) 100%)",
            opacity: booted ? 0 : 1, pointerEvents: booted ? "none" : "auto",
            transition: "opacity 600ms ease",
          }}>
          <LoadingSequence paused={booted} />
        </div>
        )}

        {!authReady ? null : !user ? (
          <div className="flex-1 px-5 pt-7 pb-6 min-h-0 flex flex-col">
            <LoginScreen />
          </div>
        ) : (
          <>
            <div ref={setScreenEl}
              className={`flex-1 px-5 pt-7 min-h-0 flex flex-col ${tab === "chat" ? "pb-3" : "pb-4 overflow-y-auto overscroll-contain"}`}>
              {(pull > 0 || refreshing) && (
                <div className="flex items-center justify-center pointer-events-none shrink-0 overflow-hidden"
                  style={{
                    height: refreshing ? 34 : pull,
                    opacity: refreshing ? 1 : Math.min(1, pull / 70),
                    /* Чирж байх явцад pull хурууны хөдөлгөөнийг шууд (transition-гүй)
                       дагана; харин суллах мөчид (амжилттай ч бай, амжилтгүй ч
                       бай) "settling" true болж, indicator адилхан гөлгөр
                       анимацаар хаагдана. Өмнө нь зөвхөн refreshing үед
                       transition идэвхтэй байсан тул threshold-д хүрэлгүй
                       суллахад indicator нэг frame-д шидэгддэг байсан. */
                    transition: (refreshing || settling) ? "height 180ms ease-out" : "none",
                  }}>
                  <RefreshCw size={16} strokeWidth={2.6}
                    style={{
                      color: C.inkSoft,
                      transform: `rotate(${refreshing ? 0 : pull * 3}deg)`,
                      animation: refreshing ? "spin 800ms linear infinite" : "none",
                    }} />
                </div>
              )}
              <div key={tab} className={`${navDir === "back" ? "scr-back" : "scr-in"} ${tab === "chat" ? "flex-1 flex flex-col min-h-0" : ""}`}>
                {tab === "home" && <HomeScreen go={go} {...{ ml, goal, items, clock, justReset, avatar, profileName, screenApps, appMin, canInstall, isIOS, isStandalone, installDismissed, updateAvailable, pushState, pushBusy, pushError, pushDismissed }} partner={partnerStats} partnerName={partnerKey ? ACCOUNTS[partnerKey].name : ""} onInstall={installApp} onDismissInstall={dismissInstall} onApplyUpdate={applyUpdate} onEnablePush={enablePush} onDismissPush={dismissPush} gifCount={frames.length} />}
                {tab === "water" && <WaterScreen {...{ ml, setMl, log, setLog, weight, setWeight, goal }} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "list" && <ListScreen items={items} setItems={setItems} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "screen" && <ScreenTimeScreen {...{ screenApps, screenHistory, appMin }} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "gif" && <GifScreen frames={frames} setFrames={setFrames} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "profile" && <ProfileScreen {...{ ml, goal, items, screenApps, appMin, avatar, setAvatar, profileName, chibiEnabled, setChibiEnabled }} gifCount={frames.length} onBack={() => go("home")} />}
                {tab === "partner" && <PartnerScreen partner={partnerStats} accountKey={accountKey} partnerKey={partnerKey} onBack={() => go("home")} />}
                {tab === "chat" && <ChatScreen onBack={() => go("home")} profileName={profileName} accountKey={accountKey} partnerKey={partnerKey} />}
              </div>
            </div>

            {tab !== "chat" && (
              <nav className="safe-bottom flex justify-around items-center gap-1 py-2 px-3 mx-4 mb-4 rounded-full shrink-0"
                style={{ background: C.card, border: `1.5px solid ${C.line}`, boxShadow: "0 10px 24px rgba(92,74,58,.14)" }}>
                {nav.map(({ id, icon, label, c, c2 }) => {
                  const on = tab === id;
                  return (
                    <button key={id} onClick={() => go(id)}
                      className="flex flex-col items-center justify-center gap-1 px-1.5 py-1.5 rounded-2xl min-h-[44px]">
                      <span className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: on ? `linear-gradient(155deg, ${c2 || c} 0%, ${c} 100%)` : C.cardIn,
                          boxShadow: on ? "0 3px 8px rgba(92,74,58,.22)" : "none",
                          transition: "background 220ms ease, box-shadow 220ms ease",
                        }}>
                        <img src={icon} alt="" className="w-full h-full object-cover" />
                      </span>
                      <span className="text-[10px] font-extrabold leading-none" style={{ color: on ? C.ink : C.inkSoft }}>{label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
