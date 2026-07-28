import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70;      /* энэ зайнаас хэтэрч суллавал шинэчилнэ */
const MAX = 110;           /* хамгийн их татагдах зай */
const RESISTANCE = 0.5;    /* хурууны хөдөлгөөний хэдэн хувь нь татагдах вэ */
const DIRECTION_LOCK = 8;  /* чиглэл тодорхойлохын өмнө хэдэн px хүлээх вэ (useSwipeBack-тай ижил) */

/* Гүйдэг элемент хамгийн дээд цэгтээ байхад доош татах хөдөлгөөнийг барина.
   THRESHOLD-оос хэтэрч суллавал onRefresh дуудагдана; эс бөгөөс байрандаа буцна.

   Хэвтээ хөдөлгөөн давамгайлбал (жишээ нь useSwipeBack-ийн зүүн ирмэгийн
   шударлагатай зэрэг эхэлбэл) татах хөдөлгөөнийг тэр дор нь орхино —
   useSwipeBack-ийн DIRECTION_LOCK хэв маягийг дагана.

   onRefresh алдаа өгвөл indicator хаагдаж, одоогийн өгөгдөл хэвээр үлдэнэ.

   Эхний аргумент нь useRef object бус, DOM элемент өөрөө байна (callback
   ref-ээс ирсэн state). Ингэснээр элемент хожуу mount болоход
   (жишээ нь auth шалгалтын ард нуугдсан div) dependency array дахь
   `el`-ийн утга өөрчлөгдөж, effect дахин ажиллаж listener холбогдоно —
   ref object-ийн identity өөрчлөгддөггүй тул энэ баталгаа байхгүй байсан. */
export function usePullToRefresh(el, onRefresh, enabled) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  /* Чирж байх явцад pull хурууны хөдөлгөөнийг шууд дагах ёстой тул
     transition идэвхгүй байна; харин суллах мөчид (амжилттай эсвэл
     амжилтгүй) индикатор гөлгөр анимацаар хаагдах ёстой тул тэр үед л
     "settling"-ийг true болгож CSS transition-ыг асаана. */
  const [settling, setSettling] = useState(false);
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    if (!el || !enabled) return;

    let startX = 0;
    let startY = 0;
    let tracking = false;
    let horizontal = null; /* null — чиглэл хараахан тодорхойгүй */
    let active = false;    /* доош чирэх нь эхэлсэн үү */
    let distance = 0;

    const onDown = (e) => {
      if (e.pointerType === "mouse") return;
      if (el.scrollTop > 0) return;
      startX = e.clientX;
      startY = e.clientY;
      tracking = true;
      horizontal = null;
      active = false;
      distance = 0;
    };

    const onMove = (e) => {
      if (!tracking) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (horizontal === null) {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
        horizontal = Math.abs(dx) > Math.abs(dy);
        /* хэвтээ чиглэл давамгайлбал (жишээ нь useSwipeBack-ийн шударлага)
           энэ гарчийг орхиж, эсрэг талдаа саад болохгүй */
        if (horizontal) { tracking = false; return; }
      }

      /* дээш чирэх эсвэл аль хэдийн гүйсэн бол орхино */
      if (dy <= 0 || el.scrollTop > 0) {
        if (active) { active = false; distance = 0; setSettling(true); setPull(0); }
        tracking = false;
        return;
      }

      active = true;
      distance = Math.min(MAX, dy * RESISTANCE);
      setSettling(false);
      setPull(distance);
    };

    const finish = async () => {
      if (!tracking) return;
      tracking = false;
      const passed = active && distance >= THRESHOLD;
      setSettling(true);
      setPull(0);
      distance = 0;
      active = false;
      if (!passed) return;

      setRefreshing(true);
      try {
        await cbRef.current();
      } catch {
        /* алдаа гарсан ч indicator хаагдана — хоосон дэлгэц гаргахгүй */
      } finally {
        /* Effect дахин ажиллах эсвэл unmount болсон ч гэсэн indicator-ыг
           гацаалгүй хаана — cleanup нь энэ дуудлагаас өмнө аль хэдийн
           refreshing-ийг false болгосон байж болох ч давхар дуудахад
           асуудалгүй (React 18 дээр unmount-ын дараах setState-д анхаарах
           шаардлагагүй). */
        setRefreshing(false);
      }
    };

    const onCancel = () => {
      tracking = false;
      horizontal = null;
      active = false;
      distance = 0;
      setSettling(true);
      setPull(0);
    };

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", onCancel);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", onCancel);
      /* Таб солигдож enabled false болоход (жишээ нь чат руу орох) энэ
         effect шууд дахин ажиллана — refreshAll() хараахан дуусаагүй байсан
         ч indicator-ыг энд шууд хаана, эс бөгөөс refreshing state мөнхөд
         true хэвээр гацна (дараа нь finish()-ийн finally ажиллах үед
         тухайн effect-ийн closure аль хэдийн хуучирсан байдаг). */
      setPull(0);
      setRefreshing(false);
    };
  }, [el, enabled]);

  return { pull, refreshing, settling };
}
