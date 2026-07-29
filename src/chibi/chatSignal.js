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
