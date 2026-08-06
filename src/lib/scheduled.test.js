import { describe, it, expect } from "vitest";
import { dueNow, parseWhen, pending } from "./scheduled.js";

const ts = (n) => ({ toMillis: () => n });
const NOW = 1_000_000;

describe("parseWhen", () => {
  it("ирээдүйн цагийг хүлээж авна", () => {
    const future = new Date(NOW + 60000).toISOString();
    expect(parseWhen(future, NOW)).toBe(NOW + 60000);
  });

  it("өнгөрсөн цагийг татгалзана", () => {
    expect(parseWhen(new Date(NOW - 1).toISOString(), NOW)).toBeNull();
  });

  it("яг одоог татгалзана", () => {
    /* "Одоо" гэдэг нь товлолт биш — шууд илгээх ёстой */
    expect(parseWhen(new Date(NOW).toISOString(), NOW)).toBeNull();
  });

  it("хоосон утгад null", () => {
    expect(parseWhen("", NOW)).toBeNull();
    expect(parseWhen(undefined, NOW)).toBeNull();
    expect(parseWhen(null, NOW)).toBeNull();
  });

  it("гэмтэлтэй огноонд null", () => {
    expect(parseWhen("хэдэн цаг", NOW)).toBeNull();
  });
});

describe("dueNow", () => {
  const list = [
    { id: "c", at: ts(NOW + 5000) },
    { id: "a", at: ts(NOW - 5000) },
    { id: "b", at: ts(NOW - 100) },
  ];

  it("цаг нь болсныг л авна", () => {
    expect(dueNow(list, NOW).map((s) => s.id)).toEqual(["a", "b"]);
  });

  it("эрт товлогдсоноос нь эхэлнэ", () => {
    /* Дараалал алдагдвал хоёр зурвас буруу эрэмбээр чатанд орно */
    expect(dueNow(list, NOW)[0].id).toBe("a");
  });

  it("яг тэр агшныг ч хүргэнэ", () => {
    expect(dueNow([{ id: "x", at: ts(NOW) }], NOW)).toHaveLength(1);
  });

  it("цаггүй бичлэгийг алгасна", () => {
    expect(dueNow([{ id: "x" }, { id: "y", at: null }], NOW)).toEqual([]);
  });

  it("хоосон жагсаалтыг тэвчинэ", () => {
    expect(dueNow([], NOW)).toEqual([]);
    expect(dueNow(undefined, NOW)).toEqual([]);
  });

  it("энгийн тоог ч хүлээж авна", () => {
    expect(dueNow([{ id: "x", at: NOW - 1 }], NOW)).toHaveLength(1);
  });
});

describe("pending", () => {
  it("ирээдүйнхийг ойрын нь эхэнд өгнө", () => {
    const list = [{ id: "far", at: ts(NOW + 9000) }, { id: "near", at: ts(NOW + 100) }, { id: "past", at: ts(NOW - 1) }];
    expect(pending(list, NOW).map((s) => s.id)).toEqual(["near", "far"]);
  });

  it("хүргэгдсэнийг оруулахгүй", () => {
    expect(pending([{ id: "x", at: ts(NOW - 1) }], NOW)).toEqual([]);
  });
});
