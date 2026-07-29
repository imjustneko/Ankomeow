/* Чатын дохионы цэвэр логик.

   Firebase, DOM, React-аас бүрэн ангид: Firestore-ийн Timestamp-ыг гаднаас
   миллисекунд болгож хөрвүүлээд дамжуулна. */

/* Уншаагүй зурвас байна уу.

   lastMsg    — { sender, createdAtMs } хамгийн сүүлийн зурвас, эсвэл null
   myReadAtMs — энэ хэрэглэгч чатыг хамгийн сүүлд нээсэн хугацаа (мс), эсвэл null
   accountKey — энэ хэрэглэгчийн түлхүүр */
export function hasUnread(lastMsg, myReadAtMs, accountKey) {
  if (!lastMsg) return false;
  if (lastMsg.sender === accountKey) return false;

  const raw = lastMsg.createdAtMs;
  if (raw === null || raw === undefined) return false;

  const created = Number(raw);
  if (!Number.isFinite(created)) return false;

  /* Хэзээ ч нээгээгүй бол хамтрагчийн аливаа зурвас уншаагүй. */
  if (myReadAtMs === null || myReadAtMs === undefined) return true;

  return created > Number(myReadAtMs);
}

/* Командын алхалт хэр удах вэ (мс). Хоёр тэнхлэг зэрэг хөдөлдөг тул
   удаанийг нь авна. Хамгаалалтын таймер үүн дээр тулгуурлана — тогтмол
   тоо нь эсвэл хэт богино (алхаж дуусаагүй байхад таслана), эсвэл хэт
   урт (гацсаныг оройтож мэднэ) болно. */
export function walkDurationMs({ fromX, fromY, toX, toY, speedX, speedY }) {
  const dx = Math.abs(toX - fromX);
  const dy = Math.abs(toY - fromY);
  const tx = speedX > 0 ? (dx / speedX) * 1000 : 0;
  const ty = speedY > 0 ? (dy / speedY) * 1000 : 0;
  return Math.max(tx, ty);
}

/* Бөмбөлгийн доор зогсох цэгийг бодно.

   Оролт нь `{ left, top, width, height }` хэлбэрийн энгийн объект — DOMRect
   тохирно, гэхдээ функц өөрөө DOM мэдэхгүй тул тестлэхэд хялбар.

   Sprite нь ДЭЭШ (бага зэрэг зүүн тийш хазайж) заасан байдлаар зурагдсан тул
   chibi зурвасын доор очно. Босоо байрлал нь ердийн алхах шугам (y = 0) тул
   энд буцаахгүй.

   `offset` нь chibi-г бөмбөлгийн голоос багахан баруун тийш шилжүүлнэ —
   ингэснээр дээш-зүүн тийш заасан хуруу нь бөмбөлөг рүү оносон харагдана. */
export function bubbleTarget({ bubble, frame, spriteWidth, offset = 12 }) {
  const maxX = Math.max(0, frame.width - spriteWidth);
  const centreX = bubble.left - frame.left + bubble.width / 2;

  const wanted = centreX - spriteWidth / 2 + offset;
  const x = Math.min(Math.max(wanted, 0), maxX);

  /* Ирмэгт дарагдаад бөмбөлгийн зүүн талд үлдвэл дээш-баруун тийш заахаар толино. */
  const facing = x + spriteWidth / 2 < centreX ? 1 : -1;

  /* Бөмбөлөг дэлгэцээс гарсан бол заах утгагүй — дуудагч дарааллыг эхлүүлэхгүй. */
  const bTop = bubble.top - frame.top;
  const bBottom = bTop + bubble.height;
  const visible = bBottom > 0 && bTop < frame.height;

  return { x, facing, visible };
}
