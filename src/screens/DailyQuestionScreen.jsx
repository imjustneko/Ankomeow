/* Өдрийн асуулт — өөрөө хариулсны дараа л хамтрагчийнх нээгдэнэ. */

import { useEffect, useState } from "react";
import { C } from "../lib/theme.js";
import { Card, Header } from "../ui/primitives.jsx";
import { auth, qaCol, qaDoc } from "../lib/firebase.js";
import { limit, onSnapshot, orderBy, query, setDoc } from "firebase/firestore";
import { questionForDay } from "../lib/questions.js";
import { notifyPartner } from "../push.js";
import { Check, Lock } from "lucide-react";

/* ── Өдрийн асуулт ── */
export function DailyQuestionScreen({ accountKey, partnerKey, partnerName, profileName, today, onBack }) {
  const [rows, setRows] = useState([]);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!accountKey) return;
    /* Сүүлийн 30 хоног — түүхийг доор нь харуулна */
    const q = query(qaCol(), orderBy("d", "desc"), limit(30));
    return onSnapshot(q, (s) => setRows(s.docs.map((x) => ({ id: x.id, ...x.data() }))), () => {});
  }, [accountKey]);

  const todayRow = rows.find((r) => r.d === today);
  const myAnswer = todayRow?.[accountKey] || "";
  const partnerAnswer = partnerKey ? todayRow?.[partnerKey] || "" : "";

  useEffect(() => {
    if (!editing) setDraft(myAnswer);
  }, [myAnswer, editing]);

  const save = () => {
    const t = draft.trim();
    if (!t) return;
    setDoc(qaDoc(today), { d: today, q: questionForDay(today), [accountKey]: t.slice(0, 600) }, { merge: true })
      .catch(() => {});
    setEditing(false);
    notifyPartner(auth, {
      to: partnerKey,
      title: profileName,
      body: "Өдрийн асуултад хариуллаа 💭",
      tag: "qa",
      tab: "qa",
    });
  };

  const past = rows.filter((r) => r.d !== today && (r[accountKey] || (partnerKey && r[partnerKey])));

  return (
    <div>
      <Header title="Өдрийн асуулт" sub="Өдөрт нэг асуулт, хоёулаа" onBack={onBack} />

      <Card tint="#F8F4FC" className="mb-3">
        <div className="text-[10px] font-extrabold mb-1.5" style={{ color: C.lilacDeep }}>ӨНӨӨДӨР</div>
        <div className="text-[15px] font-extrabold leading-snug mb-3" style={{ color: C.ink }}>
          {questionForDay(today)}
        </div>

        <textarea value={draft} onChange={(e) => { setEditing(true); setDraft(e.target.value.slice(0, 600)); }}
          placeholder="Хариултаа бичээрэй…" rows={3}
          className="w-full rounded-[18px] px-4 py-3 text-[15px] font-medium outline-none resize-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />

        <button onClick={save} disabled={!draft.trim() || draft.trim() === myAnswer}
          className="w-full mt-2 h-10 rounded-full text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-35"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Check size={15} strokeWidth={2.6} /> {myAnswer ? "Шинэчлэх" : "Хариулах"}
        </button>
      </Card>

      <Card tint={partnerAnswer && myAnswer ? "#FEF6F1" : C.card} className="mb-4">
        <div className="text-[10px] font-extrabold mb-1.5" style={{ color: C.peachDeep }}>
          {(partnerName || "ХАМТРАГЧ").toUpperCase()}
        </div>
        {!partnerAnswer ? (
          <div className="text-[12.5px] font-bold leading-snug" style={{ color: C.inkSoft }}>
            Хараахан хариулаагүй байна.
          </div>
        ) : !myAnswer ? (
          /* Эхлээд өөрөө хариулна — тэгэхгүй бол нөгөөгийнхөө үгээр нөлөөлүүлнэ */
          <div className="flex items-center gap-2">
            <Lock size={14} strokeWidth={2.4} style={{ color: C.inkSoft }} />
            <span className="text-[12.5px] font-bold" style={{ color: C.inkSoft }}>
              Хариулсан байна. Эхлээд өөрөө хариулаарай.
            </span>
          </div>
        ) : (
          <div className="text-[14px] font-semibold leading-relaxed whitespace-pre-wrap" style={{ color: C.ink }}>
            {partnerAnswer}
          </div>
        )}
      </Card>

      {past.length > 0 && (
        <>
          <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Өмнөх өдрүүд</div>
          <div className="space-y-2.5">
            {past.map((r) => (
              <Card key={r.id} tint={C.card}>
                <div className="text-[10px] font-bold mb-1" style={{ color: C.inkSoft }}>{r.d}</div>
                <div className="text-[12.5px] font-extrabold mb-2 leading-snug" style={{ color: C.ink }}>
                  {r.q || questionForDay(r.d)}
                </div>
                {[
                  { name: profileName || "Би", a: r[accountKey], c: C.lilacDeep },
                  { name: partnerName, a: partnerKey ? r[partnerKey] : "", c: C.peachDeep },
                ].filter((x) => x.a).map((x, i) => (
                  <div key={i} className="mb-1.5 last:mb-0">
                    <span className="text-[10px] font-extrabold" style={{ color: x.c }}>{x.name}</span>
                    <div className="text-[12.5px] font-semibold leading-snug whitespace-pre-wrap" style={{ color: C.ink }}>{x.a}</div>
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
