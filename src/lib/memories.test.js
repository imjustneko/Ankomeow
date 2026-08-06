import { describe, it, expect } from "vitest";
import { MEMORY_WINDOWS, memoryDays, pickMemory, shiftDay } from "./memories.js";

describe("shiftDay", () => {
  it("жилээр ухарна", () => {
    expect(shiftDay("2026-08-06", { years: 1 })).toBe("2025-08-06");
    expect(shiftDay("2026-08-06", { years: 2 })).toBe("2024-08-06");
  });

  it("сараар ухарна", () => {
    expect(shiftDay("2026-08-06", { months: 1 })).toBe("2026-07-06");
    expect(shiftDay("2026-08-06", { months: 6 })).toBe("2026-02-06");
  });

  it("оны зааг давж ухарна", () => {
    expect(shiftDay("2026-02-06", { months: 3 })).toBe("2025-11-06");
    expect(shiftDay("2026-01-15", { months: 1 })).toBe("2025-12-15");
  });

  it("байхгүй өдрийг сарын сүүлээр таслана", () => {
    /* 3-31-ээс сар ухрахад 2-31 гэж байхгүй — 2-28 болно, 3-3 биш */
    expect(shiftDay("2025-03-31", { months: 1 })).toBe("2025-02-28");
  });

  it("өндөр жилийг зөв тооцно", () => {
    expect(shiftDay("2024-03-31", { months: 1 })).toBe("2024-02-29");
    /* 2-29-өөс жил ухрахад 2-28 */
    expect(shiftDay("2024-02-29", { years: 1 })).toBe("2023-02-28");
  });

  it("гэмтэлтэй огноонд null", () => {
    expect(shiftDay("хэдэн", { years: 1 })).toBeNull();
    expect(shiftDay(undefined, { years: 1 })).toBeNull();
    expect(shiftDay("", { years: 1 })).toBeNull();
  });

  it("тэг шилжилтэд өөрийг нь буцаана", () => {
    expect(shiftDay("2026-08-06", {})).toBe("2026-08-06");
  });
});

describe("memoryDays", () => {
  it("цонх бүрд огноо гаргана", () => {
    const days = memoryDays("2026-08-06");
    expect(days).toHaveLength(MEMORY_WINDOWS.length);
    expect(days.map((d) => d.day)).toEqual([
      "2024-08-06", "2025-08-06", "2026-02-06", "2026-05-06", "2026-07-06",
    ]);
  });

  it("хол нь эхэнд байна", () => {
    expect(memoryDays("2026-08-06")[0].key).toBe("y2");
  });
});

describe("pickMemory", () => {
  it("юу ч олдоогүй бол null", () => {
    expect(pickMemory({})).toBeNull();
    expect(pickMemory(undefined)).toBeNull();
    expect(pickMemory({ y1: [], m1: [] })).toBeNull();
  });

  it("хамгийн ХОЛЫГ нь сонгоно", () => {
    /* Сарын өмнөхөөс жилийн өмнөх илүү үнэ цэнэтэй */
    const out = pickMemory({ m1: [{ id: "a" }], y1: [{ id: "b" }] });
    expect(out.key).toBe("y1");
    expect(out.items).toEqual([{ id: "b" }]);
  });

  it("ганц олдвол түүнийг өгнө", () => {
    expect(pickMemory({ m1: [{ id: "a" }] }).key).toBe("m1");
  });

  it("шошготой буцаана", () => {
    expect(pickMemory({ y1: [{ id: "b" }] }).label).toContain("Жилийн");
  });
});
