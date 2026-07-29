import { describe, it, expect } from "vitest";
import { PHRASES, TALKATIVE, pickPhrase, CHAT_POINT_PHRASE } from "./phrases.js";

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

describe("CHAT_POINT_PHRASE", () => {
  it("хоосон биш тогтмол үг", () => {
    expect(typeof CHAT_POINT_PHRASE).toBe("string");
    expect(CHAT_POINT_PHRASE.trim().length).toBeGreaterThan(0);
  });

  it("санамсаргүй үгсийн жагсаалтад ороогүй — тусдаа зорилготой", () => {
    expect(PHRASES).not.toContain(CHAT_POINT_PHRASE);
  });
});
