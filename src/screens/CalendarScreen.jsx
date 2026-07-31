/* Хамтын календарь — төлөвлөгөө, сануулга, дурсамжийн урсгал.
   Сарын торын математик нь src/lib/calendar.js-д (тесттэй). */

import { useEffect, useMemo, useState } from "react";
import { C } from "../lib/theme.js";
import { Card, Header } from "../ui/primitives.jsx";
import { auth, eventDocRef, eventsCol } from "../lib/firebase.js";
import { addDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp } from "firebase/firestore";
import { dayNumber, leftText } from "../lib/couple.js";
import { MONTHS, WEEKDAYS, addMonths, eventsOn, monthGrid, monthKey, upcoming } from "../lib/calendar.js";
import { notifyPartner } from "../push.js";
import { ChevronLeft, Plus, Trash2 } from "lucide-react";

/* ── Хамтын календарь ── */
export function CalendarScreen({ accountKey, partnerKey, partnerName, profileName, today, coupleInfo, onBack }) {
  const [events, setEvents] = useState([]);
  const [ym, setYm] = useState(monthKey(today));
  const [sel, setSel] = useState(today);
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [memory, setMemory] = useState(false); /* дурсамж уу, төлөвлөгөө үү */

  useEffect(() => {
    if (!accountKey) return;
    return onSnapshot(query(eventsCol(), orderBy("d", "desc")),
      (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
  }, [accountKey]);

  const grid = useMemo(() => monthGrid(ym), [ym]);
  const dayEvents = eventsOn(events, sel);
  const soon = upcoming(events.filter((e) => !e.memory), today, 4);
  const memories = events.filter((e) => e.memory).slice(0, 20);
  const marked = useMemo(() => new Set(events.map((e) => e.d)), [events]);

  const add = () => {
    const t = title.trim();
    if (!t) return;
    addDoc(eventsCol(), {
      d: sel, t: time || "", title: t.slice(0, 80), memory,
      by: accountKey, createdAt: serverTimestamp(),
    }).catch(() => {});
    setTitle(""); setTime("");
    notifyPartner(auth, {
      to: partnerKey, title: profileName,
      body: memory ? `💛 Дурсамж нэмлээ: ${t.slice(0, 40)}` : `🗓 ${sel} — ${t.slice(0, 40)}`,
      tag: "cal", tab: "cal",
    });
  };

  const remove = (id) => deleteDoc(eventDocRef(id)).catch(() => {});

  const [y, m] = ym.split("-").map(Number);

  return (
    <div>
      <Header title="Хамтын календарь" sub="Төлөвлөгөө ба дурсамж" onBack={onBack} />

      <Card tint="#F4FBFE" className="mb-3">
        <div className="flex items-center justify-between mb-2.5">
          <button onClick={() => setYm(addMonths(ym, -1))} aria-label="Өмнөх сар"
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: C.card, border: `1.5px solid ${C.line2}`, color: C.ink, transition: "transform 120ms ease" }}>
            <ChevronLeft size={15} strokeWidth={2.6} />
          </button>
          <div className="text-[13.5px] font-extrabold" style={{ color: C.ink }}>{y} · {MONTHS[m - 1]}</div>
          <button onClick={() => setYm(addMonths(ym, 1))} aria-label="Дараагийн сар"
            className="w-8 h-8 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: C.card, border: `1.5px solid ${C.line2}`, color: C.ink, transition: "transform 120ms ease" }}>
            <ChevronLeft size={15} strokeWidth={2.6} style={{ transform: "rotate(180deg)" }} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w) => (
            <div key={w} className="text-[9.5px] font-extrabold text-center py-1" style={{ color: C.inkSoft }}>{w}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {grid.map((c, i) => {
            const isToday = c.d === today;
            const isSel = c.d === sel;
            return (
              <button key={i} onClick={() => setSel(c.d)}
                className="aspect-square rounded-xl flex flex-col items-center justify-center active:scale-90"
                style={{
                  background: isSel ? C.waterDeep : isToday ? C.cardIn : "transparent",
                  color: isSel ? "#fff" : c.inMonth ? C.ink : C.inkSoft,
                  opacity: c.inMonth ? 1 : 0.4,
                  border: isToday && !isSel ? `1.5px solid ${C.waterDeep}` : "1.5px solid transparent",
                  transition: "transform 120ms ease",
                }}>
                <span className="text-[11.5px] font-extrabold leading-none">{Number(c.d.slice(-2))}</span>
                {marked.has(c.d) && (
                  <span className="w-1 h-1 rounded-full mt-0.5"
                    style={{ background: isSel ? "#fff" : C.peachDeep }} />
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card tint={C.card} className="mb-3">
        <div className="text-[12.5px] font-extrabold mb-2" style={{ color: C.ink }}>{sel}</div>
        {dayEvents.length === 0 ? (
          <p className="text-[11.5px] font-semibold mb-2.5" style={{ color: C.inkSoft }}>Энэ өдөр юу ч алга.</p>
        ) : (
          <div className="space-y-1.5 mb-2.5">
            {dayEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-2 rounded-[16px] px-3 py-2"
                style={{ background: C.card, border: `1.4px solid ${C.line}` }}>
                <span className="w-1.5 h-8 rounded-full shrink-0" style={{ background: e.memory ? C.gold : C.waterDeep }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-extrabold truncate" style={{ color: C.ink }}>{e.title}</div>
                  <div className="text-[10px] font-bold" style={{ color: C.inkSoft }}>
                    {e.memory ? "Дурсамж" : e.t || "Өдрийн турш"} · {e.by === accountKey ? (profileName || "Би") : partnerName}
                  </div>
                </div>
                <button onClick={() => remove(e.id)} aria-label="Устгах" className="shrink-0 active:scale-90"
                  style={{ color: C.inkSoft, transition: "transform 120ms ease" }}>
                  <Trash2 size={14} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 mb-2">
          <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder={memory ? "Юу болсон бэ?" : "Юу төлөвлөж байна?"}
            enterKeyHint="done"
            className="flex-1 min-w-0 rounded-full px-4 py-2 text-[15px] font-medium outline-none"
            style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
          <button onClick={add} aria-label="Нэмэх"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-95"
            style={{ background: memory ? C.gold : C.waterDeep, color: "#fff", transition: "transform 150ms ease" }}>
            <Plus size={17} strokeWidth={2.6} />
          </button>
        </div>
        <div className="flex gap-2 items-center">
          {!memory && (
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)}
              className="rounded-full px-3 py-1.5 text-[13px] font-semibold outline-none"
              style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink }} />
          )}
          <button onClick={() => setMemory((v) => !v)}
            className="px-3 py-1.5 rounded-full text-[11.5px] font-extrabold active:scale-95"
            style={{
              background: memory ? C.gold : C.card, color: memory ? "#fff" : C.inkSoft,
              border: `1.6px solid ${memory ? C.gold : C.line2}`, transition: "transform 150ms ease",
            }}>
            {memory ? "💛 Дурсамж" : "🗓 Төлөвлөгөө"}
          </button>
        </div>
      </Card>

      {soon.length > 0 && (
        <>
          <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Ойрын төлөвлөгөө</div>
          <div className="space-y-2 mb-4">
            {soon.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-[18px] px-4 py-2.5"
                style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-extrabold truncate" style={{ color: C.ink }}>{e.title}</div>
                  <div className="text-[10.5px] font-bold" style={{ color: C.inkSoft }}>{e.d} {e.t}</div>
                </div>
                <span className="text-[11px] font-extrabold shrink-0" style={{ color: C.waterDeep }}>
                  {leftText(e.left)}
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {memories.length > 0 && (
        <>
          <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Дурсамжийн урсгал</div>
          <div className="space-y-2">
            {memories.map((e) => {
              const ago = coupleInfo?.since ? dayNumber(coupleInfo.since, e.d) : null;
              return (
                <div key={e.id} className="flex gap-3">
                  <div className="flex flex-col items-center shrink-0">
                    <span className="w-2.5 h-2.5 rounded-full mt-2" style={{ background: C.gold }} />
                    <span className="flex-1 w-[2px] my-1" style={{ background: C.line }} />
                  </div>
                  <div className="flex-1 min-w-0 pb-1">
                    <div className="text-[10px] font-bold" style={{ color: C.inkSoft }}>
                      {e.d}{ago ? ` · хамт байсан ${ago} дахь өдөр` : ""}
                    </div>
                    <div className="text-[13.5px] font-extrabold leading-snug" style={{ color: C.ink }}>{e.title}</div>
                  </div>
                  <button onClick={() => remove(e.id)} aria-label="Устгах" className="shrink-0 self-start mt-1.5 active:scale-90"
                    style={{ color: C.inkSoft, transition: "transform 120ms ease" }}>
                    <Trash2 size={13} strokeWidth={2.2} />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
