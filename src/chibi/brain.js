/* Chibi-гийн төлөвийн машин.

   React, DOM, Firebase-ийн талаар юу ч мэдэхгүй цэвэр объект — хугацааг
   гаднаас (rAF timestamp эсвэл тестийн тоо) хүлээж авдаг тул fake timer-гүйгээр
   бүрэн тестлэгдэнэ. */

export const SPEED = 20; /* px/сек — удаан, хөөрхөн */

/* Дарснаас хойш энэ зайнаас их хөдөлбөл товшилт биш, чирэлт гэж үзнэ */
export const DRAG_THRESHOLD = 6;

export const DUR = {
  walkMin: 3000,
  walkMax: 6000,
  idleMin: 2000,
  idleMax: 5000,
  cute: 6000,
  blush: 2500,
  happy: 2000,
  land: 350,
  sleepAfter: 60000, /* хүрэлтгүй энэ хугацаа өнгөрвөл унтана */
};

/* Дараалсан хэдэн мөчлөгийн дараа cute action гаргах магадлалыг шалгах босго */
const CUTE_CHANCE = 0.34;

export function createBrain({ width, spriteWidth, rand = Math.random }) {
  let frameWidth = width;
  let state = "walk";
  let x = Math.max(0, (width - spriteWidth) / 2);
  let facing = 1;
  let stateStart = 0;
  let stateDur = 0;
  let now = 0;
  let lastTouch = 0;
  let cycles = 0;
  let pointer = null; /* { startClientX, startX, moved } — идэвхтэй нэг л хуруу */

  const maxX = () => Math.max(0, frameWidth - spriteWidth);
  const clampX = () => { x = Math.min(Math.max(x, 0), maxX()); };
  const between = (min, max) => min + rand() * (max - min);

  const enter = (next, at, dur) => {
    state = next;
    stateStart = at;
    stateDur = dur;
  };

  /* Алхаа/idle-ийн мөчлөг дуусахад дараагийн төлөвийг сонгоно */
  const nextInCycle = (at) => {
    if (state === "walk") {
      cycles += 1;
      if (cycles % 3 === 0 && rand() < CUTE_CHANCE) {
        enter(rand() < 0.5 ? "sit" : "wave", at, DUR.cute);
        return;
      }
      enter("idle", at, between(DUR.idleMin, DUR.idleMax));
      return;
    }
    enter("walk", at, between(DUR.walkMin, DUR.walkMax));
  };

  const startWalk = (at) => enter("walk", at, between(DUR.walkMin, DUR.walkMax));

  /* Эхлэлийн алхааны үргэлжлэх хугацааг тогтооно — эс бөгөөс эхний tick дээр
     elapsed (0) >= stateDur (0) болж, алхалгүйгээр шууд idle рүү үсэрнэ. */
  startWalk(0);

  return {
    snapshot: () => ({ state, x, facing, elapsed: now - stateStart }),

    tick(at) {
      const dt = Math.max(0, at - now);
      now = at;

      if (state === "walk") {
        x += (facing * SPEED * dt) / 1000;
        if (x <= 0) { x = 0; facing = 1; }
        if (x >= maxX()) { x = maxX(); facing = -1; }
      }

      if (state === "dragged") return;

      const elapsed = at - stateStart;

      if (state === "blush" || state === "happy" || state === "land") {
        if (elapsed >= stateDur) startWalk(at);
        return;
      }

      if (state === "sleep") return;

      if (at - lastTouch >= DUR.sleepAfter) {
        enter("sleep", at, Infinity);
        return;
      }

      if (elapsed >= stateDur) nextInCycle(at);
    },

    poke(at) {
      now = at;
      lastTouch = at;
      enter("blush", at, DUR.blush);
    },

    happy(at) {
      now = at;
      lastTouch = at;
      enter("happy", at, DUR.happy);
    },

    pointerDown(at, clientX) {
      if (pointer) return; /* хоёр дахь хуруу — үл тоомсорлоно */
      now = at;
      lastTouch = at;
      pointer = { startClientX: clientX, startX: x, moved: false };
    },

    pointerMove(at, clientX) {
      if (!pointer) return;
      now = at;
      lastTouch = at;
      const dx = clientX - pointer.startClientX;
      if (!pointer.moved && Math.abs(dx) < DRAG_THRESHOLD) return;
      pointer.moved = true;
      if (state !== "dragged") enter("dragged", at, Infinity);
      x = pointer.startX + dx;
      clampX();
    },

    pointerUp(at) {
      if (!pointer) return { tapped: false };
      now = at;
      lastTouch = at;
      const { moved } = pointer;
      pointer = null;
      if (moved) {
        enter("land", at, DUR.land);
        return { tapped: false };
      }
      return { tapped: true };
    },

    setWidth(next) {
      frameWidth = next;
      clampX();
    },
  };
}
