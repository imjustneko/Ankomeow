/* Товшилтыг хос руу дамжуулах давхарга.

   Firestore болон push-ыг гаднаас функц хэлбэрээр авдаг тул энэ модуль
   Firebase-ээс бүрэн ангид — тестэд mock л хангалттай.

   Firestore бичилт: THROTTLE БАЙХГҮЙ. Товшилт бүр яг нэг удаа `writeDoc`
   дуудна — batching байхгүй, учир нь хүлээн авагч талын `total` тоолуур энэ
   дээр найддаг.

   Push суваг: ЦОНХТОЙ НЭГТГЭЛТЭЙ (leading + trailing). iOS дээр push бол
   чичиргээний цорын ганц зам, харин WebKit чимээгүй push-ийн хязгаар давсан
   subscription-ыг цуцалдаг. Тиймээс push-ийг тухай бүр биш, дараах дүрмээр
   илгээнэ:
     - Цонх нээлттэй биш үед товшилт ирвэл ШУУД (0 хойшлолтгүй) нэг push
       илгээгээд 800мс цонх нээнэ — ганц товшилт хойшлолгүй хүрнэ.
     - Цонх нээлттэй үед товшилт ирвэл зөвхөн тоолуурт нэмээд, юу ч
       илгээхгүй.
     - Цонх дуусахад хуримтлагдсан тоо 0-ээс их бол яг нэг нэгтгэсэн push
       илгээгээд цонхыг хаана; 0 бол зүгээр цонхыг хаана. */

import { buzzMessage } from "./buzz.js";

export const PUSH_COALESCE_MS = 800;

export function createPokeSender({ writeDoc, sendPush, partnerName }) {
  let windowTimer = null;
  let pendingCount = 0;
  let pendingAt = null;

  const send = (at, count) => {
    try {
      Promise.resolve(sendPush({
        title: "Ankomeow",
        body: buzzMessage(partnerName, count),
        /* Давтагдахгүй tag — эс бөгөөс шинэ мэдэгдэл хуучныг дарж бичнэ. */
        tag: `poke-${at}`,
      })).catch(() => {});
    } catch {
      /* дуудлага өөрөө шидсэн ч UI зогсохгүй */
    }
  };

  return {
    poke(at) {
      /* Хоёр суваг бие биенээсээ хамаарахгүй: аль нэг нь унасан ч нөгөө нь явна. */
      try {
        Promise.resolve(writeDoc({ at })).catch(() => {});
      } catch {
        /* дуудлага өөрөө шидсэн ч UI зогсохгүй */
      }

      if (windowTimer === null) {
        /* Цонх хаалттай байсан — энэ товшилтоор шинэ цонх нээгээд шууд илгээнэ. */
        send(at, 1);
        pendingCount = 0;
        pendingAt = null;
        windowTimer = setTimeout(() => {
          const count = pendingCount;
          const triggeredAt = pendingAt;
          windowTimer = null;
          pendingCount = 0;
          pendingAt = null;
          if (count > 0) send(triggeredAt, count);
        }, PUSH_COALESCE_MS);
      } else {
        /* Цонх аль хэдийн нээлттэй — тоолуурт л нэмнэ, тусдаа push илгээхгүй. */
        pendingCount += 1;
        pendingAt = at;
      }
    },
  };
}
