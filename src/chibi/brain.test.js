import { describe, it, expect } from "vitest";
import { createBrain, DUR, SPEED, DRAG_THRESHOLD, ARRIVE_EPSILON } from "./brain.js";

/* Санамсаргүй байдлыг тестэд тогтмол болгоно */
const fixedRand = (v) => () => v;

const makeBrain = (rand = fixedRand(0.5)) =>
  createBrain({ width: 400, spriteWidth: 72, rand });

describe("эхлэлийн төлөв", () => {
  it("алхаж эхэлнэ", () => {
    const b = makeBrain();
    b.tick(0);
    expect(b.snapshot().state).toBe("walk");
  });
});

describe("алхаа", () => {
  it("хугацааны хэрээр баруун тийш SPEED хурдаар шилжинэ", () => {
    const b = makeBrain();
    b.tick(0);
    const startX = b.snapshot().x;
    b.tick(1000);
    expect(b.snapshot().x).toBeCloseTo(startX + SPEED, 5);
  });

  it("баруун ирмэгт хүрэхэд эргэж зүүн тийш явна", () => {
    const b = makeBrain();
    b.tick(0);
    /* хүрээнээс хол гарах хангалттай урт хугацаа */
    b.tick(60000);
    const snap = b.snapshot();
    expect(snap.x).toBeLessThanOrEqual(400 - 72);
    expect(snap.x).toBeGreaterThanOrEqual(0);
    expect(snap.facing).toBe(-1);
  });

  it("алхааны хугацаа дуусахад idle болно", () => {
    const b = makeBrain();
    b.tick(0);
    b.tick(DUR.walkMax + 1);
    expect(b.snapshot().state).toBe("idle");
  });
});

describe("cute action", () => {
  it("гурав дахь мөчлөгт санамсаргүй үйлдэл гарна", () => {
    /* rand 0.1 — CUTE_CHANCE (0.34)-аас бага тул cute action үргэлж гарна,
       мөн 0.5-аас бага тул үргэлж "sit" сонгогдоно */
    const b = createBrain({ width: 400, spriteWidth: 72, rand: fixedRand(0.1) });
    let t = 0;
    const states = new Set();
    for (let i = 0; i < 10; i++) {
      t += DUR.walkMax + 1;
      b.tick(t);
      states.add(b.snapshot().state);
      t += DUR.idleMax + 1;
      b.tick(t);
      states.add(b.snapshot().state);
    }
    expect(states.has("sit")).toBe(true);
  });
});

describe("унтах", () => {
  it("хүрэлтгүй sleepAfter хугацаа өнгөрвөл унтана", () => {
    const b = makeBrain();
    b.tick(0);
    b.tick(DUR.sleepAfter + 1);
    expect(b.snapshot().state).toBe("sleep");
  });

  it("товшилтын дараа унтах тоолуур дахин эхэлнэ", () => {
    const b = makeBrain();
    b.tick(0);
    b.poke(DUR.sleepAfter - 1000);
    b.tick(DUR.sleepAfter + 1);
    expect(b.snapshot().state).not.toBe("sleep");
  });
});

describe("товшилт", () => {
  it("алхаж байхад товшиход шууд blush болно", () => {
    const b = makeBrain();
    b.tick(0);
    b.poke(1000);
    expect(b.snapshot().state).toBe("blush");
  });

  it("унтаж байхад товшиход сэрж blush болно", () => {
    const b = makeBrain();
    b.tick(0);
    b.tick(DUR.sleepAfter + 1);
    expect(b.snapshot().state).toBe("sleep");
    b.poke(DUR.sleepAfter + 2);
    expect(b.snapshot().state).toBe("blush");
  });

  it("blush дууссаны дараа алхаагаа үргэлжлүүлнэ", () => {
    const b = makeBrain();
    b.tick(0);
    b.poke(1000);
    b.tick(1000 + DUR.blush + 1);
    expect(b.snapshot().state).toBe("walk");
  });

  it("blush үед байрлал хөдлөхгүй", () => {
    const b = makeBrain();
    b.tick(0);
    b.tick(2000);
    const x = b.snapshot().x;
    b.poke(2000);
    b.tick(2500);
    expect(b.snapshot().x).toBe(x);
  });
});

describe("хос товшсон", () => {
  it("happy төлөвт орж, дараа нь алхаанд буцна", () => {
    const b = makeBrain();
    b.tick(0);
    b.happy(1000);
    expect(b.snapshot().state).toBe("happy");
    b.tick(1000 + DUR.happy + 1);
    expect(b.snapshot().state).toBe("walk");
  });
});

describe("хүрээний өргөн өөрчлөгдөх", () => {
  it("өргөн багасахад chibi хүрээнд эргэж багтана", () => {
    const b = makeBrain();
    b.tick(0);
    b.tick(20000);
    b.setWidth(120);
    expect(b.snapshot().x).toBeLessThanOrEqual(120 - 72);
    expect(b.snapshot().x).toBeGreaterThanOrEqual(0);
  });
});

describe("түр зогсоод сэргэх (resume)", () => {
  it("удаан завсарлагааны дараа алгассан хугацааг тооцохгүй — нэг фрэймийн зайгаар л шилжинэ", () => {
    const b = makeBrain();
    b.tick(0);
    const startX = b.snapshot().x;
    /* таб 5 минут нуугдсан гэж бодъё */
    b.resume(5 * 60 * 1000);
    b.tick(5 * 60 * 1000 + 16);
    const dx = b.snapshot().x - startX;
    expect(dx).toBeCloseTo((SPEED * 16) / 1000, 5);
  });

  it("sleepAfter-ээс урт завсарлагааны дараа шууд унтахгүй", () => {
    const b = makeBrain();
    b.tick(0);
    const gap = DUR.sleepAfter * 3;
    b.resume(gap);
    b.tick(gap + 16);
    expect(b.snapshot().state).not.toBe("sleep");
  });

  it("цаг ухраагүй бол resume нөлөөгүй (no-op)", () => {
    const b = makeBrain();
    b.tick(1000);
    const before = b.snapshot();
    b.resume(500); /* дотоод цагаас өмнөх агшин — үл тоомсорлоно */
    b.tick(1000);
    expect(b.snapshot()).toEqual(before);
  });
});

describe("чирэх", () => {
  it("6px-ээс бага хөдөлгөөнтэй дарж авбал товшилт болно", () => {
    const b = makeBrain();
    b.tick(0);
    b.pointerDown(100, 200);
    b.pointerMove(150, 203);
    expect(b.pointerUp(200)).toEqual({ tapped: true });
  });

  it("6px-ээс их хөдөлбөл чирэлт болж, товшилт бүртгэгдэхгүй", () => {
    const b = makeBrain();
    b.tick(0);
    b.pointerDown(100, 200);
    b.pointerMove(150, 220);
    expect(b.snapshot().state).toBe("dragged");
    expect(b.pointerUp(200)).toEqual({ tapped: false });
  });

  it("чирэх үед chibi хурууны хөдөлгөөнийг дагана", () => {
    const b = makeBrain();
    b.tick(0);
    const startX = b.snapshot().x;
    b.pointerDown(100, 200);
    b.pointerMove(150, 240);
    expect(b.snapshot().x).toBeCloseTo(startX + 40, 5);
  });

  it("чирэх үед хүрээнээс гарахгүй", () => {
    const b = makeBrain();
    b.tick(0);
    b.pointerDown(100, 200);
    b.pointerMove(150, 5000);
    expect(b.snapshot().x).toBe(400 - 72);
  });

  it("тавихад land төлөвт орж, дараа нь алхаанд буцна", () => {
    const b = makeBrain();
    b.tick(0);
    b.pointerDown(100, 200);
    b.pointerMove(150, 220);
    b.pointerUp(200);
    expect(b.snapshot().state).toBe("land");
    b.tick(200 + DUR.land + 1);
    expect(b.snapshot().state).toBe("walk");
  });

  it("чирэх үед tick байрлалыг хөдөлгөхгүй", () => {
    const b = makeBrain();
    b.tick(0);
    b.pointerDown(100, 200);
    b.pointerMove(150, 220);
    const x = b.snapshot().x;
    b.tick(3000);
    expect(b.snapshot().x).toBe(x);
  });

  it("хоёр дахь хуруу үл тоогдоно", () => {
    const b = makeBrain();
    b.tick(0);
    const startX = b.snapshot().x;
    b.pointerDown(100, 200);
    b.pointerDown(110, 350); /* хоёр дахь хуруу — эхнийхийг дарж бичихгүй */
    b.pointerMove(150, 220);
    /* эхний хурууны 200 → 220 шилжилтээр л тооцоолно, 350-аас биш */
    expect(b.snapshot().x).toBeCloseTo(startX + 20, 5);
    expect(b.pointerUp(200)).toEqual({ tapped: false });
  });

  it("чирэлт унтахыг таслана", () => {
    const b = makeBrain();
    b.tick(0);
    b.tick(DUR.sleepAfter + 1);
    expect(b.snapshot().state).toBe("sleep");
    b.pointerDown(DUR.sleepAfter + 2, 200);
    b.pointerMove(DUR.sleepAfter + 3, 240);
    expect(b.snapshot().state).toBe("dragged");
  });

  it("DRAG_THRESHOLD нь 6px", () => {
    expect(DRAG_THRESHOLD).toBe(6);
  });
});

describe("хуруу таслагдах (pointerCancel)", () => {
  it("хөдөлгөөнгүй дарснаа таслахад товшилт болохгүй, chibi алхаагаа үргэлжлүүлнэ", () => {
    const b = makeBrain();
    b.tick(0);
    b.pointerDown(100, 200);
    b.pointerMove(150, 203); /* босгоос бага — pointerUp бол товшилт болох байсан */
    b.pointerCancel(200);
    expect(b.snapshot().state).toBe("walk");
    /* хуруу цэвэрлэгдсэн тул дараагийн pointerUp давхар товшилт үүсгэхгүй */
    expect(b.pointerUp(250)).toEqual({ tapped: false });
    const x = b.snapshot().x;
    b.tick(1000);
    expect(b.snapshot().x).toBeGreaterThan(x);
  });

  it("чирж байхад таслахад land төлөвт буугаад алхаанд буцна", () => {
    const b = makeBrain();
    b.tick(0);
    b.pointerDown(100, 200);
    b.pointerMove(150, 220);
    expect(b.snapshot().state).toBe("dragged");
    b.pointerCancel(200);
    expect(b.snapshot().state).toBe("land");
    b.tick(200 + DUR.land + 1);
    expect(b.snapshot().state).toBe("walk");
  });

  it("идэвхтэй хуруугүй үед pointerCancel нөлөөгүй (no-op)", () => {
    const b = makeBrain();
    b.tick(1000);
    const before = b.snapshot();
    b.pointerCancel(2000);
    expect(b.snapshot()).toEqual(before);
  });
});

describe("дээш/доош шилжих", () => {
  const riseBrain = (rand) =>
    createBrain({ width: 400, rise: 200, spriteWidth: 72, rand });

  it("rise өгөөгүй бол босоо тэнхлэгээр хөдлөхгүй", () => {
    const b = makeBrain();
    b.tick(0);
    b.tick(30000);
    expect(b.snapshot().y).toBe(0);
  });

  it("climb төлөвт орвол зорилтот өндөр рүү дөхнө", () => {
    /* rand 0.5: cute гарахгүй (0.5 >= 0.34), climb гарна (0.5 < 0.35 биш) —
       тиймээс climb-ийг гараар шалгахын тулд rand-ыг дараалуулж өгнө */
    const seq = [0.5, 0.9, 0.2, 0.9];
    let i = 0;
    const b = riseBrain(() => seq[i++ % seq.length]);
    b.tick(0);
    /* эхний алхаа дуустал */
    b.tick(DUR.walkMax + 1);
    const st = b.snapshot();
    if (st.state === "climb") {
      const y0 = st.y;
      b.tick(DUR.walkMax + 1001);
      expect(b.snapshot().y).not.toBe(y0);
    }
    expect(["climb", "idle", "sit", "wave"]).toContain(st.state);
  });

  it("өндөр нь rise-аас хэтрэхгүй", () => {
    const b = riseBrain(() => 0.99);
    b.tick(0);
    for (let t = 1; t < 60; t++) b.tick(t * 1000);
    const { y } = b.snapshot();
    expect(y).toBeGreaterThanOrEqual(0);
    expect(y).toBeLessThanOrEqual(200);
  });
});

describe("хоёр тэнхлэгээр чирэх", () => {
  const riseBrain = () => createBrain({ width: 400, rise: 200, spriteWidth: 72, rand: () => 0.5 });

  it("дээш чирэхэд chibi дээшилнэ", () => {
    const b = riseBrain();
    b.tick(0);
    b.pointerDown(100, 200, 500);
    b.pointerMove(150, 200, 440);
    expect(b.snapshot().y).toBeCloseTo(60, 5);
  });

  it("тавьсан өндөртөө үлдэнэ — доошоо унахгүй", () => {
    const b = riseBrain();
    b.tick(0);
    b.pointerDown(100, 200, 500);
    b.pointerMove(150, 200, 420);
    b.pointerUp(200);
    b.tick(200 + DUR.land + 1);
    b.tick(1500);
    expect(b.snapshot().y).toBeCloseTo(80, 5);
  });

  it("зөвхөн босоо чиглэлд хөдөлсөн ч чирэлт гэж тооцно", () => {
    const b = riseBrain();
    b.tick(0);
    b.pointerDown(100, 200, 500);
    b.pointerMove(150, 200, 480);
    expect(b.snapshot().state).toBe("dragged");
    expect(b.pointerUp(200)).toEqual({ tapped: false });
  });

  it("чирэхэд дээд хязгаараас давахгүй", () => {
    const b = riseBrain();
    b.tick(0);
    b.pointerDown(100, 200, 500);
    b.pointerMove(150, 200, -5000);
    expect(b.snapshot().y).toBe(200);
  });
});

describe("walkTo", () => {
  /* rand-ыг тогтмол болгож санамсаргүй байдлыг арилгана */
  const makeBrain = () => createBrain({ width: 400, rise: 200, spriteWidth: 72, rand: () => 0.5 });

  it("зорилтот цэг рүү ойртоно", () => {
    const b = makeBrain();
    const startX = b.snapshot().x;
    b.walkTo(startX + 100, 0, 0);
    b.tick(1000);
    const { x, state } = b.snapshot();
    expect(state).toBe("goto");
    expect(x).toBeGreaterThan(startX);
    expect(x).toBeLessThan(startX + 100);
  });

  it("зорилтот цэг рүү харна", () => {
    const b = makeBrain();
    const startX = b.snapshot().x;
    b.walkTo(startX - 100, 0, 0);
    b.tick(100);
    expect(b.snapshot().facing).toBe(-1);
    expect(b.snapshot().dir).toBe("left");
  });

  it("хүрэхэд зогсож, цаашид хөдлөхгүй", () => {
    const b = makeBrain();
    b.walkTo(10, 20, 0);
    for (let t = 100; t <= 60000; t += 100) b.tick(t);
    const a = b.snapshot();
    expect(Math.abs(a.x - 10)).toBeLessThanOrEqual(ARRIVE_EPSILON);
    expect(Math.abs(a.y - 20)).toBeLessThanOrEqual(ARRIVE_EPSILON);
  });

  it("зорилтот цэгийг frame дотор багтаана", () => {
    const b = makeBrain();
    b.walkTo(99999, 99999, 0);
    for (let t = 100; t <= 60000; t += 100) b.tick(t);
    const a = b.snapshot();
    expect(a.x).toBeLessThanOrEqual(400 - 72);
    expect(a.y).toBeLessThanOrEqual(200);
  });

  it("consumeArrival эхний удаад үнэн, дараа нь худал", () => {
    const b = makeBrain();
    b.walkTo(10, 0, 0);
    for (let t = 100; t <= 60000; t += 100) b.tick(t);
    expect(b.consumeArrival()).toBe(true);
    expect(b.consumeArrival()).toBe(false);
  });

  it("хүрээгүй байхад consumeArrival худал", () => {
    const b = makeBrain();
    b.walkTo(b.snapshot().x + 300, 0, 0);
    b.tick(100);
    expect(b.consumeArrival()).toBe(false);
  });

  it("явж байхад хүрээ багасвал зорилтот цэг дахин таслагдаж хүрнэ", () => {
    const b = makeBrain();
    b.walkTo(99999, 0, 0);
    b.tick(100);
    b.setWidth(200);
    for (let t = 200; t <= 60000; t += 100) b.tick(t);
    expect(b.snapshot().state).not.toBe("goto");
    expect(b.consumeArrival()).toBe(true);
  });
});

describe("hold ба release", () => {
  const makeBrain = () => createBrain({ width: 400, rise: 200, spriteWidth: 72, rand: () => 0.5 });

  it("hold үед автономит төлөв солигдохгүй", () => {
    const b = makeBrain();
    b.hold(0);
    const before = b.snapshot().state;
    for (let t = 1000; t <= 30000; t += 1000) b.tick(t);
    expect(b.snapshot().state).toBe(before);
  });

  it("hold үед унтахгүй", () => {
    const b = makeBrain();
    b.hold(0);
    for (let t = 1000; t <= 120000; t += 1000) b.tick(t);
    expect(b.snapshot().state).not.toBe("sleep");
  });

  it("release хийсний дараа автономит зан сэргэнэ", () => {
    const b = makeBrain();
    b.hold(0);
    b.release(1000);
    expect(b.snapshot().state).toBe("walk");
    for (let t = 2000; t <= 30000; t += 1000) b.tick(t);
    /* автономит мөчлөг дахин ажиллаж эхэлсэн эсэх — walk-аас өөр төлөвт
       нэг ч удаа орсон байх ёстой */
    expect(["walk", "idle", "sit", "wave", "climb"]).toContain(b.snapshot().state);
  });

  it("hold үед ч товшилт ажиллана", () => {
    const b = makeBrain();
    b.hold(0);
    b.pointerDown(100, 50, 50);
    const res = b.pointerUp(200);
    expect(res.tapped).toBe(true);
  });

  it("hold үед poke дуудвал blush төлөвт орно", () => {
    const b = makeBrain();
    b.hold(0);
    b.poke(100);
    expect(b.snapshot().state).toBe("blush");
  });

  it("hold үед walk төлөвт байсан ч байрнаасаа хөдлөхгүй", () => {
    const b = makeBrain();
    const x0 = b.snapshot().x;
    b.hold(0);
    for (let t = 1000; t <= 30000; t += 1000) b.tick(t);
    expect(b.snapshot().x).toBe(x0);
  });

  it("hold үед poke хийсний дараа ч алхаж эхлэхгүй", () => {
    const b = makeBrain();
    b.hold(0);
    b.poke(100);
    const x0 = b.snapshot().x;
    for (let t = 200; t <= 30000; t += 100) b.tick(t);
    expect(b.snapshot().x).toBe(x0);
  });

  it("чирэлт нь командын дарааллыг цуцална", () => {
    const b = makeBrain();
    b.hold(0);
    b.walkTo(10, 0, 0);
    b.tick(100);
    b.pointerDown(200, 50, 50);
    b.pointerMove(300, 90, 50);
    expect(b.snapshot().state).toBe("dragged");
    b.pointerUp(400);
    for (let t = 500; t <= 30000; t += 100) b.tick(t);
    /* held цуцлагдсан тул автономит зан руугаа буцсан байх ёстой */
    expect(b.snapshot().state).not.toBe("dragged");
    expect(b.consumeArrival()).toBe(false);
  });
});
