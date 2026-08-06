/* Улаанбаатарын цагийн бүсээр огноо, цаг гаргах туслахууд. */

/* ── Улаанбаатарын цаг ──
   Формат объектуудыг модулийн түвшинд НЭГ удаа үүсгэнэ. `Intl.DateTimeFormat`
   үүсгэх нь format() дуудахаас ~80 дахин үнэтэй; чат нэг зурагдахад эдгээр нь
   200 гаруй удаа дуудагддаг тул дуудалт тутамд шинээр үүсгэвэл гар утсан дээр
   товч дарах бүрд мэдрэгдэхүйц саатал болно. */
export const TZ = "Asia/Ulaanbaatar";

const DAY_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
});
const CLOCK_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
});

/* Аль ч Date-ыг УБ-ын хуанлийн өдөр (YYYY-MM-DD) болгоно. Зурвасууд өөр өөр
   цагийн бүсээс ирж болох тул "өдөр солигдсон эсэх"-ийг үргэлж УБ-аар шийднэ. */
export const ubDayOf = (d) => DAY_FMT.format(d);
export const ubDay = () => ubDayOf(new Date());

const clockParts = (d) => {
  const p = CLOCK_FMT.formatToParts(d);
  return (t) => p.find((x) => x.type === t)?.value ?? "00";
};

export const ubParts = () => {
  const g = clockParts(new Date());
  return { h: Number(g("hour")), m: Number(g("minute")), s: Number(g("second")) };
};

/* УБ-аар HH:mm */
export const ubTimeOf = (d) => {
  const g = clockParts(d);
  return `${g("hour")}:${g("minute")}`;
};

/* Firestore Timestamp-ыг УБ-ын HH:mm болгоно (чат, хадгалсан чат хоёулаа) */
export const chatTime = (ts) => (ts?.toDate ? ubTimeOf(ts.toDate()) : "");

export const pad = (n) => String(n).padStart(2, "0");

export const DAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

/* Чатын тусгаарлагч дээр бичих товч тэмдэглэгээ: "Өнөөдөр 21:34", "Даваа 10:00",
   "5 сарын 1, 10:00", "2025 оны 8 сарын 6, 10:00".

   Өдрийн зөрүүг цаг хугацааны зөрүүгээр бус, хуанлийн өдрөөр бодно — 23:50-д
   илгээсэн зурвас маргааш 00:10-д "өчигдөр" байх ёстой, "5 цагийн өмнө" биш. */
export function chatStamp(date, now = new Date()) {
  const [y, mo, d] = ubDayOf(date).split("-").map(Number);
  const [ny, nmo, nd] = ubDayOf(now).split("-").map(Number);
  const ms = Date.UTC(y, mo - 1, d);
  const days = Math.round((Date.UTC(ny, nmo - 1, nd) - ms) / 86400000);
  const time = ubTimeOf(date);

  if (days === 0) return `Өнөөдөр ${time}`;
  if (days === 1) return `Өчигдөр ${time}`;
  /* Гараг нь сүүлийн долоо хоногт л утгатай — түүнээс хол бол огноо тодорхой */
  if (days > 1 && days < 7) return `${DAYS[new Date(ms).getUTCDay()]} ${time}`;
  if (y === ny) return `${mo} сарын ${d}, ${time}`;
  return `${y} оны ${mo} сарын ${d}, ${time}`;
}
