import { describe, it, expect } from "vitest";
import { distanceM, prettyDistance, placeAt, geofenceEvent, DEFAULT_RADIUS } from "./geo.js";

const UB = { lat: 47.9184, lng: 106.9177 };

describe("зай", () => {
  it("ижил цэгийн зай тэг", () => {
    expect(distanceM(UB, UB)).toBeCloseTo(0, 5);
  });

  it("өргөргийн 1 градус ≈ 111 км", () => {
    const d = distanceM({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeGreaterThan(110000);
    expect(d).toBeLessThan(112000);
  });

  it("Улаанбаатар–Дархан ≈ 210 км", () => {
    const d = distanceM(UB, { lat: 49.4867, lng: 105.9228 });
    expect(d / 1000).toBeGreaterThan(180);
    expect(d / 1000).toBeLessThan(230);
  });

  it("дутуу өгөгдөлд null", () => {
    expect(distanceM(null, UB)).toBe(null);
    expect(distanceM(UB, { lng: 1 })).toBe(null);
  });

  it("хүнлэг бичиглэл", () => {
    expect(prettyDistance(240)).toBe("240 м");
    expect(prettyDistance(2400)).toBe("2.4 км");
    expect(prettyDistance(24000)).toBe("24 км");
    expect(prettyDistance(null)).toBe("—");
  });
});

describe("газар таних", () => {
  const home = { id: "h", name: "Гэр", lat: 47.9184, lng: 106.9177, radius: 150 };
  const work = { id: "w", name: "Ажил", lat: 47.9200, lng: 106.9300, radius: 150 };
  const city = { id: "c", name: "Хот", lat: 47.9190, lng: 106.9240, radius: 5000 };

  it("радиус дотор байвал олно", () => {
    expect(placeAt([home, work], { lat: 47.9185, lng: 106.9178 })?.id).toBe("h");
  });

  it("радиусын гадна байвал null", () => {
    expect(placeAt([home], { lat: 47.9300, lng: 106.9177 })).toBe(null);
  });

  it("давхцвал хамгийн ойрыг сонгоно", () => {
    /* Гэрийн яг дээр байхад "Хот" ч багтана — гэхдээ Гэр ойр */
    expect(placeAt([city, home], { lat: 47.9184, lng: 106.9177 })?.id).toBe("h");
  });

  it("хоосон жагсаалт, буруу өгөгдөлд унахгүй", () => {
    expect(placeAt([], UB)).toBe(null);
    expect(placeAt(null, UB)).toBe(null);
    expect(placeAt([{ id: "x" }], UB)).toBe(null);
    expect(placeAt([home], null)).toBe(null);
  });

  it("радиус заагаагүй бол өгөгдмөлийг хэрэглэнэ", () => {
    const p = { id: "p", name: "Цэг", lat: 47.9184, lng: 106.9177 };
    expect(DEFAULT_RADIUS).toBe(150);
    expect(placeAt([p], { lat: 47.9193, lng: 106.9177 })?.id).toBe("p"); /* ~100м */
    expect(placeAt([p], { lat: 47.9214, lng: 106.9177 })).toBe(null);    /* ~330м */
  });
});

describe("geofence үйл явдал", () => {
  const home = { id: "h", name: "Гэр" };

  it("гаднаас дотогш орвол enter", () => {
    expect(geofenceEvent(null, home)).toEqual({ kind: "enter", id: "h", name: "Гэр" });
  });

  it("дотроос гадагш гарвал leave", () => {
    expect(geofenceEvent("h", null)).toEqual({ kind: "leave", id: "h" });
  });

  it("ижил газарт үлдвэл давтаж мэдэгдэхгүй", () => {
    expect(geofenceEvent("h", home)).toBe(null);
    expect(geofenceEvent(null, null)).toBe(null);
  });

  it("нэг газраас нөгөө рүү шилжвэл enter", () => {
    expect(geofenceEvent("h", { id: "w", name: "Ажил" })).toEqual({ kind: "enter", id: "w", name: "Ажил" });
  });
});
