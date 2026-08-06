import { describe, it, expect } from "vitest";
import { reactionChips } from "./reactionChips.js";

describe("reactionChips", () => {
  it("реакц байхгүй бол хоосон", () => {
    expect(reactionChips(undefined, "neko")).toEqual([]);
    expect(reactionChips({}, "neko")).toEqual([]);
  });

  it("нэг реакцийг чип болгоно", () => {
    expect(reactionChips({ neko: "❤️" }, "neko")).toEqual([
      { emoji: "❤️", count: 1, mine: true },
    ]);
  });

  it("өөрийнх биш бол mine худал", () => {
    expect(reactionChips({ andela: "❤️" }, "neko")).toEqual([
      { emoji: "❤️", count: 1, mine: false },
    ]);
  });

  it("ижил эможиг нэгтгэж тоолно", () => {
    expect(reactionChips({ neko: "❤️", andela: "❤️" }, "neko")).toEqual([
      { emoji: "❤️", count: 2, mine: true },
    ]);
  });

  it("өөр эможиг тусад нь харуулна", () => {
    const out = reactionChips({ neko: "😂", andela: "❤️" }, "neko");
    expect(out).toHaveLength(2);
    expect(out.map((c) => c.emoji).sort()).toEqual(["❤️", "😂"].sort());
  });

  it("олон тавигдсан нь эхэнд", () => {
    const out = reactionChips({ a: "❤️", b: "❤️", c: "😂" }, "a");
    expect(out[0]).toEqual({ emoji: "❤️", count: 2, mine: true });
    expect(out[1].emoji).toBe("😂");
  });

  it("дараалал тогтвортой — дахин зурагдахад үсрэхгүй", () => {
    const r = { a: "😂", b: "❤️" };
    expect(reactionChips(r, "a")).toEqual(reactionChips(r, "a"));
  });

  it("хоосон утгыг алгасна", () => {
    /* Реакц авахад талбар нь устдаг ч хуучин баримтад хоосон мөр үлдсэн байж болно */
    expect(reactionChips({ neko: "", andela: "❤️" }, "neko")).toEqual([
      { emoji: "❤️", count: 1, mine: false },
    ]);
  });
});
