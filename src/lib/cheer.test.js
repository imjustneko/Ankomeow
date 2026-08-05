import { describe, it, expect } from "vitest";
import { goalsMet, pendingCheers, hasUnseen, isOnline, ONLINE_WINDOW_MS } from "./cheer.js";

const item = (done) => ({ id: String(Math.random()), text: "x", done });

describe("goalsMet", () => {
  it("зорилгодоо хүрсэн ба хэтэрсэн хоёуланг нь биелсэн гэж үзнэ", () => {
    expect(goalsMet({ ml: 2000, goal: 2000, items: [] }).water).toBe(true);
    expect(goalsMet({ ml: 2500, goal: 2000, items: [] }).water).toBe(true);
  });

  it("зорилгод хүрээгүй бол биелээгүй", () => {
    expect(goalsMet({ ml: 1999, goal: 2000, items: [] }).water).toBe(false);
  });

  it("зорилго тодорхойгүй бол биелээгүй — 0-д хүрснийг ялалт гэж үзэхгүй", () => {
    expect(goalsMet({ ml: 0, goal: 0, items: [] }).water).toBe(false);
  });

  it("жагсаалт бүрэн биелсэн бол биелсэн", () => {
    expect(goalsMet({ ml: 0, goal: 1, items: [item(true), item(true)] }).list).toBe(true);
  });

  it("нэг ч биелээгүй зүйл байвал биелээгүй", () => {
    expect(goalsMet({ ml: 0, goal: 1, items: [item(true), item(false)] }).list).toBe(false);
  });

  it("хоосон жагсаалтыг ялалт гэж үзэхгүй", () => {
    expect(goalsMet({ ml: 0, goal: 1, items: [] }).list).toBe(false);
  });
});

describe("pendingCheers", () => {
  it("шинээр биелсэнийг л буцаана", () => {
    expect(pendingCheers({ water: true, list: true }, ["water"])).toEqual(["list"]);
  });

  it("аль хэдийн баярласныг давтахгүй", () => {
    expect(pendingCheers({ water: true, list: true }, ["water", "list"])).toEqual([]);
  });

  it("биелээгүйг оруулахгүй", () => {
    expect(pendingCheers({ water: false, list: true }, [])).toEqual(["list"]);
  });

  it("Set хэлбэрээр ч ажиллана", () => {
    expect(pendingCheers({ water: true }, new Set(["water"]))).toEqual([]);
  });
});

describe("hasUnseen", () => {
  it("харснаас хойш шинэчлэгдсэн бол шинэ", () => {
    expect(hasUnseen(200, 100)).toBe(true);
  });

  it("харсны дараа өөрчлөгдөөгүй бол шинэ биш", () => {
    expect(hasUnseen(100, 100)).toBe(false);
    expect(hasUnseen(100, 200)).toBe(false);
  });

  it("хараахан харж амжаагүй бол шинэ", () => {
    expect(hasUnseen(100, 0)).toBe(true);
    expect(hasUnseen(100, undefined)).toBe(true);
  });

  it("хамтрагч юу ч хийгээгүй бол дохио асахгүй", () => {
    expect(hasUnseen(null, 0)).toBe(false);
    expect(hasUnseen(undefined, undefined)).toBe(false);
  });
});

describe("isOnline", () => {
  const now = 1_000_000_000;

  it("цонхон дотор бол онлайн", () => {
    expect(isOnline(now - 60_000, now)).toBe(true);
  });

  it("цонхноос хальсан бол офлайн", () => {
    expect(isOnline(now - ONLINE_WINDOW_MS - 1, now)).toBe(false);
  });

  it("цагийн зөрүүнээс ирээдүйн мөч ирвэл ч онлайн", () => {
    expect(isOnline(now + 30_000, now)).toBe(true);
  });

  it("хэзээ ч нээгээгүй бол офлайн", () => {
    expect(isOnline(null, now)).toBe(false);
    expect(isOnline(0, now)).toBe(false);
  });
});
