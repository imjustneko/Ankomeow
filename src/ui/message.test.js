import { describe, it, expect } from "vitest";
import { copyableText, savedSnapshot, messagePreview, durText, SAVED_FIELDS } from "./message.jsx";

describe("хуулж болох текст", () => {
  it("текст зурвасыг өөрийг нь", () => {
    expect(copyableText({ type: "text", text: "сайн уу" })).toBe("сайн уу");
  });

  it("байршлыг координатаар", () => {
    expect(copyableText({ type: "location", lat: 47.9, lng: 106.9 })).toBe("47.9, 106.9");
  });

  it("координат дутуу байвал хоосон", () => {
    expect(copyableText({ type: "location", lat: 47.9 })).toBe("");
  });

  it("GIF-гүй реакцын шошгыг", () => {
    expect(copyableText({ type: "reaction", label: "тэвэрлээ" })).toBe("тэвэрлээ");
  });

  it("GIF-тэй реакц, зураг, дуу, зурсан зурагт хуулах зүйлгүй", () => {
    expect(copyableText({ type: "reaction", label: "x", gifUrl: "a.gif" })).toBe("");
    expect(copyableText({ type: "image", blobId: "b1" })).toBe("");
    expect(copyableText({ type: "voice", blobId: "b1" })).toBe("");
    expect(copyableText({ type: "drawing", strokes: [] })).toBe("");
  });

  it("хоосон текстэд хоосон", () => {
    expect(copyableText({ type: "text" })).toBe("");
  });
});

describe("хадгалах хуулбар", () => {
  it("үндсэн талбаруудыг авна", () => {
    const s = savedSnapshot({ type: "text", text: "сайн", sender: "neko", senderName: "Neko", createdAt: 123 });
    expect(s.type).toBe("text");
    expect(s.text).toBe("сайн");
    expect(s.sender).toBe("neko");
    expect(s.sentAt).toBe(123);
  });

  it("байхгүй талбарыг ОГТ оруулахгүй — Firestore undefined-ыг хүлээж авдаггүй", () => {
    const s = savedSnapshot({ type: "text", text: "сайн" });
    for (const k of Object.keys(s)) expect(s[k]).not.toBe(undefined);
    expect("image" in s).toBe(false);
    expect("lat" in s).toBe(false);
  });

  it("байхгүй нэр, огноог null болгоно", () => {
    const s = savedSnapshot({ type: "text", text: "x" });
    expect(s.senderName).toBe(null);
    expect(s.sentAt).toBe(null);
  });

  it("хавсралтын заагч болон зурлагыг хуулна", () => {
    const s = savedSnapshot({ type: "drawing", strokes: [{ c: "#000", w: 20, p: [1, 2] }] });
    expect(s.strokes.length).toBe(1);
    const v = savedSnapshot({ type: "voice", blobId: "b9", dur: 12 });
    expect(v.blobId).toBe("b9");
    expect(v.dur).toBe(12);
  });

  it("хуулагдах талбарын жагсаалт хүлээгдэж буй хэлбэртэй", () => {
    expect(SAVED_FIELDS).toContain("blobId");
    expect(SAVED_FIELDS).toContain("strokes");
    expect(SAVED_FIELDS).not.toContain("reactions"); /* реакц хуулбарт хамаарахгүй */
  });
});

describe("мэдэгдлийн товч тайлбар", () => {
  it("төрөл бүрд өөр", () => {
    expect(messagePreview({ type: "text", text: "сайн уу" })).toBe("сайн уу");
    expect(messagePreview({ type: "image" })).toContain("Зураг");
    expect(messagePreview({ type: "voice" })).toContain("Дуут");
    expect(messagePreview({ type: "drawing" })).toContain("зурлаа");
    expect(messagePreview({ type: "location" })).toContain("Байршл");
    expect(messagePreview({ type: "reaction", label: "тэвэрлээ" })).toBe("тэвэрлээ");
  });

  it("урт текстийг таслана", () => {
    const long = "а".repeat(300);
    expect(messagePreview({ type: "text", text: long }).length).toBe(120);
  });

  it("танихгүй төрөлд ерөнхий үг", () => {
    expect(messagePreview({ type: "хачин" })).toBe("Шинэ зурвас");
  });
});

describe("хугацааны бичиглэл", () => {
  it("минут:секунд", () => {
    expect(durText(0)).toBe("0:00");
    expect(durText(5)).toBe("0:05");
    expect(durText(65)).toBe("1:05");
    expect(durText(600)).toBe("10:00");
  });

  it("байхгүй утгад 0:00", () => {
    expect(durText(undefined)).toBe("0:00");
    expect(durText(null)).toBe("0:00");
  });
});
