import { describe, it, expect } from "vitest";
import { waveBars, WAVE_BARS } from "./waveform.js";

describe("waveBars", () => {
  it("хүссэн тооны багана буцаана", () => {
    expect(waveBars("abc")).toHaveLength(WAVE_BARS);
    expect(waveBars("abc", 5)).toHaveLength(5);
  });

  it("ижил түлхүүрээс ижил долгион гарна", () => {
    /* Энэ бол гол шаардлага: дахин зурагдах бүрд долгион үсрэх ёсгүй */
    expect(waveBars("msg-1")).toEqual(waveBars("msg-1"));
  });

  it("өөр түлхүүрээс өөр долгион гарна", () => {
    expect(waveBars("msg-1")).not.toEqual(waveBars("msg-2"));
  });

  it("бүх өндөр 0.15-1 хооронд", () => {
    for (const h of waveBars("хаа нэгтээ")) {
      expect(h).toBeGreaterThanOrEqual(0.15);
      expect(h).toBeLessThanOrEqual(1);
    }
  });

  it("түлхүүр байхгүй ч уначихгүй", () => {
    expect(waveBars(undefined)).toHaveLength(WAVE_BARS);
    expect(waveBars(null)).toHaveLength(WAVE_BARS);
  });

  it("нэг багана хүссэн ч ажиллана", () => {
    expect(waveBars("x", 1)).toHaveLength(1);
  });

  it("дунд хэсэг нь үзүүрээсээ өндөр байх хандлагатай", () => {
    const bars = waveBars("дундаж", 21);
    const mid = bars.slice(7, 14).reduce((a, b) => a + b, 0) / 7;
    const ends = [...bars.slice(0, 4), ...bars.slice(-4)].reduce((a, b) => a + b, 0) / 8;
    expect(mid).toBeGreaterThan(ends);
  });
});
