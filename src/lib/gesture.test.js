import { describe, it, expect } from "vitest";
import {
  DOUBLE_TAP_MS, REPLY_COMMIT_PX, REPLY_MAX_PX,
  dragX, isDoubleTap, lockAxis, movedTooFar, replyCommitted,
} from "./gesture.js";

describe("movedTooFar", () => {
  it("бага хөдөлгөөнийг тэвчинэ", () => {
    expect(movedTooFar(3, 3)).toBe(false);
  });

  it("хязгаараас хол бол үнэн", () => {
    expect(movedTooFar(20, 0)).toBe(true);
    expect(movedTooFar(0, -20)).toBe(true);
  });

  it("хоёр тэнхлэгийн нийлбэр зайгаар бодно", () => {
    /* 8,8 → 11.3px — тус тусдаа хязгаарт багтах ч нийлбэр нь давна */
    expect(movedTooFar(8, 8)).toBe(true);
  });
});

describe("lockAxis", () => {
  it("бага хөдөлгөөнд чиглэл тодорхойгүй", () => {
    expect(lockAxis(2, 2)).toBeNull();
  });

  it("хэвтээ давамгайлбал x", () => {
    expect(lockAxis(20, 3)).toBe("x");
  });

  it("босоо давамгайлбал y", () => {
    expect(lockAxis(3, 20)).toBe("y");
  });

  it("сөрөг чиглэлийг ч таньна", () => {
    expect(lockAxis(-20, 3)).toBe("x");
    expect(lockAxis(3, -20)).toBe("y");
  });
});

describe("dragX", () => {
  it("зүүн тийш чирэхийг зөвшөөрөхгүй", () => {
    expect(dragX(-40)).toBe(0);
    expect(dragX(0)).toBe(0);
  });

  it("дээд хязгаар хүртэл хуруу дагана", () => {
    expect(dragX(30)).toBe(30);
    expect(dragX(REPLY_MAX_PX)).toBe(REPLY_MAX_PX);
  });

  it("хязгаараас цааш хүндэрнэ", () => {
    const beyond = dragX(REPLY_MAX_PX + 40);
    expect(beyond).toBeGreaterThan(REPLY_MAX_PX);
    expect(beyond).toBeLessThan(REPLY_MAX_PX + 40);
  });

  it("хэзээ ч ухарч буцахгүй", () => {
    /* Чирэх тусам утга өсөх ёстой — эс бөгөөс бөмбөлөг чичирнэ */
    let prev = -1;
    for (let dx = 0; dx <= 200; dx += 5) {
      const v = dragX(dx);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });
});

describe("replyCommitted", () => {
  it("хязгаараас богино бол хариулахгүй", () => {
    expect(replyCommitted(REPLY_COMMIT_PX - 1)).toBe(false);
  });

  it("хязгаарт хүрвэл хариулна", () => {
    expect(replyCommitted(REPLY_COMMIT_PX)).toBe(true);
    expect(replyCommitted(200)).toBe(true);
  });
});

describe("isDoubleTap", () => {
  it("өмнөх товшилтгүй бол худал", () => {
    expect(isDoubleTap(null, "a", 1000)).toBe(false);
  });

  it("өөр зурвас дээрх товшилт давхар биш", () => {
    expect(isDoubleTap({ id: "a", at: 1000 }, "b", 1100)).toBe(false);
  });

  it("хугацаанд багтвал давхар", () => {
    expect(isDoubleTap({ id: "a", at: 1000 }, "a", 1100)).toBe(true);
  });

  it("хугацаа өнгөрвөл давхар биш", () => {
    expect(isDoubleTap({ id: "a", at: 1000 }, "a", 1000 + DOUBLE_TAP_MS + 1)).toBe(false);
  });

  it("яг хязгаар дээр давхар гэж үзнэ", () => {
    expect(isDoubleTap({ id: "a", at: 1000 }, "a", 1000 + DOUBLE_TAP_MS)).toBe(true);
  });
});
