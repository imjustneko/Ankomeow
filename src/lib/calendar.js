/* Хамтын календарийн цэвэр тооцоолол. Огноо бүгд "YYYY-MM-DD". */

import { daysBetween, shiftDay } from "./couple.js";

export const MONTHS = [
  "1-р сар", "2-р сар", "3-р сар", "4-р сар", "5-р сар", "6-р сар",
  "7-р сар", "8-р сар", "9-р сар", "10-р сар", "11-р сар", "12-р сар",
];
/* Долоо хоног Даваагаар эхэлнэ */
export const WEEKDAYS = ["Да", "Мя", "Лх", "Пү", "Ба", "Бя", "Ня"];

export const monthKey = (iso) => String(iso).slice(0, 7);

/* Тухайн сарын мужийг нүдэн тор болгож бэлдэнэ. Эхний мөрийг өмнөх сарын
   өдрүүдээр нөхөж, Даваагаас эхлүүлнэ. Буцаах бүх нүд { d, inMonth }. */
export function monthGrid(ym) {
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return [];
  const first = `${y}-${String(m).padStart(2, "0")}-01`;
  /* getUTCDay: Ням=0. Даваа=0 болгож шилжүүлнэ. */
  const dow = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [];
  for (let i = 0; i < dow; i++) cells.push({ d: shiftDay(first, i - dow), inMonth: false });
  for (let i = 0; i < daysInMonth; i++) cells.push({ d: shiftDay(first, i), inMonth: true });
  while (cells.length % 7) cells.push({ d: shiftDay(first, cells.length - dow), inMonth: false });
  return cells;
}

export function addMonths(ym, delta) {
  const [y, m] = String(ym).split("-").map(Number);
  if (!y || !m) return ym;
  const t = (y * 12 + (m - 1)) + delta;
  return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, "0")}`;
}

/* Тухайн өдрийн үйл явдлууд, цагаар эрэмбэлсэн */
export const eventsOn = (events, iso) =>
  (events || []).filter((e) => e?.d === iso).sort((a, b) => String(a.t || "").localeCompare(String(b.t || "")));

/* Өнөөдрөөс хойших ойрын үйл явдлууд */
export function upcoming(events, todayISO, count = 5) {
  return (events || [])
    .filter((e) => e?.d && daysBetween(todayISO, e.d) >= 0)
    .sort((a, b) => (a.d === b.d ? String(a.t || "").localeCompare(String(b.t || "")) : a.d < b.d ? -1 : 1))
    .slice(0, count)
    .map((e) => ({ ...e, left: daysBetween(todayISO, e.d) }));
}

/* Мэдэгдэл өгөх цаг болсон эсэх: тухайн өдөр ирсэн бөгөөд цаг нь өнгөрсөн */
export function isDue(ev, todayISO, nowMinutes) {
  if (!ev?.d || ev.d !== todayISO) return false;
  if (!ev.t) return true; /* цаг заагаагүй бол өдрийн турш */
  const [h, m] = String(ev.t).split(":").map(Number);
  if (!Number.isFinite(h)) return true;
  return nowMinutes >= h * 60 + (m || 0);
}
