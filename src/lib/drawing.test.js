import { describe, it, expect } from "vitest";
import { DRAW_UNITS, strokePoints, smoothPath, assistShape } from "./drawing.js";

/* Санамсаргүй ч давтагдах чичиргээ — тест тогтвортой байх ёстой */
const rnd = ((seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647))(42);
const jit = (v, a) => v + (rnd() * 2 - 1) * a;

const circle = (cx, cy, r, n = 40, wobble = 0, squash = 1) => {
  const p = [];
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * Math.PI * 2;
    p.push(jit(cx + r * Math.cos(t), wobble), jit(cy + r * squash * Math.sin(t), wobble));
  }
  return p;
};

const rect = (x0, y0, x1, y1, per = 14, wobble = 0) => {
  const c = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
  const p = [];
  for (let s = 0; s < 4; s++) {
    for (let i = 0; i < per; i++) {
      const t = i / per;
      p.push(jit(c[s][0] + (c[s + 1][0] - c[s][0]) * t, wobble),
             jit(c[s][1] + (c[s + 1][1] - c[s][1]) * t, wobble));
    }
  }
  p.push(jit(x0, wobble), jit(y0, wobble));
  return p;
};

describe("цэг тоолох", () => {
  it("бүх шугамын цэгийг нэгтгэнэ", () => {
    expect(strokePoints([{ p: [0, 0, 1, 1] }, { p: [2, 2] }])).toBe(3);
    expect(strokePoints([])).toBe(0);
    expect(strokePoints(null)).toBe(0);
    expect(strokePoints([{}])).toBe(0);
  });
});

describe("гөлгөржүүлэлт", () => {
  it("эхний цэгээс M-ээр эхэлнэ", () => {
    expect(smoothPath([10, 20, 30, 40, 50, 60])).toMatch(/^M10 20/);
  });

  it("хоёр цэгийг шулуун L болгоно", () => {
    expect(smoothPath([0, 0, 100, 100])).toBe("M0 0L100 100");
  });

  it("гурав ба түүнээс дээш цэгт кубик муруй үүсгэнэ", () => {
    const d = smoothPath([0, 0, 50, 20, 100, 0]);
    expect(d).toContain("C");
    /* Сегментийн тоо нь цэгийн тооноос нэгээр бага */
    expect(d.split("C").length - 1).toBe(2);
  });

  it("NaN гаргахгүй", () => {
    expect(smoothPath(circle(500, 500, 200, 30))).not.toContain("NaN");
  });
});

describe("дүрсний туслах", () => {
  it("хэт богино зурлагыг хөндөхгүй", () => {
    expect(assistShape([0, 0, 5, 5, 10, 10, 12, 12, 14, 14, 16, 16])).toBe(null);
  });

  it("цөөн цэгтэйд null", () => {
    expect(assistShape([0, 0, 500, 500])).toBe(null);
  });

  it("чичиргээтэй шулууныг таньж хоёр цэг болгоно", () => {
    const p = [];
    for (let i = 0; i <= 20; i++) p.push(jit(100 + i * 22, 7), jit(300, 7));
    const r = assistShape(p);
    expect(r.k).toBe("line");
    expect(r.p.length).toBe(4);
  });

  it("тойргийг таньж дугуй болгоно", () => {
    for (let t = 0; t < 30; t++) {
      const r = assistShape(circle(500, 500, 180, 40, 14, 0.9 + rnd() * 0.2));
      expect(r?.k).toBe("circle");
    }
  });

  it("дөрвөлжинг тойрог гэж андуурахгүй", () => {
    /* Энэ нь бодит алдаа байсан: ирмэгийн 13% зөвшөөрөлд төгс тойрог ч
       цэгийнхээ 94%-аар таардаг байв. */
    for (let t = 0; t < 30; t++) {
      const r = assistShape(rect(200, 200, 650, 650, 14, 10));
      expect(r?.k).toBe("rect");
    }
  });

  it("тэгш өнцөгтийг таньж 5 цэгтэй хаалттай зам болгоно", () => {
    const r = assistShape(rect(150, 300, 650, 600, 14, 10));
    expect(r.k).toBe("rect");
    expect(r.p.length).toBe(10);
    expect(r.p.slice(0, 2)).toEqual(r.p.slice(-2)); /* эхлэл = төгсгөл */
  });

  it("санамсаргүй сараачилтыг хөндөхгүй", () => {
    const p = [];
    for (let i = 0; i <= 30; i++) p.push(300 + i * 12 + Math.sin(i) * 90, 400 + Math.cos(i * 1.7) * 140);
    expect(assistShape(p)).toBe(null);
  });

  it("үүсгэсэн дүрс хүрээнээсээ гарахгүй", () => {
    const r = assistShape(circle(500, 500, 180, 40, 10));
    for (const v of r.p) {
      expect(v).toBeGreaterThanOrEqual(-DRAW_UNITS);
      expect(v).toBeLessThanOrEqual(2 * DRAW_UNITS);
    }
  });
});
