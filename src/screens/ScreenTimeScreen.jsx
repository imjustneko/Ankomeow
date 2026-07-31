/* Дэлгэцийн цаг. */

import { useMemo, useState } from "react";
import { C } from "../lib/theme.js";
import { Bar, Card, Header, MineToggle } from "../ui/primitives.jsx";
import { AlertTriangle, FileText, Trophy } from "lucide-react";
import { DAYS, TZ } from "../lib/time.js";

const APP_COLORS = [C.peachDeep, "#E08A8A", C.waterDeep, C.sageDeep, C.gold, C.lilacDeep];

export function ScreenTimeScreen({ screenApps, screenHistory, appMin, partner, onBack }) {
  const [mine, setMine] = useState(true);

  const activeApps = mine ? screenApps : (partner?.screenApps || []);
  const activeAppMin = mine ? appMin : (partner?.appMin || 0);
  const activeHistory = mine ? screenHistory : (partner?.screenHistory || {});
  const total = activeApps.reduce((s, a) => s + a.min, 0) + activeAppMin;

  const byApp = useMemo(() => {
    const map = new Map();
    activeApps.forEach((a) => map.set(a.name, (map.get(a.name) || 0) + a.min));
    const manual = Array.from(map, ([n, m], i) => ({ name: n, min: m, color: APP_COLORS[(i + 1) % APP_COLORS.length], auto: false }))
      .sort((a, b) => b.min - a.min);
    return activeAppMin > 0 ? [{ name: "Ankomeow", min: activeAppMin, color: APP_COLORS[0], auto: true }, ...manual] : manual;
  }, [activeApps, activeAppMin]);
  const topMin = Math.max(byApp[0]?.min ?? 1, 1);

  const week = useMemo(() => {
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      out.push({ key, label: DAYS[d.getDay()][0], v: i === 0 ? total : (activeHistory[key] || 0) });
    }
    return out;
  }, [activeHistory, total]);
  const maxW = Math.max(...week.map((w) => w.v), 1);

  const last30 = useMemo(() => {
    const out = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
      out.push(i === 0 ? total : (activeHistory[key] || 0));
    }
    return out.filter((v) => v > 0);
  }, [activeHistory, total]);
  const avg30 = last30.length ? Math.round(last30.reduce((s, v) => s + v, 0) / last30.length) : 0;
  const best30 = last30.length ? Math.min(...last30) : 0;
  const worst30 = last30.length ? Math.max(...last30) : 0;

  const myTotal = screenApps.reduce((s, a) => s + a.min, 0) + appMin;
  const partnerTotal = (partner?.screenApps || []).reduce((s, a) => s + a.min, 0) + (partner?.appMin || 0);
  const diff = Math.abs(myTotal - partnerTotal);

  return (
    <div>
      <div className="flex items-start justify-between">
        <Header title="Дэлгэцийн цаг" sub="Өнөөдөр" onBack={onBack} />
        <div className="shrink-0 mt-1 flex items-center gap-1.5 rounded-full px-3 py-1.5"
          style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.ink }}>
          <FileText size={13} strokeWidth={2.2} />
          <span className="text-[11.5px] font-extrabold">Тайлан</span>
        </div>
      </div>

      {partner && <MineToggle mine={mine} setMine={setMine} partnerName={partner.name} />}

      <Card tint="#FEF6F1" className="mb-4">
        <div className="text-[36px] font-extrabold leading-none" style={{ color: C.peachDeep }}>
          {Math.floor(total / 60)}ц {total % 60}м
        </div>
        <p className="text-[12px] mt-1.5 font-semibold" style={{ color: C.inkSoft }}>
          Ankomeow доторх цаг бодитоор, автоматаар бүртгэгдэнэ
        </p>
        <div className="flex items-end gap-2 h-[78px] mt-4">
          {week.map((w, i) => (
            <div key={w.key} className="flex-1 flex flex-col items-center gap-1.5">
              <div className="w-full rounded-full" style={{
                height: `${(w.v / maxW) * 56}px`,
                background: i === 6 ? C.peachDeep : C.peach, opacity: i === 6 ? 1 : 0.5,
              }} />
              <span className="text-[9.5px] font-bold" style={{ color: C.inkSoft }}>{w.label}</span>
            </div>
          ))}
        </div>
      </Card>

      {mine && partner && (
        <Card tint={myTotal <= partnerTotal ? "#F5FBF3" : "#FEF6F1"} className="mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
              style={{ background: myTotal <= partnerTotal ? C.sageDeep : C.peachDeep }}>
              {myTotal <= partnerTotal
                ? <Trophy size={17} strokeWidth={2.2} color="#fff" />
                : <AlertTriangle size={17} strokeWidth={2.2} color="#fff" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>
                {myTotal === partnerTotal
                  ? "Хамтрагчтайгаа тэнцүү байна!"
                  : myTotal < partnerTotal
                    ? `${partner.name}-с ${diff} мин бага ашигласан 🎉`
                    : `${partner.name}-с ${diff} мин их ашигласан`}
              </div>
              <div className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>Өнөөдрийн харьцуулалт</div>
            </div>
          </div>
        </Card>
      )}

      <Card tint="#F8F4FC" className="mb-4">
        <div className="text-[12.5px] font-extrabold mb-2.5" style={{ color: C.ink }}>Сүүлийн 30 хоног</div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: C.ink }}>{Math.floor(avg30 / 60)}ц{avg30 % 60}м</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: C.inkSoft }}>Дундаж</div>
          </div>
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: C.sageDeep }}>{Math.floor(best30 / 60)}ц{best30 % 60}м</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: C.inkSoft }}>Хамгийн бага</div>
          </div>
          <div>
            <div className="text-[15px] font-extrabold" style={{ color: C.peachDeep }}>{Math.floor(worst30 / 60)}ц{worst30 % 60}м</div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: C.inkSoft }}>Хамгийн их</div>
          </div>
        </div>
      </Card>

      <div className="text-[13px] font-extrabold mb-2.5" style={{ color: C.ink }}>Аппаар</div>
      {byApp.length === 0 ? (
        <p className="text-[12px] py-3 font-medium" style={{ color: C.inkSoft }}>Одоогоор дата алга.</p>
      ) : (
        <div className="space-y-2.5">
          {byApp.map((a) => (
            <Card key={a.name}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full shrink-0" style={{ background: a.color, opacity: 0.9 }} />
                <div className="flex-1">
                  <div className="flex justify-between items-center text-[13px] mb-1.5">
                    <span className="flex items-center gap-1.5">
                      <span className="font-extrabold" style={{ color: C.ink }}>{a.name}</span>
                      {a.auto && (
                        <span className="text-[9px] font-extrabold px-1.5 py-[1.5px] rounded-full" style={{ background: C.peach, color: C.peachDeep }}>
                          АВТОМАТ
                        </span>
                      )}
                    </span>
                    <span className="font-bold" style={{ color: C.inkSoft }}>{a.min} мин</span>
                  </div>
                  <Bar value={a.min} max={topMin} color={a.color} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
