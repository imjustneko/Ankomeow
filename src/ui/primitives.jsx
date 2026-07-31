/* Аппын нийтлэг үндсэн элементүүд — бүх дэлгэц эдгээрийг ашиглана. */

import { C } from "../lib/theme.js";

/* ── жижиг элементүүд ── */
export function Bar({ value, max, color }) {
  return (
    <div className="h-[8px] rounded-full overflow-hidden" style={{ background: C.cardIn }}>
      <div className="h-full rounded-full" style={{
        width: `${Math.min((value / max) * 100, 100)}%`, background: color,
        transition: "width 700ms cubic-bezier(.22,1,.36,1)",
      }} />
    </div>
  );
}

export function Card({ children, onClick, tint, className = "" }) {
  return (
    <div onClick={onClick}
      className={`rounded-[26px] p-4 ${onClick ? "cursor-pointer active:scale-[0.97]" : ""} ${className}`}
      style={{
        /* color-mix: шөнийн горимд цайвар сүүдрийг 16% болгож сулруулна —
           эс бөгөөс харанхуй карт дээр цагаан толбо мэт цоолно. */
        background: tint
          ? `linear-gradient(158deg, color-mix(in srgb, ${tint} var(--tint-mix), ${C.card}) 0%, ${C.card} 130%)`
          : C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "var(--card-shadow)",
        transition: "transform 180ms ease",
      }}>
      {children}
    </div>
  );
}

export function Pill({ children, onClick, active, color, className = "", ...rest }) {
  return (
    <button onClick={onClick} {...rest}
      className={`rounded-full font-bold active:scale-95 ${className}`}
      style={{
        background: active ? color : "transparent",
        color: active ? "#fff" : C.ink,
        border: `1.8px solid ${active ? color : C.line2}`,
        transition: "transform 150ms ease, background 200ms ease",
      }}>
      {children}
    </button>
  );
}

export function Header({ title, sub, onBack }) {
  return (
    <div className="flex items-center gap-2.5 mb-5">
      {onBack && (
        <button onClick={onBack} className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ border: `1.6px solid ${C.line2}`, color: C.ink }} aria-label="Буцах">
          <ChevronLeft size={19} strokeWidth={2} />
        </button>
      )}
      <div>
        <h1 className="text-[22px] font-extrabold leading-tight" style={{ color: C.ink }}>{title}</h1>
        {sub && <p className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>{sub}</p>}
      </div>
    </div>
  );
}

export function MineToggle({ mine, setMine, partnerName }) {
  return (
    <div className="flex gap-1 mb-4 p-1 rounded-full" style={{ background: C.cardIn }}>
      {[{ k: true, l: "Миний" }, { k: false, l: partnerName || "Түншийн" }].map((o) => (
        <button key={String(o.k)} onClick={() => setMine(o.k)}
          className="flex-1 rounded-full py-2 text-[12.5px] font-extrabold active:scale-[0.97]"
          style={{
            background: mine === o.k ? C.card : "transparent",
            color: mine === o.k ? C.ink : C.inkSoft,
            boxShadow: mine === o.k ? "0 1px 3px rgba(92,74,58,.15)" : "none",
            transition: "all 180ms ease",
          }}>
          {o.l}
        </button>
      ))}
    </div>
  );
}
