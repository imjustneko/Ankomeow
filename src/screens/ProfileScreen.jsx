/* Профайл — статус, тэмдэглэлт огноо, өнгөний горим, нууц үг. */

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/theme.js";
import { Bar, Card, Header } from "../ui/primitives.jsx";
import { auth, coupleDoc, profileDoc } from "../lib/firebase.js";
import { serverTimestamp, setDoc } from "firebase/firestore";
import { isValidDay } from "../lib/couple.js";
import { Bookmark, Check, ChevronLeft, LogOut, Moon, Pencil, Sun, SunMoon, Upload } from "lucide-react";
import { AVATARS } from "../lib/assets.js";
import { compressImage } from "../lib/image.js";

const STATUS_MAX = 80;
const STATUS_EMOJI = ["🥰", "😴", "🍜", "📚", "💪", "🚗", "🎧", "😤", "🤒", "🎮", "☕", "💜"];

/* ── Нууц үг солих ── */
export function ChangePasswordCard() {
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

export function StatusCard({ accountKey, status }) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);

  /* Firestore-оос ирсэн утгыг зөвхөн засварлаагүй үед л тусгана —
     бичиж байх үед хуруун доороос үсэг солигдохгүй. */
  useEffect(() => {
    if (!editing) setText(status || "");
  }, [status, editing]);

  const save = (value) => {
    const t = (value ?? text).slice(0, STATUS_MAX).trim();
    setDoc(profileDoc(accountKey), { status: t, at: serverTimestamp() }, { merge: true }).catch(() => {});
    setEditing(false);
  };

  return (
    <Card tint="#FFFAF0" className="mb-4">
      <div className="text-[12.5px] font-extrabold mb-2" style={{ color: C.ink }}>Миний статус</div>
      <div className="flex gap-2 items-center">
        <input value={text} onChange={(e) => { setEditing(true); setText(e.target.value.slice(0, STATUS_MAX)); }}
          onKeyDown={(e) => e.key === "Enter" && save()} placeholder="Юу бодож байна? 😊"
          maxLength={STATUS_MAX} enterKeyHint="done"
          className="flex-1 min-w-0 rounded-full px-3.5 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
        <button onClick={() => save()} aria-label="Статус хадгалах"
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
          style={{ background: C.peachDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Check size={17} strokeWidth={2.6} />
        </button>
      </div>
      <div className="flex gap-1 mt-2 flex-wrap">
        {STATUS_EMOJI.map((e) => (
          <button key={e} onClick={() => { setEditing(true); setText((t) => (t + e).slice(0, STATUS_MAX)); }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] active:scale-90"
            style={{ background: C.card, border: `1.4px solid ${C.line}`, transition: "transform 120ms ease" }}>
            {e}
          </button>
        ))}
        {text && (
          <button onClick={() => { setEditing(true); setText(""); save(""); }}
            className="h-8 px-3 rounded-full text-[11.5px] font-extrabold active:scale-90"
            style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.peachDeep, transition: "transform 120ms ease" }}>
            Арилгах
          </button>
        )}
      </div>
    </Card>
  );
}

/* ── Хосын огноонууд ── */
export function CoupleDatesCard({ accountKey, info }) {
  const since = info?.since || "";
  const bday = info?.bdays?.[accountKey] || "";

  const saveSince = (v) => {
    if (v && !isValidDay(v)) return;
    setDoc(coupleDoc(), { since: v }, { merge: true }).catch(() => {});
  };
  /* Төрсөн өдрийг жилгүйгээр (MM-DD) хадгална — нас нь хамаагүй, ой нь чухал */
  const saveBday = (v) => {
    setDoc(coupleDoc(), { bdays: { [accountKey]: v ? v.slice(5) : "" } }, { merge: true }).catch(() => {});
  };

  const field = {
    background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink,
  };

  return (
    <Card tint="#FEF6F1" className="mb-4">
      <div className="text-[12.5px] font-extrabold mb-2.5" style={{ color: C.ink }}>Тэмдэглэлт огноо</div>
      <label className="block mb-2">
        <span className="text-[11.5px] font-bold block mb-1" style={{ color: C.inkSoft }}>Хамт байж эхэлсэн өдөр</span>
        <input type="date" value={since} onChange={(e) => saveSince(e.target.value)}
          className="w-full rounded-full px-4 py-2.5 text-[15px] font-semibold outline-none" style={field} />
      </label>
      <label className="block">
        <span className="text-[11.5px] font-bold block mb-1" style={{ color: C.inkSoft }}>Миний төрсөн өдөр</span>
        <input type="date" value={bday ? `2000-${bday}` : ""} onChange={(e) => saveBday(e.target.value)}
          className="w-full rounded-full px-4 py-2.5 text-[15px] font-semibold outline-none" style={field} />
      </label>
    </Card>
  );
}

/* ── Профайл ── */
export function ProfileScreen({ ml, goal, items, gifCount, screenApps, appMin, avatar, setAvatar, profileName, chibiEnabled, setChibiEnabled, savedCount, onOpenSaved, accountKey, myStatus, coupleInfo, themeMode, setThemeMode, onBack }) {
  const [picking, setPicking] = useState(false);
  const fileRef = useRef(null);
  const done = items.filter((i) => i.done).length;
  const stTotal = screenApps.reduce((s, a) => s + a.min, 0) + appMin;

  const [uploadErr, setUploadErr] = useState("");

  /* Утасны зураг 3–8MB байдаг. Шахалтгүйгээр data URL болговол localStorage-ийн
     ~5MB хязгаараас хальж QuotaExceededError шидэгддэг байв — зураг солигдохгүй.
     Аватар хамгийн ихдээ 512px харагддаг тул тэр хэмжээнд нь шахна (~60KB). */
  const onUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadErr("");
    try {
      let quality = 0.8;
      let dataUrl = await compressImage(file, 512, quality);
      while (dataUrl.length > 300000 && quality > 0.4) {
        quality -= 0.15;
        dataUrl = await compressImage(file, 512, quality);
      }
      setAvatar(dataUrl);
      setPicking(false);
    } catch {
      setUploadErr("Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.");
    }
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
          {myStatus && (
            <div className="text-[12.5px] font-bold mt-1.5 px-3 py-1 rounded-full inline-block"
              style={{ background: C.cardIn, color: C.ink }}>{myStatus}</div>
          )}
        </div>
      </div>

      <StatusCard accountKey={accountKey} status={myStatus} />

      <CoupleDatesCard accountKey={accountKey} info={coupleInfo} />

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
          {uploadErr && (
            <div className="text-[11.5px] font-bold mt-2 leading-snug" style={{ color: C.peachDeep }}>{uploadErr}</div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </Card>
      )}

      <button onClick={onOpenSaved} className="w-full text-left mb-4 active:scale-[0.99]"
        style={{ transition: "transform 150ms ease" }}>
        <Card tint="#F8F4FC">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: C.lilacDeep, color: "#fff" }}>
              <Bookmark size={16} strokeWidth={2.4} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Хадгалсан чат</div>
              <div className="text-[11.5px] font-bold" style={{ color: C.inkSoft }}>
                {savedCount > 0 ? `${savedCount} зурвас` : "Дурсамжтай зурвасаа энд хадгал"}
              </div>
            </div>
            <ChevronLeft size={16} strokeWidth={2.6} style={{ color: C.inkSoft, transform: "rotate(180deg)" }} />
          </div>
        </Card>
      </button>

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
      <Card tint="#F4FBFE" className="mb-3">
        <div className="text-[13px] font-extrabold mb-0.5" style={{ color: C.ink }}>Өнгөний горим</div>
        <div className="text-[11.5px] font-bold mb-2.5" style={{ color: C.inkSoft }}>
          Авто нь утасныхаа тохиргоог дагана
        </div>
        <div className="flex gap-2">
          {[
            { k: "auto", label: "Авто", icon: <SunMoon size={14} strokeWidth={2.4} /> },
            { k: "light", label: "Өдөр", icon: <Sun size={14} strokeWidth={2.4} /> },
            { k: "dark", label: "Шөнө", icon: <Moon size={14} strokeWidth={2.4} /> },
          ].map((o) => (
            <button key={o.k} onClick={() => setThemeMode(o.k)}
              className="flex-1 h-10 rounded-full flex items-center justify-center gap-1.5 text-[12px] font-extrabold active:scale-95"
              style={{
                background: themeMode === o.k ? C.waterDeep : C.card,
                color: themeMode === o.k ? "#fff" : C.ink,
                border: `1.6px solid ${themeMode === o.k ? C.waterDeep : C.line2}`,
                transition: "transform 150ms ease",
              }}>
              {o.icon} {o.label}
            </button>
          ))}
        </div>
      </Card>

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
