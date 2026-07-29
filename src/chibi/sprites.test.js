import { describe, it, expect } from "vitest";
import { CELL, cellPosition, frameFor, SPRITE_URL, CHAT_SHEET, CHAT_CELL, CHAT_STEPS, gridPosition } from "./sprites.js";

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
  it("алхах үед 170мс тутамд хоёр кадр сольж эргэлдэнэ", () => {
    expect(frameFor("walk", 0)).toBe(CELL.walkA);
    expect(frameFor("walk", 169)).toBe(CELL.walkA);
    expect(frameFor("walk", 170)).toBe(CELL.walkB);
    expect(frameFor("walk", 340)).toBe(CELL.walkA);
    expect(frameFor("walk", 520)).toBe(CELL.walkB);
  });

  it("өгсөх/буух үед мөн адил алхааны кадрыг ашиглана", () => {
    expect(frameFor("climb", 0)).toBe(CELL.walkA);
    expect(frameFor("climb", 200)).toBe(CELL.walkB);
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

describe("чат реакцийн хуудас", () => {
  it("хоёр дүрд хоёулаа хуудастай", () => {
    expect(CHAT_SHEET.andela).toBeTruthy();
    expect(CHAT_SHEET.neko).toBeTruthy();
  });

  it("гурван нүдтэй нэг мөр", () => {
    for (const key of ["andela", "neko"]) {
      expect(CHAT_SHEET[key].cols).toBe(3);
      expect(CHAT_SHEET[key].rows).toBe(1);
    }
  });

  it("нүдний хэмжээ болон renderH заагдсан", () => {
    for (const key of ["andela", "neko"]) {
      expect(CHAT_SHEET[key].cellW).toBeGreaterThan(0);
      expect(CHAT_SHEET[key].cellH).toBeGreaterThan(0);
      expect(CHAT_SHEET[key].renderH).toBeGreaterThan(0);
    }
  });

  it("нүд бүр gridPosition-оор зөв хувь буцаана", () => {
    const { cols, rows } = CHAT_SHEET.neko;
    expect(gridPosition(CHAT_CELL.look, 0, cols, rows)).toBe("0% 0%");
    expect(gridPosition(CHAT_CELL.turn, 0, cols, rows)).toBe("50% 0%");
    expect(gridPosition(CHAT_CELL.smile, 0, cols, rows)).toBe("100% 0%");
  });

  it("дараалал гурван алхамтай бөгөөд эерэг хугацаатай", () => {
    expect(CHAT_STEPS).toHaveLength(3);
    for (const step of CHAT_STEPS) {
      expect(step.ms).toBeGreaterThan(0);
    }
  });

  it("дарааллын алхмууд look → turn → smile дараалалтай", () => {
    expect(CHAT_STEPS.map((s) => s.cell)).toEqual([CHAT_CELL.look, CHAT_CELL.turn, CHAT_CELL.smile]);
  });
});
