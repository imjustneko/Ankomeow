/* Хүслийн жагсаалт — хосоороо бие биенийхээ хүслийг харна. */

import { useEffect, useState } from "react";
import { C } from "../lib/theme.js";
import { Bar, Card, Header, MineToggle } from "../ui/primitives.jsx";
import { wishDoc, wishesCol } from "../lib/firebase.js";
import { addDoc, deleteDoc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from "firebase/firestore";
import { Check, Gift, Plus, Trash2 } from "lucide-react";

/* ── Хүслийн жагсаалт ── */
export function WishScreen({ accountKey, partnerKey, partnerName, onBack }) {
  const [mine, setMine] = useState(true);
  const [myWishes, setMyWishes] = useState([]);
  const [partnerWishes, setPartnerWishes] = useState([]);
  const [text, setText] = useState("");

  /* Хоёуланг нь зэрэг сонсоно — таб солиход хүлээх шаардлагагүй */
  useEffect(() => {
    if (!accountKey) return;
    const q = query(wishesCol(accountKey), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setMyWishes(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
  }, [accountKey]);

  useEffect(() => {
    if (!partnerKey) return;
    const q = query(wishesCol(partnerKey), orderBy("createdAt", "desc"));
    return onSnapshot(q, (s) => setPartnerWishes(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
  }, [partnerKey]);

  const list = mine ? myWishes : partnerWishes;
  const done = list.filter((w) => w.done).length;

  const add = () => {
    const t = text.trim();
    if (!t) return;
    addDoc(wishesCol(accountKey), { text: t.slice(0, 200), done: false, createdAt: serverTimestamp() }).catch(() => {});
    setText("");
  };

  const toggle = (w) => updateDoc(wishDoc(accountKey, w.id), { done: !w.done }).catch(() => {});
  const remove = (id) => deleteDoc(wishDoc(accountKey, id)).catch(() => {});

  return (
    <div>
      <Header title="Хүслийн жагсаалт"
        sub={list.length ? `${done}/${list.length} биелсэн` : "Юу хүсэж байгаагаа бичээрэй"}
        onBack={onBack} />

      {partnerKey && <MineToggle mine={mine} setMine={setMine} partnerName={partnerName} />}

      <Card tint="#FFFAF0" className="mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0" style={{ background: C.gold }}>
            <Gift size={22} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] font-extrabold mb-2" style={{ color: C.ink }}>
              {mine ? "Миний хүслүүд" : `${partnerName}-ийн хүслүүд`}
            </div>
            <Bar value={done} max={Math.max(list.length, 1)} color={C.gold} />
          </div>
        </div>
      </Card>

      {mine && (
        <div className="flex gap-2 mb-4">
          <input value={text} onChange={(e) => setText(e.target.value.slice(0, 200))}
            onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Юу хүсэж байна?"
            enterKeyHint="done" autoCapitalize="sentences" autoCorrect="off"
            className="flex-1 min-w-0 rounded-full px-5 py-2.5 text-[16px] font-medium outline-none"
            style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
          <button onClick={add}
            className="shrink-0 w-[42px] h-[42px] rounded-full flex items-center justify-center active:scale-95"
            style={{ background: C.gold, color: "#fff", transition: "transform 150ms ease" }} aria-label="Нэмэх">
            <Plus size={19} strokeWidth={2.6} />
          </button>
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-[12px] py-8 text-center font-medium leading-relaxed" style={{ color: C.inkSoft }}>
          {mine
            ? "Одоогоор хүсэл алга.\nЮу ч бай — жижиг ч бай, том ч бай бичээрэй."
            : `${partnerName} хараахан хүслээ бичээгүй байна.`}
        </p>
      ) : (
        <div className="space-y-2">
          {list.map((w) => (
            <div key={w.id} className="flex items-center gap-3 rounded-[20px] px-4 py-3"
              style={{ background: w.done ? "#FFFAF0" : C.card, border: `1.5px solid ${C.line}` }}>
              {mine ? (
                <button onClick={() => toggle(w)}
                  className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                  style={{ border: `2px solid ${w.done ? C.gold : C.line2}`, background: w.done ? C.gold : "transparent" }}
                  aria-label="Биелсэн гэж тэмдэглэх">
                  {w.done && <Check size={14} strokeWidth={3.2} color="#fff" />}
                </button>
              ) : (
                <span className="w-[24px] h-[24px] rounded-full flex items-center justify-center shrink-0"
                  style={{ border: `2px solid ${w.done ? C.gold : C.line2}`, background: w.done ? C.gold : "transparent" }}>
                  {w.done && <Check size={14} strokeWidth={3.2} color="#fff" />}
                </span>
              )}
              <span className="flex-1 text-[14px] font-semibold leading-snug" style={{
                color: w.done ? C.inkSoft : C.ink, textDecoration: w.done ? "line-through" : "none",
              }}>{w.text}</span>
              {mine && (
                <button onClick={() => remove(w.id)} className="shrink-0 active:scale-90"
                  style={{ color: C.inkSoft, transition: "transform 120ms ease" }} aria-label="Устгах">
                  <Trash2 size={15} strokeWidth={2.2} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
