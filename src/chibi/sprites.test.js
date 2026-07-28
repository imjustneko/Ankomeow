import { describe, it, expect } from "vitest";
import { CELL, cellPosition, frameFor, SPRITE_URL } from "./sprites.js";

describe("cellPosition", () => {
  it("эхний нүд зүүн дээд буланд байрлана", () => {
    expect(cellPosition(0)).toBe("0% 0%");
  });

  it("хоёрдугаар мөрийн дунд нүд 50% 50% болно", () => {
    expect(cellPosition(4)).toBe("50% 50%");
  });

  it("сүүлийн нүд баруун доод буланд байрлана", () => {
    expect(cellPosition(8)).toBe("100% 100%");
  });
});

describe("frameFor", () => {
  it("алхах үед 320мс тутамд хоёр кадр сольж эргэлдэнэ", () => {
    expect(frameFor("walk", 0)).toBe(CELL.walkA);
    expect(frameFor("walk", 200)).toBe(CELL.walkA);
    expect(frameFor("walk", 400)).toBe(CELL.walkB);
    expect(frameFor("walk", 700)).toBe(CELL.walkA);
  });

  it("алхахаас бусад төлөв тогтмол нүд буцаана", () => {
    expect(frameFor("blush", 0)).toBe(CELL.blush);
    expect(frameFor("blush", 5000)).toBe(CELL.blush);
    expect(frameFor("sleep", 1234)).toBe(CELL.sleep);
    expect(frameFor("dragged", 99)).toBe(CELL.dragged);
    expect(frameFor("land", 0)).toBe(CELL.idle);
  });
});

describe("SPRITE_URL", () => {
  it("хоёр дүрийн зам public/chibi доторх файлыг заана", () => {
    expect(SPRITE_URL.andela).toBe("/chibi/andela.png");
    expect(SPRITE_URL.neko).toBe("/chibi/neko.png");
  });
});
