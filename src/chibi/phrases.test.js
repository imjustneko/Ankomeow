import { describe, it, expect } from "vitest";
import { PHRASES, TALKATIVE, pickPhrase } from "./phrases.js";

describe("pickPhrase", () => {
  it("жагсаалтаас үг буцаана", () => {
    expect(PHRASES).toContain(pickPhrase(null, () => 0.5));
  });

  it("дараалан ижил үг гаргахгүй", () => {
    const first = PHRASES[3];
    const again = pickPhrase(first, () => 3 / PHRASES.length);
    expect(again).not.toBe(first);
    expect(PHRASES).toContain(again);
  });

  it("rand 1-д ойрхон байсан ч жагсаалтаас хальж гарахгүй", () => {
    expect(PHRASES).toContain(pickPhrase(null, () => 0.999999));
  });

  it("зөвхөн Neko-гийн дүр ярина", () => {
    expect(TALKATIVE).toBe("neko");
  });
});
