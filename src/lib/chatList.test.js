import { describe, it, expect } from "vitest";
import { listChange, restoreTop } from "./chatList.js";

const s = (count, lastId) => ({ count, lastId });

describe("listChange", () => {
  it("анхны ачаалалт", () => {
    expect(listChange(s(0, null), s(100, "z"))).toEqual({ kind: "first", added: 100 });
  });

  it("хоосон хэвээр бол юу ч биш", () => {
    expect(listChange(s(0, null), s(0, null))).toEqual({ kind: "none", added: 0 });
  });

  it("бүх зурвас устсан ч уначихгүй", () => {
    expect(listChange(s(5, "e"), s(0, null))).toEqual({ kind: "none", added: 0 });
  });

  it("өөрчлөлтгүй бол юу ч биш", () => {
    expect(listChange(s(10, "j"), s(10, "j"))).toEqual({ kind: "none", added: 0 });
  });

  it("шинэ зурвас ирэхэд сүүлчийнх солигдоно", () => {
    expect(listChange(s(10, "j"), s(11, "k"))).toEqual({ kind: "new", added: 1 });
  });

  it("хэд хэдэн шинэ зурвасыг тоолно", () => {
    expect(listChange(s(10, "j"), s(13, "m"))).toEqual({ kind: "new", added: 3 });
  });

  it("хуучин зурвас ачаалахад сүүлчийнх ХЭВЭЭР үлдэнэ", () => {
    /* Гол шалгалт: энэ нь "шинэ ирлээ" гэж ойлгогдвол доош хүчээр татна */
    expect(listChange(s(100, "j"), s(200, "j"))).toEqual({ kind: "older", added: 100 });
  });

  it("дундаас зурвас устахад байрлалыг хадгална", () => {
    expect(listChange(s(100, "j"), s(99, "j"))).toEqual({ kind: "older", added: -1 });
  });

  it("хуучин ба шинэ зэрэг ирвэл шинэ гэж үзнэ", () => {
    /* Хуучин 100 нэмэгдэж, зэрэг нэг шинэ ирсэн ч added доод тал нь 1 */
    expect(listChange(s(100, "j"), s(201, "k"))).toEqual({ kind: "new", added: 101 });
  });

  it("сүүлчийнх солигдоод тоо буурвал ч added нь 1-ээс багагүй", () => {
    /* Сүүлийн зурвасаа устгав */
    expect(listChange(s(10, "j"), s(9, "i"))).toEqual({ kind: "new", added: 1 });
  });
});

describe("restoreTop", () => {
  it("дээр нэмэгдсэн өндрийг нөхнө", () => {
    /* 500px нэмэгдсэн бол scrollTop-ыг 500-аар өсгөнө — харагдац байрандаа */
    expect(restoreTop({ height: 1000, top: 0 }, { height: 1500 })).toBe(500);
  });

  it("өмнөх байрлалыг хадгална", () => {
    expect(restoreTop({ height: 1000, top: 120 }, { height: 1500 })).toBe(620);
  });

  it("өндөр буурвал ч зөв тооцно", () => {
    expect(restoreTop({ height: 1500, top: 600 }, { height: 1400 })).toBe(500);
  });
});
