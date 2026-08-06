/* Чатад хуваалцсан зургуудыг цуглуулна.

   Тусдаа индекс барихгүй — ачаалагдсан зурвасууд дотроос шүүнэ. Хайлттай
   ижил зарчим: дээш гүйлгэж хуучин зурвас нээх тусам сүлжээ ч тэлнэ. */

/* Сүлжээнд харагдах зүйлс — шинэ нь эхэнд.
   Зурсан зураг нь blob биш, вектор (strokes) тул тусдаа зурагддаг.
   Байршил, дуут зурвасыг оруулахгүй: сүлжээнд харуулах зураг байхгүй. */
export function mediaItems(messages) {
  const out = [];
  for (let i = (messages?.length ?? 0) - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.type === "image" && (m.blobId || m.image)) {
      out.push({ id: m.id, kind: "image", blobId: m.blobId, image: m.image, w: m.w, h: m.h });
    } else if (m.type === "reaction" && m.gifUrl) {
      out.push({ id: m.id, kind: "gif", gifUrl: m.gifUrl });
    } else if (m.type === "drawing" && m.strokes?.length) {
      out.push({ id: m.id, kind: "drawing", strokes: m.strokes });
    }
  }
  return out;
}
