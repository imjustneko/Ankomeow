import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70;   /* энэ зайнаас хэтэрч суллавал шинэчилнэ */
const MAX = 110;        /* хамгийн их татагдах зай */
const RESISTANCE = 0.5; /* хурууны хөдөлгөөний хэдэн хувь нь татагдах вэ */

/* Гүйдэг элемент хамгийн дээд цэгтээ байхад доош татах хөдөлгөөнийг барина.
   THRESHOLD-оос хэтэрч суллавал onRefresh дуудагдана; эс бөгөөс байрандаа буцна.

   onRefresh алдаа өгвөл indicator хаагдаж, одоогийн өгөгдөл хэвээр үлдэнэ. */
export function usePullToRefresh(ref, onRefresh, enabled) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let startY = 0;
    let tracking = false;
    let active = false;   /* доош чирэх нь эхэлсэн үү */
    let distance = 0;
    let cancelled = false;

    const onDown = (e) => {
      if (e.pointerType === "mouse") return;
      if (el.scrollTop > 0) return;
      startY = e.clientY;
      tracking = true;
      active = false;
      distance = 0;
    };

    const onMove = (e) => {
      if (!tracking) return;
      const dy = e.clientY - startY;

      /* дээш чирэх эсвэл аль хэдийн гүйсэн бол орхино */
      if (dy <= 0 || el.scrollTop > 0) {
        if (active) { active = false; distance = 0; setPull(0); }
        tracking = false;
        return;
      }

      active = true;
      distance = Math.min(MAX, dy * RESISTANCE);
      setPull(distance);
    };

    const finish = async () => {
      if (!tracking) return;
      tracking = false;
      const passed = active && distance >= THRESHOLD;
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
        if (!cancelled) setRefreshing(false);
      }
    };

    const onCancel = () => {
      tracking = false;
      active = false;
      distance = 0;
      setPull(0);
    };

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", onCancel);

    return () => {
      cancelled = true;
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", onCancel);
      setPull(0);
    };
  }, [ref, enabled]);

  return { pull, refreshing };
}
