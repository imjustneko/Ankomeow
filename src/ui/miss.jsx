/* "Санаж байна" товч — удаан дарахад тоо өсч, зүрх ниснэ.

   Firestore руу нэг дарах бүрд биш, СУЛЛАХАД НЭГ Л УДАА бичнэ: барьсан
   хугацаанаас тоог бодоод increment(n) хийнэ. Ингэснээр 5 секунд барихад
   30 бичилт биш, ганц бичилт болно. Хүлээн авагч талын чичиргээ, мэдэгдэл
   аль хэдийн олон тоог зөв боловсруулдаг. */

import { useEffect, useRef, useState } from "react";
import { Heart } from "lucide-react";
import { C } from "../lib/theme.js";
import { MISS_TICK_MS, MISS_MAX_BURST, missCount } from "../chibi/buzz.js";

export function MissButton({ onSend, disabled }) {
  const [count, setCount] = useState(0);   /* 0 = дарж байгаагүй */
  const [hearts, setHearts] = useState([]);
  const startRef = useRef(0);
  const timerRef = useRef(null);
  const seqRef = useRef(0);

  const stopTimer = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
  };

  /* Салахдаа таймер үлдээхгүй — эс бөгөөс дэлгэц солигдсон ч ажилласаар байна */
  useEffect(() => stopTimer, []);

  const bump = (n) => {
    setCount(n);
    navigator.vibrate?.(12);
    const id = ++seqRef.current;
    /* Зүрх бүр өөрийн налуу, хэмжээтэй — бүгд ижил замаар нисвэл механик харагдана */
    setHearts((h) => [...h, { id, x: Math.round((Math.random() - 0.5) * 60), s: 0.8 + Math.random() * 0.5 }]);
    setTimeout(() => setHearts((h) => h.filter((x) => x.id !== id)), 900);
  };

  const start = (e) => {
    if (disabled || timerRef.current) return;
    e.preventDefault();
    startRef.current = Date.now();
    bump(1);
    timerRef.current = setInterval(() => {
      const n = missCount(Date.now() - startRef.current);
      if (n >= MISS_MAX_BURST) stopTimer();
      bump(n);
    }, MISS_TICK_MS);
  };

  const end = () => {
    if (!timerRef.current && count === 0) return;
    stopTimer();
    const n = count || 1;
    setCount(0);
    onSend?.(n);
  };

  const holding = count > 0;

  return (
    <div className="relative">
      {/* Нисэх зүрхнүүд — товчны дээгүүр, дарагдалтыг залгихгүй */}
      <div className="absolute inset-x-0 bottom-full h-24 pointer-events-none overflow-hidden">
        {hearts.map((h) => (
          <span key={h.id} className="absolute left-1/2 bottom-0 miss-heart"
            style={{ transform: `translateX(${h.x}px) scale(${h.s})`, color: C.peachDeep }}>
            <Heart size={20} strokeWidth={2.4} fill="currentColor" />
          </span>
        ))}
      </div>

      <button
        onPointerDown={start}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
        onContextMenu={(e) => e.preventDefault()}
        disabled={disabled}
        aria-label="Санаж байгаагаа илгээх — удаан дарна"
        className="w-full rounded-full py-2.5 flex items-center justify-center gap-2 text-[12.5px] font-extrabold select-none disabled:opacity-40"
        style={{
          background: holding ? C.peachDeep : C.card,
          border: `1.6px solid ${holding ? C.peachDeep : C.line2}`,
          color: holding ? "#fff" : C.peachDeep,
          transform: holding ? "scale(0.97)" : "none",
          touchAction: "none",         /* удаан дарахад хуудас гүйхгүй */
          WebkitUserSelect: "none",    /* iOS дээр текст сонгогдохгүй */
          transition: "background 180ms ease, transform 180ms ease, color 180ms ease",
        }}>
        <Heart size={15} strokeWidth={2.6} fill={holding ? "currentColor" : "none"} />
        {holding ? `${count} удаа саналаа` : "Санаж байна"}
      </button>
    </div>
  );
}
