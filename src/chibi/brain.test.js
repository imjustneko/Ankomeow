import { describe, it, expect } from "vitest";
import { createBrain, DUR, SPEED } from "./brain.js";

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
