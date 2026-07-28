/* Chibi товшиход гарах ярианы үгс.

   Зөвхөн Neko-гийн дүр ярина — өөрөөр хэлбэл Andela-гийн дэлгэц дээр. Шинэ үг
   нэмэх бол доорх жагсаалтад нэмнэ; өөр код өөрчлөх шаардлагагүй. */

export const PHRASES = [
  "Хайртай шүү 💕",
  "Чи минь мундаг шүү!",
  "Амжилт!",
  "Хайртай!",
  "Wuadada!",
  "Nieedda~",
  "Чамайг санаж байна",
  "Тэвэрмээр байна",
  "Сайхан амраарай",
  "Чи хамгийн хөөрхөн!",
];

/* Аль дүр ярих вэ */
export const TALKATIVE = "neko";

/* Санамсаргүй үг сонгоно. Дараалан хоёр удаа ижил үг гарахаас сэргийлнэ —
   давхардвал жагсаалтын дараагийн үгийг авна. */
export function pickPhrase(previous, rand = Math.random) {
  if (PHRASES.length === 0) return "";
  if (PHRASES.length === 1) return PHRASES[0];
  const i = Math.min(PHRASES.length - 1, Math.floor(rand() * PHRASES.length));
  const picked = PHRASES[i];
  return picked === previous ? PHRASES[(i + 1) % PHRASES.length] : picked;
}
