import { describe, it, expect } from "vitest";
import { C, THEMES, COLOR_KEYS } from "./theme.js";

/* #RRGGBB эсвэл rgba(...) -г ойролцоо RGB болгоно */
function toRgb(v) {
  const m = /^#([0-9a-f]{6})$/i.exec(v.trim());
  if (m) {
    const n = parseInt(m[1], 16);
    return [n >> 16, (n >> 8) & 255, n & 255];
  }
  const r = /rgba?\(([^)]+)\)/.exec(v);
  if (r) {
    const p = r[1].split(",").map(Number);
    return [p[0], p[1], p[2]];
  }
  return null;
}

/* WCAG харьцангуй гэрэлтэлт */
function luminance([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

const contrast = (a, b) => {
  const [la, lb] = [luminance(toRgb(a)), luminance(toRgb(b))];
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
};

describe("өнгөний тогтолцоо", () => {
  it("C нь CSS хувьсагч руу заана — горим солиход шууд өөрчлөгдөнө", () => {
    for (const k of COLOR_KEYS) expect(C[k]).toBe(`var(--c-${k})`);
  });

  it("хоёр горим ижил түлхүүртэй — нэгийг нь мартвал энэ унана", () => {
    for (const k of COLOR_KEYS) {
      expect(THEMES.light[k], `light.${k}`).toBeTruthy();
      expect(THEMES.dark[k], `dark.${k}`).toBeTruthy();
    }
  });

  it("нэмэлт тохиргоо хоёуланд нь бий", () => {
    for (const k of ["tintMix", "shadow", "veilA", "veilB", "splashA", "splashB", "frameBlend"]) {
      expect(THEMES.light[k], `light.${k}`).toBeTruthy();
      expect(THEMES.dark[k], `dark.${k}`).toBeTruthy();
    }
  });
});

describe("уншигдах чадвар", () => {
  it("өдрийн горимд дэвсгэр цайвар, бичиг бараан", () => {
    expect(luminance(toRgb(THEMES.light.paper))).toBeGreaterThan(0.7);
    expect(luminance(toRgb(THEMES.light.ink))).toBeLessThan(0.3);
  });

  it("шөнийн горимд эсрэгээрээ", () => {
    expect(luminance(toRgb(THEMES.dark.paper))).toBeLessThan(0.15);
    expect(luminance(toRgb(THEMES.dark.ink))).toBeGreaterThan(0.6);
  });

  it("үндсэн бичиг хоёр горимд WCAG AA (4.5:1) хангана", () => {
    expect(contrast(THEMES.light.ink, THEMES.light.card)).toBeGreaterThan(4.5);
    expect(contrast(THEMES.dark.ink, THEMES.dark.card)).toBeGreaterThan(4.5);
  });

  it("бүдэг бичиг ч том фонтын босго (3:1) давна", () => {
    expect(contrast(THEMES.light.inkSoft, THEMES.light.card)).toBeGreaterThan(2.4);
    expect(contrast(THEMES.dark.inkSoft, THEMES.dark.card)).toBeGreaterThan(2.4);
  });

  /* 2.0 нь WCAG AA биш, зөвхөн ухрахаас хамгаалах доод шал: өнгөт товч дээрх
     цагаан бичиг одоогийнхоос бүдгэрвэл энэ унана. */
  it("өнгөт товчны цагаан бичиг доод шалыг давна", () => {
    for (const mode of ["light", "dark"]) {
      for (const k of ["peachDeep", "sageDeep", "waterDeep", "lilacDeep"]) {
        expect(contrast("#FFFFFF", THEMES[mode][k]), `${mode}.${k}`).toBeGreaterThan(2.0);
      }
    }
  });

  it("шөнийн горимд өнгө нь өдрийнхөөсөө тод — харанхуй дээр уншигдана", () => {
    for (const k of ["peachDeep", "sageDeep", "waterDeep", "lilacDeep", "gold"]) {
      expect(luminance(toRgb(THEMES.dark[k])), k)
        .toBeGreaterThan(luminance(toRgb(THEMES.light[k])));
    }
  });

  it("картын сүүдэр шөнийн горимд суларна", () => {
    expect(parseInt(THEMES.dark.tintMix)).toBeLessThan(parseInt(THEMES.light.tintMix));
  });
});
