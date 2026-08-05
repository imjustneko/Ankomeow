/* Профайлын зураг — Instagram-ын постын сүлжээтэй ижил үүрэг.

   Хадгалалт хоёр давхар: сүлжээнд харагдах жижиг хувилбар (thumb) нь постын
   баримт дотроо data URL болж сууна — ингэснээр сүлжээ зурахад нэмэлт
   уншилт хэрэггүй. Бүтэн хэмжээний зураг нь blobs цуглуулгад орж, зөвхөн
   дарж нээх үед татагдана. Firestore-ийн нэг баримтын 1MB хязгаарт багтахын
   тулд хоёуланг нь шахна. */

import { useEffect, useRef, useState } from "react";
import { deleteDoc, addDoc, onSnapshot, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { ImagePlus, Trash2, X } from "lucide-react";
import { C } from "../lib/theme.js";
import { Card } from "./primitives.jsx";
import { postsCol, postDoc, blobDoc, profileDoc } from "../lib/firebase.js";
import { compressImage } from "../lib/image.js";
import { loadBlob, putBlob } from "./message.jsx";

export const CAPTION_MAX = 100;

/* Сүлжээний нүд 1/3 өргөн — 300px хүрэлцээтэй. Бүтэн зураг нь чатынхтай
   ижил хэмжээтэй: 900px нь утасны дэлгэцэнд гүйцэд, баримтад багтана. */
const THUMB_DIM = 300;
const FULL_DIM = 900;

export function usePosts(key) {
  const [posts, setPosts] = useState([]);
  useEffect(() => {
    if (!key) { setPosts([]); return; }
    const q = query(postsCol(key), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setPosts(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
  }, [key]);
  return posts;
}

/* Заасан хэмжээнээс доош багтах хүртэл чанарыг үе шаттай буулгана. */
async function compressToFit(file, dim, limit) {
  let quality = 0.7;
  let out = await compressImage(file, dim, quality);
  while (out.length > limit && quality > 0.25) {
    quality -= 0.15;
    out = await compressImage(file, dim, quality);
  }
  return out;
}

/* ── Зураг нэмэх ── */
export function PostComposer({ accountKey, onClose }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);   /* жижиг хувилбар — харуулахад */
  const [full, setFull] = useState(null);         /* бүтэн — нийтлэхэд */
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setErr("");
    setBusy(true);
    try {
      const [thumb, big] = await Promise.all([
        compressToFit(file, THUMB_DIM, 60000),
        compressToFit(file, FULL_DIM, 700000),
      ]);
      if (big.length > 900000) throw new Error("том");
      setPreview(thumb);
      setFull(big);
    } catch {
      setErr("Зургийг уншиж чадсангүй. Өөр зураг сонгоно уу.");
    } finally {
      setBusy(false);
    }
  };

  const publish = async () => {
    if (!full || busy) return;
    setBusy(true);
    setErr("");
    try {
      const blobId = await putBlob(full, "image");
      await addDoc(postsCol(accountKey), {
        thumb: preview,
        blobId,
        caption: caption.trim().slice(0, CAPTION_MAX),
        createdAt: serverTimestamp(),
      });
      /* Профайлын "агуулга шинэчлэгдсэн" мөчийг хөдөлгөнө — хамтрагчийн
         нүүрэн дэх story тойрог шинэ зураг байгааг мэдэж асна. */
      setDoc(profileDoc(accountKey), { at: serverTimestamp() }, { merge: true }).catch(() => {});
      onClose();
    } catch {
      setErr("Нийтэлж чадсангүй. Сүлжээгээ шалгаад дахин оролдоно уу.");
      setBusy(false);
    }
  };

  return (
    <Card tint="#F8F4FC" className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="text-[12.5px] font-extrabold" style={{ color: C.ink }}>Шинэ зураг</div>
        <button onClick={onClose} aria-label="Болих" className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
          style={{ color: C.inkSoft }}>
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>

      {preview ? (
        <img src={preview} alt="" className="w-full rounded-[18px] object-cover mb-2.5"
          style={{ maxHeight: 260, border: `1.5px solid ${C.line}` }} />
      ) : (
        <button onClick={() => fileRef.current?.click()} disabled={busy}
          className="w-full rounded-[18px] py-8 flex flex-col items-center gap-2 active:scale-[0.98] disabled:opacity-50"
          style={{ background: C.card, border: `1.8px dashed ${C.line2}`, transition: "transform 150ms ease" }}>
          <ImagePlus size={26} strokeWidth={2} color={C.lilacDeep} />
          <span className="text-[12px] font-extrabold" style={{ color: C.ink }}>
            {busy ? "Боловсруулж байна..." : "Зураг сонгох"}
          </span>
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />

      {preview && (
        <>
          <input value={caption} onChange={(e) => setCaption(e.target.value.slice(0, CAPTION_MAX))}
            placeholder="Богино тайлбар (заавал биш)" maxLength={CAPTION_MAX} enterKeyHint="done"
            className="w-full rounded-full px-3.5 py-2.5 font-medium outline-none mb-2.5"
            style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
          <div className="flex gap-2">
            <button onClick={() => { setPreview(null); setFull(null); }} disabled={busy}
              className="flex-1 rounded-full py-2.5 text-[12.5px] font-extrabold active:scale-[0.97] disabled:opacity-50"
              style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink }}>
              Өөр зураг
            </button>
            <button onClick={publish} disabled={busy}
              className="flex-1 rounded-full py-2.5 text-[12.5px] font-extrabold active:scale-[0.97] disabled:opacity-50"
              style={{ background: C.lilacDeep, color: "#fff" }}>
              {busy ? "Нийтэлж байна..." : "Нийтлэх"}
            </button>
          </div>
        </>
      )}

      {err && <p className="text-[11.5px] font-bold mt-2 leading-snug" style={{ color: C.peachDeep }}>{err}</p>}
    </Card>
  );
}

/* ── Нээсэн нэг зураг ──
   Аппад бүрэн дэлгэцийн давхарга байхгүй тул сүлжээг түр орлуулан
   энд байрлана — z-index, portal-гүйгээр найдвартай ажиллана. */
function PostView({ post, canEdit, ownerKey, onClose }) {
  const [src, setSrc] = useState(post.thumb || null);

  useEffect(() => {
    setSrc(post.thumb || null);
    if (!post.blobId) return;
    let alive = true;
    loadBlob(post.blobId).then((d) => { if (alive && d) setSrc(d); });
    return () => { alive = false; };
  }, [post.id, post.blobId, post.thumb]);

  const remove = () => {
    deleteDoc(postDoc(ownerKey, post.id)).catch(() => {});
    /* Бүтэн зураг нь тусдаа баримт — үлдээвэл хэнд ч хэрэггүй байж сан дүүргэнэ */
    if (post.blobId) deleteDoc(blobDoc(post.blobId)).catch(() => {});
    onClose();
  };

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2 mb-2">
        <button onClick={onClose}
          className="text-[12px] font-extrabold px-3 py-1.5 rounded-full active:scale-95"
          style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.ink }}>
          ← Бүх зураг
        </button>
        {canEdit && (
          <button onClick={remove} aria-label="Зураг устгах"
            className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.peachDeep }}>
            <Trash2 size={15} strokeWidth={2.4} />
          </button>
        )}
      </div>
      <img src={src} alt="" className="w-full rounded-[22px] object-contain"
        style={{ border: `1.5px solid ${C.line}`, background: C.cardIn }} />
      {post.caption && (
        <p className="text-[12.5px] font-bold mt-2 leading-snug" style={{ color: C.ink }}>{post.caption}</p>
      )}
    </div>
  );
}

/* ── Зургийн сүлжээ ── */
export function PostGallery({ ownerKey, canEdit = false, emptyText = "Зураг байхгүй байна." }) {
  const posts = usePosts(ownerKey);
  const [openId, setOpenId] = useState(null);

  /* Устгасан эсвэл өөр хүний профайл руу шилжсэн үед нээлттэй зураг үлдэхгүй */
  useEffect(() => { setOpenId(null); }, [ownerKey]);
  const open = posts.find((p) => p.id === openId);

  if (open) {
    return <PostView post={open} canEdit={canEdit} ownerKey={ownerKey} onClose={() => setOpenId(null)} />;
  }

  if (posts.length === 0) {
    return (
      <p className="text-[12px] font-bold text-center py-6" style={{ color: C.inkSoft }}>{emptyText}</p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-1 mb-4">
      {posts.map((p) => (
        <button key={p.id} onClick={() => setOpenId(p.id)}
          className="relative aspect-square overflow-hidden rounded-[4px] active:scale-95"
          style={{ background: C.cardIn, transition: "transform 150ms ease" }}>
          <img src={p.thumb} alt={p.caption || ""} className="w-full h-full object-cover" />
        </button>
      ))}
    </div>
  );
}
