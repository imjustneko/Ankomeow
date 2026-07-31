/* Ус — өдрийн хэрэглээ, аяганы анимаци. */

import { useEffect, useRef, useState } from "react";
import { C } from "../lib/theme.js";
import { Card, Header, MineToggle, Pill } from "../ui/primitives.jsx";
import { RotateCcw } from "lucide-react";
import { IC_WATER } from "../lib/assets.js";
import { pad, ubParts } from "../lib/time.js";

/* ── усны долгион ── */
const makeWave = (amp, len) => {
  const from = -260, to = 480, depth = 340;
  let d = `M ${from} 0`;
  for (let x = from; x < to; x += len)
    d += ` q ${len / 4} ${-amp} ${len / 2} 0 q ${len / 4} ${amp} ${len / 2} 0`;
  return d + ` L ${to} ${depth} L ${from} ${depth} Z`;
};
const WAVE_A = makeWave(7, 56);
const WAVE_B = makeWave(5, 44);

/* ── аяга ── */
export function Glass({ ml, goal, spillKey, spilling, over }) {
  const pct = ml / goal;
  const fill = Math.min(pct, 1);
  const TOP = 32, BOT = 280;
  const level = BOT - (BOT - TOP) * fill;
  const wallX = (y) => 156 - (y - 30) * 0.0798;

  return (
    <div style={{ animation: spilling ? "wobble 700ms ease-in-out 2" : "none" }}>
      <svg viewBox="0 0 200 330" className="w-full max-w-[248px]" aria-label="Усны хэмжээ">
        <defs>
          <clipPath id="inside">
            <path d="M 44 30 L 63 268 Q 65 280 78 280 L 122 280 Q 135 280 137 268 L 156 30 Z" />
          </clipPath>
          <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.water} />
            <stop offset="100%" stopColor={C.waterDeep} />
          </linearGradient>
          <radialGradient id="pud" cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor={C.water} stopOpacity="0.75" />
            <stop offset="100%" stopColor={C.waterDeep} stopOpacity="0.4" />
          </radialGradient>
        </defs>

        {/* байнгын гоожилт — зорилгоос давсан үед аяга бодитоор гоожиж, шалбааг үлдээнэ */}
        <g style={{
          opacity: over ? 1 : 0, transition: "opacity 900ms cubic-bezier(.22,1,.36,1)",
          pointerEvents: "none",
        }}>
          <ellipse cx="96" cy="306" rx="46" ry="8" fill="url(#pud)" className={over ? "puddleBreathe" : ""} />
          <ellipse cx="118" cy="309" rx="20" ry="5" fill="url(#pud)" className={over ? "puddleBreathe" : ""} style={{ animationDelay: ".4s" }} />
          <circle cx="44" cy="30" r="3.2" fill={C.waterDeep} className={over ? "leakL" : ""} />
          <circle cx="156" cy="30" r="3" fill={C.waterDeep} className={over ? "leakR" : ""} style={{ animationDelay: "0.55s" }} />
        </g>

        {/* асгарсан ус — нэмэх бүрд шуух эффект */}
        {spilling && (
          <g key={spillKey}>
            <ellipse cx="100" cy="302" rx="52" ry="7" fill="url(#pud)"
              className="puddle" style={{ transformOrigin: "100px 302px" }} />
            {[
              [44, "L", 0], [42, "L", 0.18], [156, "R", 0.09], [158, "R", 0.3], [47, "L", 0.42],
            ].map(([x, side, d], i) => (
              <circle key={i} cx={x} cy={30} r={i % 2 ? 3.6 : 4.6} fill={C.waterDeep}
                className={side === "L" ? "dropL" : "dropR"} style={{ animationDelay: `${d}s` }} />
            ))}
          </g>
        )}

        {/* ус */}
        <g clipPath="url(#inside)">
          <g style={{ transform: `translateY(${level}px)`, transition: "transform 950ms cubic-bezier(.22,1,.36,1)" }}>
            <path d={WAVE_A} fill="url(#wg)" className="wv-a" />
            <path d={WAVE_B} fill={C.water} opacity="0.55" className="wv-b" />
            {ml > 0 && [[82, 0, 3.4], [104, 1.4, 2.4], [118, 2.6, 3], [93, 3.8, 2]].map(([x, dl, r], i) => (
              <circle key={i} cx={x} cy={170} r={r} fill="#fff" opacity="0"
                className="bub" style={{ animationDelay: `${dl}s` }} />
            ))}
          </g>
        </g>

        {/* контур */}
        <path d="M 38 26 L 58 272 Q 60 286 76 286 L 124 286 Q 140 286 142 272 L 162 26"
          fill="none" stroke={C.ink} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <ellipse cx="100" cy="26" rx="62" ry="8.5" fill="none" stroke={C.ink} strokeWidth="2.6" />
        <path d="M 50 60 L 66 250" stroke="#fff" strokeWidth="4.5" opacity="0.5" strokeLinecap="round" fill="none" />

        {/* хэмжээс */}
        {[0.25, 0.5, 0.75, 1].map((m) => {
          const y = BOT - (BOT - TOP) * m;
          const x = wallX(y);
          return (
            <g key={m}>
              <line x1={x - 15} y1={y} x2={x - 3} y2={y} stroke={C.line2} strokeWidth="1.8" strokeLinecap="round" />
              <text x={x + 9} y={y + 4} fontSize="11" fill={C.inkSoft} fontWeight="700">
                {Math.round((goal * m) / 50) * 50}
              </text>
            </g>
          );
        })}

        <text x="100" y="322" textAnchor="middle" fontSize="13.5" fontWeight="800"
          fill={pct > 1 ? C.peachDeep : C.inkSoft}>
          {Math.round(pct * 100)}%
        </text>
      </svg>
    </div>
  );
}

/* ── Ус ── */
export function WaterScreen({ ml, setMl, log, setLog, weight, setWeight, goal, partner, onBack }) {
  const [spillKey, setSpillKey] = useState(0);
  const [spilling, setSpilling] = useState(false);
  const [mine, setMine] = useState(true);
  const timer = useRef(null);

  const cups = [
    { v: 100, label: "Балга" }, { v: 200, label: "Аяга" },
    { v: 330, label: "Лааз" }, { v: 500, label: "Шил" },
  ];
  const cupCounts = [
    { v: 250, label: "1 аяга" }, { v: 500, label: "2 аяга" }, { v: 750, label: "3 аяга" },
  ];

  const add = (v) => {
    const next = Math.max(0, ml + v);
    setMl(next);
    if (v > 0) {
      if (next > goal) {
        setSpillKey((k) => k + 1);
        setSpilling(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setSpilling(false), 1700);
      }
      const t = ubParts();
      setLog((l) => [{ v, t: `${pad(t.h)}:${pad(t.m)}` }, ...l]);
    }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const over = ml > goal;
  const pGoal = partner?.goal || 1;
  const pOver = !!partner && partner.ml > pGoal;

  return (
    <div>
      <Header title="Ус уух"
        sub={mine ? `${ml} / ${goal} мл · ${Math.floor(ml / 250)} аяга` : `${partner?.ml ?? 0} / ${pGoal} мл`}
        onBack={onBack} />

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      {mine ? (
        <>
          <div className="flex justify-center mb-2"><Glass {...{ ml, goal, spillKey, spilling, over }} /></div>

          {over && (
            <div className="rounded-full px-4 py-2 mb-4 text-center text-[12.5px] font-bold"
              style={{ background: C.peach, color: "#fff" }}>
              {ml > goal * 1.5
                ? "Нэлээд давлаа — жигд хуваарилж уувал биед зөв"
                : "Аяга дүүрч асгарлаа! Зорилго биелсэн 🎉"}
            </div>
          )}

          <div className="grid grid-cols-4 gap-2 mb-2">
            {cups.map((c) => (
              <button key={c.v} onClick={() => add(c.v)}
                className="rounded-full py-3 active:scale-95"
                style={{ background: C.card, border: `1.8px solid ${C.line2}`, transition: "transform 150ms ease" }}>
                <div className="text-[13px] font-extrabold" style={{ color: C.waterDeep }}>{c.v} мл</div>
                <div className="text-[9.5px] font-semibold mt-0.5" style={{ color: C.inkSoft }}>{c.label}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2 mb-3">
            {cupCounts.map((c) => (
              <Pill key={c.v} onClick={() => add(c.v)} className="py-2 text-[12px]">{c.label}</Pill>
            ))}
          </div>

          <div className="flex gap-2 mb-5">
            <Pill onClick={() => add(-100)} className="flex-1 py-2.5 text-[12.5px]">−100 мл буцаах</Pill>
            <Pill onClick={() => { setMl(0); setLog([]); }} className="px-4" aria-label="Тэглэх">
              <RotateCcw size={16} strokeWidth={2.2} />
            </Pill>
          </div>

          <Card tint="#F4FBFE" className="mb-4">
            <div className="flex justify-between items-baseline mb-2.5">
              <span className="text-[13px] font-extrabold" style={{ color: C.ink }}>Өдрийн зорилго</span>
              <span className="text-[12px] font-bold" style={{ color: C.waterDeep }}>{weight} кг → {goal} мл</span>
            </div>
            <input type="range" min="35" max="120" value={weight} onChange={(e) => setWeight(+e.target.value)} className="w-full" />
            <p className="text-[11px] mt-2 font-medium" style={{ color: C.inkSoft }}>Биеийн жин × 33 мл-ээр тооцов.</p>
          </Card>

          <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>Өнөөдрийн бүртгэл</div>
          {log.length === 0 ? (
            <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна. Дээрх товчнуудаас нэмнэ үү.</p>
          ) : (
            <div className="space-y-1.5">
              {log.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12.5px] py-2 px-3 rounded-full"
                  style={{ background: C.card, border: `1.5px solid ${C.line}`, color: C.ink }}>
                  <img src={IC_WATER} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span className="font-semibold">{e.t}</span>
                  <span className="ml-auto font-extrabold" style={{ color: C.waterDeep }}>+{e.v} мл</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex justify-center mb-2">
            <Glass ml={partner?.ml ?? 0} goal={pGoal} spillKey={0} spilling={false} over={pOver} />
          </div>

          <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>Өнөөдрийн бүртгэл</div>
          {!partner?.log?.length ? (
            <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна.</p>
          ) : (
            <div className="space-y-1.5">
              {partner.log.slice(0, 8).map((e, i) => (
                <div key={i} className="flex items-center gap-2.5 text-[12.5px] py-2 px-3 rounded-full"
                  style={{ background: C.card, border: `1.5px solid ${C.line}`, color: C.ink }}>
                  <img src={IC_WATER} alt="" className="w-5 h-5 rounded-full object-cover" />
                  <span className="font-semibold">{e.t}</span>
                  <span className="ml-auto font-extrabold" style={{ color: C.waterDeep }}>+{e.v} мл</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
