import { describe, it, expect } from "vitest";
import { groupMessages } from "./chatGroup.js";
import { ubDayOf } from "./time.js";

const MIN = 60000;
const base = Date.UTC(2026, 7, 6, 2, 0, 0); /* 2026-08-06 10:00 УБ */

/* Firestore Timestamp-ыг дуурайна */
const msg = (sender, minutes) => ({
  sender,
  createdAt: minutes == null ? null : { toMillis: () => base + minutes * MIN },
});

const run = (list) => groupMessages(list, ubDayOf);

describe("groupMessages", () => {
  it("эхний зурвас үргэлж тэмдэглэгээтэй", () => {
    const [a] = run([msg("a", 0)]);
    expect(a.stamp).toBe(true);
    expect(a.groupStart).toBe(true);
    expect(a.groupEnd).toBe(true);
  });

  it("нэг хүний ойрхон зурвасуудыг нэг бүлэг болгоно", () => {
    const r = run([msg("a", 0), msg("a", 1), msg("a", 2)]);
    expect(r.map((x) => x.groupStart)).toEqual([true, false, false]);
    expect(r.map((x) => x.groupEnd)).toEqual([false, false, true]);
    expect(r.map((x) => x.stamp)).toEqual([true, false, false]);
  });

  it("илгээгч солигдоход бүлэг тасарна", () => {
    const r = run([msg("a", 0), msg("b", 1)]);
    expect(r.map((x) => x.groupStart)).toEqual([true, true]);
    expect(r.map((x) => x.groupEnd)).toEqual([true, true]);
  });

  it("5 минутаас урт завсарт бүлэг тасрах ч тэмдэглэгээ гарахгүй", () => {
    const r = run([msg("a", 0), msg("a", 10)]);
    expect(r[1].groupStart).toBe(true);
    expect(r[1].stamp).toBe(false);
  });

  it("1 цагаас урт завсарт тэмдэглэгээ гарна", () => {
    const r = run([msg("a", 0), msg("a", 90)]);
    expect(r[1].stamp).toBe(true);
    expect(r[1].groupStart).toBe(true);
    expect(r[0].groupEnd).toBe(true);
  });

  it("богино завсар ч гэсэн өдөр солигдвол тэмдэглэгээ гарна", () => {
    /* 23:58 → 00:02 УБ. Ердөө 4 минут ч шинэ өдөр. */
    const late = Date.UTC(2026, 7, 6, 15, 58); /* 2026-08-06 23:58 УБ */
    const r = groupMessages([
      { sender: "a", createdAt: { toMillis: () => late } },
      { sender: "a", createdAt: { toMillis: () => late + 4 * MIN } },
    ], ubDayOf);
    expect(r[1].stamp).toBe(true);
    expect(r[1].groupStart).toBe(true);
  });

  it("цаггүй (илгээгдэж яваа) зурвас шинэ тэмдэглэгээ гаргахгүй", () => {
    const r = run([msg("a", 0), msg("a", null)]);
    expect(r[1].stamp).toBe(false);
    expect(r[1].groupStart).toBe(false);
  });
});
