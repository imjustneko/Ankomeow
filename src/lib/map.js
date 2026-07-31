/* Газрын зургийн Web Mercator тооцоо ба tile эх үүсвэрүүд.
   Гадны сан ашиглахгүй — эдгээр нь бүгд цэвэр функц тул тесттэй. */

/* ── Байршлын жижиг газрын зураг ──
   Түлхүүр (API key) шаардахгүйн тулд OpenStreetMap-ийн растер tile-уудыг шууд
   зэрэгцүүлж тавина. Ямар ч сан (Leaflet г.м.) татахгүй, зөвхөн хэдэн <img>.
   Товшиход Google Maps дээр нээгдэнэ. */
export const MAP_TILE = 256;
export const MAP_ZOOM = 15;
export const MAP_W = 212;
export const MAP_H = 142;

export const MAP_MIN_Z = 3;
export const MAP_MAX_Z = 19;

/* Tile эх үүсвэр. OSM-ийн үндсэн загвар хуучинсаг харагддаг тул CARTO Voyager-ыг
   ашиглана — ижил OSM өгөгдөл (өдөр бүр шинэчлэгддэг) боловч орчин үеийн загвартай,
   @2x retina хувилбартай тул утсан дээр хурц. Хоёулаа түлхүүргүй, үнэгүй. */
export const MAP_RETINA = typeof window !== "undefined" && window.devicePixelRatio > 1.3 ? "@2x" : "";
export const tileUrl = (layer, z, x, y) => (layer === "sat"
  ? `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`
  : `https://basemaps.cartocdn.com/rastertiles/voyager/${z}/${x}/${y}${MAP_RETINA}.png`);
export const MAP_CREDIT = { map: "© OpenStreetMap · CARTO", sat: "© Esri" };

/* WGS84 → Web Mercator дэлхийн пиксел координат (тухайн zoom дээр) */
export function worldPx(lat, lng, z) {
  const tot = 2 ** z * MAP_TILE;
  const latR = (Math.max(-85.05, Math.min(85.05, lat)) * Math.PI) / 180;
  return [
    ((lng + 180) / 360) * tot,
    ((1 - Math.log(Math.tan(latR) + 1 / Math.cos(latR)) / Math.PI) / 2) * tot,
  ];
}

/* Буцаах хөрвүүлэлт — газрын зургийг чирэхэд шинэ төвийг олоход хэрэгтэй */
export function pxToLatLng(x, y, z) {
  const tot = 2 ** z * MAP_TILE;
  return [
    (Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / tot))) * 180) / Math.PI,
    (x / tot) * 360 - 180,
  ];
}

/* distanceM, prettyDistance, metersPerPx нь src/lib/geo.js-д (тесттэй) */

/* Firestore Timestamp эсвэл энгийн миллисекундыг хоёуланг нь хүлээж авна */
export const agoText = (ts) => {
  const ms = ts?.toMillis ? ts.toMillis() : ts;
  if (!ms) return "";
  const s = Math.max(0, Math.round((Date.now() - ms) / 1000));
  if (s < 45) return "яг одоо";
  if (s < 3600) return `${Math.round(s / 60)} мин өмнө`;
  if (s < 86400) return `${Math.round(s / 3600)} цагийн өмнө`;
  return `${Math.round(s / 86400)} өдрийн өмнө`;
};

export function mapTiles(lat, lng, z, w, h) {
  const n = 2 ** z;
  const [cx, cy] = worldPx(lat, lng, z);
  const left = cx - w / 2, top = cy - h / 2;
  const out = [];
  for (let x = Math.floor(left / MAP_TILE); x <= Math.floor((left + w) / MAP_TILE); x++) {
    for (let y = Math.floor(top / MAP_TILE); y <= Math.floor((top + h) / MAP_TILE); y++) {
      if (y < 0 || y >= n) continue; /* туйлын цаана tile байхгүй */
      out.push({
        key: `${x}/${y}`,
        x: ((x % n) + n) % n, /* уртрагаар тойрч дугуйлна */
        y,
        left: x * MAP_TILE - left,
        top: y * MAP_TILE - top,
      });
    }
  }
  return out;
}
