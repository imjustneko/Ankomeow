/* Чатын хайлт.

   Firestore нь бүтэн текст хайлт дэмждэггүй бөгөөд гуравдагч сан (Algolia г.м.)
   холбох нь хосын чатад хэтэрхий хүнд. Ачаалагдсан зурвасууд дотор локалаар
   шүүх нь энэ хэмжээнд бүрэн хангалттай — хэрэглэгч дээш гүйлгэж хуучин
   зурвасаа нээх тусам хайлтын хамрах хүрээ ч тэлнэ.

   Зөвхөн ТЕКСТ агуулсан зурвасыг хайна: зураг, дуу, зурсан зурагт хайх үг
   байхгүй. Реакцийн шошго нь текст боловч хэрэглэгчийн бичсэн үг биш тул
   хайлтын үр дүнг бохирдуулна. */

/* Монгол хэлний том/жижиг үсгийг ялгахгүй, хоёр талын зайг хасна */
const norm = (s) => String(s ?? "").toLocaleLowerCase("mn").trim();

/* Зурвасаас хайж болох текстийг гаргана. Хайх зүйлгүй бол хоосон мөр. */
export function searchableText(m) {
  if (m?.type === "text") return m.text || "";
  /* Хариулт дотор иш татсан текст ч хайлтад тохирвол утгатай */
  return "";
}

/* Тохирсон зурвасууд — шинэ нь эхэнд (хайж байгаа хүн ихэвчлэн сүүлийнхийг
   хайдаг). Хоосон хайлтад юу ч буцаахгүй — бүх зурвасыг үзүүлэх нь утгагүй. */
export function searchMessages(messages, term) {
  const q = norm(term);
  if (!q) return [];
  const out = [];
  for (let i = (messages?.length ?? 0) - 1; i >= 0; i--) {
    const m = messages[i];
    if (norm(searchableText(m)).includes(q)) out.push(m);
  }
  return out;
}

/* Үр дүнд харуулах товч хэсэг — тохирлыг нь голд нь байлгана.
   Урт зурвасын эхний 60 тэмдэгтийг харуулбал тохирсон үг харагдахгүй байж
   болно; тохирлын эргэн тойрныг таслах нь үр дүнг уншиж болохуйц болгоно. */
export function snippet(text, term, span = 48) {
  const t = String(text ?? "");
  const i = norm(t).indexOf(norm(term));
  if (i < 0 || t.length <= span * 2) return t;
  const from = Math.max(0, i - span);
  const to = Math.min(t.length, i + term.length + span);
  return (from > 0 ? "…" : "") + t.slice(from, to) + (to < t.length ? "…" : "");
}
