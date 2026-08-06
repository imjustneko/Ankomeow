import { describe, it, expect } from "vitest";
import { imageBox, IMG_MAX_H } from "./imageBox.js";

describe("imageBox", () => {
  it("өндөр зургийг дээд өндөрт багтаана", () => {
    /* 400×800 → өндөр нь 220 болж хумигдана, өргөн нь харьцаагаараа 110 */
    expect(imageBox(400, 800)).toEqual({ width: 110, aspectRatio: "400 / 800" });
  });

  it("өргөн зургийн харьцааг хадгална", () => {
    expect(imageBox(800, 400)).toEqual({ width: 440, aspectRatio: "800 / 400" });
  });

  it("дээд өндрөөс нам зургийг томруулахгүй", () => {
    const box = imageBox(100, 50);
    expect(box.width).toBe(100); /* 50 < 220 тул байгалийн хэмжээгээрээ */
  });

  it("дээд өндрийг тохируулж болно", () => {
    expect(imageBox(400, 800, 100).width).toBe(50);
  });

  it("хэмжээ мэдэгдэхгүй бол null", () => {
    expect(imageBox(undefined, undefined)).toBeNull();
    expect(imageBox(null, 100)).toBeNull();
    expect(imageBox(0, 100)).toBeNull();
    expect(imageBox(100, 0)).toBeNull();
    expect(imageBox(-5, 100)).toBeNull();
    expect(imageBox("хоосон", 100)).toBeNull();
  });

  it("текст болсон тоог хүлээж авна", () => {
    /* Firestore-ээс тоо string болж ирж болзошгүй */
    expect(imageBox("800", "400")).toEqual({ width: 440, aspectRatio: "800 / 400" });
  });

  it("анхдагч дээд өндөр утгатай", () => {
    expect(IMG_MAX_H).toBeGreaterThan(0);
  });
});
