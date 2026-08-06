/* "Өнөөдрийн дурсамж" карт.

   Firestore-оос хэдэн хугацааны цонхыг зэрэг шүүж, олдсоны хамгийн холыг нь
   харуулна. Зөвхөн НЭГ удаа (өдөрт нэг) татна — нүүр дэлгэц дахин зурагдах
   бүрд сүлжээ рүү явбал утгагүй. */

import { useEffect, useState } from "react";
import { Timestamp, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { messagesCol } from "../lib/firebase.js";
import { C } from "../lib/theme.js";
import { chatStamp } from "../lib/time.js";
import { memoryDays, pickMemory } from "../lib/memories.js";
import { MessageBody } from "./message.jsx";
import { Card } from "./primitives.jsx";

/* "YYYY-MM-DD" УБ-ын өдрийг эхлэл/төгсгөлийн агшин болгоно.
   УБ нь UTC+8 тул тухайн өдөр UTC-гээр өмнөх өдрийн 16:00-д эхэлнэ. Хэлхээг
   гараар бодохын оронд Intl-ээр шалгасан тогтмол шилжилтийг ашиглана —
   Монгол улс зуны цаг хэрэглэдэггүй тул шилжилт тогтмол. */
const UB_OFFSET_MS = 8 * 60 * 60 * 1000;
const dayRange = (dayISO) => {
  const [y, m, d] = dayISO.split("-").map(Number);
  const start = Date.UTC(y, m - 1, d) - UB_OFFSET_MS;
  return [Timestamp.fromMillis(start), Timestamp.fromMillis(start + 86400000 - 1)];
};

export function MemoryCard({ todayISO, onOpen }) {
  const [memory, setMemory] = useState(null);

  useEffect(() => {
    let alive = true;
    const windows = memoryDays(todayISO);

    Promise.all(windows.map(async (w) => {
      const [from, to] = dayRange(w.day);
      const snap = await getDocs(query(
        messagesCol(), where("createdAt", ">=", from), where("createdAt", "<=", to),
        orderBy("createdAt", "asc"), limit(20)
      )).catch(() => null);
      return [w.key, snap ? snap.docs.map((x) => ({ id: x.id, ...x.data() })) : []];
    })).then((pairs) => {
      if (alive) setMemory(pickMemory(Object.fromEntries(pairs)));
    });

    return () => { alive = false; };
  }, [todayISO]);

  if (!memory) return null;

  /* Зураг байвал түүнийг, эс бөгөөс хамгийн урт текстийг сонгоно —
     "юу болсон бэ" гэдгийг хамгийн сайн илэрхийлэх нэг зүйл. */
  const pick = memory.items.find((m) => m.type === "image" || m.type === "drawing")
    ?? [...memory.items].sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0))[0];

  return (
    <Card tint="#F6F0FF" className="mb-4" onClick={onOpen}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[13px] font-extrabold flex-1 min-w-0 truncate" style={{ color: C.ink }}>
          ✨ {memory.label}
        </span>
        <span className="text-[11.5px] font-bold shrink-0" style={{ color: C.lilacDeep }}>Чат руу →</span>
      </div>
      <div className="rounded-2xl px-3 py-2.5" style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
        <div className="text-[9.5px] font-extrabold mb-1" style={{ color: C.inkSoft }}>
          {pick?.senderName || ""}{pick?.createdAt?.toDate ? ` · ${chatStamp(pick.createdAt.toDate())}` : ""}
        </div>
        <div className="text-[12.5px] font-semibold" style={{ color: C.ink }}>
          <MessageBody m={pick} mine={false} />
        </div>
      </div>
      {memory.items.length > 1 && (
        <div className="text-[10.5px] font-bold mt-1.5 px-1" style={{ color: C.inkSoft }}>
          Тэр өдөр {memory.items.length} зурвас солилцжээ
        </div>
      )}
    </Card>
  );
}
