/* GIF үүсгэгч. */

import { useEffect, useMemo, useRef, useState } from "react";
import { C } from "../lib/theme.js";
import { Card, Header, MineToggle, Pill } from "../ui/primitives.jsx";
import { Download, Pause, Play, Upload, X } from "lucide-react";
import { IC_GIF } from "../lib/assets.js";
import { compressImage } from "../lib/image.js";

/* Санг нэг л удаа татна — дараагийн дуудлагууд ижил promise-ыг хуваалцана */
let gifLibPromise = null;

const loadGifLib = () => {
  if (!gifLibPromise) {
    gifLibPromise = Promise.all([
      import("gif.js"),
      import("gif.js/dist/gif.worker.js?url"),
    ]).then(([mod, worker]) => ({ GIF: mod.default, workerUrl: worker.default }));
  }
  return gifLibPromise;
};

/* ── GIF ── */
export function GifScreen({ frames, setFrames, partner, onBack }) {
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(300);
  const [idx, setIdx] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [mine, setMine] = useState(true);
  const inputRef = useRef(null);

  const pFrames = useMemo(() => (partner?.gifFrames || []).map((thumb, i) => ({ id: `p${i}`, url: thumb })), [partner]);
  const activeFrames = mine ? frames : pFrames;

  useEffect(() => {
    if (!playing || activeFrames.length < 2) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % activeFrames.length), speed);
    return () => clearInterval(id);
  }, [playing, speed, activeFrames.length]);

  const handleSave = () => {
    if (!activeFrames.length || saving) return;
    setSaving(true);
    setSaveProgress(0);
    const W = 480, H = 360;
    Promise.all([
      loadGifLib(),
      ...activeFrames.map((f) => new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = f.url;
      })),
    ]).then(([{ GIF, workerUrl }, ...imgs]) => {
      const gif = new GIF({ workers: 2, quality: 10, width: W, height: H, workerScript: workerUrl });
      imgs.forEach((img) => {
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const ctx = canvas.getContext("2d");
        ctx.fillStyle = "#F8F4FC";
        ctx.fillRect(0, 0, W, H);
        const ir = img.width / img.height, cr = W / H;
        let dw, dh, dx, dy;
        if (ir > cr) { dw = W; dh = dw / ir; dx = 0; dy = (H - dh) / 2; }
        else { dh = H; dw = dh * ir; dx = (W - dw) / 2; dy = 0; }
        ctx.drawImage(img, dx, dy, dw, dh);
        gif.addFrame(ctx, { delay: speed, copy: true });
      });
      gif.on("progress", (p) => setSaveProgress(p));
      gif.on("finished", (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ankomeow.gif";
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        setSaving(false);
        setSaveProgress(0);
      });
      gif.render();
    }).catch(() => setSaving(false));
  };

  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    const added = files.map((x) => ({ id: Math.random(), url: URL.createObjectURL(x) }));
    setFrames((f) => [...f, ...added]);
    files.forEach((file, i) => {
      compressImage(file, 220, 0.5).then((thumb) => {
        setFrames((f) => f.map((fr) => (fr.id === added[i].id ? { ...fr, thumb } : fr)));
      }).catch(() => {});
    });
  };

  return (
    <div>
      <Header title="GIF хийх" sub={`${activeFrames.length} кадр`} onBack={onBack} />

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      <div className="rounded-[26px] overflow-hidden mb-4 flex items-center justify-center"
        style={{ background: C.cardIn, border: `1.8px solid ${C.line}`, aspectRatio: "4/3" }}>
        {activeFrames.length ? (
          <img src={activeFrames[idx % activeFrames.length].url} alt="" className="w-full h-full object-contain" />
        ) : (
          <div className="text-center px-8">
            <img src={IC_GIF} alt="" className="w-14 h-14 mx-auto mb-2 rounded-2xl object-cover" />
            <p className="text-[12.5px] font-semibold" style={{ color: C.inkSoft }}>
              {mine ? "Зурагнууд нэмээд давталт үүсгэнэ" : "Хамтрагч одоогоор GIF хийгээгүй байна"}
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {mine && (
          <button onClick={() => inputRef.current?.click()}
            className="flex-1 rounded-full py-3 text-[13.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
            <Upload size={16} strokeWidth={2.4} /> Зураг нэмэх
          </button>
        )}
        {playing ? (
          <Pill onClick={() => setPlaying(false)} disabled={activeFrames.length < 2}
            className={`${mine ? "px-5" : "flex-1 py-3"} disabled:opacity-40`} aria-label="Түр зогсоох">
            <Pause size={17} strokeWidth={2.4} />
          </Pill>
        ) : (
          <button onClick={() => setPlaying(true)} disabled={activeFrames.length < 2}
            className={`active:scale-95 disabled:opacity-40 flex items-center justify-center gap-2 rounded-full ${mine ? "shrink-0 w-[42px] h-[42px]" : "flex-1 py-3 text-[13.5px] font-extrabold"}`}
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }} aria-label="Эхлэх">
            <Play size={mine ? 17 : 16} strokeWidth={2.4} fill="#fff" /> {!mine && "Тоглуулах"}
          </button>
        )}
        {mine && <input ref={inputRef} type="file" accept="image/*" multiple onChange={onPick} className="hidden" />}
      </div>

      <Card tint="#F8F4FC" className="mb-4">
        <div className="flex justify-between text-[13px] mb-2.5">
          <span className="font-extrabold" style={{ color: C.ink }}>Кадрын хугацаа</span>
          <span className="font-bold" style={{ color: C.lilacDeep }}>{speed} мс</span>
        </div>
        <input type="range" min="80" max="800" step="20" value={speed} onChange={(e) => setSpeed(+e.target.value)} className="w-full" />
      </Card>

      <button onClick={handleSave} disabled={!activeFrames.length || saving}
        className="w-full mb-4 rounded-full py-3 text-[13.5px] font-extrabold flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
        style={{ background: C.peachDeep, color: "#fff", transition: "transform 150ms ease" }}>
        {saving ? `Хадгалж байна… ${Math.round(saveProgress * 100)}%` : <><Download size={16} strokeWidth={2.4} /> Хадгалах</>}
      </button>

      {mine && frames.length > 0 && (
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

      {!mine && pFrames.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {pFrames.map((f, i) => (
            <img key={f.id} src={f.url} alt="" className="w-14 h-14 object-cover rounded-2xl shrink-0"
              style={{ border: `2.5px solid ${i === idx % pFrames.length ? C.lilacDeep : C.line}` }} />
          ))}
        </div>
      )}

      <p className="text-[11px] mt-4 leading-relaxed px-1 font-medium" style={{ color: C.inkSoft }}>
        "Хадгалах" дарахад кадруудыг нэгтгэж .gif файл болгон утсанд татаж авна.
      </p>
    </div>
  );
}
