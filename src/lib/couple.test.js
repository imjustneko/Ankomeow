import { describe, it, expect } from "vitest";
import {
  daysBetween, shiftDay, dayNumber, nextMilestone, nextBirthday,
  streakCount, bothDoneDays, isValidDay, leftText,
} from "./couple.js";

describe("огнооны үндэс", () => {
  it("хоёр огнооны хоорондох өдрийг тоолно", () => {
    expect(daysBetween("2026-01-01", "2026-01-02")).toBe(1);
    expect(daysBetween("2026-01-02", "2026-01-01")).toBe(-1);
    expect(daysBetween("2026-01-01", "2026-01-01")).toBe(0);
  });

  it("сар, жилийн зааг дамжина", () => {
    expect(daysBetween("2026-01-31", "2026-02-01")).toBe(1);
    expect(daysBetween("2026-12-31", "2027-01-01")).toBe(1);
    expect(daysBetween("2026-01-01", "2027-01-01")).toBe(365);
  });

  it("өндөр жилийг зөв бодно", () => {
    /* 2028 бол өндөр жил — 2 сар 29 хоногтой */
    expect(daysBetween("2028-01-01", "2029-01-01")).toBe(366);
    expect(daysBetween("2028-02-28", "2028-03-01")).toBe(2);
  });

  it("өдөр нэмж хасна", () => {
    expect(shiftDay("2026-03-01", -1)).toBe("2026-02-28");
    expect(shiftDay("2028-03-01", -1)).toBe("2028-02-29");
    expect(shiftDay("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("буруу огноог няцаана", () => {
    expect(isValidDay("2026-05-05")).toBe(true);
    expect(isValidDay("")).toBe(false);
    expect(isValidDay("хогийн")).toBe(false);
    expect(daysBetween("хогийн", "2026-01-01")).toBe(null);
  });

  it("танилцсан өдөр нь 1 дэх өдөр", () => {
    expect(dayNumber("2026-07-31", "2026-07-31")).toBe(1);
    expect(dayNumber("2026-07-31", "2026-08-01")).toBe(2);
  });
});

describe("тэмдэглэлт өдөр", () => {
  it("ойрын өдрийн тооны босгыг олно", () => {
    const m = nextMilestone("2026-01-01", "2026-01-10"); /* 9 хоног өнгөрсөн */
    expect(m.kind).toBe("days");
    expect(m.label).toBe("50 өдөр");
    expect(m.left).toBe(41);
    expect(m.date).toBe("2026-02-20");
  });

  it("босго ба хуанлийн ойгоос эртхэнийг сонгоно", () => {
    /* 360 дахь хоног: 365 өдрийн босго 5 хоногийн дараа, 1 жилийн ой мөн ойрхон */
    const m = nextMilestone("2026-01-01", "2026-12-27");
    expect(m.left).toBeLessThanOrEqual(6);
  });

  it("жилийн ойг зөв нэрлэнэ", () => {
    const m = nextMilestone("2020-06-15", "2026-06-01");
    expect(m.kind).toBe("year");
    expect(m.label).toBe("6 жилийн ой");
    expect(m.date).toBe("2026-06-15");
  });

  it("ирээдүйн огноог үл тоомсорлоно", () => {
    expect(nextMilestone("2027-01-01", "2026-01-01")).toBe(null);
  });

  it("төрсөн өдөр — өнөөдөр бол 0 хоног", () => {
    expect(nextBirthday("07-31", "2026-07-31")).toEqual({ date: "2026-07-31", left: 0 });
  });

  it("төрсөн өдөр өнгөрсөн бол дараа жилийнхийг өгнө", () => {
    const b = nextBirthday("01-15", "2026-07-31");
    expect(b.date).toBe("2027-01-15");
    expect(b.left).toBe(168);
  });

  it("буруу форматыг няцаана", () => {
    expect(nextBirthday("", "2026-07-31")).toBe(null);
    expect(nextBirthday("7-1", "2026-07-31")).toBe(null);
  });
});

describe("streak", () => {
  it("өнөөдрийг оруулан тоолно", () => {
    expect(streakCount(["2026-07-29", "2026-07-30", "2026-07-31"], "2026-07-31")).toBe(3);
  });

  it("өнөөдөр дуусаагүй бол өчигдрөөс тоолно — өглөө тэглэгдэхгүй", () => {
    expect(streakCount(["2026-07-29", "2026-07-30"], "2026-07-31")).toBe(2);
  });

  it("нэг өдөр тасарвал зогсоно", () => {
    expect(streakCount(["2026-07-25", "2026-07-26", "2026-07-30"], "2026-07-31")).toBe(1);
  });

  it("хоёр өдөр тасарвал тэг", () => {
    expect(streakCount(["2026-07-01"], "2026-07-31")).toBe(0);
    expect(streakCount([], "2026-07-31")).toBe(0);
  });

  it("сарын заагийг дамжина", () => {
    expect(streakCount(["2026-06-29", "2026-06-30", "2026-07-01"], "2026-07-01")).toBe(3);
  });

  it("зөвхөн хоёулаа биелүүлсэн өдрийг тооцно", () => {
    const docs = [
      { d: "2026-07-31", andela: true, neko: true },
      { d: "2026-07-30", andela: true },              /* зөвхөн нэг нь */
      { d: "2026-07-29", andela: true, neko: true },
    ];
    const set = bothDoneDays(docs, "andela", "neko");
    expect([...set].sort()).toEqual(["2026-07-29", "2026-07-31"]);
    expect(streakCount(set, "2026-07-31")).toBe(1);
  });
});

describe("үлдсэн хоногийн бичиглэл", () => {
  it("өнөөдөр, маргааш, бусад", () => {
    expect(leftText(0)).toBe("өнөөдөр!");
    expect(leftText(1)).toBe("маргааш");
    expect(leftText(9)).toBe("9 хоногийн дараа");
  });
});
