import { describe, it, expect, vi, afterEach } from "vitest";
import { vibrationPattern, pokeDelta, canVibrate, buzzMessage, MAX_BUZZ_PULSES } from "./buzz.js";

describe("vibrationPattern", () => {
  it("нэг товшилтод нэг богино цохилт", () => {
    expect(vibrationPattern(1)).toEqual([35]);
  });

  it("гурван товшилтод гурван цохилт", () => {
    expect(vibrationPattern(3)).toEqual([0, 35, 90, 35, 90, 35]);
  });

  it("олон товшилтыг дээд хязгаараар таслана", () => {
    const p = vibrationPattern(10);
    const pulses = p.filter((_, i) => i % 2 === 1).length;
    expect(pulses).toBe(MAX_BUZZ_PULSES);
  });

  it("тэг эсвэл сөрөг тоонд хоосон массив", () => {
    expect(vibrationPattern(0)).toEqual([]);
    expect(vibrationPattern(-2)).toEqual([]);
  });
});

describe("pokeDelta", () => {
  it("хэвийн өсөлтийг тооцно", () => {
    expect(pokeDelta(5, 8)).toBe(3);
  });

  it("өөрчлөлтгүй бол тэг", () => {
    expect(pokeDelta(5, 5)).toBe(0);
  });

  it("тоолуур дахин тохируулагдвал тэг", () => {
    expect(pokeDelta(9, 2)).toBe(0);
  });

  it("тэгээс эхэлсэн ч зөв тоолно", () => {
    expect(pokeDelta(0, 4)).toBe(4);
  });
});

describe("canVibrate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigator.vibrate байвал үнэн", () => {
    vi.stubGlobal("navigator", { vibrate: () => true });
    expect(canVibrate()).toBe(true);
  });

  it("navigator.vibrate байхгүй бол худал", () => {
    vi.stubGlobal("navigator", {});
    expect(canVibrate()).toBe(false);
  });

  it("navigator огт байхгүй бол худал", () => {
    vi.stubGlobal("navigator", undefined);
    expect(canVibrate()).toBe(false);
  });
});

describe("buzzMessage", () => {
  it("нэг товшилтод ганц тооны текст", () => {
    expect(buzzMessage("Andela", 1)).toBe("Andela чамайг товшлоо 💕");
  });

  it("олон товшилтыг тоогоор нэгтгэнэ", () => {
    expect(buzzMessage("Andela", 5)).toBe("Andela чамайг 5 удаа товшлоо 💕");
  });
});
