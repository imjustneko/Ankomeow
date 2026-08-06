/* "Өнөөдрийн дурсамж" — өнгөрсөн жил, сарын яг энэ өдөр юу болсон бэ.

   Хосын аппад хамгийн их сэтгэл хөдөлгөдөг зүйл нь шинэ боломж биш, аль хэдийн
   болж өнгөрсөн мөчийг эргүүлж санагдуулах явдал. Өгөгдөл нь бүрэн бэлэн —
   зурвас бүр цагтай.

   Он сар өдрийг УБ-ын хуанлиар шийднэ (lib/time.js-тэй нэг зарчим): "яг энэ
   өдөр" гэдэг нь хэрэглэгчийн амьдарч буй өдөр байх ёстой, UTC-гийнх биш. */

/* Хэдэн хугацааны цонх харах вэ. Хол нь илүү үнэ цэнэтэй тул эрэмбэ нь
   хол→ойр: олдвол хамгийн холыг нь харуулна. */
export const MEMORY_WINDOWS = [
  { key: "y2", years: 2, label: "Хоёр жилийн өмнөх өнөөдөр" },
  { key: "y1", years: 1, label: "Жилийн өмнөх өнөөдөр" },
  { key: "m6", months: 6, label: "Хагас жилийн өмнөх өнөөдөр" },
  { key: "m3", months: 3, label: "Гурван сарын өмнөх өнөөдөр" },
  { key: "m1", months: 1, label: "Сарын өмнөх өнөөдөр" },
];

/* "YYYY-MM-DD"-оос тухайн хэмжээгээр ухарсан огноо.
   Сар ухрахад байхгүй өдөр гарч болно (3-31 → 2-31). JS-ийн Date нь үүнийг
   дараагийн сар руу гүйлгэдэг тул сарын сүүлийн өдрөөр таслана — 1-р сарын
   31-нээс сар ухрахад 12-р сарын 31 биш, 12-р сарын 31 гарах ёстой. */
export function shiftDay(dayISO, { years = 0, months = 0 }) {
  const [y, m, d] = String(dayISO).split("-").map(Number);
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;

  const total = (y * 12 + (m - 1)) - years * 12 - months;
  const ny = Math.floor(total / 12);
  const nm = total % 12;
  /* Тухайн сарын өдрийн тоо: дараагийн сарын 0 дахь өдөр */
  const lastDay = new Date(Date.UTC(ny, nm + 1, 0)).getUTCDate();
  const nd = Math.min(d, lastDay);
  return `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
}

/* Хайх өдрүүд — хол нь эхэнд. Дуудагч эдгээрийг Firestore-оос шүүнэ. */
export const memoryDays = (todayISO) =>
  MEMORY_WINDOWS
    .map((w) => ({ ...w, day: shiftDay(todayISO, w) }))
    .filter((w) => w.day);

/* Хэд хэдэн цонхны үр дүнгээс аль нэгийг сонгоно — хамгийн ХОЛЫГ нь.
   found нь { [key]: [зурвас…] } хэлбэртэй. */
export function pickMemory(found) {
  for (const w of MEMORY_WINDOWS) {
    const items = found?.[w.key];
    if (items?.length) return { ...w, items };
  }
  return null;
}
