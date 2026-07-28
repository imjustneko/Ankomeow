import { useEffect, useRef } from "react";

const EDGE = 24;              /* ирмэгээс хэдэн px дотор эхэлсэн шударлагыг барих вэ */
const DIRECTION_LOCK = 8;     /* чиглэл тодорхойлохын өмнө хэдэн px хүлээх вэ */
const COMMIT_RATIO = 0.4;     /* өргөний хэдэн хувийг давбал буцах вэ */
const COMMIT_VELOCITY = 0.5;  /* px/ms — үүнээс хурдан бол зайнаас үл хамааран буцна */

/* Зүүн ирмэгээс баруун тийш шударахад элементийг хуруу дагуулж гулсуулна.
   Хангалттай хол эсвэл хурдан бол onBack дуудагдана; эс бөгөөс байрандаа буцна.

   Босоо хөдөлгөөн давамгайлбал шударлагыг тэр дор нь орхино — эс бөгөөс
   ердийн scroll хийхэд саад болно. */
export function useSwipeBack(ref, onBack, enabled) {
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;    /* ирмэгээс эхэлсэн үү */
    let horizontal = null;   /* null — чиглэл хараахан тодорхойгүй */

    const settle = (animate) => {
      el.style.transition = animate ? "transform 220ms ease-out" : "";
      el.style.transform = "";
      tracking = false;
      horizontal = null;
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse") return;
      if (e.clientX > EDGE) return;
      startX = e.clientX;
      startY = e.clientY;
      startT = e.timeStamp;
      tracking = true;
      horizontal = null;
      el.style.transition = "";
    };

    const onMove = (e) => {
      if (!tracking) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (horizontal === null) {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
        horizontal = Math.abs(dx) > Math.abs(dy);
        if (!horizontal) { tracking = false; return; }
      }

      /* Зөвхөн баруун тийш чирэхийг зөвшөөрнө */
      el.style.transform = dx > 0 ? `translateX(${dx}px)` : "";
    };

    const onUp = (e) => {
      if (!tracking || !horizontal) { settle(false); return; }
      const dx = e.clientX - startX;
      const dt = Math.max(1, e.timeStamp - startT);
      const passed = dx > el.clientWidth * COMMIT_RATIO || dx / dt > COMMIT_VELOCITY;
      /* Шударлага амжилттай бол дараагийн агшинд шинэ дэлгэц өөрөө .scr-back
         анимацаар гулсаж орж ирнэ — эцгийн transform-ыг анимацгүйгээр шууд
         цэвэрлэнэ, эс бөгөөс хоёр анимац давхцаж доргилт мэт харагдана.
         Амжилтгүй бол (байрандаа буцах) ганцхан энэ анимац ажиллах тул
         хэвээр 220ms-ээр гөлгөр буцаана. */
      settle(passed ? false : true);
      if (passed) backRef.current();
    };

    const onCancel = () => settle(true);

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
      settle(false);
    };
  }, [ref, enabled]);
}
