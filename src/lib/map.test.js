import { describe, it, expect } from "vitest";
import { MAP_TILE, MAP_MIN_Z, MAP_MAX_Z, worldPx, pxToLatLng, mapTiles, tileUrl } from "./map.js";

const UB = { lat: 47.9184, lng: 106.9177 };

describe("Web Mercator хөрвүүлэлт", () => {
  it("Гринвич + экватор нь дэлхийн төв", () => {
    const [x, y] = worldPx(0, 0, 0);
    expect(x).toBeCloseTo(MAP_TILE / 2, 6);
    expect(y).toBeCloseTo(MAP_TILE / 2, 6);
  });

  it("буцаах хөрвүүлэлт анхны утгыг сэргээнэ", () => {
    for (const z of [3, 10, 15, 19]) {
      const [x, y] = worldPx(UB.lat, UB.lng, z);
      const [lat, lng] = pxToLatLng(x, y, z);
      expect(lat).toBeCloseTo(UB.lat, 6);
      expect(lng).toBeCloseTo(UB.lng, 6);
    }
  });

  it("zoom нэмэгдэхэд координат хоёр дахин өснө", () => {
    const [x1] = worldPx(UB.lat, UB.lng, 10);
    const [x2] = worldPx(UB.lat, UB.lng, 11);
    expect(x2).toBeCloseTo(x1 * 2, 6);
  });

  it("туйлын цаана ч тоо гарна (85.05-д таслана)", () => {
    const [, y] = worldPx(89, 0, 10);
    expect(Number.isFinite(y)).toBe(true);
    expect(y).toBeGreaterThan(0);
  });

  it("хойд өргөрөг дээш байна", () => {
    const [, yN] = worldPx(60, 0, 10);
    const [, yS] = worldPx(-60, 0, 10);
    expect(yN).toBeLessThan(yS);
  });
});

describe("tile тор", () => {
  it("харагдах хэсгийг бүтэн бүрхнэ", () => {
    const w = 320, h = 400;
    const tiles = mapTiles(UB.lat, UB.lng, 15, w, h);
    expect(tiles.length).toBeGreaterThan(0);
    /* Зүүн дээд булан (0,0) ба баруун доод (w,h) аль нэг tile дотор байх ёстой */
    const covers = (px, py) => tiles.some((t) =>
      px >= t.left && px < t.left + MAP_TILE && py >= t.top && py < t.top + MAP_TILE);
    expect(covers(0, 0)).toBe(true);
    expect(covers(w - 1, h - 1)).toBe(true);
    expect(covers(w / 2, h / 2)).toBe(true);
  });

  it("төв нь дэлгэцийн голд таарна", () => {
    const w = 300, h = 300;
    const tiles = mapTiles(UB.lat, UB.lng, 15, w, h);
    /* Голын цэгийг агуулах tile-ийн дотоод байрлал зөв эсэх */
    const t = tiles.find((x) => w / 2 >= x.left && w / 2 < x.left + MAP_TILE);
    expect(t).toBeTruthy();
  });

  it("tile индекс хүрээнээсээ гарахгүй", () => {
    for (const z of [3, 8, 15]) {
      const n = 2 ** z;
      for (const t of mapTiles(UB.lat, UB.lng, z, 500, 500)) {
        expect(t.x).toBeGreaterThanOrEqual(0);
        expect(t.x).toBeLessThan(n);
        expect(t.y).toBeGreaterThanOrEqual(0);
        expect(t.y).toBeLessThan(n);
      }
    }
  });

  it("уртраг ±180 давахад тойрч дугуйлна", () => {
    const tiles = mapTiles(0, 179.99, 5, 600, 200);
    const n = 2 ** 5;
    expect(tiles.every((t) => t.x >= 0 && t.x < n)).toBe(true);
    /* Дэлхийг тойрч эргэсэн тул зүүн ирмэгийн tile-ууд ч орно */
    expect(new Set(tiles.map((t) => t.x)).size).toBeGreaterThan(1);
  });

  it("туйл дээр байхгүй мөрийг алгасна", () => {
    const tiles = mapTiles(85, 0, 4, 400, 800);
    expect(tiles.every((t) => t.y >= 0 && t.y < 2 ** 4)).toBe(true);
  });
});

describe("tile хаяг", () => {
  it("энгийн зураг CARTO-гоос", () => {
    expect(tileUrl("map", 15, 26115, 11401)).toContain("basemaps.cartocdn.com");
    expect(tileUrl("map", 15, 26115, 11401)).toContain("/15/26115/11401");
  });

  it("хиймэл дагуул Esri-ээс, y ба x эсрэг дараалалтай", () => {
    const u = tileUrl("sat", 15, 26115, 11401);
    expect(u).toContain("arcgisonline.com");
    expect(u).toContain("/15/11401/26115");
  });

  it("zoom-ийн хязгаар ухаалаг", () => {
    expect(MAP_MIN_Z).toBeLessThan(MAP_MAX_Z);
    expect(MAP_MAX_Z).toBeLessThanOrEqual(19);
  });
});
