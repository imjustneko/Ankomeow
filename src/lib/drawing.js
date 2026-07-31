/* Зурах (sticker) — вектор шугамын өгөгдөл, гөлгөржүүлэлт, дүрсний туслах.
   Бүгд цэвэр функц тул тесттэй. */

import { C } from "./theme.js";

/* ── Зурах (sticker) ──
   Зургийг ПИКСЕЛЬ БИШ, вектор шугам болгож хадгална. Цэг бүр 0..DRAW_UNITS
   хоорондох харьцангуй нэгжид бичигдэнэ. Тиймээс жижиг утсан дээр зурсан зураг
   том дэлгэц дээр ч, том утсан дээр зурсан нь жижиг дээр ч ЯГ ижил хэлбэртэй
   харагдана — дэлгэцийн пиксел, DPR, өргөнөөс огт хамаарахгүй. */
export const DRAW_UNITS = 1000;
export const DRAW_COLORS = ["#2B2B2B", C.ink, C.peachDeep, "#E4557B", C.gold, C.sageDeep, C.waterDeep, C.lilacDeep];
export const DRAW_SIZES = [10, 20, 36];
export const DRAW_MIN_STEP = 7;      /* цэг хоорондын доод зай — хэт нягт цэгийг хаяна */
export const DRAW_MAX_POINTS = 6000; /* нэг зурган дахь цэгийн дээд хязгаар (Firestore 1MB) */
/* Тунгалаг дэвсгэрийг харуулах цайвар шатрын хээ */
export const DRAW_CHECKER = `repeating-conic-gradient(${C.cardIn} 0% 25%, ${C.card} 0% 50%) 50% / 18px 18px`;

export const strokePoints = (strokes) => (strokes || []).reduce((n, s) => n + (s.p?.length || 0) / 2, 0);

/* Catmull-Rom сплайныг кубик Безье болгож SVG зам үүсгэнэ. Хурууны чичиргээтэй
   олон өнцөгт шугамыг гөлгөр муруй болгодог — "draw assist"-ийн үндэс. */
export function smoothPath(p) {
  const n = p.length / 2;
  let d = `M${p[0]} ${p[1]}`;
  if (n === 2) return d + `L${p[2]} ${p[3]}`;
  const at = (i) => { const k = Math.max(0, Math.min(n - 1, i)); return [p[2 * k], p[2 * k + 1]]; };
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = at(i - 1), [x1, y1] = at(i), [x2, y2] = at(i + 1), [x3, y3] = at(i + 2);
    const c1x = x1 + (x2 - x0) / 6, c1y = y1 + (y2 - y0) / 6;
    const c2x = x2 - (x3 - x1) / 6, c2y = y2 - (y3 - y1) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)},${c2x.toFixed(1)} ${c2y.toFixed(1)},${x2} ${y2}`;
  }
  return d;
}

/* Зурсан шугамыг төгс дүрс рүү "татах". Таарахгүй бол null буцаана —
   тэгвэл хүний зурсан шугам хэвээрээ үлдэнэ. */
export function assistShape(p) {
  const n = p.length / 2;
  if (n < 6) return null;
  const pts = Array.from({ length: n }, (_, i) => [p[2 * i], p[2 * i + 1]]);
  let len = 0;
  for (let i = 1; i < n; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  if (len < 70) return null; /* хэт богино — цэг, зураас байж мэднэ */

  const [sx, sy] = pts[0], [ex, ey] = pts[n - 1];
  const span = Math.hypot(ex - sx, ey - sy);

  /* Шулуун: замын урт нь хоёр үзүүрийн шулуун зайтай бараг тэнцүү */
  if (span / len > 0.92) return { p: [sx, sy, ex, ey], k: "line" };

  /* Хаалттай дүрс биш бол хөндөхгүй */
  if (span / len > 0.28) return null;

  const cx = pts.reduce((a, q) => a + q[0], 0) / n;
  const cy = pts.reduce((a, q) => a + q[1], 0) / n;
  const rs = pts.map((q) => Math.hypot(q[0] - cx, q[1] - cy));
  const mean = rs.reduce((a, b) => a + b, 0) / n;
  const dev = Math.sqrt(rs.reduce((a, r) => a + (r - mean) ** 2, 0) / n) / (mean || 1);

  /* Тойрог: төвөөс бүх цэг ойролцоо ижил зайд.
     САНАМЖ: дан dev хүрэлцэхгүй — тэгш өнцөгтийн dev ч бага гардаг тул
     хамгийн ойр/хол радиусын харьцааг заавал шалгана (дөрвөлжинд √2 ≈ 1.41). */
  const rMax = Math.max(...rs), rMin = Math.min(...rs);
  const round = rMax / (rMin || 1); /* дугуй байдал: тойрогт ≈1, дөрвөлжинд ≈1.41 */

  const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const w = x1 - x0, h = y1 - y0;

  /* Тэгш өнцөгтийг ЭХЛЭЭД шалгана.
     САНАМЖ: ирмэгийн зөвшөөрөл 13% байхад ТӨГС ТОЙРОГ ч цэгийнхээ 94%-аар
     таарч, тойрог дөрвөлжин болж хувирдаг байв (45° дээрх цэг ирмэгээс
     радиусынхаа 29% буюу өргөний 14.6% зайд байдаг). 6% болгож чангатгаад,
     нэмээд дугуй биш болохыг (round > 1.25) шаардана. */
  if (w > 40 && h > 40 && round > 1.25) {
    const onEdge = pts.filter((q) =>
      Math.min(q[0] - x0, x1 - q[0]) < w * 0.06 || Math.min(q[1] - y0, y1 - q[1]) < h * 0.06).length / n;
    if (onEdge > 0.9) return { p: [x0, y0, x1, y0, x1, y1, x0, y1, x0, y0], k: "rect" };
  }

  /* Тойрог: төвөөс бүх цэг ойролцоо ижил зайд */
  if (dev < 0.22 && mean > 25 && round < 1.35) {
    const out = [];
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI * 2;
      out.push(Math.round(cx + mean * Math.cos(t)), Math.round(cy + mean * Math.sin(t)));
    }
    return { p: out, k: "circle" };
  }
  return null;
}
