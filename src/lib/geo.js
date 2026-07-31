/* Газарзүйн цэвэр тооцоолол — газрын зураг, geofence хоёулаа ашиглана. */

/* Хоёр цэгийн хоорондох зай (метр) — haversine */
export function distanceM(a, b) {
  if (!a || !b || a.lat == null || b.lat == null) return null;
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180, la2 = (b.lat * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export const prettyDistance = (m) =>
  (m == null ? "—" : m < 1000 ? `${Math.round(m)} м` : `${(m / 1000).toFixed(m < 10000 ? 1 : 0)} км`);

/* Нэг пикселд ногдох метр — нарийвчлалын тойрог зурахад */
export const metersPerPx = (lat, z) => (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** z;

export const DEFAULT_RADIUS = 150;

/* Тухайн байрлал аль хадгалсан газар дотор байна вэ.
   Хэд хэдэн газар давхцвал ХАМГИЙН ОЙРЫГ нь сонгоно — том "Хот" доторх
   жижиг "Гэр" зөв ялгарна. */
export function placeAt(places, pos) {
  if (!pos || pos.lat == null) return null;
  let best = null, bestD = Infinity;
  for (const p of places || []) {
    if (p?.lat == null) continue;
    const d = distanceM(p, pos);
    if (d == null) continue;
    if (d <= (p.radius || DEFAULT_RADIUS) && d < bestD) { best = p; bestD = d; }
  }
  return best;
}

/* Өмнөх ба одоогийн газраас мэдэгдэх үйл явдлыг гаргана.
   Ижил газарт үлдвэл юу ч болохгүй — давтаж мэдэгдэхгүй. */
export function geofenceEvent(prevId, place) {
  const nextId = place?.id || null;
  if (prevId === nextId) return null;
  if (nextId) return { kind: "enter", id: nextId, name: place.name || "газар" };
  return { kind: "leave", id: prevId };
}
