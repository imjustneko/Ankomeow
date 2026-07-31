import { describe, it, expect } from "vitest";
import { monthGrid, addMonths, eventsOn, upcoming, isDue, monthKey, WEEKDAYS } from "./calendar.js";

describe("сарын тор", () => {
  it("нүдний тоо 7-д хуваагдана", () => {
    for (const ym of ["2026-01", "2026-02", "2026-07", "2028-02"]) {
      expect(monthGrid(ym).length % 7).toBe(0);
    }
  });

  it("сарын бүх өдрийг агуулна", () => {
    const g = monthGrid("2026-07");
    const inMonth = g.filter((c) => c.inMonth);
    expect(inMonth.length).toBe(31);
    expect(inMonth[0].d).toBe("2026-07-01");
    expect(inMonth[30].d).toBe("2026-07-31");
  });

  it("өндөр жилийн 2 сар 29 хоногтой", () => {
    expect(monthGrid("2028-02").filter((c) => c.inMonth).length).toBe(29);
    expect(monthGrid("2026-02").filter((c) => c.inMonth).length).toBe(28);
  });

  it("эхний нүд Даваа гарагт эхэлнэ", () => {
    /* 2026-07-01 бол Лхагва — өмнөх 2 нүд нь 6 сарын 29, 30 */
    const g = monthGrid("2026-07");
    expect(g[0].d).toBe("2026-06-29");
    expect(g[0].inMonth).toBe(false);
    expect(g[2].d).toBe("2026-07-01");
    expect(WEEKDAYS[0]).toBe("Да");
  });

  it("сар яг Даваагаар эхэлбэл нөхөх нүдгүй", () => {
    /* 2026-06-01 бол Даваа */
    const g = monthGrid("2026-06");
    expect(g[0].d).toBe("2026-06-01");
    expect(g[0].inMonth).toBe(true);
  });

  it("буруу оролтод хоосон", () => {
    expect(monthGrid("")).toEqual([]);
    expect(monthGrid("хогийн")).toEqual([]);
  });
});

describe("сар шилжих", () => {
  it("урагш, хойш", () => {
    expect(addMonths("2026-07", 1)).toBe("2026-08");
    expect(addMonths("2026-07", -1)).toBe("2026-06");
  });

  it("жилийн заагийг давна", () => {
    expect(addMonths("2026-12", 1)).toBe("2027-01");
    expect(addMonths("2026-01", -1)).toBe("2025-12");
    expect(addMonths("2026-06", 12)).toBe("2027-06");
  });

  it("огнооноос сарын түлхүүр гаргана", () => {
    expect(monthKey("2026-07-31")).toBe("2026-07");
  });
});

describe("үйл явдал", () => {
  const evs = [
    { id: "a", d: "2026-07-31", t: "18:00", title: "Оройн хоол" },
    { id: "b", d: "2026-07-31", t: "09:00", title: "Эмчид" },
    { id: "c", d: "2026-08-02", title: "Аялал" },
    { id: "d", d: "2026-07-20", title: "Өнгөрсөн" },
  ];

  it("тухайн өдрийнхийг цагаар эрэмбэлнэ", () => {
    expect(eventsOn(evs, "2026-07-31").map((e) => e.id)).toEqual(["b", "a"]);
    expect(eventsOn(evs, "2026-07-25")).toEqual([]);
  });

  it("ойрын үйл явдлыг өдөр, цагаар эрэмбэлнэ", () => {
    const u = upcoming(evs, "2026-07-31");
    expect(u.map((e) => e.id)).toEqual(["b", "a", "c"]);
    expect(u[0].left).toBe(0);
    expect(u[2].left).toBe(2);
  });

  it("өнгөрсөн үйл явдлыг оруулахгүй", () => {
    expect(upcoming(evs, "2026-07-31").some((e) => e.id === "d")).toBe(false);
  });

  it("тоог хязгаарлана", () => {
    expect(upcoming(evs, "2026-07-01", 2).length).toBe(2);
  });

  it("хоосон, дутуу өгөгдөлд унахгүй", () => {
    expect(upcoming(null, "2026-07-31")).toEqual([]);
    expect(eventsOn(null, "2026-07-31")).toEqual([]);
    expect(upcoming([{ title: "огноогүй" }], "2026-07-31")).toEqual([]);
  });
});

describe("сануулгын цаг", () => {
  const ev = { d: "2026-07-31", t: "18:30" };

  it("цаг болоогүй бол үгүй", () => {
    expect(isDue(ev, "2026-07-31", 18 * 60 + 29)).toBe(false);
  });

  it("цаг болсон бол тийм", () => {
    expect(isDue(ev, "2026-07-31", 18 * 60 + 30)).toBe(true);
    expect(isDue(ev, "2026-07-31", 23 * 60)).toBe(true);
  });

  it("өөр өдөр бол үгүй", () => {
    expect(isDue(ev, "2026-08-01", 23 * 60)).toBe(false);
  });

  it("цаг заагаагүй бол өдрийн турш", () => {
    expect(isDue({ d: "2026-07-31" }, "2026-07-31", 0)).toBe(true);
  });
});
