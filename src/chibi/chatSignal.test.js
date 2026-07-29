import { describe, it, expect } from "vitest";
import { hasUnread, bubbleTarget, walkDurationMs } from "./chatSignal.js";

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

  it("тоо болж хөрвөхгүй хугацааг уншаагүйд тооцохгүй", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: "хоосон" }, 1000, "neko")).toBe(false);
    expect(hasUnread({ sender: "andela", createdAtMs: NaN }, 1000, "neko")).toBe(false);
  });
});

describe("walkDurationMs", () => {
  it("зөвхөн хэвтээ зайг хурдаараа хуваана", () => {
    expect(walkDurationMs({
      fromX: 0, fromY: 0, toX: 140, toY: 0, speedX: 70, speedY: 200,
    })).toBe(2000);
  });

  it("зөвхөн босоо зайг хурдаараа хуваана", () => {
    expect(walkDurationMs({
      fromX: 50, fromY: 400, toX: 50, toY: 0, speedX: 70, speedY: 200,
    })).toBe(2000);
  });

  it("хоёр тэнхлэг зэрэг хөдлөхөд удаан тэнхлэгийг буцаана", () => {
    /* хэвтээ: 350/70 = 5с, босоо: 400/200 = 2с → 5000 */
    expect(walkDurationMs({
      fromX: 0, fromY: 400, toX: 350, toY: 0, speedX: 70, speedY: 200,
    })).toBe(5000);
  });

  it("хөдлөх зайгүй бол тэг", () => {
    expect(walkDurationMs({
      fromX: 120, fromY: 30, toX: 120, toY: 30, speedX: 70, speedY: 200,
    })).toBe(0);
  });

  it("хурд тэг байсан ч Infinity буюу NaN гарахгүй", () => {
    const t = walkDurationMs({
      fromX: 0, fromY: 0, toX: 300, toY: 200, speedX: 0, speedY: 0,
    });
    expect(Number.isFinite(t)).toBe(true);
    expect(t).toBe(0);
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

  it("хүрээн дотор бүтнээрээ харагдаж буй бөмбөлгийг харагдана гэнэ", () => {
    const bubble = { left: 20, top: 300, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).visible).toBe(true);
  });

  it("хүрээнээс дээш гарсан бөмбөлгийг харагдахгүй гэнэ", () => {
    /* доод ирмэг нь −40 → хүрээнээс бүрэн дээш */
    const bubble = { left: 20, top: -100, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).visible).toBe(false);
  });

  it("хүрээнээс доош гарсан бөмбөлгийг харагдахгүй гэнэ", () => {
    const bubble = { left: 20, top: 900, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).visible).toBe(false);
  });

  it("дээд ирмэг дээр хагасаараа давхацсан бөмбөлгийг харагдана гэнэ", () => {
    /* дээд ирмэг −30, доод ирмэг +30 */
    const bubble = { left: 20, top: -30, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).visible).toBe(true);
  });
});
