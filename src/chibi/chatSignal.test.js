import { describe, it, expect } from "vitest";
import { hasUnread, bubbleTarget } from "./chatSignal.js";

describe("hasUnread", () => {
  it("зурвас огт байхгүй бол худал", () => {
    expect(hasUnread(null, 1000, "neko")).toBe(false);
    expect(hasUnread(undefined, 1000, "neko")).toBe(false);
  });

  it("сүүлийн зурвас өөрийнх бол худал", () => {
    expect(hasUnread({ sender: "neko", createdAtMs: 5000 }, 1000, "neko")).toBe(false);
  });

  it("хамтрагчийнх бөгөөд уншсанаас хойш бол үнэн", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 5000 }, 1000, "neko")).toBe(true);
  });

  it("хамтрагчийнх боловч уншсанаас өмнө бол худал", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 500 }, 1000, "neko")).toBe(false);
  });

  it("яг уншсан агшны зурвасыг уншсанд тооцно", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 1000 }, 1000, "neko")).toBe(false);
  });

  it("хэзээ ч уншаагүй бол хамтрагчийн зурвас уншаагүй", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 5000 }, null, "neko")).toBe(true);
  });

  it("хугацаа нь тодорхойгүй зурвасыг уншаагүйд тооцохгүй", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: null }, 1000, "neko")).toBe(false);
  });

  it("тоо биш хугацаатай зурвасыг уншаагүйд тооцохгүй", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: undefined }, 1000, "neko")).toBe(false);
  });
});

describe("bubbleTarget", () => {
  /* 400px өргөнтэй frame, 72px өргөнтэй chibi */
  const frame = { left: 0, top: 0, width: 400, height: 800 };
  const base = { frame, spriteWidth: 72 };

  it("бөмбөлгийн голын доор, багахан баруун тийш шилжиж зогсоно", () => {
    /* бөмбөлгийн гол = 120; 120 − 36 + 12 = 96 */
    const bubble = { left: 20, top: 300, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).x).toBe(96);
  });

  it("бөмбөлгөөс баруун тийш шилжсэн тул зурсан хэвээр заана", () => {
    const bubble = { left: 20, top: 300, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).facing).toBe(-1);
  });

  it("баруун ирмэгт дарагдвал frame дотор багтаж, толигдоно", () => {
    /* гол = 370, хүссэн x = 346 > maxX(328) тул 328 дээр таслагдана.
       Chibi бөмбөлгийн голоос ЗҮҮН талд үлдсэн тул дээш-баруун тийш заана. */
    const bubble = { left: 340, top: 300, width: 60, height: 60 };
    const t = bubbleTarget({ ...base, bubble });
    expect(t.x).toBe(400 - 72);
    expect(t.facing).toBe(1);
  });

  it("зүүн ирмэгт дарагдвал 0 дээр зогсож, зурсан хэвээр заана", () => {
    /* гол = 15, хүссэн x = −9 < 0 тул 0 дээр таслагдана.
       Chibi бөмбөлгийн голоос БАРУУН талд байгаа тул зурсан хэвээр (дээш-зүүн). */
    const bubble = { left: 0, top: 300, width: 30, height: 60 };
    const t = bubbleTarget({ ...base, bubble });
    expect(t.x).toBe(0);
    expect(t.facing).toBe(-1);
  });

  it("frame шилжсэн байрлалтай байсан ч харьцангуй утга буцаана", () => {
    const shifted = { left: 100, top: 50, width: 400, height: 800 };
    const bubble = { left: 120, top: 350, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, frame: shifted, bubble }).x).toBe(96);
  });

  it("offset-ыг гаднаас өгч болно", () => {
    const bubble = { left: 20, top: 300, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble, offset: 0 }).x).toBe(84);
  });
});
