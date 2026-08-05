/* Статуст хавсаргах дуу — хайх (SongPicker), харуулж сонсох (SongChip).

   Нэг дор зөвхөн нэг дуу тоглоно: audio элемент модулийн түвшинд ганц байх
   бөгөөд гурван дэлгэц ижил модулийг импортлодог тул нүүрэн дээр эхэлсэн
   preview хамтрагчийн дэлгэц рүү орход өөрөө зогсохгүй, харин өөр дуу дарвал
   өмнөх нь тасарна. */

import { useEffect, useRef, useState } from "react";
import { Music, Pause, Play, Search, X } from "lucide-react";
import { C } from "../lib/theme.js";
import { freshPreview, searchSongs } from "../lib/music.js";

/* ── Ганц preview тоглуулагч ── */
let audioEl = null;
let playingId = null;
const listeners = new Set();

function announce() {
  for (const fn of listeners) fn(playingId);
}

export function stopPreview() {
  if (audioEl) {
    audioEl.pause();
    audioEl.src = "";
    audioEl = null;
  }
  if (playingId !== null) {
    playingId = null;
    announce();
  }
}

export function togglePreview(song, src) {
  const url = src || song?.preview;
  if (!url) return;
  if (playingId === song.id) return stopPreview();
  stopPreview();
  audioEl = new Audio(url);
  audioEl.addEventListener("ended", stopPreview);
  /* Автомат тоглуулалтыг browser хориглож болзошгүй — чимээгүй бүтэлгүйтвэл
     товч эргээд "тоглуулах" төлөвт орно. */
  audioEl.play().catch(stopPreview);
  playingId = song.id;
  announce();
}

/* Deezer-ийн preview холбоос ойролцоогоор нэг хоногийн дараа хүчингүй болдог.
   Хадгалсан дууг тоглуулах гэхэд шинийг нь татах гэж хүлээвэл iOS Safari
   товшилтын хэлхээ тасарсан гэж үзээд дууг хориглоно. Тиймээс дэлгэц дээр
   гармагц далд байдлаар урьдчилж татаж тавина — дарах үед бэлэн байна. */
function usePlayableUrl(song) {
  const [url, setUrl] = useState(song?.preview || "");
  useEffect(() => {
    setUrl(song?.preview || "");
    if (!song?.id || song.src !== "deezer") return;
    const ctl = new AbortController();
    freshPreview(song, { signal: ctl.signal })
      .then((u) => { if (!ctl.signal.aborted && u) setUrl(u); })
      .catch(() => {});
    return () => ctl.abort();
  }, [song?.id, song?.preview, song?.src]);
  return url;
}

function usePlayingId() {
  const [id, setId] = useState(playingId);
  useEffect(() => {
    listeners.add(setId);
    return () => listeners.delete(setId);
  }, []);
  return id;
}

/* ── Харуулах чип ──
   compact — нүүрний нарийхан карт дотор багтах жижиг хувилбар. */
export function SongChip({ song, compact = false, onRemove }) {
  const nowId = usePlayingId();
  const url = usePlayableUrl(song);
  if (!song?.title) return null;

  const playing = nowId === song.id;
  const art = compact ? 26 : 38;

  return (
    <div className="flex items-center gap-2 rounded-full min-w-0"
      style={{
        background: C.cardIn,
        border: `1.4px solid ${C.line}`,
        padding: compact ? "3px 8px 3px 3px" : "4px 12px 4px 4px",
      }}>
      <div className="rounded-full overflow-hidden shrink-0 flex items-center justify-center"
        style={{ width: art, height: art, background: C.line }}>
        {song.art
          ? <img src={song.art} alt="" className="w-full h-full object-cover" />
          : <Music size={compact ? 13 : 17} color={C.inkSoft} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="font-extrabold truncate leading-tight"
          style={{ fontSize: compact ? 10.5 : 12.5, color: C.ink }}>{song.title}</div>
        {song.artist && (
          <div className="font-bold truncate leading-tight"
            style={{ fontSize: compact ? 9.5 : 11, color: C.inkSoft }}>{song.artist}</div>
        )}
      </div>

      {url && (
        <button
          onClick={(e) => { e.stopPropagation(); togglePreview(song, url); }}
          aria-label={playing ? "Зогсоох" : "Сонсох"}
          className="shrink-0 rounded-full flex items-center justify-center active:scale-90"
          style={{
            width: compact ? 22 : 28, height: compact ? 22 : 28,
            background: playing ? C.peachDeep : C.card,
            border: `1.4px solid ${playing ? C.peachDeep : C.line2}`,
            color: playing ? "#fff" : C.ink,
            transition: "transform 120ms ease, background 200ms ease",
          }}>
          {playing
            ? <Pause size={compact ? 10 : 13} strokeWidth={2.8} fill="currentColor" />
            : <Play size={compact ? 10 : 13} strokeWidth={2.8} fill="currentColor" />}
        </button>
      )}

      {onRemove && (
        <button onClick={(e) => { e.stopPropagation(); stopPreview(); onRemove(); }}
          aria-label="Дууг арилгах"
          className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center active:scale-90"
          style={{ color: C.inkSoft }}>
          <X size={14} strokeWidth={2.8} />
        </button>
      )}
    </div>
  );
}

/* ── Хайлтын хэсэг ──
   Бичих бүрт хүсэлт явуулахгүй: 400ms амарсны дараа л хайж, шинэ үсэг оръё
   гэвэл өмнөх хүсэлтийг цуцална. */
export function SongPicker({ onPick, onClose }) {
  const [term, setTerm] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const abortRef = useRef(null);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      abortRef.current?.abort();
      setResults([]);
      setBusy(false);
      setErr("");
      return;
    }
    const timer = setTimeout(async () => {
      abortRef.current?.abort();
      const ctl = new AbortController();
      abortRef.current = ctl;
      setBusy(true);
      setErr("");
      try {
        const list = await searchSongs(q, { signal: ctl.signal });
        if (!ctl.signal.aborted) setResults(list);
      } catch (e) {
        if (e?.name !== "AbortError") setErr("Хайлт амжилтгүй. Сүлжээгээ шалгана уу.");
      } finally {
        if (!ctl.signal.aborted) setBusy(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [term]);

  /* Хайлтаас гарахад сонсож байсан хэсэг чимээгүй үлдэхгүй */
  useEffect(() => stopPreview, []);

  return (
    <div className="mt-2.5 rounded-[20px] p-2.5" style={{ background: C.cardIn, border: `1.4px solid ${C.line}` }}>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 flex items-center gap-2 rounded-full px-3 py-2"
          style={{ background: C.card, border: `1.6px solid ${C.line2}` }}>
          <Search size={15} strokeWidth={2.4} color={C.inkSoft} className="shrink-0" />
          <input value={term} onChange={(e) => setTerm(e.target.value)} autoFocus
            placeholder="Дуу эсвэл дуучин хайх..." enterKeyHint="search"
            className="flex-1 min-w-0 bg-transparent text-[16px] font-medium outline-none"
            style={{ color: C.ink }} />
        </div>
        <button onClick={() => { stopPreview(); onClose(); }} aria-label="Хайлт хаах"
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
          style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.ink }}>
          <X size={16} strokeWidth={2.6} />
        </button>
      </div>

      {err && <p className="text-[11px] font-bold mt-2 px-1" style={{ color: C.peachDeep }}>{err}</p>}
      {!err && busy && <p className="text-[11px] font-bold mt-2 px-1" style={{ color: C.inkSoft }}>Хайж байна...</p>}
      {!err && !busy && term.trim().length >= 2 && results.length === 0 && (
        <p className="text-[11px] font-bold mt-2 px-1" style={{ color: C.inkSoft }}>Юу ч олдсонгүй.</p>
      )}

      {results.length > 0 && (
        <div className="mt-2 space-y-1 max-h-[236px] overflow-y-auto overscroll-contain">
          {/* Мөр нь div — доторх сонсох товчийг үүрлэсэн <button> болгож болохгүй */}
          {results.map((s) => (
            <div key={s.id}
              className="flex items-center gap-2.5 rounded-2xl p-1.5"
              style={{ background: C.card, border: `1.3px solid ${C.line}` }}>
              <button onClick={() => { stopPreview(); onPick(s); }}
                className="flex-1 min-w-0 flex items-center gap-2.5 text-left active:scale-[0.98]"
                style={{ transition: "transform 140ms ease" }}>
                <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 flex items-center justify-center"
                  style={{ background: C.cardIn }}>
                  {s.art ? <img src={s.art} alt="" className="w-full h-full object-cover" /> : <Music size={16} color={C.inkSoft} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[12.5px] font-extrabold truncate" style={{ color: C.ink }}>{s.title}</div>
                  <div className="text-[11px] font-bold truncate" style={{ color: C.inkSoft }}>{s.artist}</div>
                </div>
              </button>
              {s.preview && (
                <button onClick={() => togglePreview(s)} aria-label="Сонсох"
                  className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                  style={{ background: C.cardIn, color: C.ink }}>
                  <PreviewIcon song={s} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* Жагсаалт доторх нэг мөрийн тоглуулах/зогсоох дүрс */
function PreviewIcon({ song }) {
  const nowId = usePlayingId();
  return nowId === song.id
    ? <Pause size={12} strokeWidth={2.8} fill="currentColor" />
    : <Play size={12} strokeWidth={2.8} fill="currentColor" />;
}
