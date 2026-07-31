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
