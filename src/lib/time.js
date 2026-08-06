/* Улаанбаатарын цагийн бүсээр огноо, цаг гаргах туслахууд. */

/* ── Улаанбаатарын цаг ── */
export const TZ = "Asia/Ulaanbaatar";
export const ubDay = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date());
export const ubParts = () => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const g = (t) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { h: g("hour"), m: g("minute"), s: g("second") };
};
export const pad = (n) => String(n).padStart(2, "0");

export const DAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

/* ── Чатын огнооны тэмдэглэгээ ──
   Аль ч Date-ыг УБ-ын хуанлийн өдөр (YYYY-MM-DD) болгоно. Зурвасууд өөр өөр
   цагийн бүсээс ирж болох тул "өдөр солигдсон эсэх"-ийг үргэлж УБ-аар шийднэ. */
export const ubDayOf = (d) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

const ubTimeOf = (d) => {
  const p = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false })
    .formatToParts(d);
  const g = (t) => p.find((x) => x.type === t)?.value ?? "00";
  return `${g("hour")}:${g("minute")}`;
};

/* Чатын тусгаарлагч дээр бичих товч тэмдэглэгээ: "Өнөөдөр 21:34", "Даваа 10:00",
   "5 сарын 1, 10:00", "2025 оны 8 сарын 6, 10:00".

   Өдрийн зөрүүг цаг хугацааны зөрүүгээр бус, хуанлийн өдрөөр бодно — 23:50-д
   илгээсэн зурвас маргааш 00:10-д "өчигдөр" байх ёстой, "5 цагийн өмнө" биш. */
export function chatStamp(date, now = new Date()) {
  const key = ubDayOf(date);
  const [y, mo, d] = key.split("-").map(Number);
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
