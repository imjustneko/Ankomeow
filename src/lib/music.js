/* Дууны хайлт — Deezer API.

   Яагаад Deezer вэ: iTunes-ийн сан нарийн, хайж байсан дуу олдохгүй байв
   (ж: noevdv — "want u"). Deezer илүү өргөн бөгөөд мөн 30 секундын preview
   өгдөг тул аппад шууд тоглуулна.

   Яагаад JSONP вэ: api.deezer.com нь Access-Control-Allow-Origin толгой
   буцаадаггүй тул энгийн fetch хоригдоно. Гэхдээ output=jsonp дэмждэг —
   ингэснээр серверийн proxy огт шаардлагагүй. JSONP нь гадны скриптийг
   ажиллуулдаг тул зөвхөн api.deezer.com руу л хандана. */

const API = "https://api.deezer.com";

/* Preview холбоос нь exp=<timestamp> агуулсан бөгөөд ойролцоогоор нэг
   хоногийн дараа хүчингүй болно. Хадгалсан дууг тоглуулахын өмнө шинийг нь
   татах шаардлагатай гэдгийг энэ тогтмол сануулна. */
export const PREVIEW_TTL_MS = 12 * 60 * 60 * 1000;

let seq = 0;

/* Скрипт хийж дуудах — Promise болгож ороосон.
   Цуцлах (signal), хугацаа хэтрэх, алдаа гарах бүх тохиолдолд window дээрх
   түр функц ба script элементийг цэвэрлэнэ — эс бөгөөс хуудас дүүрнэ. */
export function jsonp(url, { signal, timeout = 8000 } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());

    const name = `__dz${Date.now().toString(36)}${seq++}`;
    const script = document.createElement("script");
    let timer = null;

    const cleanup = () => {
      clearTimeout(timer);
      delete window[name];
      script.remove();
      signal?.removeEventListener("abort", onAbort);
    };
    const onAbort = () => { cleanup(); reject(abortError()); };

    window[name] = (data) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error("Deezer холбогдсонгүй")); };
    timer = setTimeout(() => { cleanup(); reject(new Error("Deezer хариу өгсөнгүй")); }, timeout);
    signal?.addEventListener("abort", onAbort);

    script.src = `${url}${url.includes("?") ? "&" : "?"}output=jsonp&callback=${name}`;
    document.head.appendChild(script);
  });
}

function abortError() {
  const e = new Error("Цуцлагдав");
  e.name = "AbortError";
  return e;
}

/* Нэг үр дүнг аппын дууны бүтэц рүү. Дуу биш эсвэл нэргүй бол null. */
export function toSong(r) {
  if (!r || !r.id || !r.title) return null;
  return {
    id: String(r.id),
    src: "deezer",
    title: r.title,
    artist: r.artist?.name || "",
    art: r.album?.cover_medium || r.album?.cover_small || "",
    preview: r.preview || "",
    url: r.link || "",
  };
}

/* Нэг дуу олон цомгоос давхардаж ирдэг тул нэр+дуучнаар нь шүүнэ. */
export function parseResults(json, limit = 8) {
  const list = Array.isArray(json?.data) ? json.data : [];
  const seen = new Set();
  const out = [];
  for (const r of list) {
    const s = toSong(r);
    if (!s) continue;
    const key = `${s.title}|${s.artist}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

/* Хайлт. 2-оос бага үсэгт хүсэлт явуулахгүй — дэмий дуудлага хийхгүй.
   Давхардлыг хасахад үр дүн цөөрдөг тул хүссэнээс 2 дахин их гуйна. */
export async function searchSongs(term, { signal, limit = 8, jsonpImpl } = {}) {
  const q = (term || "").trim();
  if (q.length < 2) return [];
  const call = jsonpImpl || jsonp;
  const json = await call(`${API}/search?q=${encodeURIComponent(q)}&limit=${limit * 2}`, { signal });
  if (json?.error) throw new Error(json.error.message || "Deezer алдаа");
  return parseResults(json, limit);
}

/* Хадгалсан дууны preview холбоос хүчингүй болсон байх магадлалтай тул
   дугаараар нь шинийг татна. Deezer биш (хуучин iTunes) дуунд хэрэггүй —
   тэдний холбоос хугацаагүй. */
export async function freshPreview(song, { signal, jsonpImpl } = {}) {
  if (!song?.id || song.src !== "deezer") return song?.preview || "";
  const call = jsonpImpl || jsonp;
  const json = await call(`${API}/track/${encodeURIComponent(song.id)}`, { signal });
  return json?.preview || song.preview || "";
}
