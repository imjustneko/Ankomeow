/* Зөвхөн эможигоос бүтсэн зурвасыг таних.

   Instagram-ийн адил цөөн эможи бичихэд бөмбөлөггүй, том хэмжээгээр харуулна.
   Гурваас олон бол энгийн зурвас шиг харагдана — эс бөгөөс урт эгнээ дэлгэц
   дүүргэнэ. */

const MAX_BIG = 3;

/* Эможи нь нэг тэмдэгт биш байж болно: 👨‍👩‍👧 нь ZWJ-ээр холбогдсон таван
   код цэг, 👍🏽 нь арьсны өнгөтэй хос. Тиймээс код цэгээр бус ХАРАГДАХ НЭГЖ
   (grapheme)-ээр тоолно. Intl.Segmenter байхгүй хуучин хөтөч дээр код цэгээр
   унана — тэр үед нийлмэл эможи олон нэгж болж тоологдоод хязгаараас хэтэрч,
   энгийн зурвас болж харагдана (буруу томрохоос дээр). */
const graphemes = (s) => {
  if (typeof Intl?.Segmenter === "function") {
    return [...new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(s)].map((x) => x.segment);
  }
  return Array.from(s);
};

/* Зурвас нь 1-3 эможи мөн үү. Мөн бол хэдэн эможи болохыг, эс бөгөөс 0 буцаана. */
export function bigEmoji(text) {
  if (typeof text !== "string") return 0;
  const t = text.trim();
  if (!t) return 0;

  const units = graphemes(t).filter((g) => g.trim() !== "");
  if (units.length === 0 || units.length > MAX_BIG) return 0;

  return units.every((g) => /\p{Extended_Pictographic}/u.test(g)) ? units.length : 0;
}

/* Хэдэн эможи байгаагаас хамаарч хэмжээ — олон бол бага. Нэг эможи хамгийн том. */
export const BIG_EMOJI_SIZE = [46, 40, 34];
