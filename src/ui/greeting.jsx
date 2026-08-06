/* Мэндчилгээ — хамтрагч аппаа нээхэд угтах зурсан зураг.

   Чатын зурвас биш: зурвас нь урсгал дотор алга болдог бол мэндчилгээ нь
   БҮТЭН ДЭЛГЭЦЭЭР угтана. "Өглөө сэрэхэд чиний зурсан зураг угтлаа" гэдэг
   мэдрэмжийг ердийн зурвас өгч чадахгүй.

   Нэг л удаа харагдана: хараад хаамагц баримт устана. Хадгалах ёстой бол
   хүлээн авагч нь чат руу шилжүүлж болно — гэхдээ мартагдах эрх нь ч
   мэндчилгээг үнэ цэнэтэй болгодог. */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { deleteDoc, doc, onSnapshot } from "firebase/firestore";
import { CHAT_ROOM, db } from "../lib/firebase.js";
import { C } from "../lib/theme.js";
import { DrawingView } from "./drawing.jsx";
import { X } from "lucide-react";

export const greetingDoc = (key) => doc(db, "rooms", CHAT_ROOM, "greetings", key);

/* Надад ирсэн мэндчилгээг сонсоно. Байвал бүтэн дэлгэцээр угтана. */
export function GreetingOverlay({ accountKey }) {
  const [greeting, setGreeting] = useState(null);

  useEffect(() => {
    if (!accountKey) return;
    const unsub = onSnapshot(greetingDoc(accountKey), (s) => {
      setGreeting(s.exists() && s.data()?.strokes?.length ? s.data() : null);
    }, () => {});
    return unsub;
  }, [accountKey]);

  /* Нээлттэй үед арын хуудас гүйхгүй */
  useEffect(() => {
    if (!greeting) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [greeting]);

  if (!greeting) return null;

  const close = () => {
    setGreeting(null);                                  /* шууд хаана — сүлжээ хүлээхгүй */
    deleteDoc(greetingDoc(accountKey)).catch(() => {});
  };

  return createPortal(
    <div className="fixed inset-0 z-[998] flex flex-col items-center justify-center px-8 greeting-in"
      style={{ background: "var(--splash-a)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
      <button onClick={close} aria-label="Хаах"
        className="absolute top-5 right-5 w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
        style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink, transition: "transform 120ms ease" }}>
        <X size={19} strokeWidth={2.6} />
      </button>

      <div className="text-[12px] font-extrabold mb-4 tracking-wide" style={{ color: C.inkSoft, letterSpacing: ".08em" }}>
        {(greeting.fromName || "ХАМТРАГЧ").toUpperCase()} ЧАМД ҮЛДЭЭВ
      </div>

      <div className="w-full rounded-[28px] p-4" style={{ maxWidth: 340, background: C.card, border: `1.6px solid ${C.line2}` }}>
        <DrawingView strokes={greeting.strokes} />
      </div>

      {greeting.text && (
        <div className="text-[14px] font-extrabold mt-4 text-center" style={{ color: C.ink }}>{greeting.text}</div>
      )}

      <button onClick={close}
        className="mt-6 rounded-full px-6 py-2.5 text-[12.5px] font-extrabold active:scale-95"
        style={{ background: C.lilacDeep, color: "#fff", transition: "transform 120ms ease" }}>
        Баярлалаа 💛
      </button>
    </div>,
    document.body
  );
}
