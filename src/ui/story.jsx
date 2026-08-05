/* Нүүрний толгойн "story" мөр — Instagram-ын дээд мөртэй ижил үүрэг:
   хамтрагчаа хамгийн түрүүнд, скроллгүйгээр харуулах.

   Зүүнд өөрийнх (дарвал профайл засах), баруунд хамтрагчийнх (дарвал явц).
   Статус эсвэл дуу тавьсан бол тойрог өнгөтэй болж "шинэ юм байна" гэдгийг
   хэлнэ — Instagram-ын уншаагүй story-тэй ижил дохио. */

import { Music } from "lucide-react";
import { C } from "../lib/theme.js";
import { IC_PROFILE } from "../lib/assets.js";

function Story({ avatar, name, active, dim, hasSong, onClick }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1.5 w-[74px] shrink-0 active:scale-95"
      style={{ transition: "transform 150ms ease" }}>
      <span className="relative w-[68px] h-[68px] rounded-full flex items-center justify-center"
        style={{
          /* Тойрог нь 2.5px зузаан цагираг — дотор талд картын өнгөөр завсар
             үлдээж аватараас тусгаарлана */
          background: active
            ? `linear-gradient(140deg, ${C.peachDeep} 0%, ${C.lilacDeep} 100%)`
            : C.line,
          transition: "background 250ms ease",
        }}>
        <img src={avatar || IC_PROFILE} alt="" className="w-[60px] h-[60px] rounded-full object-cover"
          style={{ border: `2.5px solid ${C.card}`, opacity: dim ? 0.4 : 1 }} />
        {hasSong && (
          <span className="absolute bottom-0 right-0 w-[22px] h-[22px] rounded-full flex items-center justify-center"
            style={{ background: C.lilacDeep, border: `2px solid ${C.card}` }}>
            <Music size={11} strokeWidth={2.8} color="#fff" />
          </span>
        )}
      </span>
      <span className="text-[11px] font-bold truncate max-w-full" style={{ color: dim ? C.inkSoft : C.ink }}>
        {name}
      </span>
    </button>
  );
}

export function StoryRow({ me, partner, onMe, onPartner, className = "" }) {
  return (
    <div className={`flex gap-3 ${className}`}>
      <Story avatar={me.avatar} name="Миний" onClick={onMe}
        active={!!(me.status || me.song?.title)} hasSong={!!me.song?.title} />
      {partner.name && (
        <Story avatar={partner.avatar} name={partner.name} onClick={onPartner}
          active={!!(partner.status || partner.song?.title)} hasSong={!!partner.song?.title}
          dim={partner.offline} />
      )}
    </div>
  );
}
