import { useState, useEffect, useRef, useMemo } from "react";
import {
  Home, Droplet, ListChecks, Hourglass, Film, MapPin, Plus, Check,
  Trash2, Play, Pause, Upload, RotateCcw, ChevronLeft, X,
} from "lucide-react";

/* ── хэрэглэгчийн өгсөн зургууд ── */
const LOGO = "data:image/webp;base64,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";
const GIRL = "data:image/webp;base64,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";
const BOY = "data:image/webp;base64,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";

/* ── логоноос авсан өнгөний систем ── */
const C = {
  paper: "#FDF8EF",
  paper2: "#F4EADA",
  card: "#FFFDF8",
  cardIn: "#F2E9DA",
  ink: "#5C4A3A",
  inkSoft: "#A08C77",
  line: "rgba(92,74,58,0.15)",
  line2: "rgba(92,74,58,0.32)",
  peach: "#F5AF8E",
  peachDeep: "#E8825C",
  sage: "#AFCDA6",
  sageDeep: "#7CAF71",
  water: "#8AD0EC",
  waterDeep: "#3FA3D1",
  gold: "#E3BC61",
  lilac: "#C6B0DD",
  lilacDeep: "#9E82C4",
};

const GRAIN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.22'/%3E%3C/svg%3E\")";

const DAYS = ["Ням", "Даваа", "Мягмар", "Лхагва", "Пүрэв", "Баасан", "Бямба"];

/* ── Улаанбаатарын цаг ── */
const TZ = "Asia/Ulaanbaatar";
const ubDay = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" })
    .format(new Date());
const ubParts = () => {
  const p = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const g = (t) => Number(p.find((x) => x.type === t)?.value ?? 0);
  return { h: g("hour"), m: g("minute"), s: g("second") };
};
const pad = (n) => String(n).padStart(2, "0");

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
function Glass({ ml, goal, spillKey, spilling }) {
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
        </defs>

        {/* асгарсан ус */}
        {spilling && (
          <g key={spillKey}>
            <ellipse cx="100" cy="302" rx="52" ry="7" fill={C.water}
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

/* ── жижиг элементүүд ── */
function Bar({ value, max, color }) {
  return (
    <div className="h-[8px] rounded-full overflow-hidden" style={{ background: C.cardIn }}>
      <div className="h-full rounded-full" style={{
        width: `${Math.min((value / max) * 100, 100)}%`, background: color,
        transition: "width 700ms cubic-bezier(.22,1,.36,1)",
      }} />
    </div>
  );
}

function Card({ children, onClick, tint, className = "" }) {
  return (
    <div onClick={onClick}
      className={`rounded-[26px] p-4 ${onClick ? "cursor-pointer active:scale-[0.97]" : ""} ${className}`}
      style={{
        background: tint || C.card,
        border: `1.5px solid ${C.line}`,
        boxShadow: "0 2px 0 rgba(92,74,58,.05), 0 1px 0 rgba(255,255,255,.8) inset",
        transition: "transform 180ms ease",
      }}>
      {children}
    </div>
  );
}

function Pill({ children, onClick, active, color, className = "", ...rest }) {
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

function Header({ title, sub, onBack }) {
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

function Who({ who, setWho }) {
  const people = [
    { id: "g", img: GIRL, name: "Сарнай", color: C.peachDeep },
    { id: "b", img: BOY, name: "Тэмүүлэн", color: C.sageDeep },
  ];
  return (
    <div className="flex gap-2">
      {people.map((p) => {
        const on = who === p.id;
        return (
          <button key={p.id} onClick={() => setWho(p.id)}
            className="flex items-center gap-2 pl-1 pr-3.5 py-1 rounded-full active:scale-95"
            style={{
              background: on ? p.color : "transparent",
              border: `1.8px solid ${on ? p.color : C.line}`,
              transition: "all 200ms ease",
            }}>
            <img src={p.img} alt="" className="w-8 h-8 rounded-full object-cover"
              style={{ border: `2px solid ${on ? "#fff" : C.line}` }} />
            <span className="text-[12px] font-bold" style={{ color: on ? "#fff" : C.inkSoft }}>{p.name}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ── Ус ── */
function WaterScreen({ ml, setMl, log, setLog, weight, setWeight, goal, who, setWho, onBack }) {
  const [spillKey, setSpillKey] = useState(0);
  const [spilling, setSpilling] = useState(false);
  const timer = useRef(null);

  const cups = [
    { v: 100, label: "Балга" }, { v: 200, label: "Аяга" },
    { v: 330, label: "Лааз" }, { v: 500, label: "Шил" },
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
      setLog((l) => [{ v, t: `${pad(t.h)}:${pad(t.m)}`, who }, ...l]);
    }
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  const over = ml > goal;

  return (
    <div>
      <Header title="Ус уух" sub={`${ml} / ${goal} мл · ${Math.floor(ml / 250)} аяга`} onBack={onBack} />

      <div className="mb-3"><Who who={who} setWho={setWho} /></div>

      <div className="flex justify-center mb-2"><Glass {...{ ml, goal, spillKey, spilling }} /></div>

      {over && (
        <div className="rounded-full px-4 py-2 mb-4 text-center text-[12.5px] font-bold"
          style={{ background: C.peach, color: "#fff" }}>
          {ml > goal * 1.5
            ? "Нэлээд давлаа — жигд хуваарилж уувал биед зөв"
            : "Аяга дүүрч асгарлаа! Зорилго биелсэн 🎉"}
        </div>
      )}

      <div className="grid grid-cols-4 gap-2 mb-3">
        {cups.map((c) => (
          <button key={c.v} onClick={() => add(c.v)}
            className="rounded-full py-3 active:scale-95"
            style={{ background: C.card, border: `1.8px solid ${C.line2}`, transition: "transform 150ms ease" }}>
            <div className="text-[15px] font-extrabold" style={{ color: C.waterDeep }}>{c.v}</div>
            <div className="text-[9.5px] font-semibold mt-0.5" style={{ color: C.inkSoft }}>{c.label}</div>
          </button>
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
              <img src={e.who === "b" ? BOY : GIRL} alt="" className="w-5 h-5 rounded-full object-cover" />
              <span className="font-semibold">{e.t}</span>
              <span className="ml-auto font-extrabold" style={{ color: C.waterDeep }}>+{e.v} мл</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Жагсаалт ── */
function ListScreen({ items, setItems, onBack }) {
  const [text, setText] = useState("");
  const done = items.filter((i) => i.done).length;
  const addItem = () => {
    const t = text.trim();
    if (!t) return;
    setItems((l) => [...l, { id: Date.now(), text: t, done: false }]);
    setText("");
  };

  return (
    <div>
      <Header title="Нэг жагсаалт" sub={`${done}/${items.length} биелсэн`} onBack={onBack} />

      <Card tint="#F5FBF3" className="mb-4">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="flex-1">
            <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>Өнөөдрийн явц</div>
            <Bar value={done} max={Math.max(items.length, 1)} color={C.sageDeep} />
          </div>
        </div>
      </Card>

      <div className="flex gap-2 mb-4">
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Юу хийх вэ?"
          className="flex-1 rounded-full px-5 py-2.5 text-[14px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
        <button onClick={addItem} className="rounded-full w-12 flex items-center justify-center active:scale-95"
          style={{ background: C.sageDeep, color: "#fff", transition: "transform 150ms ease" }} aria-label="Нэмэх">
          <Plus size={19} strokeWidth={2.6} />
        </button>
      </div>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="flex items-center gap-3 rounded-full px-4 py-3"
            style={{ background: it.done ? "#F5FBF3" : C.card, border: `1.5px solid ${C.line}` }}>
            <button onClick={() => setItems((l) => l.map((x) => x.id === it.id ? { ...x, done: !x.done } : x))}
              className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
              style={{ border: `2px solid ${it.done ? C.sageDeep : C.line2}`, background: it.done ? C.sageDeep : "transparent" }}
              aria-label="Тэмдэглэх">
              {it.done && <Check size={14} strokeWidth={3.2} color="#fff" />}
            </button>
            <span className="flex-1 text-[14px] font-semibold" style={{
              color: it.done ? C.inkSoft : C.ink, textDecoration: it.done ? "line-through" : "none",
            }}>{it.text}</span>
            <button onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))}
              style={{ color: C.inkSoft }} aria-label="Устгах">
              <Trash2 size={15} strokeWidth={2} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Дэлгэцийн цаг ── */
const APPS = [
  { name: "Instagram", min: 42, color: C.peachDeep },
  { name: "YouTube", min: 26, color: "#E08A8A" },
  { name: "Messenger", min: 18, color: C.waterDeep },
  { name: "Chrome", min: 9, color: C.sageDeep },
  { name: "Notes", min: 5, color: C.gold },
];
const WEEK = [95, 142, 118, 80, 165, 210, 100];

function ScreenTimeScreen({ onBack }) {
  const total = APPS.reduce((s, a) => s + a.min, 0);
  const maxW = Math.max(...WEEK);
  const today = new Date().getDay();

  return (
    <div>
      <Header title="Дэлгэцийн цаг" sub="Өнөөдөр" onBack={onBack} />

      <Card tint="#FEF6F1" className="mb-4">
        <div className="text-[36px] font-extrabold leading-none" style={{ color: C.peachDeep }}>
          {Math.floor(total / 60)}ц {total % 60}м
        </div>
        <p className="text-[12px] mt-1.5 font-semibold" style={{ color: C.inkSoft }}>
          Долоо хоногийн дунджаас 18 минут бага
        </p>
        <div className="flex items-end gap-2 h-[78px] mt-4">
          {WEEK.map((v, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-full" style={{
                height: `${(v / maxW) * 56}px`,
                background: i === today ? C.peachDeep : C.peach, opacity: i === today ? 1 : 0.5,
              }} />
              <span className="text-[9.5px] font-bold" style={{ color: C.inkSoft }}>{DAYS[i][0]}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Аппаар</div>
      <div className="space-y-2.5">
        {APPS.map((a) => (
          <Card key={a.name}>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full shrink-0" style={{ background: a.color, opacity: 0.9 }} />
              <div className="flex-1">
                <div className="flex justify-between text-[13px] mb-1.5">
                  <span className="font-extrabold" style={{ color: C.ink }}>{a.name}</span>
                  <span className="font-bold" style={{ color: C.inkSoft }}>{a.min} мин</span>
                </div>
                <Bar value={a.min} max={APPS[0].min} color={a.color} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <p className="text-[11px] mt-4 leading-relaxed px-1 font-medium" style={{ color: C.inkSoft }}>
        Демо өгөгдөл. Жинхэнэ тоог системээс авна — Android: UsageStatsManager, iOS: Screen Time API.
      </p>
    </div>
  );
}

/* ── GIF ── */
function GifScreen({ frames, setFrames, onBack }) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(300);
  const [idx, setIdx] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!playing || frames.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % frames.length), speed);
    return () => clearInterval(id);
  }, [playing, speed, frames.length]);

  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    setFrames((f) => [...f, ...files.map((x) => ({ id: Math.random(), url: URL.createObjectURL(x) }))]);
  };

  return (
    <div>
      <Header title="GIF хийх" sub={`${frames.length} кадр`} onBack={onBack} />

      <div className="rounded-[26px] overflow-hidden mb-4 flex items-center justify-center"
        style={{ background: "#F8F4FC", border: `1.8px solid ${C.line}`, aspectRatio: "4/3" }}>
        {frames.length ? (
          <img src={frames[idx % frames.length].url} alt="" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center px-8">
            <Film size={32} strokeWidth={1.6} color={C.lilacDeep} className="mx-auto mb-2" />
            <p className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>Зурагнууд нэмээд давталт үүсгэнэ</p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        <button onClick={() => inputRef.current?.click()}
          className="flex-1 rounded-full py-3 text-[13.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Upload size={16} strokeWidth={2.4} /> Зураг нэмэх
        </button>
        <Pill onClick={() => setPlaying((p) => !p)} disabled={frames.length < 2}
          className="px-5 disabled:opacity-40" aria-label="Тоглуулах">
          {playing ? <Pause size={17} strokeWidth={2.4} /> : <Play size={17} strokeWidth={2.4} />}
        </Pill>
        <input ref={inputRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />
      </div>

      <Card tint="#F8F4FC" className="mb-4">
        <div className="flex justify-between text-[13px] mb-2.5">
          <span className="font-extrabold" style={{ color: C.ink }}>Кадрын хугацаа</span>
          <span className="font-bold" style={{ color: C.lilacDeep }}>{speed} мс</span>
        </div>
        <input type="range" min="80" max="800" step="20" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full" />
      </Card>

      {frames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {frames.map((f, i) => (
            <div key={f.id} className="relative shrink-0">
              <img src={f.url} alt="" className="w-14 h-14 object-cover rounded-2xl"
                style={{ border: `2.5px solid ${i === idx % frames.length ? C.lilacDeep : C.line}` }} />
              <button onClick={() => setFrames((l) => l.filter((x) => x.id !== f.id))}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: C.ink, color: "#fff" }} aria-label="Кадр хасах">
                <X size={11} strokeWidth={3} />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="text-[11px] mt-4 leading-relaxed px-1 font-medium" style={{ color: C.inkSoft }}>
        Прототипт давталтыг урьдчилж харуулна. Бодит .gif гаргахад gif.js эсвэл ffmpeg.wasm ашиглана.
      </p>
    </div>
  );
}

/* ── Байршил ── */
function LocationCard() {
  const [s, setS] = useState({ status: "idle" });
  const ask = () => {
    if (!navigator.geolocation) return setS({ status: "error", msg: "Төхөөрөмж байршил дэмжихгүй байна." });
    setS({ status: "loading" });
    navigator.geolocation.getCurrentPosition(
      (p) => setS({ status: "ok", lat: p.coords.latitude.toFixed(4), lng: p.coords.longitude.toFixed(4), acc: Math.round(p.coords.accuracy) }),
      () => setS({ status: "error", msg: "Зөвшөөрөл өгөгдөөгүй." }),
      { timeout: 8000 }
    );
  };
  return (
    <Card tint="#FFFAF0">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.gold }}>
          <MapPin size={17} strokeWidth={2.2} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Байршил</div>
          <div className="text-[11.5px] truncate font-medium" style={{ color: C.inkSoft }}>
            {s.status === "ok" && `${s.lat}, ${s.lng} · ±${s.acc}м`}
            {s.status === "loading" && "Хайж байна…"}
            {s.status === "error" && s.msg}
            {s.status === "idle" && "Одоогийн цэгээ тэмдэглэх"}
          </div>
        </div>
        <Pill onClick={ask} className="text-[12px] px-4 py-1.5 shrink-0">
          {s.status === "ok" ? "Дахин" : "Авах"}
        </Pill>
      </div>
    </Card>
  );
}

/* ── Нүүр ── */
function HomeScreen({ go, ml, goal, items, gifCount, who, setWho, clock, justReset }) {
  const now = new Date();
  const greet = clock.h < 11 ? "Өглөөний мэнд" : clock.h < 18 ? "Өдрийн мэнд" : "Оройн мэнд";
  const done = items.filter((i) => i.done).length;
  const stTotal = APPS.reduce((s, a) => s + a.min, 0);
  const left = 86400 - (clock.h * 3600 + clock.m * 60 + clock.s);

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <img src={LOGO} alt="Төвлөрөх Хамтрах" className="w-[52px] h-[52px] rounded-[18px] object-cover shrink-0"
          style={{ border: `1.5px solid ${C.line2}` }} />
        <div>
          <p className="text-[11px] font-bold tracking-wide" style={{ color: C.inkSoft, letterSpacing: ".06em" }}>
            {now.getMonth() + 1}-Р САРЫН {now.getDate()} · {DAYS[now.getDay()].toUpperCase()}
          </p>
          <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: C.ink }}>{greet}</h1>
        </div>
      </div>

      {justReset && (
        <div className="rounded-full px-4 py-2.5 mb-3 text-[12.5px] font-bold text-center"
          style={{ background: C.sage, color: "#fff" }}>
          Шинэ өдөр эхэллээ — бүртгэл тэглэгдлээ
        </div>
      )}

      <div className="mb-4"><Who who={who} setWho={setWho} /></div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card tint="#F5FBF3" onClick={() => go("list")}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: C.sage }}>
            <ListChecks size={20} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Нэг жагсаалт</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.sageDeep }}>{done}/{items.length}</div>
          <Bar value={done} max={Math.max(items.length, 1)} color={C.sageDeep} />
        </Card>

        <Card tint="#F4FBFE" onClick={() => go("water")}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: C.water }}>
            <Droplet size={20} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Ус уух</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.waterDeep }}>
            {Math.floor(ml / 250)}/{Math.round(goal / 250)} аяга
          </div>
          <Bar value={ml} max={goal} color={C.waterDeep} />
        </Card>

        <Card tint="#FEF6F1" onClick={() => go("screen")}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: C.peach }}>
            <Hourglass size={19} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Дэлгэцийн цаг</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.peachDeep }}>
            {Math.floor(stTotal / 60)}ц {stTotal % 60}м
          </div>
          <Bar value={stTotal} max={240} color={C.peachDeep} />
        </Card>

        <Card tint="#F8F4FC" onClick={() => go("gif")}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-2" style={{ background: C.lilac }}>
            <Film size={19} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>GIF хийх</div>
          <div className="text-[11.5px] font-bold" style={{ color: C.lilacDeep }}>
            {gifCount ? `${gifCount} кадр` : "Шинээр эхлэх"}
          </div>
        </Card>
      </div>

      <div className="mb-3"><LocationCard /></div>

      <div className="text-center text-[11px] font-bold pb-1" style={{ color: C.inkSoft }}>
        Шинэчлэх хүртэл {pad(Math.floor(left / 3600))}:{pad(Math.floor(left / 60) % 60)}:{pad(left % 60)} · УБ цагаар
      </div>
    </div>
  );
}

/* ── апп ── */
export default function App() {
  const [booted, setBooted] = useState(false);
  const [tab, setTab] = useState("home");
  const [who, setWho] = useState("g");
  const [ml, setMl] = useState(750);
  const [log, setLog] = useState([{ v: 500, t: "08:20", who: "g" }, { v: 250, t: "11:05", who: "b" }]);
  const [weight, setWeight] = useState(60);
  const [items, setItems] = useState([
    { id: 1, text: "Өглөөний дасгал 15 мин", done: true },
    { id: 2, text: "Ном 10 хуудас унших", done: false },
    { id: 3, text: "Ээжрүү залгах", done: false },
  ]);
  const [frames, setFrames] = useState([]);
  const [day, setDay] = useState(ubDay());
  const [clock, setClock] = useState(ubParts());
  const [justReset, setJustReset] = useState(false);

  const goal = useMemo(() => Math.round((weight * 33) / 50) * 50, [weight]);

  useEffect(() => { const t = setTimeout(() => setBooted(true), 1500); return () => clearTimeout(t); }, []);

  /* УБ цагаар 00:00 болоход өдрийн бүртгэл тэглэгдэнэ */
  useEffect(() => {
    const id = setInterval(() => {
      setClock(ubParts());
      const d = ubDay();
      if (d !== day) {
        setDay(d);
        setMl(0);
        setLog([]);
        setItems((l) => l.map((i) => ({ ...i, done: false })));
        setJustReset(true);
        setTimeout(() => setJustReset(false), 6000);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [day]);

  const nav = [
    { id: "home", icon: Home, label: "Нүүр", c: C.ink },
    { id: "water", icon: Droplet, label: "Ус", c: C.waterDeep },
    { id: "list", icon: ListChecks, label: "Жагсаалт", c: C.sageDeep },
    { id: "screen", icon: Hourglass, label: "Дэлгэц", c: C.peachDeep },
    { id: "gif", icon: Film, label: "GIF", c: C.lilacDeep },
  ];

  return (
    <div className="w-full min-h-screen flex items-start justify-center py-6 px-4"
      style={{ background: C.paper2, fontFamily: "'Manrope','Inter',system-ui,-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap');
        @keyframes wvA { from { transform: translateX(0) } to { transform: translateX(-56px) } }
        @keyframes wvB { from { transform: translateX(0) } to { transform: translateX(-44px) } }
        @keyframes rise { 0%{transform:translateY(0) scale(.5);opacity:0} 25%{opacity:.65} 100%{transform:translateY(-150px) scale(1);opacity:0} }
        @keyframes dropL { 0%{transform:translate(0,0) scale(.3);opacity:0} 12%{opacity:1} 100%{transform:translate(-16px,272px) scale(1);opacity:0} }
        @keyframes dropR { 0%{transform:translate(0,0) scale(.3);opacity:0} 12%{opacity:1} 100%{transform:translate(16px,272px) scale(1);opacity:0} }
        @keyframes puddle { 0%{transform:scaleX(0);opacity:0} 55%{opacity:.5} 100%{transform:scaleX(1);opacity:.28} }
        @keyframes wobble { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-1.6deg)} 75%{transform:rotate(1.6deg)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        .wv-a{animation:wvA 4.5s linear infinite} .wv-b{animation:wvB 6.5s linear infinite}
        .bub{animation:rise 4s ease-in infinite}
        .dropL{animation:dropL 1.5s cubic-bezier(.5,0,.9,.5) forwards}
        .dropR{animation:dropR 1.5s cubic-bezier(.5,0,.9,.5) forwards}
        .puddle{animation:puddle 1.6s ease-out forwards}
        .scr{animation:fadeUp 320ms ease-out}
        @media (prefers-reduced-motion: reduce){ .wv-a,.wv-b,.bub,.dropL,.dropR,.puddle,.scr{animation:none} }
        input[type=range]{height:6px;border-radius:99px;background:${C.cardIn};-webkit-appearance:none;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${C.waterDeep};border:3px solid #fff;box-shadow:0 1px 4px rgba(92,74,58,.25);cursor:pointer}
        ::-webkit-scrollbar{height:5px;width:5px} ::-webkit-scrollbar-thumb{background:${C.line2};border-radius:99px}
      `}</style>

      <div className="w-full max-w-[400px] rounded-[38px] overflow-hidden flex flex-col relative"
        style={{
          background: C.paper, backgroundImage: GRAIN, backgroundBlendMode: "multiply",
          border: `2.5px solid ${C.line2}`, boxShadow: "0 24px 54px rgba(92,74,58,.16)", minHeight: "760px",
        }}>

        {/* Splash */}
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4"
          style={{
            background: C.paper, opacity: booted ? 0 : 1, pointerEvents: booted ? "none" : "auto",
            transition: "opacity 600ms ease",
          }}>
          <img src={LOGO} alt="Төвлөрөх Хамтрах" className="w-[190px] rounded-[30px]" />
        </div>

        <div className="flex-1 px-5 pt-7 pb-4 overflow-y-auto" style={{ maxHeight: "672px" }}>
          <div key={tab} className="scr">
            {tab === "home" && <HomeScreen go={setTab} {...{ ml, goal, items, who, setWho, clock, justReset }} gifCount={frames.length} />}
            {tab === "water" && <WaterScreen {...{ ml, setMl, log, setLog, weight, setWeight, goal, who, setWho }} onBack={() => setTab("home")} />}
            {tab === "list" && <ListScreen items={items} setItems={setItems} onBack={() => setTab("home")} />}
            {tab === "screen" && <ScreenTimeScreen onBack={() => setTab("home")} />}
            {tab === "gif" && <GifScreen frames={frames} setFrames={setFrames} onBack={() => setTab("home")} />}
          </div>
        </div>

        <nav className="flex justify-around items-center py-2.5 px-2 shrink-0"
          style={{ borderTop: `1.5px solid ${C.line}`, background: C.card }}>
          {nav.map(({ id, icon: Icon, label, c }) => {
            const on = tab === id;
            return (
              <button key={id} onClick={() => setTab(id)}
                className="flex flex-col items-center gap-1 px-3 py-1.5 rounded-full"
                style={{
                  background: on ? c : "transparent", color: on ? "#fff" : C.inkSoft,
                  transition: "background 220ms ease",
                }}>
                <Icon size={18} strokeWidth={on ? 2.4 : 1.9} />
                <span className="text-[9px] font-extrabold">{label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
