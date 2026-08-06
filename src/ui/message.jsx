/* Чатын зурвасын харагдац ба хавсралтын хадгалалт.

   Хүнд хавсралт (зураг, дуу) нь зурвасын баримт дотор биш, blobs/ дор тусдаа
   хэвтэнэ. Чат нь сүүлийн 100 зурвасыг бүтнээр татдаг тул энэ нь чат нээгдэх
   хурдыг шийддэг. */

import { useState, useEffect, useRef } from "react";
import { addDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Image as ImageIcon, MapPin, Pause, Play } from "lucide-react";
import { C } from "../lib/theme.js";
import { blobsCol, blobDoc } from "../lib/firebase.js";
import { DrawingView } from "./drawing.jsx";
import { Lightbox } from "./lightbox.jsx";
import { MapView } from "../screens/MapScreens.jsx";
import { BIG_EMOJI_SIZE, bigEmoji } from "../lib/emoji.js";

/* Нэг blob-ыг хоёр удаа татахгүйн тулд санах ойд кэшлэнэ.
   Зэрэг хүсэлтийг ч нэгтгэнэ (нэг зураг хоёр газар харагдаж болно). */
export const blobCache = new Map();
const blobPending = new Map();
export function loadBlob(id) {
  if (!id) return Promise.resolve(null);
  if (blobCache.has(id)) return Promise.resolve(blobCache.get(id));
  if (blobPending.has(id)) return blobPending.get(id);
  const p = getDoc(blobDoc(id))
    .then((s) => {
      const data = s.exists() ? s.data()?.data || null : null;
      blobCache.set(id, data);
      blobPending.delete(id);
      return data;
    })
    .catch(() => { blobPending.delete(id); return null; });
  blobPending.set(id, p);
  return p;
}

export async function putBlob(dataUrl, kind) {
  const ref = await addDoc(blobsCol(), { data: dataUrl, kind, createdAt: serverTimestamp() });
  blobCache.set(ref.id, dataUrl); /* өөрийн илгээсэн зүйл шууд харагдана */
  return ref.id;
}

/* blobId-аар өгөгдөл татаж, ирэх хүртэл орлуулагч харуулна */
export function useBlob(id, inline) {
  const [data, setData] = useState(inline || (id ? blobCache.get(id) ?? null : null));
  useEffect(() => {
    if (inline) { setData(inline); return; }
    if (!id) { setData(null); return; }
    let alive = true;
    loadBlob(id).then((d) => { if (alive) setData(d); });
    return () => { alive = false; };
  }, [id, inline]);
  return data;
}

export const SAVED_FIELDS = ["text", "label", "key", "gifUrl", "image", "blobId", "dur", "strokes", "lat", "lng", "count"];
export const savedSnapshot = (m) => {
  const out = {
    type: m.type,
    sender: m.sender ?? null,
    senderName: m.senderName ?? null,
    sentAt: m.createdAt ?? null,
  };
  SAVED_FIELDS.forEach((f) => { if (m[f] !== undefined) out[f] = m[f]; });
  return out;
};

/* Зурвасаас хуулж болох текстийг гаргана. Зураг/GIF-д хуулах зүйл байхгүй. */
export const copyableText = (m) => {
  if (m.type === "text") return m.text || "";
  if (m.type === "location") return m.lat != null && m.lng != null ? `${m.lat}, ${m.lng}` : "";
  if (m.type === "reaction") return m.gifUrl ? "" : m.label || "";
  return "";
};

export const writeClipboard = async (t) => {
  /* navigator.clipboard нь зөвхөн secure context дээр байдаг. Хуучин iOS
     Safari болон http дээр ажиллуулахад textarea+execCommand руу шилжинэ. */
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(t);
    return;
  }
  const ta = document.createElement("textarea");
  ta.value = t;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, ta.value.length); /* iOS-д select() дангаараа хүрэлцэхгүй */
  document.execCommand("copy");
  document.body.removeChild(ta);
};

/* Дархад бүтэн дэлгэцээр нээгддэг зураг.

   Төлөвийг энд барьсны учир нь чат ба хадгалсан чат хоёулаа ижилхэн ажиллах
   ёстой — эцэг дэлгэц бүрд давхардуулж утаслах шаардлагагүй. */
export function ZoomableImage({ src, alt = "", maxHeight = 220 }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      {/* stopPropagation — эс бөгөөс бөмбөлгийн реакцийн цэс ч зэрэг нээгдэнэ */}
      <img src={src} alt={alt} onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className="rounded-[14px] max-w-full block cursor-zoom-in" style={{ maxHeight }} />
      {open && <Lightbox src={src} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}

/* Хавсаргасан зураг. m.image нь хуучин зурвасуудын нийцтэй байдлын төлөө. */
export function ChatImage({ m }) {
  const src = useBlob(m.blobId, m.image);

  if (!src) {
    return (
      <div className="rounded-[14px] flex items-center justify-center"
        style={{ width: 180, height: 130, background: C.cardIn }}>
        <ImageIcon size={22} strokeWidth={2} style={{ color: C.inkSoft, opacity: 0.6 }} />
      </div>
    );
  }

  return <ZoomableImage src={src} />;
}

export const durText = (s) => `${Math.floor((s || 0) / 60)}:${String(Math.round(s || 0) % 60).padStart(2, "0")}`;

/* Дуут зурвасын тоглуулагч — жижигхэн, өөрийн загвартай */
export function VoiceBubble({ m, mine }) {
  const src = useBlob(m.blobId, m.audio);
  const ref = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  const total = m.dur || 0;
  const tone = mine ? "#fff" : C.lilacDeep;

  const toggle = (e) => {
    e.stopPropagation(); /* бөмбөлгийн реакц цэсийг нээхгүй */
    const a = ref.current;
    if (!a) return;
    if (a.paused) a.play().catch(() => {}); else a.pause();
  };

  return (
    <div className="flex items-center gap-2.5" style={{ minWidth: 160 }}>
      <audio ref={ref} src={src || undefined} preload="none"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPos(0); }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)} />
      <button onClick={toggle} disabled={!src} aria-label={playing ? "Түр зогсоох" : "Тоглуулах"}
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90 disabled:opacity-40"
        style={{ background: mine ? "rgba(255,255,255,.22)" : C.cardIn, color: tone, transition: "transform 120ms ease" }}>
        {playing ? <Pause size={16} strokeWidth={2.6} /> : <Play size={16} strokeWidth={2.6} />}
      </button>
      <div className="flex-1 min-w-0">
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: mine ? "rgba(255,255,255,.3)" : C.cardIn }}>
          <div className="h-full rounded-full"
            style={{ width: `${total ? Math.min(100, (pos / total) * 100) : 0}%`, background: tone, transition: "width 120ms linear" }} />
        </div>
        <div className="text-[10px] font-bold mt-1" style={{ color: mine ? "rgba(255,255,255,.85)" : C.inkSoft }}>
          {durText(playing || pos ? pos : total)}
        </div>
      </div>
    </div>
  );
}

/* Бөмбөлөгний дотоод агуулга — чат болон хадгалсан чат хоёулаа ашиглана */
/* "Санаж байна" зурвас — энгийн бөмбөлөг биш, өөрийн гэрэлтсэн карт.

   Тоо нь хэдэн зүрх зурахыг заана. Таваас олбол бүгдийг зурахгүй: дүүрсэн
   эгнээ уншигдахаа больдог тул таван зүрх дээр тоог нь бичнэ.

   Зүрх нь гурав л цохилно — төгсгөлгүй давтвал чат уруу гүйлгэх бүрд
   анхаарал сарниулах болно. */
const MISS_MAX_HEARTS = 5;

function MissBubble({ count }) {
  const n = Math.max(1, Math.floor(Number(count) || 1));
  const hearts = Math.min(n, MISS_MAX_HEARTS);

  return (
    <div className="miss-card relative flex flex-col items-center gap-1.5 px-5 py-3.5 rounded-[22px]"
      style={{
        background: `radial-gradient(130% 110% at 50% 10%, rgba(245,175,142,.34) 0%, rgba(245,175,142,0) 68%), ${C.card}`,
        border: `1.5px solid rgba(232,130,92,.42)`,
        boxShadow: "0 0 0 5px rgba(232,130,92,.07), 0 8px 22px rgba(232,130,92,.20)",
      }}>
      <div className="flex items-end gap-0.5">
        {Array.from({ length: hearts }, (_, i) => (
          <span key={i} className="miss-beat" role="img" aria-label="зүрх"
            style={{ fontSize: 26 - i * 2.5, lineHeight: 1, opacity: 1 - i * 0.14, animationDelay: `${i * 90}ms` }}>
            💖
          </span>
        ))}
        {n > MISS_MAX_HEARTS && (
          <span className="text-[14px] font-extrabold ml-1.5" style={{ color: C.peachDeep }}>×{n}</span>
        )}
      </div>
      <span className="text-[13px] font-extrabold whitespace-nowrap" style={{ color: C.ink }}>
        {n > 1 ? `${n} удаа саналаа` : "Чамайг саналаа"}
      </span>
    </div>
  );
}

/* Зөвхөн эможигоос бүтсэн богино зурвасыг том, бөмбөлөггүй харуулна.
   Бөмбөлгийг нь ChatScreen хасдаг (`bare`); энд зөвхөн хэмжээг нь өсгөнө. */
function TextBody({ text }) {
  const big = bigEmoji(text);
  if (!big) return text;
  return (
    <span style={{ fontSize: BIG_EMOJI_SIZE[big - 1], lineHeight: 1.15, letterSpacing: 1 }}>{text}</span>
  );
}

export function MessageBody({ m, mine }) {
  return (
    <>
      {m.type === "text" && <TextBody text={m.text} />}
      {m.type === "image" && <ChatImage m={m} />}
      {m.type === "voice" && <VoiceBubble m={m} mine={mine} />}
      {m.type === "drawing" && <div style={{ width: 190, maxWidth: "100%" }}><DrawingView strokes={m.strokes} /></div>}
      {m.type === "reaction" && m.gifUrl && (
        <div>
          <ZoomableImage src={m.gifUrl} alt={m.label} maxHeight={180} />
          <div className="italic text-[11px] px-1 pt-1">{m.label}</div>
        </div>
      )}
      {m.type === "reaction" && !m.gifUrl && <span className="italic">*{m.label}*</span>}
      {m.type === "location" && <MapView lat={m.lat} lng={m.lng} />}
      {m.type === "miss" && <MissBubble count={m.count} />}
    </>
  );
}

/* Мэдэгдэлд харагдах товч тайлбар (зураг/байршлыг бүтнээр нь илгээхгүй) */
export function messagePreview(payload) {
  switch (payload.type) {
    case "text": return payload.text?.slice(0, 120) || "Зурвас илгээлээ";
    case "reaction": return payload.label || "Реакц илгээлээ";
    case "image": return "📷 Зураг илгээлээ";
    case "drawing": return "🎨 Зураг зурлаа";
    case "voice": return "🎤 Дуут зурвас илгээлээ";
    case "location": return "📍 Байршлаа илгээлээ";
    case "miss": return payload.count > 1 ? `💗 ${payload.count} удаа саналаа` : "💗 Чамайг саналаа";
    default: return "Шинэ зурвас";
  }
}
