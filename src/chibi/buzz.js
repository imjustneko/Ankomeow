/* Товшилтын чичиргээ ба мэдэгдлийн цэвэр логик.

   Firebase, DOM, React-аас бүрэн ангид — `canVibrate` нь дэлхийн `navigator`-ыг
   зөвхөн уншиж шалгадаг тул тестэд stub хийхэд хангалттай. */

/* Хүн 5-аас олон цохилтыг ялгаж мэдрэхгүй бөгөөд урт чичиргээ бухимдуулна. */
export const MAX_BUZZ_PULSES = 5;

const PULSE_MS = 35; /* нэг цохилтын урт */
const GAP_MS = 90;   /* цохилт хоорондын завсар */

/* Хэдэн товшилт ирснийг чичиргээний хэв маяг болгоно.
   Нэг товшилт → зүгээр л нэг богино цохилт.
   Олон товшилт → [завсар, цохилт, завсар, цохилт, ...] хэлбэр. */
export function vibrationPattern(count) {
  const n = Math.min(Math.max(Math.floor(count), 0), MAX_BUZZ_PULSES);
  if (n <= 0) return [];
  if (n === 1) return [PULSE_MS];

  const pattern = [];
  for (let i = 0; i < n; i += 1) {
    pattern.push(i === 0 ? 0 : GAP_MS);
    pattern.push(PULSE_MS);
  }
  return pattern;
}

/* Хоёр тоолуурын хооронд хэдэн шинэ товшилт байсныг олно.
   Буурсан утга нь тоолуур дахин тохируулагдсан гэсэн үг — шинэ товшилт биш. */
export function pokeDelta(prevTotal, nextTotal) {
  const diff = Number(nextTotal) - Number(prevTotal);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

/* Энэ төхөөрөмж чичрэх боломжтой юу. iOS нь Vibration API-г огт дэмждэггүй. */
export function canVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/* Мэдэгдлийн текст. */
export function buzzMessage(name, count) {
  return count > 1 ? `${name} чамайг ${count} удаа товшлоо 💕` : `${name} чамайг товшлоо 💕`;
}
