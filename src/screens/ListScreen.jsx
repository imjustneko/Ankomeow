/* Хийх зүйлсийн жагсаалт. */

import { useState } from "react";
import { C } from "../lib/theme.js";
import { Bar, Card, Header, MineToggle } from "../ui/primitives.jsx";
import { Check, Plus, Trash2 } from "lucide-react";
import { LOGO } from "../lib/assets.js";

/* ── Жагсаалт ── */
export function ListScreen({ items, setItems, partner, onBack }) {
  const [text, setText] = useState("");
  const [mine, setMine] = useState(true);
  const done = items.filter((i) => i.done).length;
  const pItems = partner?.items || [];
  const pDone = pItems.filter((i) => i.done).length;
  const addItem = () => {
    const t = text.trim();
    if (!t) return;
    setItems((l) => [...l, { id: Date.now(), text: t, done: false }]);
    setText("");
  };

  return (
    <div>
      <Header title="Нэг жагсаалт"
        sub={mine ? `${done}/${items.length} биелсэн` : `${pDone}/${pItems.length} биелсэн`}
        onBack={onBack} />

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      <Card tint="#F5FBF3" className="mb-4">
        <div className="flex items-center gap-3">
          <img src={LOGO} alt="" className="w-12 h-12 rounded-2xl object-cover shrink-0"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="flex-1">
            <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>Өнөөдрийн явц</div>
            <Bar value={mine ? done : pDone} max={Math.max(mine ? items.length : pItems.length, 1)} color={C.sageDeep} />
          </div>
        </div>
      </Card>

      {mine ? (
        <>
          <div className="flex gap-2 mb-4">
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Юу хийх вэ?"
              enterKeyHint="done" autoCapitalize="sentences" autoCorrect="off"
              className="flex-1 rounded-full px-5 py-2.5 text-[16px] font-medium outline-none"
              style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
            <button onClick={addItem}
              className="shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center active:scale-95"
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
        </>
      ) : (
        <div className="space-y-2">
          {pItems.length === 0 ? (
            <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна.</p>
          ) : pItems.map((it) => (
            <div key={it.id} className="flex items-center gap-3 rounded-full px-4 py-3"
              style={{ background: it.done ? "#F5FBF3" : C.card, border: `1.5px solid ${C.line}` }}>
              <div className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                style={{ border: `2px solid ${it.done ? C.sageDeep : C.line2}`, background: it.done ? C.sageDeep : "transparent" }}>
                {it.done && <Check size={14} strokeWidth={3.2} color="#fff" />}
              </div>
              <span className="flex-1 text-[14px] font-semibold" style={{
                color: it.done ? C.inkSoft : C.ink, textDecoration: it.done ? "line-through" : "none",
              }}>{it.text}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
