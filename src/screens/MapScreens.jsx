/* Газрын зураг: чат доторх жижиг зураг, интерактив зураг, бодит цагийн
   байршлын дэлгэц. Tile математик нь src/lib/map.js-д (тесттэй). */

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/theme.js";
import { Card, Header, Pill } from "../ui/primitives.jsx";
import { auth, liveDoc, placeDocRef, placesCol } from "../lib/firebase.js";
import { addDoc, deleteDoc, onSnapshot, query, serverTimestamp, setDoc } from "firebase/firestore";
import { DEFAULT_RADIUS, distanceM, geofenceEvent, metersPerPx, placeAt, prettyDistance } from "../lib/geo.js";
import { MAP_CREDIT, MAP_H, MAP_MAX_Z, MAP_MIN_Z, MAP_TILE, MAP_W, MAP_ZOOM, agoText, mapTiles, pxToLatLng, tileUrl, worldPx } from "../lib/map.js";
import { notifyPartner } from "../push.js";
import { MapPin, Plus, Trash2 } from "lucide-react";

const UB = { lat: 47.9184, lng: 106.9177 }; /* хаана ч байршил мэдэгдэхгүй үеийн эхлэл */

/* Хоёулаа багтахаар zoom сонгоно */
const zoomForSpan = (meters, lat) => {
  const mpp = Math.max(1, (meters * 2.2) / 320); /* дэлгэцийн ~320px-д багтаана */
  const z = Math.floor(Math.log2((156543.03392 * Math.cos((lat * Math.PI) / 180)) / mpp));
  return Math.max(MAP_MIN_Z, Math.min(17, z));
};

export function MapView({ lat, lng }) {
  if (lat == null || lng == null) return null;
  const tiles = mapTiles(lat, lng, MAP_ZOOM, MAP_W, MAP_H);
  const href = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  return (
    <div style={{ width: MAP_W, maxWidth: "100%" }}>
      <div className="relative overflow-hidden rounded-[14px]"
        style={{ height: MAP_H, background: C.cardIn, border: `1.5px solid ${C.line}` }}>
        {tiles.map((t) => (
          <img key={t.key} src={tileUrl("map", MAP_ZOOM, t.x, t.y)}
            alt="" loading="lazy" onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
            style={{ position: "absolute", left: t.left, top: t.top, width: MAP_TILE, height: MAP_TILE, maxWidth: "none" }} />
        ))}
        <span className="absolute" style={{ left: "50%", top: "50%", transform: "translate(-50%, -100%)" }}>
          <MapPin size={26} strokeWidth={2.6} color={C.peachDeep} fill={C.card} />
        </span>
      </div>
      <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
        className="mt-1 flex items-center justify-center gap-1.5 rounded-full py-1.5 text-[11px] font-extrabold active:scale-[0.97]"
        style={{ background: C.card, border: `1.5px solid ${C.line2}`, color: C.ink, transition: "transform 150ms ease" }}>
        <MapPin size={12} strokeWidth={2.6} /> Google Map дээр нээх
      </a>
    </div>
  );
}

/* ── Интерактив газрын зураг ──
   Гадны сан (Leaflet/Google) ашиглахгүй: tile-уудыг өөрсдөө байрлуулж, чирэх
   болон хоёр хурууны zoom-ыг pointer эвентээр барина. Бүрэн үнэгүй. */
export function TileMap({ center, zoom, onView, markers = [], height = 320, className = "" }) {
  const [layer, setLayer] = useState("map");
  const boxRef = useRef(null);
  const [size, setSize] = useState({ w: 0, h: 0 }); /* ResizeObserver бөглөх хүртэл юу ч зурахгүй */
  const ptrsRef = useRef(new Map()); /* pointerId → {x,y} */
  const gestureRef = useRef(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  const { w, h } = size;
  const tiles = w > 0 ? mapTiles(center.lat, center.lng, zoom, w, h) : [];
  const [ccx, ccy] = worldPx(center.lat, center.lng, zoom);

  /* Дэлгэц дээрх байрлал: тухайн цэг ба төвийн дэлхийн пикселийн зөрүү */
  const screenPos = (lat, lng) => {
    const [x, y] = worldPx(lat, lng, zoom);
    return [x - ccx + w / 2, y - ccy + h / 2];
  };

  const panBy = (dx, dy) => {
    const [lat, lng] = pxToLatLng(ccx - dx, ccy - dy, zoom);
    onView({ center: { lat, lng }, zoom });
  };

  /* Хуруу/хулганы дундах цэгийг байрандаа үлдээж zoom хийнэ */
  const zoomAt = (nextZoom, px, py) => {
    const z = Math.max(MAP_MIN_Z, Math.min(MAP_MAX_Z, nextZoom));
    if (z === zoom) return;
    const [alat, alng] = pxToLatLng(ccx + (px - w / 2), ccy + (py - h / 2), zoom); /* анкер цэг */
    const [ax, ay] = worldPx(alat, alng, z);
    const [lat, lng] = pxToLatLng(ax - (px - w / 2), ay - (py - h / 2), z);
    onView({ center: { lat, lng }, zoom: z });
  };

  const local = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const down = (e) => {
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
    ptrsRef.current.set(e.pointerId, local(e));
    if (ptrsRef.current.size === 2) {
      const [a, b] = [...ptrsRef.current.values()];
      gestureRef.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom };
    }
  };

  const move = (e) => {
    const ptrs = ptrsRef.current;
    const prev = ptrs.get(e.pointerId);
    if (!prev) return;
    const cur = local(e);
    ptrs.set(e.pointerId, cur);

    if (ptrs.size >= 2 && gestureRef.current) {
      const [a, b] = [...ptrs.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const g = gestureRef.current;
      if (g.dist > 8) {
        /* Хоёр дахин ойртуулах бүрд zoom нэгээр нэмэгдэнэ (log2) */
        zoomAt(Math.round(g.zoom + Math.log2(dist / g.dist)), (a.x + b.x) / 2, (a.y + b.y) / 2);
      }
      return;
    }
    panBy(cur.x - prev.x, cur.y - prev.y);
  };

  const up = (e) => {
    ptrsRef.current.delete(e.pointerId);
    if (ptrsRef.current.size < 2) gestureRef.current = null;
  };

  return (
    <div ref={boxRef}
      onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      onWheel={(e) => { const p = local(e); zoomAt(zoom + (e.deltaY < 0 ? 1 : -1), p.x, p.y); }}
      className={`relative overflow-hidden ${className}`}
      style={{ height, touchAction: "none", background: C.cardIn, border: `1.5px solid ${C.line}` }}>
      {tiles.map((t) => (
        <img key={`${layer}/${zoom}/${t.key}`} src={tileUrl(layer, zoom, t.x, t.y)}
          alt="" draggable={false} onError={(e) => { e.currentTarget.style.visibility = "hidden"; }}
          style={{ position: "absolute", left: t.left, top: t.top, width: MAP_TILE, height: MAP_TILE, maxWidth: "none" }} />
      ))}

      {w > 0 && markers.map((mk) => {
        const [x, y] = screenPos(mk.lat, mk.lng);
        if (x < -80 || y < -80 || x > w + 80 || y > h + 80) return null;
        const accPx = mk.acc ? mk.acc / metersPerPx(mk.lat, zoom) : 0;
        return (
          <div key={mk.key}>
            {accPx > 6 && (
              <span className="absolute rounded-full pointer-events-none"
                style={{
                  left: x - accPx, top: y - accPx, width: accPx * 2, height: accPx * 2,
                  /* mk.color нь CSS хувьсагч тул hex залгаж болохгүй — color-mix */
                  background: `color-mix(in srgb, ${mk.color} 14%, transparent)`,
                  border: `1.5px solid color-mix(in srgb, ${mk.color} 45%, transparent)`,
                }} />
            )}
            <span className="absolute flex flex-col items-center pointer-events-none"
              style={{ left: x, top: y, transform: "translate(-50%, -100%)" }}>
              <span className="rounded-full overflow-hidden flex items-center justify-center"
                style={{ width: 34, height: 34, background: mk.color, border: "2.5px solid #fff", boxShadow: "0 4px 10px rgba(92,74,58,.3)" }}>
                {mk.avatar
                  ? <img src={mk.avatar} alt="" className="w-full h-full object-cover" />
                  : <MapPin size={17} strokeWidth={2.6} color="#fff" />}
              </span>
              <span className="text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-full mt-0.5 whitespace-nowrap"
                style={{ background: C.card, border: `1.2px solid ${C.line2}`, color: C.ink }}>
                {mk.label}
              </span>
            </span>
          </div>
        );
      })}

      <button onClick={() => setLayer((l) => (l === "map" ? "sat" : "map"))}
        aria-label={layer === "map" ? "Хиймэл дагуул" : "Энгийн зураг"}
        className="absolute right-2 top-2 h-8 px-3 rounded-full text-[11px] font-extrabold active:scale-90"
        style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink, transition: "transform 120ms ease" }}>
        {layer === "map" ? "🛰 Дагуул" : "🗺 Зураг"}
      </button>

      <div className="absolute right-2 bottom-2 flex flex-col gap-1.5">
        {[["+", 1], ["−", -1]].map(([sign, d]) => (
          <button key={sign} onClick={() => zoomAt(zoom + d, w / 2, h / 2)} aria-label={d > 0 ? "Ойртуулах" : "Холдуулах"}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[16px] font-extrabold active:scale-90"
            style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink, transition: "transform 120ms ease" }}>
            {sign}
          </button>
        ))}
      </div>

      <span className="absolute left-1.5 bottom-1 text-[8.5px] font-bold px-1 rounded"
        style={{ background: "rgba(255,253,248,.75)", color: C.inkSoft }}>
        {MAP_CREDIT[layer]}
      </span>
    </div>
  );
}

export function LiveMapScreen({ accountKey, partnerKey, profileName, partnerName, avatar, partnerAvatar, onBack }) {
  const [sharing, setSharing] = useState(() => localStorage.getItem("ankomeow-share-loc") === "1");
  const [me, setMe] = useState(null);        /* { lat, lng, acc, ts } — өөрийн шууд заалт */
  const [partner, setPartner] = useState(null);
  const [err, setErr] = useState("");
  const [view, setView] = useState({ center: UB, zoom: 12 });
  const [tick, setTick] = useState(0);       /* "хэдэн минутын өмнө"-г шинэчлэхэд */
  const [places, setPlaces] = useState([]);
  const [newPlace, setNewPlace] = useState("");
  const inited = useRef(false);
  const lastWrite = useRef(0);
  const lastPos = useRef(null);
  /* Хамгийн сүүлд ямар газарт байсан — дахин ачаалсан ч давтаж мэдэгдэхгүйн
     тулд localStorage-д үлдээнэ. */
  const placeIdRef = useRef(localStorage.getItem("ankomeow-place") || null);
  const placesRef = useRef([]);
  useEffect(() => { placesRef.current = places; }, [places]);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 20000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    localStorage.setItem("ankomeow-share-loc", sharing ? "1" : "0");
  }, [sharing]);

  /* Хуваалцахаа болих — өөрийн байршлыг сангаас цэвэрлэнэ */
  useEffect(() => {
    if (sharing || !accountKey) return;
    setMe(null);
    lastPos.current = null;
    deleteDoc(liveDoc(accountKey)).catch(() => {});
  }, [sharing, accountKey]);

  /* Байршлыг зөвхөн энэ дэлгэц нээлттэй үед л мөрдөнө — батарей, нууцлалын аль
     алинд нь зөв. Бичихдээ 8 секунд тутам эсвэл 15м хөдөлсөн үед л илгээнэ. */
  useEffect(() => {
    if (!sharing || !accountKey) return;
    if (!navigator.geolocation) { setErr("Энэ төхөөрөмж байршил дэмжихгүй байна."); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setErr("");
        const pos = { lat: p.coords.latitude, lng: p.coords.longitude, acc: Math.round(p.coords.accuracy || 0) };
        setMe({ ...pos, ts: Date.now() });
        const now = Date.now();
        const moved = lastPos.current ? distanceM(lastPos.current, pos) : Infinity;
        if (now - lastWrite.current > 8000 || moved > 15) {
          lastWrite.current = now;
          lastPos.current = pos;
          setDoc(liveDoc(accountKey), { ...pos, at: serverTimestamp() }).catch(() => {});
        }

        /* Geofence. ӨӨРИЙН байрлалыг шалгаад ХАМТРАГЧ РУУ мэдэгдэл илгээнэ —
           хөтөч зөвхөн өөрийн байршлыг мэдэрдэг тул энэ л зөв тал. */
        const here = placeAt(placesRef.current, pos);
        const ev = geofenceEvent(placeIdRef.current, here);
        if (ev) {
          placeIdRef.current = ev.kind === "enter" ? ev.id : null;
          if (placeIdRef.current) localStorage.setItem("ankomeow-place", placeIdRef.current);
          else localStorage.removeItem("ankomeow-place");
          const left = placesRef.current.find((p) => p.id === ev.id);
          notifyPartner(auth, {
            to: partnerKey,
            title: profileName,
            body: ev.kind === "enter" ? `📍 ${ev.name} дээр ирлээ` : `👋 ${left?.name || "газраас"} гарлаа`,
            tag: "geo",
            tab: "map",
          });
        }
      },
      (e) => setErr(e.code === 1
        ? "Байршлын зөвшөөрөл өгөөгүй байна. Хөтчийн тохиргооноос зөвшөөрнө үү."
        : "Байршил тодорхойлж чадсангүй. Гадаа эсвэл цонхны дэргэд оролдоно уу."),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [sharing, accountKey]);

  useEffect(() => {
    if (!partnerKey) return;
    const unsub = onSnapshot(liveDoc(partnerKey), (snap) => {
      setPartner(snap.exists() ? snap.data() : null);
    }, () => {});
    return unsub;
  }, [partnerKey]);

  useEffect(() => {
    if (!accountKey) return;
    return onSnapshot(placesCol(), (s) => setPlaces(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
  }, [accountKey]);

  const addPlace = () => {
    const name = newPlace.trim();
    /* Газрын зургийн ТӨВД байгаа цэгийг хадгална — өөрийн байршил дээр биш
       ч гэсэн (жишээ нь хамтрагчийн ажлыг) тэмдэглэж болно. */
    if (!name) return;
    addDoc(placesCol(), {
      name: name.slice(0, 40), lat: view.center.lat, lng: view.center.lng,
      radius: DEFAULT_RADIUS, createdAt: serverTimestamp(),
    }).catch(() => {});
    setNewPlace("");
  };

  const removePlace = (id) => deleteDoc(placeDocRef(id)).catch(() => {});

  /* Эхний байршил мэдэгдмэгц нэг л удаа автоматаар төвлөрнө */
  useEffect(() => {
    if (inited.current) return;
    const first = me || partner;
    if (!first?.lat) return;
    inited.current = true;
    setView({ center: { lat: first.lat, lng: first.lng }, zoom: 16 });
  }, [me, partner]);

  const markers = [];
  if (me?.lat != null) markers.push({ key: "me", lat: me.lat, lng: me.lng, acc: me.acc, color: C.waterDeep, label: profileName || "Би", avatar });
  if (partner?.lat != null) markers.push({ key: "p", lat: partner.lat, lng: partner.lng, acc: partner.acc, color: C.peachDeep, label: partnerName || "Хамтрагч", avatar: partnerAvatar });

  const gap = me?.lat != null && partner?.lat != null ? distanceM(me, partner) : null;

  const focus = (p, z = 17) => p?.lat != null && setView({ center: { lat: p.lat, lng: p.lng }, zoom: z });

  const fitBoth = () => {
    if (me?.lat == null || partner?.lat == null) return;
    const mid = { lat: (me.lat + partner.lat) / 2, lng: (me.lng + partner.lng) / 2 };
    setView({ center: mid, zoom: zoomForSpan(Math.max(50, gap), mid.lat) });
  };

  return (
    <div>
      <Header title="Газрын зураг" sub="Хоёулангийнхаа байршлыг шууд харах" onBack={onBack} />

      <div className="rounded-[22px] overflow-hidden mb-3">
        <TileMap center={view.center} zoom={view.zoom} onView={setView} markers={markers} height="min(58vh, 460px)" />
      </div>

      <div className="flex gap-2 mb-3">
        <Pill onClick={() => focus(me)} className="flex-1 py-2 text-[11.5px]" active={false}>Би</Pill>
        <Pill onClick={() => focus(partner)} className="flex-1 py-2 text-[11.5px]">{partnerName || "Хамтрагч"}</Pill>
        <Pill onClick={fitBoth} className="flex-1 py-2 text-[11.5px]">Хоёулаа</Pill>
      </div>

      <Card tint="#F4FBFE" className="mb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[13px] font-extrabold mb-0.5" style={{ color: C.ink }}>Байршлаа хуваалцах</div>
            <div className="text-[11.5px] font-bold leading-snug" style={{ color: C.inkSoft }}>
              {sharing
                ? (me ? `Нарийвчлал ±${me.acc} м · ${agoText(me.ts)}` : "Байршлыг тодорхойлж байна…")
                : "Зөвхөн энэ дэлгэц нээлттэй үед хуваалцана"}
            </div>
          </div>
          <button onClick={() => setSharing((v) => !v)} aria-pressed={sharing} aria-label="Байршлаа хуваалцах"
            className="w-12 h-7 rounded-full shrink-0 relative active:scale-95"
            style={{ background: sharing ? C.waterDeep : C.line2, transition: "background 200ms ease, transform 150ms ease" }}>
            <span className="absolute top-1 w-5 h-5 rounded-full bg-white shadow"
              style={{ left: sharing ? 26 : 4, transition: "left 200ms cubic-bezier(.2,.8,.3,1)" }} />
          </button>
        </div>
        {err && (
          <div className="text-[11.5px] font-bold mt-2 leading-snug" style={{ color: C.peachDeep }}>{err}</div>
        )}
      </Card>

      <Card tint="#F5FBF3" className="mb-3">
        <div className="text-[12.5px] font-extrabold mb-1" style={{ color: C.ink }}>Миний газрууд</div>
        <div className="text-[11px] font-bold mb-2.5 leading-snug" style={{ color: C.inkSoft }}>
          Эдгээр газарт ирэх/гарахад чинь хамтрагчид мэдэгдэнэ. Байршил хуваалцаж,
          апп нээлттэй байх үед ажиллана.
        </div>

        <div className="flex gap-2 mb-2">
          <input value={newPlace} onChange={(e) => setNewPlace(e.target.value.slice(0, 40))}
            onKeyDown={(e) => e.key === "Enter" && addPlace()} placeholder="Газрын нэр (жишээ: Гэр)"
            enterKeyHint="done"
            className="flex-1 min-w-0 rounded-full px-4 py-2 text-[15px] font-medium outline-none"
            style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
          <button onClick={addPlace} aria-label="Газрын зургийн төвийг хадгалах"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
            style={{ background: C.sageDeep, color: "#fff", transition: "transform 150ms ease" }}>
            <Plus size={17} strokeWidth={2.6} />
          </button>
        </div>
        <div className="text-[10.5px] font-bold mb-2" style={{ color: C.inkSoft }}>
          Газрын зургийн ТӨВД байгаа цэг хадгалагдана (радиус {DEFAULT_RADIUS}м).
        </div>

        {places.length === 0 ? (
          <p className="text-[11.5px] font-semibold py-1" style={{ color: C.inkSoft }}>Хадгалсан газар алга.</p>
        ) : (
          <div className="space-y-1.5">
            {places.map((p) => (
              <div key={p.id} className="flex items-center gap-2 rounded-full px-3 py-2"
                style={{ background: C.card, border: `1.4px solid ${C.line}` }}>
                <button onClick={() => setView({ center: { lat: p.lat, lng: p.lng }, zoom: 16 })}
                  className="flex-1 min-w-0 text-left active:scale-[0.98]" style={{ transition: "transform 120ms ease" }}>
                  <span className="text-[13px] font-extrabold block truncate" style={{ color: C.ink }}>{p.name}</span>
                  {me?.lat != null && (
                    <span className="text-[10px] font-bold" style={{ color: C.inkSoft }}>
                      надаас {prettyDistance(distanceM(p, me))}
                    </span>
                  )}
                </button>
                <button onClick={() => removePlace(p.id)} aria-label="Устгах"
                  className="shrink-0 active:scale-90" style={{ color: C.inkSoft, transition: "transform 120ms ease" }}>
                  <Trash2 size={14} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <Card tint="#FEF6F1">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.peachDeep }}>{partnerName || "Хамтрагч"}</div>
          <div className="text-[13px] font-extrabold leading-snug" style={{ color: C.ink }}>
            {partner?.lat != null ? agoText(partner.at) : "Хуваалцаагүй"}
          </div>
          {partner?.acc != null && (
            <div className="text-[11px] font-bold mt-0.5" style={{ color: C.inkSoft }}>Нарийвчлал ±{partner.acc} м</div>
          )}
        </Card>
        <Card tint="#F5FBF3">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.sageDeep }}>Хоорондын зай</div>
          <div className="text-[15px] font-extrabold" style={{ color: C.ink }}>
            {gap != null ? prettyDistance(gap) : "—"}
          </div>
        </Card>
      </div>
    </div>
  );
}
