/* Чатын бөмбөлгийн нэгдсэн дохио: давхар товшилт, удаан дарах, баруун шудрах.

   Гурвуулаа НЭГ хуруунаас гардаг тул тусад нь бичвэл зөрчилдөнө. Тиймээс нэг
   төлөвт төвлөрүүлж, аль нь "ялсныг" суллах агшинд шийднэ.

   Яагаад цэсийг удаан дарахад шилжүүлэв: өмнө нь ганц товшилт цэс нээдэг байсан
   тул давхар товшилтыг таних гэж ганц товшилтыг 260ms хойшлуулах шаардлагатай
   болдог байв — товшилт бүр мэдэгдэхүйц удаашрана. Удаан дарахад шилжүүлснээр
   ганц товшилт огт үйлдэлгүй болж, хойшлуулах шалтгаан алга болно. */

import { useEffect, useRef } from "react";
import {
  LONG_PRESS_MS, dragX, isDoubleTap, lockAxis, movedTooFar, replyCommitted,
} from "../lib/gesture.js";
import { EDGE } from "./useSwipeBack.js";

export function useBubbleGestures({ onDoubleTap, onLongPress, onReply }) {
  /* Хамгийн сүүлийн товшилт — давхар эсэхийг шалгахад */
  const lastTap = useRef(null);
  const timerRef = useRef(null);
  /* Callback-уудыг ref-ээр барина: эдгээр нь render бүрт шинэ функц болдог тул
     шууд ашиглавал хуучин closure-т баригдана. */
  const cb = useRef({ onDoubleTap, onLongPress, onReply });
  cb.current = { onDoubleTap, onLongPress, onReply };

  useEffect(() => () => clearTimeout(timerRef.current), []);

  /* Зурвас бүрд spread хийх props буцаана */
  return (m, el) => {
    let startX = 0, startY = 0, axis = null, fired = false, swiping = false;

    const reset = (node) => {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      if (node) {
        node.style.transition = "transform 200ms cubic-bezier(.22,1,.36,1)";
        node.style.transform = "";
        /* Хариултын дүрсийг дахин нуух. Эцэг дээр тэмдэглэдэг шалтгаан:
           бөмбөлөг тунгалаг байж болно (зурсан зураг) — тэр үед дүрс нь
           чирээгүй байхад ч ил харагдана. */
        delete node.parentElement?.dataset.swiping;
      }
      axis = null; swiping = false;
    };

    return {
      onPointerDown: (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        /* Ирмэгийн шударлага нь дэлгэц буцаах — түүнийг өөртөө авахгүй */
        if (e.clientX <= EDGE) return;
        startX = e.clientX; startY = e.clientY;
        axis = null; fired = false; swiping = false;
        const node = el?.();
        if (node) node.style.transition = "";
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          fired = true;
          navigator.vibrate?.(14);
          cb.current.onLongPress?.(m);
        }, LONG_PRESS_MS);
      },

      onPointerMove: (e) => {
        if (!timerRef.current && !swiping) return;
        const dx = e.clientX - startX, dy = e.clientY - startY;

        /* Хөдөлсөн бол цэс нээгдэхгүй */
        if (timerRef.current && movedTooFar(dx, dy)) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }

        if (axis === null) axis = lockAxis(dx, dy);
        /* Босоо бол ердийн гүйлгэлт — огт хөндөхгүй */
        if (axis !== "x") return;

        swiping = true;
        const node = el?.();
        if (node) {
          node.style.transform = `translateX(${dragX(dx)}px)`;
          if (node.parentElement) node.parentElement.dataset.swiping = "1";
        }
      },

      onPointerUp: (e) => {
        const node = el?.();
        const dx = e.clientX - startX;
        const wasSwiping = swiping && axis === "x";
        const hadTimer = !!timerRef.current;
        reset(node);

        if (fired) return;                       /* цэс аль хэдийн нээгдсэн */
        if (wasSwiping) {
          if (replyCommitted(dx)) { navigator.vibrate?.(10); cb.current.onReply?.(m); }
          return;
        }
        if (!hadTimer) return;                   /* хол хөдөлсөн — товшилт биш */

        const now = e.timeStamp;
        if (isDoubleTap(lastTap.current, m.id, now)) {
          lastTap.current = null;
          cb.current.onDoubleTap?.(m);
        } else {
          lastTap.current = { id: m.id, at: now };
        }
      },

      onPointerCancel: () => { fired = true; reset(el?.()); },
      /* Хэвтээ чирэлтийг хөтөч өөрөө барихгүй байх — эс бөгөөс шударлага тасарна */
      style: { touchAction: "pan-y" },
    };
  };
}
