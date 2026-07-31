import { describe, it, expect } from "vitest";
import { QUESTIONS, questionIndex, questionForDay } from "./questions.js";

describe("өдрийн асуулт", () => {
  it("асуултын сан хангалттай том бөгөөд давхардалгүй", () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(50);
    expect(new Set(QUESTIONS).size).toBe(QUESTIONS.length);
  });

  it("нэг өдөр үргэлж ижил асуулт өгнө", () => {
    /* Хоёулаа ижил асуулт харах ёстой — энэ бол гол шаардлага */
    expect(questionForDay("2026-07-31")).toBe(questionForDay("2026-07-31"));
    expect(questionIndex("2026-07-31")).toBe(questionIndex("2026-07-31"));
  });

  it("өөр өдөрт ихэвчлэн өөр асуулт", () => {
    const days = [];
    for (let d = 1; d <= 28; d++) days.push(`2026-02-${String(d).padStart(2, "0")}`);
    const uniq = new Set(days.map(questionForDay));
    expect(uniq.size).toBeGreaterThan(20);
  });

  it("индекс үргэлж хүрээндээ байна", () => {
    for (let y = 2024; y <= 2030; y++) {
      for (let m = 1; m <= 12; m++) {
        const i = questionIndex(`${y}-${String(m).padStart(2, "0")}-15`);
        expect(i).toBeGreaterThanOrEqual(0);
        expect(i).toBeLessThan(QUESTIONS.length);
      }
    }
  });

  it("жилийн турш сангаа сайн ашиглана", () => {
    const seen = new Set();
    for (let d = 0; d < 365; d++) {
      const dt = new Date(Date.UTC(2026, 0, 1 + d));
      seen.add(questionForDay(dt.toISOString().slice(0, 10)));
    }
    /* Санамсаргүй хуваарилалтад 60 асуултаас 365 өдөрт бараг бүгд гарна */
    expect(seen.size).toBeGreaterThan(QUESTIONS.length * 0.8);
  });
});
