import { describe, it, expect } from "vitest";
import { TYPING_PING_MS, TYPING_STALE_MS, isTyping, shouldPing } from "./typing.js";

describe("shouldPing", () => {
  it("хараахан мэдэгдээгүй бол шууд мэдэгдэнэ", () => {
    expect(shouldPing(0, 1000)).toBe(true);
  });

  it("давтамж дуусаагүй бол мэдэгдэхгүй", () => {
    expect(shouldPing(1000, 1000 + TYPING_PING_MS - 1)).toBe(false);
  });

  it("давтамж дүүрвэл мэдэгдэнэ", () => {
    expect(shouldPing(1000, 1000 + TYPING_PING_MS)).toBe(true);
  });
});

describe("isTyping", () => {
  const ts = (ms) => ({ toMillis: () => ms });

  it("баримт байхгүй бол худал", () => {
    expect(isTyping(undefined, 1000)).toBe(false);
    expect(isTyping(null, 1000)).toBe(false);
  });

  it("typing:false бол худал", () => {
    expect(isTyping({ typing: false, at: ts(1000) }, 1000)).toBe(false);
  });

  it("шинэ төлөвт итгэнэ", () => {
    expect(isTyping({ typing: true, at: ts(1000) }, 2000)).toBe(true);
  });

  it("хуучирсан төлөвийг үл тоомсорлоно", () => {
    /* Апп унтарсан бол унтраах бичилт ирэхгүй — өөрөө хүчингүй болно */
    expect(isTyping({ typing: true, at: ts(1000) }, 1000 + TYPING_STALE_MS)).toBe(false);
  });

  it("serverTimestamp хараахан бичигдээгүй байхад итгэнэ", () => {
    /* Firestore нь өөрийн бичилтийг эхлээд at:null-тэйгээр эргүүлж өгдөг */
    expect(isTyping({ typing: true, at: null }, 5000)).toBe(true);
    expect(isTyping({ typing: true }, 5000)).toBe(true);
  });

  it("энгийн тоог ч хүлээж авна", () => {
    expect(isTyping({ typing: true, at: 1000 }, 2000)).toBe(true);
    expect(isTyping({ typing: true, at: 1000 }, 99999)).toBe(false);
  });
});
