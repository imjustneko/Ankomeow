/* Чатын бөмбөлөг дээрх дохионы шийдвэрүүд.

   Нэг хуруу гурван өөр утга илэрхийлж болно:
     давхар товшилт → зүрх
     удаан дарах    → үйлдлийн цэс
     баруун шудрах  → хариулах

   Эдгээр нь бие биенээ таслах ёстой: чирсэн бол удаан дарах цуцлагдана, удаан
   дарж цэс нээгдсэн бол суллахад товшилт тооцогдохгүй. Шийдвэрийн логикийг
   энд цэвэр функц болгон салгасан нь DOM-гүйгээр шалгах боломж өгнө. */

export const LONG_PRESS_MS = 460;      /* цэс нээгдэх хүртэл барих хугацаа */
export const MOVE_CANCEL_PX = 10;      /* энэ зайг давбал удаан дарах цуцлагдана */
export const DIRECTION_LOCK_PX = 8;    /* чиглэл тодорхойлохын өмнөх хүлээлт */
export const REPLY_COMMIT_PX = 52;     /* энэ зайг давж суллавал хариулт эхэлнэ */
export const REPLY_MAX_PX = 76;        /* чирэлт үүнээс цааш хүндэрнэ */
export const DOUBLE_TAP_MS = 300;      /* хоёр товшилтыг "давхар" гэх дээд завсар */

/* Удаан дарахыг цуцлах хэмжээний хөдөлгөөн үү */
export const movedTooFar = (dx, dy, limit = MOVE_CANCEL_PX) => Math.hypot(dx, dy) > limit;

/* Хөдөлгөөний тэнхлэг. null — хараахан тодорхойгүй, цааш хүлээнэ. */
export function lockAxis(dx, dy, lock = DIRECTION_LOCK_PX) {
  if (Math.abs(dx) < lock && Math.abs(dy) < lock) return null;
  return Math.abs(dx) > Math.abs(dy) ? "x" : "y";
}

/* Резинэн чирэлт: зөвхөн баруун тийш, дээд хязгаараас цааш дөрөв дахин хүнд.
   Хатуу зогсоовол дохио эвдэрсэн мэт мэдрэгддэг тул бүрэн таслахгүй. */
export function dragX(dx, max = REPLY_MAX_PX) {
  if (dx <= 0) return 0;
  return dx <= max ? dx : max + (dx - max) * 0.25;
}

/* Суллахад хариулт эхлэх үү */
export const replyCommitted = (dx, commit = REPLY_COMMIT_PX) => dx >= commit;

/* Хоёр дахь товшилт "давхар" мөн үү. Өмнөх товшилтын id ба хугацаа хэрэгтэй. */
export function isDoubleTap(prev, id, now, within = DOUBLE_TAP_MS) {
  return !!prev && prev.id === id && now - prev.at <= within;
}
