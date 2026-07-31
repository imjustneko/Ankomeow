/* Хадгалсан чат — зурвасын хуулбар, эх нь устсан ч үлдэнэ. */

import { useEffect, useState } from "react";
import { C } from "../lib/theme.js";
import { Card, Header } from "../ui/primitives.jsx";
import { blobDoc, savedItemDoc, savedItemsCol } from "../lib/firebase.js";
import { deleteDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { Check, Copy, Trash2 } from "lucide-react";
import { MessageBody, chatTime, copyableText, writeClipboard } from "../ui/message.jsx";

/* ── Хадгалсан чат ── */
export function SavedChatScreen({ accountKey, onBack }) {
  const [items, setItems] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    if (!accountKey) return;
    const q = query(savedItemsCol(accountKey), orderBy("savedAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [accountKey]);

  const copyItem = async (m) => {
    const t = copyableText(m);
    if (!t) return;
    try {
      await writeClipboard(t);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((id) => (id === m.id ? null : id)), 1200);
    } catch {}
  };

  const remove = (id) => {
    const it = items.find((x) => x.id === id);
    deleteDoc(savedItemDoc(accountKey, id)).catch(() => {});
    if (it?.blobId) deleteDoc(blobDoc(it.blobId)).catch(() => {});
  };

  return (
    <div>
      <Header title="Хадгалсан чат" sub="Дурсамжтай зурвасууд" onBack={onBack} />

      {items.length === 0 ? (
        <p className="text-[12px] py-10 text-center font-medium" style={{ color: C.inkSoft }}>
          Одоогоор хадгалсан зурвас алга.<br />Чат дээр зурвас дээрээ товшоод 🔖 дар.
        </p>
      ) : (
        <div className="space-y-2.5">
          {items.map((m) => {
            const mine = m.sender === accountKey;
            const draw = m.type === "drawing";
            const media = m.type === "image" || draw || m.type === "location" || (m.type === "reaction" && m.gifUrl);
            return (
              <Card key={m.id} tint={mine ? "#F8F4FC" : "#FFFFFF"}>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="text-[10px] font-bold truncate" style={{ color: C.inkSoft }}>
                    {m.senderName || (mine ? "Би" : "Хамтрагч")} · {chatTime(m.sentAt)}
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {copyableText(m) && (
                      <button onClick={() => copyItem(m)}
                        className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                        style={{ color: copiedId === m.id ? C.waterDeep : C.inkSoft, transition: "transform 120ms ease" }}
                        aria-label={copiedId === m.id ? "Хуулагдлаа" : "Хуулах"}>
                        {copiedId === m.id
                          ? <Check size={14} strokeWidth={2.6} />
                          : <Copy size={14} strokeWidth={2.2} />}
                      </button>
                    )}
                    <button onClick={() => remove(m.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                      style={{ color: C.peachDeep, transition: "transform 120ms ease" }} aria-label="Хадгалснаас хасах">
                      <Trash2 size={14} strokeWidth={2.2} />
                    </button>
                  </div>
                </div>
                <div className={`rounded-[16px] text-[13px] font-semibold ${media ? "p-1.5" : "px-3 py-2"}`}
                  style={draw
                    ? { background: "transparent", border: "none", padding: 0 }
                    : {
                      background: mine ? C.lilacDeep : C.cardIn, color: mine ? "#fff" : C.ink,
                      border: mine ? "none" : `1.5px solid ${C.line}`,
                    }}>
                  <MessageBody m={m} mine={mine} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
