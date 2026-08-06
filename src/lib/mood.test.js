import { describe, it, expect } from "vitest";
import { MOODS, moodByKey, moodReply, moodToday } from "./mood.js";

describe("MOODS", () => {
  it("түлхүүр давхардахгүй", () => {
    expect(new Set(MOODS.map((m) => m.key)).size).toBe(MOODS.length);
  });

  it("эможи давхардахгүй", () => {
    expect(new Set(MOODS.map((m) => m.emoji)).size).toBe(MOODS.length);
  });

  it("бүгд шошготой", () => {
    for (const m of MOODS) expect(m.label.length).toBeGreaterThan(0);
  });
});

describe("moodByKey", () => {
  it("түлхүүрээр олно", () => {
    expect(moodByKey("sad").emoji).toBe("🥺");
  });

  it("байхгүй түлхүүрт null", () => {
    expect(moodByKey("хаа нэгтээ")).toBeNull();
    expect(moodByKey(undefined)).toBeNull();
  });
});

describe("moodToday", () => {
  it("өнөөдрийнхийг өгнө", () => {
    expect(moodToday({ mood: "great", moodDay: "2026-08-06" }, "2026-08-06").key).toBe("great");
  });

  it("өчигдрийнхийг өгөхгүй", () => {
    /* Өчигдөр ядарсан гэдэг нь өнөөдрийн тухай юу ч хэлэхгүй */
    expect(moodToday({ mood: "tired", moodDay: "2026-08-05" }, "2026-08-06")).toBeNull();
  });

  it("тэмдэглээгүй бол null", () => {
    expect(moodToday({}, "2026-08-06")).toBeNull();
    expect(moodToday(null, "2026-08-06")).toBeNull();
    expect(moodToday({ moodDay: "2026-08-06" }, "2026-08-06")).toBeNull();
  });

  it("танихгүй эможид null", () => {
    expect(moodToday({ mood: "хачин", moodDay: "2026-08-06" }, "2026-08-06")).toBeNull();
  });
});

describe("moodReply", () => {
  it("сайн байгаа хүнд хариу санал болгохгүй", () => {
    /* "Юу болов?" гэж бичих нь утгагүй */
    expect(moodReply(moodByKey("great"))).toBeNull();
    expect(moodReply(moodByKey("ok"))).toBeNull();
  });

  it("муу байгаа хүнд хариу санал болгоно", () => {
    expect(moodReply(moodByKey("sad"))).toBeTruthy();
    expect(moodReply(moodByKey("tired"))).toBeTruthy();
    expect(moodReply(moodByKey("meh"))).toBeTruthy();
  });

  it("сэтгэл санаа байхгүй бол null", () => {
    expect(moodReply(null)).toBeNull();
    expect(moodReply(undefined)).toBeNull();
  });
});
