/* Чат дахь зургийн байрлуулах хайрцаг.

   Зураг ирэхээс өмнө яг тэр хэмжээгээр орон зай эзэлнэ — ингэснээр ачаалагдах
   мөчид чат доошоо үсрэхгүй. */

export const IMG_MAX_H = 220;

/* Байгалийн w×h-ийг өгвөл { width, aspectRatio } буцаана.
   width нь дээд өндөрт багтаах өргөн; CSS дээр maxWidth:"100%" -тай хамт
   хэрэглэхэд нарийн дэлгэц дээр багасаж, aspectRatio нь өндрийг дагуулна.
   Хэмжээ мэдэгдэхгүй бол null — дуудагч тал хуучин орлуулагчаа хэрэглэнэ. */
export function imageBox(w, h, maxH = IMG_MAX_H) {
  const W = Number(w), H = Number(h);
  if (!Number.isFinite(W) || !Number.isFinite(H) || W <= 0 || H <= 0) return null;
  return { width: Math.round(Math.min(H, maxH) * (W / H)), aspectRatio: `${W} / ${H}` };
}
