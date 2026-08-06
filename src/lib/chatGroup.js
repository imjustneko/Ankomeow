/* Чатын зурвасыг Instagram маягаар бүлэглэх.

   Хоёр тусдаа шийдвэр гарна:
     stamp      — энэ зурвасын дээр огнооны тэмдэглэгээ гарах уу
     groupStart / groupEnd — бөмбөлөг нь бүлгийн эхэн/төгсгөл үү

   Тэмдэглэгээ нь өдөр солигдоход, эсвэл ярианд урт завсар үүсэхэд гарна.
   Бүлэг нь нэг хүний ойрхон илгээсэн зурвасуудыг нэгтгэнэ — нэр нэг л удаа
   бичигдэж, булангууд нийлж, зай нь нягтарна. */

const STAMP_GAP_MS = 60 * 60 * 1000; /* 1 цаг */
const GROUP_GAP_MS = 5 * 60 * 1000;  /* 5 минут */

/* Илгээгдэж яваа зурвасын serverTimestamp нь эхэндээ null байдаг тул цаг нь
   мэдэгдэхгүй байж болно. Тийм үед завсрыг мэдэх аргагүй — шинэ тэмдэглэгээ
   гаргахгүй (буруу "Өнөөдөр" бичихээс дуугүй байсан нь дээр). */
const msOf = (m) => m?.createdAt?.toMillis?.() ?? null;

export function groupMessages(messages, dayKey) {
  const at = messages.map(msOf);

  const stamp = messages.map((m, i) => {
    if (i === 0) return true;
    const t = at[i], p = at[i - 1];
    if (t == null || p == null) return false;
    return t - p > STAMP_GAP_MS || dayKey(new Date(t)) !== dayKey(new Date(p));
  });

  /* i ба i+1 хоёр зэргэлдээ зурвас нэг бүлэгт багтах хэмжээний ойрхон уу */
  const near = (i) => {
    const a = at[i], b = at[i + 1];
    return a == null || b == null || b - a <= GROUP_GAP_MS;
  };

  /* stamp[0] нь үргэлж true тул эхний зурвас автоматаар бүлгийн эхлэл болно */
  return messages.map((m, i) => ({
    m,
    stamp: stamp[i],
    groupStart: stamp[i] || messages[i - 1].sender !== m.sender || !near(i - 1),
    groupEnd: i === messages.length - 1 || stamp[i + 1] || messages[i + 1].sender !== m.sender || !near(i),
  }));
}
