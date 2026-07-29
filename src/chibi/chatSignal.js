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

  const created = Number(lastMsg.createdAtMs);
  if (!Number.isFinite(created)) return false;

  /* Хэзээ ч нээгээгүй бол хамтрагчийн аливаа зурвас уншаагүй. */
  if (myReadAtMs === null || myReadAtMs === undefined) return true;

  return created > Number(myReadAtMs);
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

  return { x, facing };
}
