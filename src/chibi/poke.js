/* Товшилтыг хос руу дамжуулах давхарга.

   Firestore болон push-ыг гаднаас функц хэлбэрээр авдаг тул энэ модуль
   Firebase-ээс бүрэн ангид — тестэд mock л хангалттай.

   Ичих анимаци нь эндээс хамаарахгүй: UI шууд ажиллаад, энэ нь зөвхөн
   сүлжээний талыг throttle-той хариуцна. */

export const POKE_THROTTLE_MS = 60000;

export function pokeMessage(name, count) {
  return count > 1 ? `${name} чамайг ${count} удаа товшлоо 💕` : `${name} чамайг товшлоо 💕`;
}

export function createPokeSender({ writeDoc, sendPush, partnerName, throttleMs = POKE_THROTTLE_MS }) {
  let lastSentAt = -Infinity;
  let pending = 0;

  const flush = (at) => {
    const count = pending;
    pending = 0;
    lastSentAt = at;
    try {
      Promise.resolve(writeDoc({ count })).catch(() => {});
      Promise.resolve(sendPush({
        title: "Ankomeow",
        body: pokeMessage(partnerName, count),
        tag: "poke",
      })).catch(() => {});
    } catch {
      /* дуудлага өөрөө шидсэн ч UI зогсохгүй */
    }
  };

  return {
    poke(at) {
      pending += 1;
      if (at - lastSentAt >= throttleMs) flush(at);
    },
  };
}
