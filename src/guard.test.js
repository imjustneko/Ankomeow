import { describe, expect, it } from "vitest";
import { isAllowedHost } from "./guard.js";

const HOSTS = ["imjustneko.github.io"];

describe("isAllowedHost", () => {
  it("зөвшөөрөгдсөн хаягийг нэвтрүүлнэ", () => {
    expect(isAllowedHost("imjustneko.github.io", HOSTS)).toBe(true);
    expect(isAllowedHost("IMJUSTNEKO.GITHUB.IO", HOSTS)).toBe(true);
  });

  it("хуулбар байрлуулсан өөр хаягийг хаана", () => {
    expect(isAllowedHost("ankomeow-copy.vercel.app", HOSTS)).toBe(false);
    expect(isAllowedHost("evil.github.io", HOSTS)).toBe(false);
    expect(isAllowedHost("", HOSTS)).toBe(false);
  });

  it("дэд домейноор хууран мэхлэхийг зөвшөөрөхгүй", () => {
    expect(isAllowedHost("imjustneko.github.io.evil.com", HOSTS)).toBe(false);
    expect(isAllowedHost("xximjustneko.github.io", HOSTS)).toBe(false);
  });

  it("локал хөгжүүлэлт болон LAN тестийг зөвшөөрнө", () => {
    expect(isAllowedHost("localhost", HOSTS)).toBe(true);
    expect(isAllowedHost("127.0.0.1", HOSTS)).toBe(true);
    expect(isAllowedHost("192.168.1.42", HOSTS)).toBe(true);
    expect(isAllowedHost("10.0.0.7", HOSTS)).toBe(true);
    expect(isAllowedHost("172.20.5.1", HOSTS)).toBe(true);
  });

  it("нийтийн IP-г LAN гэж андуурахгүй", () => {
    expect(isAllowedHost("172.15.0.1", HOSTS)).toBe(false);
    expect(isAllowedHost("172.32.0.1", HOSTS)).toBe(false);
    expect(isAllowedHost("11.0.0.1", HOSTS)).toBe(false);
  });
});
