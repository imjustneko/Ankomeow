/* Хосын огноо, ой, streak-ийн тооцоолол.
   Бүгд ЦЭВЭР функц — Date.now(), цагийн бүс, Firestore-оос хамаарахгүй тул
   тестлэхэд амархан. Огноог бүгдийг нь "YYYY-MM-DD" мөрөөр илэрхийлнэ
   (аппын бусад хэсэг ubDay()-ээр яг ийм мөр үүсгэдэг).

   Санамж: огноог UTC-ээр задлан бодно. Локал Date(y, m, d) ашиглавал
   зуны цагийн шилжилттэй бүсэд өдрийн зөрүү 1-ээр алдагдах эрсдэлтэй. */

const MS_DAY = 86400000;

const toUTC = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number);
  if (!y || !m || !d) return NaN;
  return Date.UTC(y, m - 1, d);
};

const fromUTC = (ms) => {
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
};

export const isValidDay = (iso) => Number.isFinite(toUTC(iso));

/* fromISO-оос toISO хүртэлх бүтэн өдрийн тоо (сөрөг ч байж болно) */
export function daysBetween(fromISO, toISO) {
  const a = toUTC(fromISO), b = toUTC(toISO);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return null;
  return Math.round((b - a) / MS_DAY);
}

export function shiftDay(iso, delta) {
  const a = toUTC(iso);
  if (!Number.isFinite(a)) return null;
  return fromUTC(a + delta * MS_DAY);
}

/* Хамт байсан хэддэх өдөр вэ. Танилцсан өдөр нь 1 дэх өдөр. */
export function dayNumber(sinceISO, todayISO) {
  const n = daysBetween(sinceISO, todayISO);
  return n == null ? null : n + 1;
}

/* Тэмдэглэлт өдрийн тоонууд — эдгээрт хүрэхэд баярлана */
export const MILESTONE_DAYS = [50, 100, 200, 300, 365, 500, 700, 1000, 1500, 2000, 2500, 3000, 4000, 5000];

/* Ойрын тэмдэглэлт өдөр: өдрийн тоогоор ба хуанлийн ойгоор хоёуланг нь
   бодоод хамгийн эртхэн ирэхийг нь буцаана. */
export function nextMilestone(sinceISO, todayISO) {
  const passed = daysBetween(sinceISO, todayISO);
  if (passed == null || passed < 0) return null;

  const cands = [];

  for (const d of MILESTONE_DAYS) {
    if (d > passed) { cands.push({ kind: "days", label: `${d} өдөр`, date: shiftDay(sinceISO, d), left: d - passed }); break; }
  }

  /* Хуанлийн ой — 29-ний 2 сард төрсөн зэрэг тохиолдолд Date.UTC өөрөө
     дараагийн сар руу гулсуулдаг тул нэмэлт залруулга шаардлагагүй. */
  const [sy, sm, sd] = sinceISO.split("-").map(Number);
  const ty = Number(todayISO.slice(0, 4));
  for (let y = ty; y <= ty + 1; y++) {
    const iso = fromUTC(Date.UTC(y, sm - 1, sd));
    const left = daysBetween(todayISO, iso);
    if (left > 0) {
      cands.push({ kind: "year", label: `${y - sy} жилийн ой`, date: iso, left });
      break;
    }
  }

  cands.sort((a, b) => a.left - b.left);
  return cands[0] || null;
}

/* Дараагийн төрсөн өдөр. mmdd нь "MM-DD". */
export function nextBirthday(mmdd, todayISO) {
  if (!/^\d{2}-\d{2}$/.test(String(mmdd || ""))) return null;
  const [m, d] = mmdd.split("-").map(Number);
  const ty = Number(todayISO.slice(0, 4));
  for (let y = ty; y <= ty + 1; y++) {
    const iso = fromUTC(Date.UTC(y, m - 1, d));
    const left = daysBetween(todayISO, iso);
    if (left >= 0) return { date: iso, left };
  }
  return null;
}

/* Хоёулаа биелүүлсэн дараалсан өдрийн тоо.
   Өнөөдөр хараахан биелээгүй байж болно — тэр тохиолдолд өчигдрөөс тоолж
   эхэлнэ, эс бөгөөс өглөө бүр streak тэглэгдсэн мэт харагдана. */
export function streakCount(doneDays, todayISO) {
  const set = doneDays instanceof Set ? doneDays : new Set(doneDays || []);
  let cur = set.has(todayISO) ? todayISO : shiftDay(todayISO, -1);
  let n = 0;
  while (cur && set.has(cur)) {
    n += 1;
    cur = shiftDay(cur, -1);
  }
  return n;
}

/* Өдрийн баримтуудаас хоёулаа биелүүлсэн өдрүүдийг ялгана */
export const bothDoneDays = (docs, keyA, keyB) =>
  new Set((docs || []).filter((r) => r?.[keyA] && r?.[keyB]).map((r) => r.d).filter(Boolean));

/* Үлдсэн хоногийг хүнлэг үгээр */
export const leftText = (left) =>
  left === 0 ? "өнөөдөр!" : left === 1 ? "маргааш" : `${left} хоногийн дараа`;
