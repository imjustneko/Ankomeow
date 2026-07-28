/* Chibi-гийн төлөвийн машин.

   React, DOM, Firebase-ийн талаар юу ч мэдэхгүй цэвэр объект — хугацааг
   гаднаас (rAF timestamp эсвэл тестийн тоо) хүлээж авдаг тул fake timer-гүйгээр
   бүрэн тестлэгдэнэ. */

export const SPEED = 26; /* px/сек — хэвтээ алхааны хурд */
export const CLIMB_SPEED = 20; /* px/сек — дээш/доош шилжих хурд */

/* Дарснаас хойш энэ зайнаас их хөдөлбөл товшилт биш, чирэлт гэж үзнэ */
export const DRAG_THRESHOLD = 6;

export const DUR = {
  walkMin: 3000,
  walkMax: 6000,
  idleMin: 2000,
  idleMax: 5000,
  cuteMin: 5000,
  cuteMax: 9000,
  cute: 6000, /* хуучин нэр — гадны код ашигласаар байвал эвдрэхгүй */
  blush: 2500,
  happy: 2000,
  land: 350,
  sleepAfter: 60000, /* хүрэлтгүй энэ хугацаа өнгөрвөл унтана */
};

/* Дараалсан хэдэн мөчлөгийн дараа cute action гаргах магадлалыг шалгах босго */
const CUTE_CHANCE = 0.34;
/* Cute action гараагүй үед дээш/доош шилжих магадлал */
const CLIMB_CHANCE = 0.35;

/* rise = дэлгэцийн ёроолын шугамаас дээш хэдэн пиксел өгсөж болох вэ.
   y нь тэр шугамаас ДЭЭШ хэмжигдэнэ: y = 0 бол доод шугам дээр. */
export function createBrain({ width, rise = 0, spriteWidth, rand = Math.random }) {
  let frameWidth = width;
  let frameRise = rise;
  let state = "walk";
  let x = Math.max(0, (width - spriteWidth) / 2);
  let y = 0;
  let targetY = 0;
  let facing = 1;
  let stateStart = 0;
  let stateDur = 0;
  let now = 0;
  let lastTouch = 0;
  let cycles = 0;
  let pointer = null; /* { startClientX, startClientY, startX, startY, moved } */

  const maxX = () => Math.max(0, frameWidth - spriteWidth);
  const maxY = () => Math.max(0, frameRise);
  const clampX = () => { x = Math.min(Math.max(x, 0), maxX()); };
  const clampY = () => { y = Math.min(Math.max(y, 0), maxY()); };
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
        /* нэг газраа тухлаад амарна */
        enter(rand() < 0.5 ? "sit" : "wave", at, between(DUR.cuteMin, DUR.cuteMax));
        return;
      }
      /* хааяа өөр өндөрт өгсөж/буун очно — товчлууруудын дээгүүр ч гарч болно */
      if (maxY() > 0 && rand() < CLIMB_CHANCE) {
        targetY = between(0, maxY());
        enter("climb", at, Infinity);
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
    snapshot: () => ({ state, x, y, facing, elapsed: now - stateStart }),

    tick(at) {
      const dt = Math.max(0, at - now);
      now = at;

      if (state === "walk") {
        x += (facing * SPEED * dt) / 1000;
        if (x <= 0) { x = 0; facing = 1; }
        if (x >= maxX()) { x = maxX(); facing = -1; }
      }

      if (state === "climb") {
        const step = (CLIMB_SPEED * dt) / 1000;
        const gap = targetY - y;
        if (Math.abs(gap) <= step) {
          y = targetY;
          clampY();
          startWalk(at);
        } else {
          y += Math.sign(gap) * step;
          clampY();
        }
        return;
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

    /* Хөдөлгөөний цикл түр зогсоод дахин эхлэхэд (таб нуугдах, гар нээгдэх)
       алгассан хугацааг тооцохгүй — эс бөгөөс chibi хана руу үсэрч, шууд унтана. */
    resume(at) {
      const gap = at - now;
      if (gap <= 0) return;
      now = at;
      stateStart += gap;
      lastTouch += gap;
    },

    pointerDown(at, clientX, clientY = 0) {
      if (pointer) return; /* хоёр дахь хуруу — үл тоомсорлоно */
      now = at;
      lastTouch = at;
      pointer = { startClientX: clientX, startClientY: clientY, startX: x, startY: y, moved: false };
    },

    /* Хоёр тэнхлэгээр чирнэ. Дэлгэцийн y доошоо өсдөг тул дээш чирэхэд
       (clientY багасах) chibi-гийн y нэмэгдэнэ. */
    pointerMove(at, clientX, clientY = pointer ? pointer.startClientY : 0) {
      if (!pointer) return;
      now = at;
      lastTouch = at;
      const dx = clientX - pointer.startClientX;
      const dy = clientY - pointer.startClientY;
      if (!pointer.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      pointer.moved = true;
      if (state !== "dragged") enter("dragged", at, Infinity);
      x = pointer.startX + dx;
      y = pointer.startY - dy;
      clampX();
      clampY();
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

    /* Систем хурууг таслав (iOS ирмэгийн swipe, урт дарах цэс, ирсэн дуудлага).
       Товшилт гэж НЭГ Ч ТОХИОЛДОЛД тооцохгүй — түншид хуурамч мэдэгдэл очно.
       Чирэлт болж амжсан бол pointerUp-тай адил land төлөвт буулгана. */
    pointerCancel(at) {
      if (!pointer) return;
      now = at;
      lastTouch = at;
      const { moved } = pointer;
      pointer = null;
      if (moved) enter("land", at, DUR.land);
    },

    /* Тавьсан газартаа үлдэнэ — доошоо унахгүй. */
    setSize(nextWidth, nextRise) {
      frameWidth = nextWidth;
      if (typeof nextRise === "number") frameRise = nextRise;
      clampX();
      clampY();
    },

    setWidth(next) {
      frameWidth = next;
      clampX();
    },
  };
}
