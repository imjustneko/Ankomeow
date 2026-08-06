import { describe, it, expect } from "vitest";
import { searchMessages, searchableText, snippet } from "./chatSearch.js";

const txt = (id, text) => ({ id, type: "text", text });

const chat = [
  txt("1", "Өглөөний мэнд"),
  txt("2", "Ус уусан уу"),
  { id: "3", type: "image", blobId: "b1" },
  txt("4", "Өнөөдөр ус их уулаа"),
  { id: "5", type: "voice", blobId: "b2", dur: 6 },
  { id: "6", type: "reaction", label: "Үнслээ", gifUrl: "x.gif" },
];

describe("searchableText", () => {
  it("текст зурвасаас үгийг гаргана", () => {
    expect(searchableText(txt("1", "сайн уу"))).toBe("сайн уу");
  });

  it("зураг, дуунд хайх үг байхгүй", () => {
    expect(searchableText({ type: "image", blobId: "b" })).toBe("");
    expect(searchableText({ type: "voice", blobId: "b" })).toBe("");
    expect(searchableText({ type: "drawing", strokes: [] })).toBe("");
  });

  it("реакцийн шошгыг хайлтад оруулахгүй", () => {
    /* Хэрэглэгчийн бичсэн үг биш тул үр дүнг бохирдуулна */
    expect(searchableText({ type: "reaction", label: "Үнслээ" })).toBe("");
  });

  it("байхгүй зурвасыг тэвчинэ", () => {
    expect(searchableText(undefined)).toBe("");
    expect(searchableText(null)).toBe("");
  });
});

describe("searchMessages", () => {
  it("хоосон хайлтад юу ч буцаахгүй", () => {
    expect(searchMessages(chat, "")).toEqual([]);
    expect(searchMessages(chat, "   ")).toEqual([]);
  });

  it("тохирсон зурвасыг олно", () => {
    expect(searchMessages(chat, "мэнд").map((m) => m.id)).toEqual(["1"]);
  });

  it("хэд хэдэн тохирлыг ШИНЭ нь эхэнд гэж эрэмбэлнэ", () => {
    expect(searchMessages(chat, "ус").map((m) => m.id)).toEqual(["4", "2"]);
  });

  it("том жижиг үсэг ялгахгүй", () => {
    expect(searchMessages(chat, "ӨГЛӨӨНИЙ").map((m) => m.id)).toEqual(["1"]);
    expect(searchMessages([txt("x", "Hello")], "hello").map((m) => m.id)).toEqual(["x"]);
  });

  it("хоёр талын зайг үл тоомсорлоно", () => {
    expect(searchMessages(chat, "  мэнд  ").map((m) => m.id)).toEqual(["1"]);
  });

  it("текстгүй зурвасыг олохгүй", () => {
    expect(searchMessages(chat, "b1")).toEqual([]);
    expect(searchMessages(chat, "Үнслээ")).toEqual([]);
  });

  it("олдохгүй бол хоосон", () => {
    expect(searchMessages(chat, "нисдэг тэрэг")).toEqual([]);
  });

  it("жагсаалт байхгүй ч уначихгүй", () => {
    expect(searchMessages(undefined, "ус")).toEqual([]);
    expect(searchMessages([], "ус")).toEqual([]);
  });
});

describe("snippet", () => {
  it("богино текстийг бүтнээр нь өгнө", () => {
    expect(snippet("Ус уусан уу", "ус")).toBe("Ус уусан уу");
  });

  it("урт текстээс тохирлын эргэн тойрныг таслана", () => {
    const long = "а".repeat(200) + "ЗҮРХ" + "б".repeat(200);
    const out = snippet(long, "ЗҮРХ");
    expect(out).toContain("ЗҮРХ");
    expect(out.length).toBeLessThan(long.length);
    expect(out.startsWith("…")).toBe(true);
    expect(out.endsWith("…")).toBe(true);
  });

  it("эхэнд байгаа тохиролд урд талын цэг тавихгүй", () => {
    const long = "ЗҮРХ" + "б".repeat(300);
    const out = snippet(long, "ЗҮРХ");
    expect(out.startsWith("…")).toBe(false);
    expect(out.endsWith("…")).toBe(true);
  });

  it("олдохгүй бол текстийг хэвээр өгнө", () => {
    expect(snippet("сайн уу", "хаа нэгтээ")).toBe("сайн уу");
  });

  it("хоосон утгыг тэвчинэ", () => {
    expect(snippet(undefined, "ус")).toBe("");
    expect(snippet(null, "ус")).toBe("");
  });
});
