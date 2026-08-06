import { describe, it, expect } from "vitest";
import { careHint } from "./care.js";

const p = (over = {}) => ({ ml: 0, goal: 2000, items: [], screenApps: [], appMin: 0, ...over });
const key = (partner, hour) => careHint(partner, hour)?.key ?? null;

describe("careHint", () => {
  it("хамтрагч байхгүй бол юу ч биш", () => {
    expect(careHint(null, 14)).toBeNull();
    expect(careHint(undefined, 14)).toBeNull();
  });

  it("өглөө эрт ус уугаагүйг зэмлэхгүй", () => {
    /* 8 цагт хэн ч уугаагүй байна — энэ нь мэдээлэл биш */
    expect(key(p({ ml: 0 }), 8)).toBeNull();
  });

  it("үдээс хойш ус уугаагүйг анзаарна", () => {
    expect(key(p({ ml: 0 }), 13)).toBe("noWater");
  });

  it("орой ус дутуу байхыг анзаарна", () => {
    expect(key(p({ ml: 500, goal: 2000 }), 18)).toBe("lowWater");
  });

  it("хангалттай ууссан бол ус тухай юу ч хэлэхгүй", () => {
    expect(key(p({ ml: 1500, goal: 2000 }), 18)).toBeNull();
  });

  it("шөнө оройтож дэлгэц ширтэхийг бусдаас түрүүнд хэлнэ", () => {
    /* Ус ч уугаагүй байсан ч шөнийн амралт илүү чухал */
    const hint = careHint(p({ ml: 0, screenApps: [{ min: 130 }] }), 23);
    expect(hint.key).toBe("late");
  });

  it("шөнө боловч дэлгэц бага бол амраарай гэхгүй", () => {
    expect(key(p({ ml: 1200, goal: 2000, screenApps: [{ min: 20 }] }), 23)).toBeNull();
  });

  it("орой жагсаалт эхлээгүйг дэмжинэ", () => {
    expect(key(p({ ml: 2000, goal: 2000, items: [{ done: false }, { done: false }] }), 20)).toBe("listStuck");
  });

  it("жагсаалт хоосон бол дэмжих зүйлгүй", () => {
    expect(key(p({ ml: 2000, goal: 2000, items: [] }), 20)).toBeNull();
  });

  it("бүх зорилго биелсэнийг баярлуулна", () => {
    expect(key(p({ ml: 2000, goal: 2000, items: [{ done: true }] }), 20)).toBe("allDone");
  });

  it("appMin ба screenApps хоёуланг нэгтгэж тоолно", () => {
    expect(key(p({ screenApps: [{ min: 60 }], appMin: 65 }), 22)).toBe("late");
  });

  it("гэмтэлтэй өгөгдлийг тэвчинэ", () => {
    expect(() => careHint({ ml: "хэдэн", items: [null, undefined], screenApps: [{}] }, 22)).not.toThrow();
  });

  it("зөвлөмж бүр товч ба зурвастай", () => {
    const hint = careHint(p({ ml: 0 }), 14);
    expect(hint.cta.length).toBeGreaterThan(0);
    expect(hint.message.length).toBeGreaterThan(0);
  });
});
