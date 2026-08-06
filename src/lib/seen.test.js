import { describe, it, expect } from "vitest";
import { seenUpToId } from "./seen.js";

const ts = (n) => ({ toMillis: () => n });
const msg = (id, sender, at) => ({ id, sender, createdAt: at == null ? null : ts(at) });

/* neko = би, andela = хамтрагч */
const chat = [
  msg("a", "neko", 100),
  msg("b", "andela", 200),
  msg("c", "neko", 300),
  msg("d", "neko", 400),
];

describe("seenUpToId", () => {
  it("уншсан цаг байхгүй бол null", () => {
    expect(seenUpToId(chat, null, "neko")).toBeNull();
    expect(seenUpToId(chat, undefined, "neko")).toBeNull();
  });

  it("хоосон чат дээр null", () => {
    expect(seenUpToId([], ts(500), "neko")).toBeNull();
    expect(seenUpToId(undefined, ts(500), "neko")).toBeNull();
  });

  it("бүгдийг уншсан бол сүүлийн зурвасыг заана", () => {
    expect(seenUpToId(chat, ts(500), "neko")).toBe("d");
  });

  it("дунд хүртэл уншсан бол тэр байрлалыг заана", () => {
    /* 350-д уншсан → c уншсан, d уншаагүй */
    expect(seenUpToId(chat, ts(350), "neko")).toBe("c");
  });

  it("яг тэр мөчид уншсаныг ч тооцно", () => {
    expect(seenUpToId(chat, ts(300), "neko")).toBe("c");
  });

  it("миний нэг ч зурвас уншаагүй бол null", () => {
    expect(seenUpToId(chat, ts(50), "neko")).toBeNull();
  });

  it("хамтрагчийн өөрийнх нь зурвасыг тоолохгүй", () => {
    /* 250-д уншсан: b (andela-гийнх) нь тоологдохгүй, a л миний уншигдсан */
    expect(seenUpToId(chat, ts(250), "neko")).toBe("a");
  });

  it("цаггүй (илгээгдэж яваа) зурвасыг уншсан гэж үзэхгүй", () => {
    const pending = [...chat, msg("e", "neko", null)];
    expect(seenUpToId(pending, ts(9999), "neko")).toBe("d");
  });

  it("энгийн тоог ч хүлээж авна", () => {
    expect(seenUpToId(chat, 350, "neko")).toBe("c");
  });
});
