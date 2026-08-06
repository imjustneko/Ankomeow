/* Товлосон зурвас — одоо бичээд ирээдүйд хүргэгдэнэ.

   Cron хэрэглэхгүй: хос хоёулаа аппаа нээх бүрд хүргэх цаг нь болсон зурвас
   байгаа эсэхийг шалгана. Хоёулангийнх нь клиент шалгадаг тул аль нэг нь
   нээхэд л хүрнэ — сервергүйгээр найдвартай байх арга.

   Хариуд нь: хүргэлт нь товлосон ЯГ тэр агшинд биш, түүнээс хойш хэн нэг нь
   аппаа нээх эхний мөчид болно. Хосын аппад энэ нь хүлээн зөвшөөрөгдөх —
   зурвасын утга нь секундэд биш, өдөрт нь байдаг. */

/* datetime-local оролтоос ирсэн утга ирээдүйд байна уу.
   Хоромхон зуурын ялгааг тэвчинэ: хэрэглэгч "яг одоо"-г сонгож болно. */
export function parseWhen(value, now = Date.now()) {
  if (!value) return null;
  const ms = new Date(value).getTime();
  if (!Number.isFinite(ms)) return null;
  return ms > now ? ms : null;
}

/* Хүргэх цаг нь болсон зурвасууд — эрт товлогдсоноос нь эхэлж.
   `at` нь Firestore Timestamp эсвэл тоо байж болно. */
const toMs = (t) => (typeof t?.toMillis === "function" ? t.toMillis() : t ?? null);

export function dueNow(list, now = Date.now()) {
  return (list ?? [])
    .filter((s) => {
      const at = toMs(s?.at);
      return at != null && at <= now;
    })
    .sort((a, b) => toMs(a.at) - toMs(b.at));
}

/* Хүлээгдэж буй зурвасууд — ойрын нь эхэнд (хэрэглэгчид харуулах жагсаалт) */
export function pending(list, now = Date.now()) {
  return (list ?? [])
    .filter((s) => {
      const at = toMs(s?.at);
      return at != null && at > now;
    })
    .sort((a, b) => toMs(a.at) - toMs(b.at));
}
