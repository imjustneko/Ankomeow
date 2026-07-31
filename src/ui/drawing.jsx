/* Зурах самбар ба вектор зургийн харагдац. Математик нь src/lib/drawing.js-д. */

import { useEffect, useMemo, useRef, useState } from "react";
import { C } from "../lib/theme.js";
import { DRAW_CHECKER, DRAW_COLORS, DRAW_MAX_POINTS, DRAW_MIN_STEP, DRAW_SIZES, DRAW_UNITS, assistShape, smoothPath, strokePoints } from "../lib/drawing.js";
import { Bookmark, BookmarkCheck, RotateCcw, Send, Sticker, Trash2, Wand2, X } from "lucide-react";

export function DrawingView({ strokes, style }) {
  return (
    <svg viewBox={`0 0 ${DRAW_UNITS} ${DRAW_UNITS}`} className="block w-full"
      style={{ aspectRatio: "1 / 1", ...style }} role="img" aria-label="Зурсан зураг">
      {(strokes || []).map((s, i) => {
        const p = s.p || [];
        if (p.length < 2) return null;
        /* Ганц товшилт — шугам биш, дугуй толбо */
        if (p.length === 2) return <circle key={i} cx={p[0]} cy={p[1]} r={(s.w || 20) / 2} fill={s.c || "#2B2B2B"} />;
        /* Туслахаар үүссэн дүрсийг гөлгөрүүлэхгүй — булан нь мохохгүй, шулуун
           нь шулуун хэвээр үлдэнэ. Хүний зурсныг л гөлгөрүүлнэ. */
        let d;
        if (s.k) {
          d = "";
          for (let k = 0; k < p.length; k += 2) d += `${k ? "L" : "M"}${p[k]} ${p[k + 1]}`;
        } else {
          d = smoothPath(p);
        }
        return (
          <path key={i} d={d} fill="none" stroke={s.c || "#2B2B2B"} strokeWidth={s.w || 20}
            strokeLinecap="round" strokeLinejoin="round" />
        );
      })}
    </svg>
  );
}

export function DrawPad({ stickers, onClose, onSend, onSaveSticker, onSendSticker, onDeleteSticker }) {
  const [strokes, setStrokes] = useState([]);
  const [cur, setCur] = useState(null);      /* зурж байгаа шугамын харагдах хуулбар */
  const [color, setColor] = useState(DRAW_COLORS[0]);
  const [width, setWidth] = useState(DRAW_SIZES[1]);
  const [tray, setTray] = useState(false);
  const [assist, setAssist] = useState(() => localStorage.getItem("ankomeow-draw-assist") !== "0");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => { localStorage.setItem("ankomeow-draw-assist", assist ? "1" : "0"); }, [assist]);
  const boxRef = useRef(null);
  const curRef = useRef(null);               /* жинхэнэ (mutable) шугам — фрэйм бүрт хуулбарлана */
  const rafRef = useRef(0);

  const committed = useMemo(() => strokePoints(strokes), [strokes]);
  const empty = strokes.length === 0;

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  const pos = (e) => {
    const r = boxRef.current.getBoundingClientRect();
    const clamp = (v) => Math.max(0, Math.min(DRAW_UNITS, Math.round(v)));
    return [clamp(((e.clientX - r.left) / r.width) * DRAW_UNITS), clamp(((e.clientY - r.top) / r.height) * DRAW_UNITS)];
  };

  /* pointermove бүрт setState хийвэл сул утсан дээр сааталтай болно —
     фрэйм тутамд нэг л удаа шинэчилнэ. */
  const flush = () => {
    rafRef.current = 0;
    if (curRef.current) setCur({ ...curRef.current, p: curRef.current.p.slice() });
  };

  const down = (e) => {
    if (committed >= DRAW_MAX_POINTS) return;
    try { e.currentTarget.setPointerCapture?.(e.pointerId); } catch {}
    const [x, y] = pos(e);
    curRef.current = { c: color, w: width, p: [x, y] };
    setCur({ ...curRef.current, p: [x, y] });
  };

  const move = (e) => {
    const s = curRef.current;
    if (!s) return;
    if (committed + s.p.length / 2 >= DRAW_MAX_POINTS) return;
    const [x, y] = pos(e);
    const n = s.p.length;
    if (Math.hypot(x - s.p[n - 2], y - s.p[n - 1]) < DRAW_MIN_STEP) return;
    s.p.push(x, y);
    if (!rafRef.current) rafRef.current = requestAnimationFrame(flush);
  };

  const up = () => {
    const s = curRef.current;
    curRef.current = null;
    if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0; }
    setCur(null);
    if (!s) return;
    const shape = assist ? assistShape(s.p) : null;
    setStrokes((all) => [...all, shape ? { ...s, ...shape } : s]);
  };

  const saveSticker = () => {
    if (empty) return;
    onSaveSticker(strokes);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1200);
  };

  const IconBtn = ({ onClick, disabled, label, tone, children }) => (
    <button onClick={onClick} disabled={disabled} aria-label={label}
      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90 disabled:opacity-35"
      style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: tone || C.ink, transition: "transform 120ms ease" }}>
      {children}
    </button>
  );

  return (
    <div className="mb-2">
      {tray && (
        <div className="flex gap-2 overflow-x-auto pb-1.5 mb-2">
          {stickers.length === 0 ? (
            <p className="text-[11.5px] font-semibold py-3" style={{ color: C.inkSoft }}>
              Хадгалсан sticker алга. Зураад 🔖 дар.
            </p>
          ) : stickers.map((s) => (
            <div key={s.id} className="relative shrink-0 pt-1.5 pr-1.5">
              <button onClick={() => onSendSticker(s)} aria-label="Sticker илгээх"
                className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center active:scale-90"
                style={{ background: DRAW_CHECKER, border: `1.6px solid ${C.line2}`, transition: "transform 120ms ease" }}>
                <DrawingView strokes={s.strokes} />
              </button>
              <button onClick={() => onDeleteSticker(s.id)} aria-label="Sticker устгах"
                className="absolute top-0 right-0 w-5 h-5 rounded-full flex items-center justify-center active:scale-90"
                style={{ background: C.peachDeep, color: "#fff", border: "1.5px solid #fff" }}>
                <X size={10} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div ref={boxRef}
        /* onPointerLeave-г ЗОРИУДААР сонсохгүй: setPointerCapture-тэй үед хуруу
           талбайн гадуур гарахад ч эвентүүд бидэнд ирсээр байх ба capture-ийн
           улмаас leave эрт дуудагдвал шугам дундуураа тасарна. */
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
        className="relative mx-auto rounded-[20px] overflow-hidden"
        style={{
          width: "min(100%, 46vh)", aspectRatio: "1 / 1", touchAction: "none",
          background: DRAW_CHECKER, border: `1.8px solid ${C.line2}`,
        }}>
        <DrawingView strokes={cur ? [...strokes, cur] : strokes} style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
        {empty && !cur && (
          <span className="absolute inset-0 flex items-center justify-center text-[12px] font-bold pointer-events-none"
            style={{ color: C.inkSoft }}>
            Энд хуруугаараа зур
          </span>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-2">
        {DRAW_COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)} aria-label="Өнгө"
            className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 active:scale-90"
            style={{ background: c, border: `2.5px solid ${color === c ? C.ink : "transparent"}`, transition: "transform 120ms ease" }} />
        ))}
      </div>

      {/* Хэрэгслүүд. САНАМЖ: бүгдийг нэг мөрөнд битгий хий — 9 товч утасны
          өргөнд багтахгүй хальж, Илгээх товч дэлгэцнээс гарч байсан. */}
      <div className="flex items-center gap-1.5 mt-2">
        {DRAW_SIZES.map((w) => (
          <button key={w} onClick={() => setWidth(w)} aria-label="Бийрний зузаан"
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 active:scale-90"
            style={{ background: width === w ? C.cardIn : C.card, border: `1.6px solid ${C.line2}`, transition: "transform 120ms ease" }}>
            <span className="rounded-full block" style={{ width: w / 3.2, height: w / 3.2, background: color }} />
          </button>
        ))}
        <div className="flex-1" />
        <IconBtn onClick={() => setAssist((a) => !a)} label="Зурах туслах" tone={assist ? C.lilacDeep : C.inkSoft}>
          <Wand2 size={15} strokeWidth={2.4} />
        </IconBtn>
        <IconBtn onClick={() => setStrokes((a) => a.slice(0, -1))} disabled={empty} label="Буцаах">
          <RotateCcw size={15} strokeWidth={2.4} />
        </IconBtn>
        <IconBtn onClick={() => setStrokes([])} disabled={empty} label="Цэвэрлэх" tone={C.peachDeep}>
          <Trash2 size={15} strokeWidth={2.4} />
        </IconBtn>
        <IconBtn onClick={() => setTray((t) => !t)} label="Хадгалсан sticker" tone={tray ? C.lilacDeep : C.ink}>
          <Sticker size={15} strokeWidth={2.4} />
        </IconBtn>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <button onClick={onClose}
          className="shrink-0 h-10 px-4 rounded-full text-[12.5px] font-extrabold active:scale-95"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink, transition: "transform 150ms ease" }}>
          Хаах
        </button>
        <button onClick={saveSticker} disabled={empty}
          className="flex-1 min-w-0 h-10 rounded-full text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-35"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: savedFlash ? C.lilacDeep : C.ink, transition: "transform 150ms ease" }}>
          {savedFlash ? <BookmarkCheck size={15} strokeWidth={2.6} /> : <Bookmark size={15} strokeWidth={2.4} />}
          {savedFlash ? "Хадгаллаа" : "Sticker"}
        </button>
        <button onClick={() => { if (!empty) onSend(strokes); }} disabled={empty}
          className="flex-1 min-w-0 h-10 rounded-full text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-35"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Send size={15} strokeWidth={2.4} /> Илгээх
        </button>
      </div>
    </div>
  );
}
