/* Чатад хуваалцсан зургийн сүлжээ.

   Нүд бүр дөрвөлжин: янз бүрийн харьцаатай зургийг эгнүүлэхэд сүлжээ л
   уншигдана. Дарвал эх зурвас руу үсэрнэ — "хаана ярьж байсан билээ" гэдэг
   нь зураг өөрөөсөө ихэвчлэн чухал. */

import { useState } from "react";
import { C } from "../lib/theme.js";
import { Image as ImageIcon } from "lucide-react";
import { DRAW_CHECKER } from "../lib/drawing.js";
import { DrawingView } from "./drawing.jsx";
import { useBlob } from "./message.jsx";

function Cell({ item, onJump }) {
  /* Хук нөхцөлт дуудагдах ёсгүй тул blob биш зүйлд ч дуудагдана (null өгнө) */
  const src = useBlob(item.kind === "image" ? item.blobId : null, item.kind === "image" ? item.image : null);

  return (
    <button onClick={() => onJump(item.id)} aria-label="Зурвас руу очих"
      className="relative w-full overflow-hidden rounded-xl active:scale-95"
      style={{
        aspectRatio: "1 / 1",
        background: item.kind === "drawing" ? DRAW_CHECKER : C.cardIn,
        border: `1.5px solid ${C.line}`,
        transition: "transform 120ms ease",
      }}>
      {item.kind === "drawing" && (
        <div className="absolute inset-0 flex items-center justify-center p-1">
          <DrawingView strokes={item.strokes} />
        </div>
      )}
      {item.kind === "gif" && (
        <img src={item.gifUrl} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      {item.kind === "image" && (src
        ? <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
        : <span className="absolute inset-0 flex items-center justify-center">
            <ImageIcon size={18} strokeWidth={2} style={{ color: C.inkSoft, opacity: 0.5 }} />
          </span>)}
    </button>
  );
}

export function MediaGrid({ items, onJump }) {
  /* Бүх зургийг нэг дор татвал чат нээх хурдыг унагана. Эхлээд эхний хэсгийг
     харуулж, "Илүү ихийг" дарахад тэлнэ — сүлжээ нь ихэвчлэн эхний мөрүүдээр
     л хангалттай байдаг. */
  const [shown, setShown] = useState(30);
  const visible = items.slice(0, shown);

  if (items.length === 0) {
    return (
      <p className="text-[11.5px] font-semibold py-6 text-center" style={{ color: C.inkSoft }}>
        Хуваалцсан зураг алга. Дээш гүйлгэвэл хуучин зурвас нэмж ачаалагдана.
      </p>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-3 gap-1.5">
        {visible.map((it) => <Cell key={it.id} item={it} onJump={onJump} />)}
      </div>
      {shown < items.length && (
        <button onClick={() => setShown((n) => n + 30)}
          className="w-full mt-2 py-2 rounded-full text-[11.5px] font-extrabold active:scale-[0.98]"
          style={{ background: C.card, border: `1.5px solid ${C.line}`, color: C.inkSoft, transition: "transform 120ms ease" }}>
          Илүү ихийг харах ({items.length - shown})
        </button>
      )}
    </div>
  );
}
