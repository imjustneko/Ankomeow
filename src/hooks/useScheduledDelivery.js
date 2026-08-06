/* Товлосон зурвасыг хүргэнэ.

   Хос хоёулаа энэ hook-ийг ажиллуулна: аль нэг нь аппаа нээхэд цаг нь болсон
   зурвас чат руу орно. Cron шаардлагагүй бөгөөд сервер ажиллаагүйгээс болж
   зурвас алдагдахгүй.

   Хоёулангийнх нь клиент зэрэг хүргэхийг оролдож болзошгүй тул ТРАНЗАКЦААР
   хийнэ: товлолтын баримт байсаар байвал л зурвас үүсгэж, тэр даруй устгана.
   Хожигдсон клиентийн транзакц баримт олдохгүй болж зогсоно — давхар зурвас
   гарахгүй. */

import { useEffect } from "react";
import { doc, onSnapshot, runTransaction, serverTimestamp } from "firebase/firestore";
import { db, messagesCol, scheduledCol } from "../lib/firebase.js";
import { dueNow } from "../lib/scheduled.js";

export function useScheduledDelivery(accountKey, onDelivered) {
  useEffect(() => {
    if (!accountKey) return;

    /* Бүх товлолтыг сонсоно — хэдхэн баримт тул хөнгөн. Цаг нь болсныг
       клиент талд шүүнэ: `where`-ээр шүүвэл цаг өнгөрөхөд өөрөө шинэчлэгдэхгүй. */
    const unsub = onSnapshot(scheduledCol(), (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      for (const s of dueNow(all, Date.now())) deliver(s, onDelivered);
    }, () => {});

    return unsub;
  }, [accountKey, onDelivered]);
}

async function deliver(s, onDelivered) {
  const schedRef = doc(scheduledCol(), s.id);
  /* Шинэ зурвасын лавлагааг УРЬДЧИЛЖ үүсгэнэ — транзакц дотор addDoc хийж
     болохгүй (id нь урьдчилан мэдэгдсэн байх ёстой). */
  const msgRef = doc(messagesCol());

  const done = await runTransaction(db, async (tx) => {
    const cur = await tx.get(schedRef);
    if (!cur.exists()) return false;      /* нөгөө клиент хүргэчихсэн */
    const d = cur.data();
    tx.set(msgRef, {
      sender: d.from, senderName: d.fromName ?? null, createdAt: serverTimestamp(),
      type: "text", text: d.text, scheduled: true,
    });
    tx.delete(schedRef);
    return true;
  }).catch(() => false);

  if (done) onDelivered?.(s);
}
