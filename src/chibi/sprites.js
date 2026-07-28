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
  if (state === "walk" || state === "climb") {
    return Math.floor(elapsedMs / WALK_FRAME_MS) % 2 === 0 ? CELL.walkA : CELL.walkB;
  }
  if (state === "land") return CELL.idle;
  const cell = CELL[state];
  return cell === undefined ? CELL.idle : cell;
}
