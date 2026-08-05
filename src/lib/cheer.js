/* Өдрийн ялалт ба хамтрагчийн шинэ мэдээ — цэвэр логик.

   Хоёр тусдаа асуулт хариулна:
   1. Өнөөдөр аль зорилго шинээр биелсэн бэ (баяр хийх ёстой мөч).
   2. Хамтрагч дээр миний хараагүй шинэ юм байна уу (story тойргийн дохио).

   Хоёулаа Date.now(), localStorage, Firestore-оос хамаарахгүй тул тестлэхэд
   амархан — дуудагч тал л утгыг нь дамжуулна. */

/* Өнөөдрийн зорилгууд биелсэн эсэх. Жагсаалт хоосон бол "биелсэн" гэж
   тооцохгүй — юу ч хийгээгүй байхад баярлах нь утгагүй. */
export function goalsMet({ ml, goal, items }) {
  const list = items || [];
  return {
    water: goal > 0 && (ml ?? 0) >= goal,
    list: list.length > 0 && list.every((i) => i.done),
  };
}

/* Урьд нь баярлаж байгаагүй бөгөөд одоо биелсэн зорилгууд.
   done нь тухайн өдөр аль хэдийн баярласан зорилгуудын багц. */
export function pendingCheers(met, done) {
  const already = done instanceof Set ? done : new Set(done || []);
  return Object.keys(met).filter((k) => met[k] && !already.has(k));
}

export const CHEER_TEXT = {
  water: { toast: "Өнөөдрийн усаа уучихлаа 💧", notify: "өнөөдрийн усаа уучихлаа 💧" },
  list: { toast: "Жагсаалтаа бүрэн биелүүллээ ✨", notify: "жагсаалтаа бүрэн биелүүллээ ✨" },
};

/* Хамтрагч дээр миний хараагүй шинэ юм байна уу.
   updatedAt, seenAt хоёул миллисекунд. Аль нэг нь байхгүй бол шинэ гэж
   үзэхгүй — эс бөгөөс анх нэвтрэхэд шалтгаангүй дохио асна. */
export function hasUnseen(updatedAt, seenAt) {
  if (!updatedAt) return false;
  return updatedAt > (seenAt || 0);
}

/* Хамтрагч яг одоо апп нээлттэй байна уу.
   seenAt нь тэдний сүүлд бичсэн мөч, now нь одоо. Цагийн зөрүүнээс болж
   ирээдүйн мөч ирвэл ч онлайн гэж үзнэ. */
export const ONLINE_WINDOW_MS = 5 * 60 * 1000;

export function isOnline(seenAt, now, windowMs = ONLINE_WINDOW_MS) {
  if (!seenAt) return false;
  return now - seenAt < windowMs;
}
