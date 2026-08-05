/* Хамтрагчийн явц — зөвхөн харах. */

import { useEffect } from "react";
import { C } from "../lib/theme.js";
import { Bar, Card, Header } from "../ui/primitives.jsx";
import { ACCOUNTS, CHAT_ROOM, auth, db } from "../lib/firebase.js";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { notifyPartner } from "../push.js";
import { Check } from "lucide-react";
import { IC_PROFILE } from "../lib/assets.js";
import { SongChip } from "../ui/song.jsx";
import { PostGallery } from "../ui/posts.jsx";

/* ── Хамтрагчийн явц (зөвхөн харах) ── */
export function PartnerScreen({ partner, accountKey, partnerKey, partnerStatus, partnerSong, onBack }) {
  const items = partner?.items || [];
  const done = items.filter((i) => i.done).length;
  const stTotal = (partner?.screenApps || []).reduce((s, a) => s + a.min, 0) + (partner?.appMin || 0);
  const gifCount = (partner?.gifFrames || []).length;
  const ml = partner?.ml ?? 0;
  const goal = partner?.goal || 1;

  useEffect(() => {
    if (!partnerKey || !accountKey) return;
    setDoc(doc(db, "rooms", CHAT_ROOM, "peeks", partnerKey), { from: accountKey, at: serverTimestamp() }).catch(() => {});
    notifyPartner(auth, {
      to: partnerKey,
      title: ACCOUNTS[accountKey]?.name || "Хамтрагч",
      body: "Чиний өдрийн явцыг харлаа 👀",
      tag: "peek",
      tab: "home",
    });
  }, [partnerKey, accountKey]);

  return (
    <div>
      <Header title={partner?.name || "Хамтрагч"} sub="Өнөөдрийн явц" onBack={onBack} />

      <div className="flex flex-col items-center gap-3 mb-5">
        <img src={partner?.avatar || IC_PROFILE} alt="" className="w-20 h-20 rounded-[26px] object-cover"
          style={{ border: `2px solid ${C.line2}` }} />
        {partnerStatus && (
          <div className="text-[12.5px] font-bold px-3.5 py-1.5 rounded-full text-center"
            style={{ background: C.cardIn, color: C.ink }}>{partnerStatus}</div>
        )}
        {/* Хамтрагчийн сонсож буй дуу — дарвал 30 секундын хэсэг тоглоно */}
        {partnerSong?.title && <SongChip song={partnerSong} />}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-5">
        <Card tint="#F4FBFE">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.waterDeep }}>Ус</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>{ml} / {goal} мл</div>
          <Bar value={ml} max={goal} color={C.waterDeep} />
        </Card>
        <Card tint="#F5FBF3">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.sageDeep }}>Жагсаалт</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>{done}/{items.length}</div>
          <Bar value={done} max={Math.max(items.length, 1)} color={C.sageDeep} />
        </Card>
        <Card tint="#FEF6F1">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.peachDeep }}>Дэлгэц</div>
          <div className="text-[15px] font-extrabold mb-1.5" style={{ color: C.ink }}>
            {Math.floor(stTotal / 60)}ц {stTotal % 60}м
          </div>
          <Bar value={stTotal} max={240} color={C.peachDeep} />
        </Card>
        <Card tint="#F8F4FC">
          <div className="text-[11.5px] font-bold mb-1" style={{ color: C.lilacDeep }}>GIF</div>
          <div className="text-[15px] font-extrabold" style={{ color: C.ink }}>{gifCount} кадр</div>
        </Card>
      </div>

      <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Зураг</div>
      <PostGallery ownerKey={partnerKey} emptyText="Хараахан зураг тавиагүй байна." />

      <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Жагсаалт</div>
      {items.length === 0 ? (
        <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Хоосон байна.</p>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
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
