import { describe, it, expect } from "vitest";
import { mediaItems } from "./media.js";

const chat = [
  { id: "1", type: "text", text: "сайн уу" },
  { id: "2", type: "image", blobId: "b1", w: 800, h: 600 },
  { id: "3", type: "voice", blobId: "b2", dur: 5 },
  { id: "4", type: "reaction", label: "Үнслээ", gifUrl: "kiss.gif" },
  { id: "5", type: "drawing", strokes: [[1, 2]] },
  { id: "6", type: "location", lat: 47, lng: 106 },
  { id: "7", type: "miss", count: 3 },
];

describe("mediaItems", () => {
  it("зөвхөн харагдах зүйлсийг авна", () => {
    expect(mediaItems(chat).map((x) => x.id)).toEqual(["5", "4", "2"]);
  });

  it("шинэ нь эхэнд", () => {
    const out = mediaItems(chat);
    expect(out[0].id).toBe("5");
    expect(out[out.length - 1].id).toBe("2");
  });

  it("төрлийг зөв тэмдэглэнэ", () => {
    const byId = Object.fromEntries(mediaItems(chat).map((x) => [x.id, x.kind]));
    expect(byId).toEqual({ "2": "image", "4": "gif", "5": "drawing" });
  });

  it("зургийн хэмжээг дамжуулна", () => {
    expect(mediaItems(chat).find((x) => x.id === "2")).toMatchObject({ w: 800, h: 600 });
  });

  it("GIF-гүй реакцийг оруулахгүй", () => {
    expect(mediaItems([{ id: "x", type: "reaction", label: "Тэмтэрлээ" }])).toEqual([]);
  });

  it("хоосон зурсан зургийг оруулахгүй", () => {
    expect(mediaItems([{ id: "x", type: "drawing", strokes: [] }])).toEqual([]);
    expect(mediaItems([{ id: "x", type: "drawing" }])).toEqual([]);
  });

  it("blobId-гүй зургийг оруулахгүй", () => {
    expect(mediaItems([{ id: "x", type: "image" }])).toEqual([]);
  });

  it("хуучин inline зурагтай нийцнэ", () => {
    /* m.image нь blobs гарахаас өмнөх зурвасуудад байсан */
    const out = mediaItems([{ id: "x", type: "image", image: "data:..." }]);
    expect(out).toHaveLength(1);
    expect(out[0].image).toBe("data:...");
  });

  it("хоосон жагсаалтыг тэвчинэ", () => {
    expect(mediaItems([])).toEqual([]);
    expect(mediaItems(undefined)).toEqual([]);
  });
});
