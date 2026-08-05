/* Профайл — статус, тэмдэглэлт огноо, өнгөний горим, нууц үг. */

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/theme.js";
import { Bar, Card, Header } from "../ui/primitives.jsx";
import { auth, coupleDoc, profileDoc } from "../lib/firebase.js";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { serverTimestamp, setDoc } from "firebase/firestore";
import { dayNumber, isValidDay } from "../lib/couple.js";
import { Check, LogOut, Menu, Moon, Music, Plus, Sun, Upload } from "lucide-react";
import { SongChip, SongPicker } from "../ui/song.jsx";
import { PostComposer, PostGallery, usePosts } from "../ui/posts.jsx";
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

export function StatusCard({ accountKey, status, song }) {
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [picking, setPicking] = useState(false);

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

  /* Дуу нь статустай нэг баримт дээр сууна — null бол хавсралтгүй гэсэн үг */
  const saveSong = (s) => {
    setDoc(profileDoc(accountKey), { song: s, at: serverTimestamp() }, { merge: true }).catch(() => {});
    setPicking(false);
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

      {/* Сонсож буй дуу — статусын хавсралт */}
      <div className="mt-3 pt-3" style={{ borderTop: `1.2px solid ${C.line}` }}>
        {song?.title ? (
          <div className="flex items-center gap-2">
            <SongChip song={song} onRemove={() => saveSong(null)} />
            <button onClick={() => setPicking((p) => !p)}
              className="shrink-0 text-[11px] font-extrabold px-2.5 py-1.5 rounded-full active:scale-95"
              style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.inkSoft }}>
              Солих
            </button>
          </div>
        ) : (
          <button onClick={() => setPicking((p) => !p)}
            className="flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-extrabold active:scale-95"
            style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.ink, transition: "transform 140ms ease" }}>
            <Music size={14} strokeWidth={2.6} color={C.lilacDeep} />
            Сонсож буй дуугаа нэмэх
          </button>
        )}
        {picking && <SongPicker onPick={saveSong} onClose={() => setPicking(false)} />}
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

/* ── Профайл дээрх нэг тоо (Instagram-ын "posts / followers") ── */
function Stat({ n, label, onClick }) {
  const body = (
    <>
      <div className="text-[17px] font-extrabold leading-tight" style={{ color: C.ink }}>{n}</div>
      <div className="text-[11px] font-bold" style={{ color: C.inkSoft }}>{label}</div>
    </>
  );
  if (!onClick) return <div className="text-center px-1">{body}</div>;
  return (
    <button onClick={onClick} className="text-center px-1 active:scale-95"
      style={{ transition: "transform 150ms ease" }}>{body}</button>
  );
}

/* ── Профайл — Instagram хэв ──
   Дээд мөр: нэр + баруун талд ☰ тохиргоо. Дор нь аватар + гурван тоо, товч
   танилцуулга, "Профайл засах" мөр. Тохиргоо, засварын талбарууд өөрсдийн
   дэлгэцтэй болсон тул энэ дэлгэц зөвхөн харуулах үүрэгтэй. */
export function ProfileScreen({ ml, goal, items, gifCount, screenApps, appMin, avatar, profileName, savedCount, onOpenSaved, accountKey, myStatus, mySong, coupleInfo, day, onEdit, onSettings }) {
  const [composing, setComposing] = useState(false);
  const posts = usePosts(accountKey);
  const done = items.filter((i) => i.done).length;
  const stTotal = screenApps.reduce((s, a) => s + a.min, 0) + appMin;
  const together = coupleInfo?.since && day ? dayNumber(coupleInfo.since, day) : null;

  const actionBtn = {
    background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink,
    transition: "transform 150ms ease",
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-2 mb-5">
        <h1 className="text-[22px] font-extrabold leading-tight truncate" style={{ color: C.ink }}>{profileName}</h1>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setComposing((v) => !v)} aria-label="Зураг нэмэх"
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
            style={{ color: C.ink, transition: "transform 150ms ease" }}>
            <Plus size={22} strokeWidth={2.4} />
          </button>
          <button onClick={onSettings} aria-label="Тохиргоо"
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
            style={{ color: C.ink, transition: "transform 150ms ease" }}>
            <Menu size={22} strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-3">
        <img src={avatar} alt="" className="w-[84px] h-[84px] rounded-full object-cover shrink-0"
          style={{ border: `2px solid ${C.line2}` }} />
        <div className="flex-1 flex justify-around min-w-0">
          <Stat n={posts.length} label="Зураг" />
          <Stat n={together ?? "—"} label="Хамт хоног" />
          <Stat n={savedCount} label="Хадгалсан" onClick={onOpenSaved} />
        </div>
      </div>

      <div className="mb-3.5">
        <div className="text-[12px] font-semibold" style={{ color: C.inkSoft }}>Төвлөрөх Хамтрах</div>
        {myStatus && (
          <div className="text-[13px] font-bold mt-1 leading-snug" style={{ color: C.ink }}>{myStatus}</div>
        )}
        {mySong?.title && <div className="flex mt-2"><SongChip song={mySong} /></div>}
      </div>

      <div className="flex gap-2 mb-5">
        <button onClick={onEdit} style={actionBtn}
          className="flex-1 rounded-xl py-2 text-[12.5px] font-extrabold active:scale-[0.97]">
          Профайл засах
        </button>
        <button onClick={onOpenSaved} style={actionBtn}
          className="flex-1 rounded-xl py-2 text-[12.5px] font-extrabold active:scale-[0.97]">
          Хадгалсан чат
        </button>
      </div>

      {composing && <PostComposer accountKey={accountKey} onClose={() => setComposing(false)} />}

      <PostGallery ownerKey={accountKey} canEdit
        emptyText="Зураг байхгүй. Дээрх + товчоор нэмээрэй." />

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
    </div>
  );
}

/* ── Профайл засах ──
   Зураг, статус (дуутайгаа), тэмдэглэлт огноо — өөрийг тодорхойлох бүх зүйл. */
export function EditProfileScreen({ avatar, setAvatar, accountKey, myStatus, mySong, coupleInfo, onBack }) {
  const fileRef = useRef(null);
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
    } catch {
      setUploadErr("Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.");
    }
  };

  return (
    <div>
      <Header title="Профайл засах" onBack={onBack} />

      <Card tint="#FEF6F1" className="mb-4">
        <div className="flex flex-col items-center gap-2.5 mb-3">
          <img src={avatar} alt="" className="w-20 h-20 rounded-full object-cover"
            style={{ border: `2px solid ${C.line2}` }} />
          <button onClick={() => fileRef.current?.click()}
            className="text-[12px] font-extrabold flex items-center gap-1.5 active:scale-95"
            style={{ color: C.peachDeep, transition: "transform 150ms ease" }}>
            <Upload size={14} strokeWidth={2.6} /> Өөрийн зураг оруулах
          </button>
          {uploadErr && (
            <div className="text-[11.5px] font-bold leading-snug text-center" style={{ color: C.peachDeep }}>{uploadErr}</div>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onUpload} className="hidden" />
        </div>
        <div className="text-[11.5px] font-bold mb-2" style={{ color: C.inkSoft }}>Эсвэл бэлэн зургаас сонгох</div>
        <div className="grid grid-cols-4 gap-2">
          {AVATARS.map((src, i) => (
            <button key={i} onClick={() => setAvatar(src)}
              className="rounded-2xl overflow-hidden active:scale-95"
              style={{ border: `2px solid ${avatar === src ? C.peachDeep : C.line}`, transition: "transform 150ms ease" }}>
              <img src={src} alt="" className="w-full aspect-square object-cover" />
            </button>
          ))}
        </div>
      </Card>

      <StatusCard accountKey={accountKey} status={myStatus} song={mySong} />

      <CoupleDatesCard accountKey={accountKey} info={coupleInfo} />
    </div>
  );
}

/* ── Тохиргоо (☰) ──
   Аппын үйлдлийг өөрчилдөг бүх зүйл энд. */
export function SettingsScreen({ chibiEnabled, setChibiEnabled, themeMode, setThemeMode, onLogout, onBack }) {
  /* Гарах нь буцаагдахгүй үйлдэл тул нэг дарахад шууд гүйцэтгэхгүй — товч
     эхлээд баталгаажуулах төлөвт орно. Апп хаа ч харилцах цонх ашигладаггүй
     тул confirm() биш, товч өөрөө хоёр алхамтай болно. */
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const t = setTimeout(() => setConfirming(false), 6000);
    return () => clearTimeout(t);
  }, [confirming]);

  return (
    <div>
      <Header title="Тохиргоо" onBack={onBack} />

      <Card tint="#F4FBFE" className="mb-3">
        <div className="text-[13px] font-extrabold mb-0.5" style={{ color: C.ink }}>Өнгөний горим</div>
        <div className="text-[11.5px] font-bold mb-2.5" style={{ color: C.inkSoft }}>
          Апп үргэлж цагаанаар нээгдэнэ
        </div>
        <div className="flex gap-2">
          {[
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

      <Card tint="#F8F4FC" className="mb-3">
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

      <ChangePasswordCard />

      <button onClick={() => (confirming ? onLogout() : setConfirming(true))}
        className="w-full rounded-full py-3 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
        style={{
          background: confirming ? C.peachDeep : C.card,
          border: `1.6px solid ${confirming ? C.peachDeep : C.line2}`,
          color: confirming ? "#fff" : C.peachDeep,
          transition: "transform 150ms ease, background 200ms ease",
        }}>
        <LogOut size={15} strokeWidth={2.4} /> {confirming ? "Дарвал гарна — итгэлтэй байна уу?" : "Гарах"}
      </button>
      <p className="text-[11px] font-bold text-center mt-2 leading-snug" style={{ color: C.inkSoft }}>
        Гарахад энэ утсанд хадгалсан өдрийн бүртгэл цэвэрлэгдэнэ.
      </p>
    </div>
  );
}
