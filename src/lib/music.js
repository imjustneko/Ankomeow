/* Дууны хайлт — Apple-ийн iTunes Search API.
   Түлхүүр шаардахгүй, CORS нээлттэй тул browser-оос шууд дуудна.
   Хариунаас зөвхөн хэрэгтэй талбаруудыг авч цэвэр бүтэц болгоно. */

const ENDPOINT = "https://itunes.apple.com/search";

/* iTunes цомгийн зургийг 100x100-аар буцаадаг. Замын доторх хэмжээг сольж
   илүү тод хувилбарыг гуйна — файлын нэр нь ".../100x100bb.jpg" хэлбэртэй. */
export function artworkUrl(raw, size = 200) {
  if (!raw) return "";
  return raw.replace(/\/\d+x\d+([a-z]*)\.(jpg|png)$/i, `/${size}x${size}$1.$2`);
}

/* Нэг үр дүнг аппын дууны бүтэц рүү. Дуу биш эсвэл нэргүй бол null. */
export function toSong(r) {
  if (!r || !r.trackId || !r.trackName) return null;
  return {
    id: String(r.trackId),
    title: r.trackName,
    artist: r.artistName || "",
    art: artworkUrl(r.artworkUrl100 || r.artworkUrl60 || ""),
    preview: r.previewUrl || "",
    url: r.trackViewUrl || "",
  };
}

/* Нэг дуу олон цомгоос давхардаж ирдэг тул нэр+дуучнаар нь шүүнэ. */
export function parseResults(json, limit = 8) {
  const list = Array.isArray(json?.results) ? json.results : [];
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
export async function searchSongs(term, { signal, limit = 8, fetchImpl } = {}) {
  const q = (term || "").trim();
  if (q.length < 2) return [];
  const f = fetchImpl || fetch;
  const url = `${ENDPOINT}?term=${encodeURIComponent(q)}&entity=song&limit=${limit * 2}`;
  const res = await f(url, { signal });
  if (!res.ok) throw new Error(`iTunes ${res.status}`);
  return parseResults(await res.json(), limit);
}
