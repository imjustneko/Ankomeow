import { describe, it, expect } from "vitest";
import { bigEmoji, BIG_EMOJI_SIZE } from "./emoji.js";

describe("bigEmoji", () => {
  it("нэг эможиг таньна", () => {
    expect(bigEmoji("❤️")).toBe(1);
  });

  it("гурав хүртэлх эможиг таньна", () => {
    expect(bigEmoji("😂😂")).toBe(2);
    expect(bigEmoji("🎉🎂🎁")).toBe(3);
  });

  it("гурваас олон бол энгийн зурвас", () => {
    expect(bigEmoji("😀😀😀😀")).toBe(0);
  });

  it("хооронд нь зай байсан ч тоолно", () => {
    expect(bigEmoji(" 👍 👍 ")).toBe(2);
  });

  it("үсэг холилдвол энгийн зурвас", () => {
    expect(bigEmoji("баярлалаа ❤️")).toBe(0);
    expect(bigEmoji("ok👍")).toBe(0);
  });

  it("хоосон зурвас 0", () => {
    expect(bigEmoji("")).toBe(0);
    expect(bigEmoji("   ")).toBe(0);
  });

  it("текстээс өөр төрлийг тэвчинэ", () => {
    expect(bigEmoji(undefined)).toBe(0);
    expect(bigEmoji(null)).toBe(0);
    expect(bigEmoji(42)).toBe(0);
  });

  it("ZWJ-ээр холбогдсон гэр бүл нэг эможи гэж тоологдоно", () => {
    /* 👨‍👩‍👧 нь таван код цэг боловч нэг л харагдах нэгж */
    expect(bigEmoji("👨‍👩‍👧")).toBe(1);
  });

  it("арьсны өнгөтэй эможи нэг гэж тоологдоно", () => {
    expect(bigEmoji("👍🏽")).toBe(1);
  });

  it("хэмжээний хүснэгт таних тоо бүрд утгатай", () => {
    expect(BIG_EMOJI_SIZE).toHaveLength(3);
    /* Олон эможи байх тусам жижиг — эс бөгөөс мөр дүүрнэ */
    expect(BIG_EMOJI_SIZE[0]).toBeGreaterThan(BIG_EMOJI_SIZE[1]);
    expect(BIG_EMOJI_SIZE[1]).toBeGreaterThan(BIG_EMOJI_SIZE[2]);
  });
});
