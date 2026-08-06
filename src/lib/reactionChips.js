/* Зурвасын реакцуудыг харагдах чип болгон бэлдэнэ.

   Firestore-т реакц нь { хэрэглэгч: эможи } байдлаар хадгалагдана. Хоёулаа
   ижил эможи тавьвал давхардаж харагдах ёсгүй — нэг чип дээр тоог нь бичнэ. */

/* [{ emoji, count, mine }] — хамгийн олон тавигдсан нь эхэнд.
   Тэнцвэл эможигоор эрэмбэлнэ: эс бөгөөс дахин зурагдах бүрд дараалал үсэрнэ
   (Object.values-ийн дараалал баталгаагүй). */
export function reactionChips(reactions, me) {
  const counts = new Map();
  for (const [user, emoji] of Object.entries(reactions || {})) {
    if (!emoji) continue;
    const c = counts.get(emoji) || { emoji, count: 0, mine: false };
    c.count += 1;
    if (user === me) c.mine = true;
    counts.set(emoji, c);
  }
  return [...counts.values()].sort((a, b) => b.count - a.count || a.emoji.localeCompare(b.emoji));
}
