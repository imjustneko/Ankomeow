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

/* "Санаж байна" товчны текст. Товшилттой нэг сувгаар явдаг тул баримт дээрх
   kind талбараар л ялгагдана. */
export function missMessage(name, count) {
  return count > 1 ? `${name} чамайг ${count} удаа саналаа 💗` : `${name} чамайг саналаа 💗`;
}

/* Аль сувгийн текстийг сонгох вэ. Танихгүй утга ирвэл товшилт гэж үзнэ —
   хуучин баримтуудад kind огт байхгүй. */
export function pokeMessage(kind, name, count) {
  return kind === "miss" ? missMessage(name, count) : buzzMessage(name, count);
}

/* Нэг удаа дарж байхад илгээх дээд тоо. Хуруу гацсан, эсвэл халаасанд
   дарагдсан ч хамтрагч руу зуу зуун зүрх явахгүй. */
export const MISS_MAX_BURST = 30;

/* Дарж байх хугацааг тоо болгоно — эхний зүрх шууд, дараа нь алхам тутам. */
export const MISS_TICK_MS = 180;

export function missCount(heldMs, tickMs = MISS_TICK_MS, max = MISS_MAX_BURST) {
  if (!Number.isFinite(heldMs) || heldMs < 0) return 1;
  return Math.min(max, 1 + Math.floor(heldMs / tickMs));
}

/* Хүлээн авах талын шийдвэрийн логик: чичрэх үү, мэдэгдэл харуулах уу, юу ч
   хийхгүй юу. Firebase, DOM-оос ангид байлгахын тулд `canVibrate`,
   `visible`-ийг гаднаас plain boolean хэлбэрээр авна.

   Persistent cache асаалттай тул Firestore-ийн эхний snapshot КЭШЛЭГДСЭН
   баримт байдаг бөгөөд дараа нь СЕРВЕРИЙН баримт ирдэг. Тиймээс baseline-ыг
   зөвхөн серверийн (fromCache === false) эхний snapshot дээр л тогтооно —
   эс бөгөөс кэшийн snapshot дээр baseline тогтоод, дараагийн серверийн
   snapshot-ыг "шинэ" товшилт мэт үзэж, өглөө бүр шөнийн товшилтуудаар
   чичрэх болно. */
export function shouldBuzz({ fromCache, baselineReady, prev, total, canVibrate, visible }) {
  if (!baselineReady) {
    return { action: "none", delta: 0, nextBaselineReady: !fromCache };
  }

  const delta = pokeDelta(prev, total);

  if (delta <= 0) {
    return { action: "none", delta, nextBaselineReady: true };
  }
  if (canVibrate) {
    return { action: "vibrate", delta, nextBaselineReady: true };
  }
  if (visible) {
    return { action: "notify", delta, nextBaselineReady: true };
  }
  /* Апп харагдахгүй үед (дэлгэц түгжигдсэн, tab арын дэвсгэрт) sw.js аль
     хэдийн OS мэдэгдэл харуулдаг тул давхар мэдэгдэл гаргахгүй. */
  return { action: "none", delta, nextBaselineReady: true };
}
