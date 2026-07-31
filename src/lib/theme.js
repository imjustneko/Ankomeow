/* Аппын өнгөний тогтолцоо — өдөр/шөнийн палитр ба хэрэглэх функц.
   Утга бүр CSS хувьсагч руу заадаг тул горим солиход бүх дэлгэц шууд өөрчлөгдөнө. */

/* ── Өнгө ──
   Утга бүр CSS хувьсагч руу заана. Аппын 400 гаруй байрлалд `C.ink` гэх мэтээр
   inline style-д тавигддаг тул хувьсагчийн утгыг сольмогц бүх дэлгэц шууд
   өөрчлөгдөнө — нэг ч дуудлагыг гар аргаар засах шаардлагагүй. */
export const COLOR_KEYS = [
  "paper", "paper2", "card", "cardIn", "ink", "inkSoft", "line", "line2",
  "peach", "peachDeep", "sage", "sageDeep", "water", "waterDeep", "gold", "lilac", "lilacDeep",
];
export const C = Object.fromEntries(COLOR_KEYS.map((k) => [k, `var(--c-${k})`]));

export const THEMES = {
  light: {
    paper: "#FDF8EF", paper2: "#F4EADA", card: "#FFFDF8", cardIn: "#F2E9DA",
    ink: "#5C4A3A", inkSoft: "#A08C77",
    line: "rgba(92,74,58,0.15)", line2: "rgba(92,74,58,0.32)",
    peach: "#F5AF8E", peachDeep: "#E8825C", sage: "#AFCDA6", sageDeep: "#7CAF71",
    water: "#8AD0EC", waterDeep: "#3FA3D1", gold: "#E3BC61",
    lilac: "#C6B0DD", lilacDeep: "#9E82C4",
    /* Картын өнгөт сүүдэр бүрэн хүчээрээ */
    tintMix: "100%", shadow: "0 2px 0 rgba(92,74,58,.05), 0 1px 0 rgba(255,255,255,.8) inset",
    /* Дэвсгэр зургийн дээгүүр тавих хөшиг */
    veilA: "rgba(253,248,239,.82)", veilB: "rgba(244,234,218,.88)",
    splashA: "rgba(253,248,239,.9)", splashB: "rgba(244,234,218,.94)",
    frameBlend: "multiply, normal, normal",
  },
  dark: {
    paper: "#211C25", paper2: "#191419", card: "#2B242F", cardIn: "#372E3C",
    ink: "#F0E7DC", inkSoft: "#A99BB2",
    line: "rgba(240,231,220,0.14)", line2: "rgba(240,231,220,0.30)",
    /* Гүн өнгүүдийг харанхуй дээр уншигдахуйц болгож бага зэрэг тодруулав */
    peach: "#F0A98A", peachDeep: "#F0946E", sage: "#A8CC9E", sageDeep: "#8FC583",
    water: "#8FD3EE", waterDeep: "#5FBBE0", gold: "#EBC873",
    lilac: "#CBB6E0", lilacDeep: "#B79BDB",
    /* Цайвар сүүдрийг харанхуй карт дээр бүдэг болгоно, эс бөгөөс цоолно */
    tintMix: "16%", shadow: "0 2px 10px rgba(0,0,0,.28)",
    /* Цайвар дэвсгэр зургийг харанхуй хөшигөөр дарна — эс бөгөөс шөнө нүд гялбана */
    veilA: "rgba(33,28,37,.88)", veilB: "rgba(25,20,25,.93)",
    splashA: "rgba(33,28,37,.94)", splashB: "rgba(25,20,25,.96)",
    frameBlend: "overlay, normal, normal",
  },
};

export function applyTheme(mode) {
  const t = THEMES[mode] || THEMES.light;
  const root = document.documentElement;
  for (const k of COLOR_KEYS) root.style.setProperty(`--c-${k}`, t[k]);
  root.style.setProperty("--tint-mix", t.tintMix);
  root.style.setProperty("--card-shadow", t.shadow);
  root.style.setProperty("--veil-a", t.veilA);
  root.style.setProperty("--veil-b", t.veilB);
  root.style.setProperty("--splash-a", t.splashA);
  root.style.setProperty("--splash-b", t.splashB);
  root.style.setProperty("--frame-blend", t.frameBlend);
  root.style.colorScheme = mode === "dark" ? "dark" : "light";
  document.body.style.background = t.paper2;
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", t.paper2);
}

