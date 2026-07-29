import { describe, it, expect } from "vitest";
import { hasUnread } from "./chatSignal.js";

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
});
