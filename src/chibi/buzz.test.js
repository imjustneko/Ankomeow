import { describe, it, expect, vi, afterEach } from "vitest";
import { MAX_BUZZ_PULSES, vibrationPattern, pokeDelta, canVibrate, buzzMessage, shouldBuzz, missMessage, pokeMessage, missCount } from "./buzz.js";

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

describe("shouldBuzz", () => {
  it("baseline бэлэн бус, кэшийн snapshot ирвэл: none, бэлэн хэвээр биш", () => {
    const r = shouldBuzz({
      fromCache: true,
      baselineReady: false,
      prev: 0,
      total: 3,
      canVibrate: true,
      visible: true,
    });
    expect(r).toEqual({ action: "none", delta: 0, nextBaselineReady: false });
  });

  it("baseline бэлэн бус, серверийн snapshot ирвэл: none, гэхдээ одоо бэлэн", () => {
    const r = shouldBuzz({
      fromCache: false,
      baselineReady: false,
      prev: 0,
      total: 3,
      canVibrate: true,
      visible: true,
    });
    expect(r).toEqual({ action: "none", delta: 0, nextBaselineReady: true });
  });

  it("baseline бэлэн, тоолуур өөрчлөгдөөгүй бол none", () => {
    const r = shouldBuzz({
      fromCache: false,
      baselineReady: true,
      prev: 3,
      total: 3,
      canVibrate: true,
      visible: true,
    });
    expect(r).toEqual({ action: "none", delta: 0, nextBaselineReady: true });
  });

  it("baseline бэлэн, тоолуур буурсан (дахин тохируулагдсан) бол none", () => {
    const r = shouldBuzz({
      fromCache: false,
      baselineReady: true,
      prev: 9,
      total: 2,
      canVibrate: true,
      visible: true,
    });
    expect(r).toEqual({ action: "none", delta: 0, nextBaselineReady: true });
  });

  it("baseline бэлэн, тоолуур өссөн, чичрэх боломжтой бол vibrate", () => {
    const r = shouldBuzz({
      fromCache: false,
      baselineReady: true,
      prev: 3,
      total: 5,
      canVibrate: true,
      visible: true,
    });
    expect(r).toEqual({ action: "vibrate", delta: 2, nextBaselineReady: true });
  });

  it("baseline бэлэн, чичрэх боломжгүй (iOS) ч апп харагдаж байвал notify", () => {
    const r = shouldBuzz({
      fromCache: false,
      baselineReady: true,
      prev: 3,
      total: 5,
      canVibrate: false,
      visible: true,
    });
    expect(r).toEqual({ action: "notify", delta: 2, nextBaselineReady: true });
  });

  it("baseline бэлэн, чичрэх боломжгүй, апп нуугдмал бол none (sw.js хариуцна)", () => {
    const r = shouldBuzz({
      fromCache: false,
      baselineReady: true,
      prev: 3,
      total: 5,
      canVibrate: false,
      visible: false,
    });
    expect(r).toEqual({ action: "none", delta: 2, nextBaselineReady: true });
  });

  it("бодит дараалал: кэш → сервер → шинэ товшилт", () => {
    /* 1. mount, кэшийн snapshot: baseline бэлэн бус хэвээр */
    let r = shouldBuzz({
      fromCache: true,
      baselineReady: false,
      prev: 0,
      total: 7,
      canVibrate: true,
      visible: true,
    });
    expect(r.action).toBe("none");
    expect(r.nextBaselineReady).toBe(false);

    /* 2. серверийн snapshot: baseline эцэст нь бэлэн болно, гэхдээ энэ
       snapshot дээр өөрөө чичрэхгүй */
    r = shouldBuzz({
      fromCache: false,
      baselineReady: r.nextBaselineReady,
      prev: 7,
      total: 7,
      canVibrate: true,
      visible: true,
    });
    expect(r.action).toBe("none");
    expect(r.nextBaselineReady).toBe(true);

    /* 3. baseline бэлэн болсны дараа шинэ товшилт ирвэл vibrate/notify */
    r = shouldBuzz({
      fromCache: false,
      baselineReady: r.nextBaselineReady,
      prev: 7,
      total: 8,
      canVibrate: true,
      visible: true,
    });
    expect(r).toEqual({ action: "vibrate", delta: 1, nextBaselineReady: true });
  });
});

describe("missMessage", () => {
  it("нэг удаа санасныг ганц тоолуургүй хэлнэ", () => {
    expect(missMessage("Neko", 1)).toBe("Neko чамайг саналаа 💗");
  });

  it("олон удаа санасныг тоогоор нь хэлнэ", () => {
    expect(missMessage("Neko", 7)).toBe("Neko чамайг 7 удаа саналаа 💗");
  });
});

describe("pokeMessage", () => {
  it("miss сувгийг таньж зөв текст сонгоно", () => {
    expect(pokeMessage("miss", "Neko", 2)).toContain("саналаа");
  });

  it("товшилтын сувагт товшлоо гэж хэлнэ", () => {
    expect(pokeMessage("chibi", "Neko", 2)).toContain("товшлоо");
  });

  it("kind байхгүй хуучин баримтыг товшилт гэж үзнэ", () => {
    expect(pokeMessage(undefined, "Neko", 1)).toContain("товшлоо");
  });
});

describe("missCount", () => {
  it("шууд тавихад нэг удаа", () => {
    expect(missCount(0)).toBe(1);
    expect(missCount(179)).toBe(1);
  });

  it("алхам тутам нэгээр нэмэгдэнэ", () => {
    expect(missCount(180)).toBe(2);
    expect(missCount(540)).toBe(4);
  });

  it("дээд хязгааргүй — удаан барих тусам тоо өснө", () => {
    expect(missCount(60_000)).toBe(334);
  });

  it("утгагүй хугацаанд нэг гэж үзнэ", () => {
    expect(missCount(NaN)).toBe(1);
    expect(missCount(-5)).toBe(1);
  });
});
