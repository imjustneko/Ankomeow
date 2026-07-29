/* Chibi sprite-ийн цорын ганц эх сурвалж.

   Дүр тус бүр нэг PNG хуудастай: 1024×1024, ил тод дэвсгэр, 3×3 тор.
   CSS дээр background-size: 300% 300% гэж тавихад нүд бүр 0/50/100%-ийн
   алхмаар яг таарна — зураг хуваах скрипт шаардлагагүй.

   Хэрэв AI-гаар үүсгэсэн хуудас жаахан хазайвал энд байгаа GRID эсвэл
   cellPosition-ыг л засна; бусад код өөрчлөгдөхгүй. */

export const SPRITE_URL = {
  andela: "/chibi/andela.png",
  neko: "/chibi/neko.png",
};

export const GRID = 3;

/* Торны нүдний дугаар (зүүнээс баруун, дээрээс доош) */
export const CELL = {
  idle: 0,
  walkA: 1,
  walkB: 2,
  blush: 3,
  happy: 4,
  sit: 5,
  sleep: 6,
  wave: 7,
  dragged: 8,
};

export const SPRITE_WIDTH = 72;
export const SPRITE_HEIGHT = 72;

/* Зурсан алхааны кадрууд аль тийш харсан бэ: -1 = зүүн, 1 = баруун.
   Код нь `scaleX(SHEET_FACING * facing)`-ээр эргүүлдэг тул зургаа сольвол
   зөвхөн энэ утгыг өөрчилнө. */
export const SHEET_FACING = -1;

/* Алхааны хоёр кадр хэдэн мс тутамд солигдох. Хэт удаан бол хөл нь хөдлөхгүй
   мэт харагдаж, дүр нь гулсаж яваа сэтгэгдэл төрүүлнэ. */
export const WALK_FRAME_MS = 170;

export function cellPosition(index) {
  const step = 100 / (GRID - 1);
  const col = index % GRID;
  const row = Math.floor(index / GRID);
  return `${col * step}% ${row * step}%`;
}

/* Төлөв ба тухайн төлөвт орсноос хойшх хугацаанаас харагдах нүдийг олно. */
export function frameFor(state, elapsedMs) {
  if (state === "walk" || state === "climb" || state === "goto") {
    return Math.floor(elapsedMs / WALK_FRAME_MS) % 2 === 0 ? CELL.walkA : CELL.walkB;
  }
  if (state === "land") return CELL.idle;
  const cell = CELL[state];
  return cell === undefined ? CELL.idle : cell;
}

/* ── Алхааны хуудас ──
   Дүр бүр 4 чиглэлийн (урд/зүүн/баруун/ар) бүтэн алхааны циклтэй тусдаа
   хуудастай. Багана бүр нэг кадр; мөр бүр нэг чиглэл. Багануудын тоо дүрээр
   өөр тул хэмжээг энд төвлөрүүлэв. */
export const WALK_SHEET = {
  andela: { url: "/chibi/andela-walk.png", cols: 7, rows: 4, cellW: 170, cellH: 241, frameMs: 115 },
  neko: { url: "/chibi/neko-walk.png", cols: 9, rows: 4, cellW: 153, cellH: 248, frameMs: 90 },
};

/* Хуудасны мөр бүр аль чиглэл вэ */
export const WALK_ROW = { down: 0, left: 1, right: 2, up: 3 };

export function gridPosition(col, row, cols, rows) {
  const cx = cols > 1 ? (col * 100) / (cols - 1) : 0;
  const cy = rows > 1 ? (row * 100) / (rows - 1) : 0;
  return `${cx}% ${cy}%`;
}

/* Тухайн төлөвт орсноос хойшх хугацаанаас алхааны кадрын дугаарыг олно */
export function walkFrame(elapsedMs, sheet) {
  return Math.floor(Math.max(0, elapsedMs) / sheet.frameMs) % sheet.cols;
}

/* ── Чат реакцийн хуудас ──
   renderH — энэ хуудсыг дэлгэц дээр хэдэн пикселийн өндрөөр зурах вэ.
   Үндсэн хуудсын SPRITE_HEIGHT (72) биш: чат дүрүүд нүдэндээ арай бага
   талбай эзэлдэг тул 72-оор зурвал хуучин дүрээс мэдэгдэхүйц жижиг
   харагдана. 80 нь нүдээр тааруулсан утга — Task 7-ийн хөтөчийн шалгалтад
   баталгаажуулна.

   Чат руу орох үед л ажиллах гурван дүр. Үндсэн 9 нүдийн хуудсыг хөндөхгүйн
   тулд WALK_SHEET-ийн адил тусдаа файлаар байрлана. */
export const CHAT_SHEET = {
  andela: { url: "/chibi/andela-chat.png", cols: 3, rows: 1, cellW: 362, cellH: 590, renderH: 80 },
  neko: { url: "/chibi/neko-chat.png", cols: 3, rows: 1, cellW: 328, cellH: 546, renderH: 80 },
};

export const CHAT_CELL = { look: 0, turn: 1, smile: 2 };

/* Зурсан дүр зүүн тийш заасан. Баруун тийш заах шаардлагатай үед код
   scaleX-ээр толино. Зураг баруун тийш заасан бол энийг 1 болгоно. */
export const CHAT_SHEET_FACING = -1;

/* Дарааллын алхмууд: аль нүд, хэдэн мс.
   smile алхмын үргэлжлэх хугацаа (2200мс) нь зүрхний анимацийн бүтэн урттай
   (520мс сүүлийн зүрхний delay + 1600мс нислэг ≈ 2120мс) таарч, зүрхнүүд дуусаагүй
   байхад контейнер unmount болохоос сэргийлнэ. */
export const CHAT_STEPS = [
  { cell: CHAT_CELL.look, ms: 700 },
  { cell: CHAT_CELL.turn, ms: 250 },
  { cell: CHAT_CELL.smile, ms: 2200 },
];
