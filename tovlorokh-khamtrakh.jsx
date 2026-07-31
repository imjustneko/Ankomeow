import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { ChevronLeft, Check, Copy, Bookmark, BookmarkCheck, Brush, Sticker, Wand2, Gift, CalendarHeart, Reply, Lock, HelpCircle, Mic, CalendarDays, Sun, Moon, SunMoon, Trash2, Pause, Play, Upload, RotateCcw, X, MapPin, Pencil, Send, Heart, MessageCircle, Image as ImageIcon, CheckCheck, Download, Share2, LogOut, Plus, FileText, RefreshCw, Trophy, AlertTriangle, Bell, BellOff } from "lucide-react";
import { collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, arrayUnion, increment } from "firebase/firestore";
import { onAuthStateChanged, signInWithEmailAndPassword, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { pushSupported, pushPermission, requestPushToken, notifyPartner, NOTIFY_ENDPOINT } from "./src/push.js";
import { useKeyboardInset } from "./src/hooks/useKeyboardInset.js";
import { useSwipeBack } from "./src/hooks/useSwipeBack.js";
import { usePullToRefresh } from "./src/hooks/usePullToRefresh.js";
import ChibiPet from "./src/chibi/ChibiPet.jsx";
import { createPokeSender } from "./src/chibi/poke.js";
import { hasUnread } from "./src/chibi/chatSignal.js";
import { C, applyTheme } from "./src/lib/theme.js";
import { Bar, Card, Pill, Header, MineToggle } from "./src/ui/primitives.jsx";
import { GifScreen } from "./src/screens/GifScreen.jsx";
import { ScreenTimeScreen } from "./src/screens/ScreenTimeScreen.jsx";
import { ListScreen } from "./src/screens/ListScreen.jsx";
import { WaterScreen, Glass } from "./src/screens/WaterScreen.jsx";
import { PartnerScreen } from "./src/screens/PartnerScreen.jsx";
import { ProfileScreen, StatusCard, CoupleDatesCard, ChangePasswordCard } from "./src/screens/ProfileScreen.jsx";
import { ChatScreen } from "./src/screens/ChatScreen.jsx";
import { DrawingView, DrawPad } from "./src/ui/drawing.jsx";
import {
  IMG, LOGO, IC_PROFILE, IC_WATER, IC_LIST, IC_TIME, IC_GIF, IC_CAT, AVATARS,
  BG_MAIN, GRAIN, WELCOME_HERO, NAV_HOME, NAV_WATER, NAV_LIST, NAV_TIME, NAV_GIF,
  CAR_LIST, CAR_WATER, CAR_SCREEN, CAR_GIF,
  LOAD_0, LOAD_25, LOAD_50, LOAD_75, LOAD_90, LOAD_100, LOAD_ALMOST, LOAD_DONE, LOAD_FINISH,
} from "./src/lib/assets.js";
import { TZ, ubDay, ubParts, pad, DAYS } from "./src/lib/time.js";
import { compressImage, compressDataUrl } from "./src/lib/image.js";
import { REACTIONS, REACTION_GIFS, QUICK_REACTIONS } from "./src/lib/reactions.js";
import {
  chatTime, loadBlob, putBlob, useBlob, savedSnapshot, copyableText, writeClipboard,
  durText, MessageBody, messagePreview,
} from "./src/ui/message.jsx";
import { SavedChatScreen } from "./src/screens/SavedChatScreen.jsx";
import { DailyQuestionScreen } from "./src/screens/DailyQuestionScreen.jsx";
import { CalendarScreen } from "./src/screens/CalendarScreen.jsx";
import { WishScreen } from "./src/screens/WishScreen.jsx";
import { MapView, TileMap, LiveMapScreen } from "./src/screens/MapScreens.jsx";
import {
  db, auth, CHAT_ROOM, ACCOUNTS, accountKeyFromEmail,
  blobsCol, blobDoc, qaCol, qaDoc, eventsCol, eventDocRef, placesCol, placeDocRef,
  coupleDoc, daysCol, dayDoc, wishesCol, wishDoc, liveDoc, profileDoc,
  savedItemsCol, savedItemDoc, stickersCol, stickerDoc, messagesCol, messageDoc,
} from "./src/lib/firebase.js";
import { DRAW_UNITS, DRAW_COLORS, DRAW_SIZES, DRAW_MIN_STEP, DRAW_MAX_POINTS, DRAW_CHECKER, strokePoints, smoothPath, assistShape } from "./src/lib/drawing.js";
import { MAP_TILE, MAP_ZOOM, MAP_W, MAP_H, MAP_MIN_Z, MAP_MAX_Z, MAP_CREDIT, tileUrl, worldPx, pxToLatLng, mapTiles } from "./src/lib/map.js";
import { questionForDay } from "./src/lib/questions.js";
import { MONTHS, WEEKDAYS, monthKey, monthGrid, addMonths, eventsOn, upcoming, isDue } from "./src/lib/calendar.js";
import { distanceM, prettyDistance, metersPerPx, placeAt, geofenceEvent, DEFAULT_RADIUS } from "./src/lib/geo.js";
import { dayNumber, nextMilestone, nextBirthday, streakCount, bothDoneDays, leftText, isValidDay } from "./src/lib/couple.js";
import { vibrationPattern, canVibrate, buzzMessage, shouldBuzz } from "./src/chibi/buzz.js";


/* ── хэрэглэгчийн зурган эх сурвалж (лого болон section icon-ууд) ──
   Зургууд public/img/ дотор жинхэнэ файлаар байрлана. Урьд нь base64-ээр JS
   bundle дотор шингэж байсан нь ~1.1MB нэмж, gzip-д шахагдахгүй, тусад нь
   кэшлэгдэхгүй, шаардлагагүй үедээ ч заавал татагддаг байлаа.
   Зам нь баримт бичгийн URL-тэй харьцангуй тул дэд зам дээр байршуулсан ч ажиллана. */



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






/* ── Апп суулгах ── */
/* Мэдэгдлийн зөвшөөрөл асуух баннер.
   state: "granted" | "default" | "denied" | "unsupported" | "needs-install" | "unconfigured" */
function NotifyBanner({ state, busy, error, onEnable, onDismiss }) {
  if (state === "granted" || state === "unconfigured") return null;

  const copy = {
    default: { title: "Мэдэгдэл асаах", sub: "Апп хаалттай байхад ч хамтрагчийн зурвас ирнэ" },
    denied: { title: "Мэдэгдэл хаалттай байна", sub: "Хөтчийн тохиргооноос Ankomeow-д зөвшөөрөл өгнө үү" },
    "needs-install": { title: "Эхлээд утсандаа суулга", sub: "iPhone дээр мэдэгдэл зөвхөн Home Screen-д суулгасны дараа ажиллана" },
    unsupported: { title: "Энэ хөтөч мэдэгдэл дэмжихгүй", sub: "Chrome эсвэл Safari-гийн шинэ хувилбар ашиглана уу" },
  }[state];

  if (!copy) return null;

  return (
    <div className="rounded-[22px] p-4 mb-4 relative" style={{
      background: `linear-gradient(158deg, #FDF6F0 0%, ${C.card} 130%)`,
      border: `1.5px solid ${C.line}`, boxShadow: "0 2px 0 rgba(92,74,58,.05), 0 1px 0 rgba(255,255,255,.8) inset",
    }}>
      <button onClick={onDismiss} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ color: C.inkSoft }} aria-label="Хаах">
        <X size={13} strokeWidth={2.4} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.lilacDeep }}>
          {state === "denied" ? <BellOff size={18} strokeWidth={2.2} color="#fff" /> : <Bell size={18} strokeWidth={2.2} color="#fff" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>{copy.title}</div>
          <div className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>{copy.sub}</div>
        </div>
      </div>

      {state === "default" && (
        <button onClick={onEnable} disabled={busy}
          className="w-full mt-3 rounded-full py-2.5 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Bell size={15} strokeWidth={2.4} /> {busy ? "Асааж байна…" : "Мэдэгдэл асаах"}
        </button>
      )}

      {error && (
        <p className="text-[11.5px] font-semibold mt-2.5 leading-relaxed" style={{ color: C.inkSoft }}>{error}</p>
      )}
    </div>
  );
}

function InstallBanner({ canInstall, isIOS, onInstall, onDismiss }) {
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  if (!canInstall && !isIOS) return null;

  return (
    <div className="rounded-[22px] p-4 mb-4 relative" style={{
      background: `linear-gradient(158deg, #F8F4FC 0%, ${C.card} 130%)`,
      border: `1.5px solid ${C.line}`, boxShadow: "0 2px 0 rgba(92,74,58,.05), 0 1px 0 rgba(255,255,255,.8) inset",
    }}>
      <button onClick={onDismiss} className="absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center"
        style={{ color: C.inkSoft }} aria-label="Хаах">
        <X size={13} strokeWidth={2.4} />
      </button>
      <div className="flex items-center gap-3 pr-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: C.lilacDeep }}>
          <Download size={18} strokeWidth={2.2} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Утсандаа суулгах</div>
          <div className="text-[11.5px] font-medium" style={{ color: C.inkSoft }}>Апп шиг нээгээд, offline ч ажиллана</div>
        </div>
      </div>

      {canInstall && (
        <button onClick={onInstall}
          className="w-full mt-3 rounded-full py-2.5 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
          <Download size={15} strokeWidth={2.4} /> Одоо суулгах
        </button>
      )}

      {!canInstall && isIOS && (
        <>
          <button onClick={() => setShowIOSHelp((s) => !s)}
            className="w-full mt-3 rounded-full py-2.5 text-[12.5px] font-extrabold flex items-center justify-center gap-2 active:scale-[0.97]"
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
            <Share2 size={15} strokeWidth={2.4} /> Яаж суулгах вэ?
          </button>
          {showIOSHelp && (
            <p className="text-[11.5px] font-semibold mt-2.5 leading-relaxed" style={{ color: C.inkSoft }}>
              Доорх <Share2 size={12} strokeWidth={2.4} style={{ display: "inline", verticalAlign: "-1px" }} /> Хуваалцах товч дараад,
              жагсаалтаас "Нүүр дэлгэц рүү нэмэх" (Add to Home Screen) сонголтыг дарна уу.
            </p>
          )}
        </>
      )}
    </div>
  );
}



/* ── Дэлгэцийн цаг ── */


/* gif.js нь зөвхөн "GIF болгож хадгалах" үед хэрэгтэй ~60KB сан. Дээд талд нь
   статикаар импортлохгүй — товч дарсан үед л татаж, дараа нь дахин ашиглана. */


/* ── Чат ── */


/* ── Хадгалсан чат ──
   Зурвасын ХУУЛБАР өөрийн аккаунтын дор хадгалагдана (эх зурвасыг заасан
   заагч биш). Ингэснээр илгээгч нь эх зурвасаа устгасан ч хадгалсан хуулбар
   үлдэнэ. Баримтын id нь эх зурвасын id — нэг зурвас хоёр удаа хадгалагдахгүй. */










/* Firestore нь undefined утгыг хүлээж авдаггүй тул зөвхөн байгаа талбарыг хуулна. */















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

/* ── Ачааллах анимаци ── */
const LOAD_FRAMES = [
  [LOAD_0, 280], [LOAD_25, 280], [LOAD_50, 280], [LOAD_75, 280],
  [LOAD_90, 320], [LOAD_100, 320], [LOAD_ALMOST, 320], [LOAD_FINISH, 320],
  [LOAD_DONE, 520],
];

function LoadingSequence({ paused = false }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    /* Апп бэлэн болмогц анимациа зогсооно — эс тэгвэл splash нуугдсан ч
       үлдсэн фрэймүүдээ ард нь татсаар байдаг. */
    if (paused || i >= LOAD_FRAMES.length - 1) return;
    const t = setTimeout(() => setI((v) => v + 1), LOAD_FRAMES[i][1]);
    return () => clearTimeout(t);
  }, [i, paused]);
  /* Зөвхөн харагдсан фрэймүүд + дараагийнхыг л DOM-д байлгана. Урьд нь 9 фрэйм
     бүгд зэрэг ордог байсан — base64 үед үнэгүй байсан ч файл болсон одоо энэ нь
     ~500KB-ыг шууд татах байлаа. Splash ихэвчлэн эхний 1-2 фрэйм дээр хаагддаг. */
  const visible = LOAD_FRAMES.slice(0, i + 2);
  return (
    <div className="relative" style={{ width: 300, height: 202 }}>
      {visible.map(([src], idx) => (
        <img key={idx} src={src} alt="" fetchPriority={idx === 0 ? "high" : "auto"}
          className="absolute inset-0 w-full h-full object-contain"
          style={{ opacity: idx === i ? 1 : 0, transition: "opacity 260ms ease" }} />
      ))}
    </div>
  );
}

/* ── Нүүрний carousel ── */
function carouselNearestIndex(root, refs) {
  const rootRect = root.getBoundingClientRect();
  const rootCenter = rootRect.left + rootRect.width / 2;
  let best = 0, bestDist = Infinity;
  refs.forEach((el, i) => {
    if (!el) return;
    const r = el.getBoundingClientRect();
    const c = r.left + r.width / 2;
    const d = Math.abs(c - rootCenter);
    if (d < bestDist) { bestDist = d; best = i; }
  });
  return best;
}

function HomeCarousel() {
  const base = [CAR_LIST, CAR_WATER, CAR_SCREEN, CAR_GIF];
  const REPS = 3;
  const slides = Array.from({ length: base.length * REPS }, (_, i) => base[i % base.length]);
  const n = base.length;
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const pausedUntil = useRef(0);
  const settleTimer = useRef(null);
  const lastIndex = useRef(n);

  const goTo = (i, smooth) => {
    const el = slideRefs.current[i];
    const root = trackRef.current;
    if (!el || !root) return;
    const target = el.offsetLeft - (root.clientWidth - el.clientWidth) / 2;
    root.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => { goTo(n, false); }, []);

  useEffect(() => {
    const id = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      const root = trackRef.current;
      if (!root) return;
      const next = carouselNearestIndex(root, slideRefs.current) + 1;
      lastIndex.current = next;
      goTo(next, true);
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const onScroll = () => {
    clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      const root = trackRef.current;
      if (!root) return;
      let cur = carouselNearestIndex(root, slideRefs.current);
      if (cur < lastIndex.current) {
        goTo(lastIndex.current, false);
        cur = lastIndex.current;
      } else {
        lastIndex.current = cur;
      }
      if (cur >= n * (REPS - 1)) {
        goTo(cur - n, false);
        lastIndex.current = cur - n;
      } else if (cur < n) {
        goTo(cur + n, false);
        lastIndex.current = cur + n;
      }
    }, 120);
  };

  const pause = () => { pausedUntil.current = Date.now() + 4000; };

  return (
    <div ref={trackRef} onScroll={onScroll} onTouchStart={pause} onPointerDown={pause} onWheel={pause}
      className="hcarousel flex gap-3 overflow-x-auto mb-4"
      style={{ scrollSnapType: "x mandatory", scrollPadding: "0 31%" }}>
      {slides.map((src, i) => (
        <img key={i} ref={(el) => (slideRefs.current[i] = el)} src={src} alt=""
          className="shrink-0 rounded-[22px] object-cover"
          style={{ width: "38%", aspectRatio: "143/602", scrollSnapAlign: "center" }} />
      ))}
    </div>
  );
}


/* ── Статус ── */


/* Нүүр дэлгэцийн "Бид хамт" карт — өдрийн тоо, ойрын ой, streak */
function TogetherCard({ info, today, streak, partnerName, accountKey, partnerKey, onOpen }) {
  const since = info?.since;
  const nth = since ? dayNumber(since, today) : null;
  const milestone = since ? nextMilestone(since, today) : null;

  /* Хоёулангийн төрсөн өдрөөс ойрхныг нь сонгоно */
  const bdays = [
    { who: "Миний", mmdd: info?.bdays?.[accountKey] },
    { who: `${partnerName}-ийн`, mmdd: partnerKey ? info?.bdays?.[partnerKey] : null },
  ].map((b) => ({ ...b, next: nextBirthday(b.mmdd, today) })).filter((b) => b.next);
  bdays.sort((a, b) => a.next.left - b.next.left);
  const bday = bdays[0];

  if (!nth && !streak && !bday) {
    return (
      <Card tint="#FEF6F1" className="mb-3" onClick={onOpen}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.peachDeep }}>
            <CalendarHeart size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Тэмдэглэлт огноо</div>
            <div className="text-[11.5px] font-bold" style={{ color: C.inkSoft }}>Хамт байж эхэлсэн өдрөө оруулаарай</div>
          </div>
          <ChevronLeft size={16} strokeWidth={2.6} style={{ color: C.inkSoft, transform: "rotate(180deg)" }} />
        </div>
      </Card>
    );
  }

  return (
    <Card tint="#FEF6F1" className="mb-3" onClick={onOpen}>
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.peachDeep }}>
          <CalendarHeart size={17} strokeWidth={2.2} color="#fff" />
        </div>
        <div className="flex-1 min-w-0">
          {nth ? (
            <>
              <div className="text-[15px] font-extrabold" style={{ color: C.ink }}>Хамт байгаа {nth} дахь өдөр</div>
              {milestone && (
                <div className="text-[11.5px] font-bold" style={{ color: C.peachDeep }}>
                  {milestone.label} — {leftText(milestone.left)}
                </div>
              )}
            </>
          ) : (
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Тэмдэглэлт огноо</div>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {streak > 0 && (
          <span className="text-[11.5px] font-extrabold px-2.5 py-1 rounded-full"
            style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.gold }}>
            🔥 {streak} өдөр дараалан
          </span>
        )}
        {bday && (
          <span className="text-[11.5px] font-extrabold px-2.5 py-1 rounded-full"
            style={{ background: C.card, border: `1.4px solid ${C.line}`, color: C.lilacDeep }}>
            🎂 {bday.who} төрсөн өдөр {leftText(bday.next.left)}
          </span>
        )}
      </div>
    </Card>
  );
}





/* ── Бодит цагийн газрын зураг ── */




/* ── Нэвтрэх (зөвхөн 2 fixed account, бүртгүүлэх боломжгүй) ── */
function LoginScreen() {
  const [pick, setPick] = useState(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pick || !password || loading) return;
    setLoading(true);
    setError("");
    try {
      await signInWithEmailAndPassword(auth, ACCOUNTS[pick].email, password);
    } catch {
      setError("Нууц үг буруу байна");
    }
    setLoading(false);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-0 text-center">
      <img src={LOGO} alt="" className="w-14 h-14 rounded-[18px] object-cover mb-3"
        style={{ border: `1.5px solid ${C.line2}` }} />
      <h1 className="text-[19px] font-extrabold mb-1" style={{ color: C.ink }}>Нэвтрэх</h1>
      <p className="text-[12px] font-semibold mb-5" style={{ color: C.inkSoft }}>Хэн бэ? Нууц үгээ оруулна уу</p>

      <div className="grid grid-cols-2 gap-3 mb-5 w-full" style={{ maxWidth: 260 }}>
        {Object.entries(ACCOUNTS).map(([key, a]) => (
          <button key={key} onClick={() => { setPick(key); setError(""); setPassword(""); }}
            className="rounded-[20px] py-4 text-[14px] font-extrabold active:scale-95"
            style={{
              background: pick === key ? C.lilacDeep : C.card,
              border: `1.8px solid ${pick === key ? C.lilacDeep : C.line2}`,
              color: pick === key ? "#fff" : C.ink,
              transition: "all 150ms ease",
            }}>
            {a.name}
          </button>
        ))}
      </div>

      <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Нууц үг" disabled={!pick} autoFocus
        autoComplete="current-password" enterKeyHint="go"
        className="w-full max-w-[240px] rounded-full px-4 py-2.5 text-[16px] font-medium text-center outline-none mb-1 disabled:opacity-40"
        style={{ background: C.card, border: `1.8px solid ${error ? C.peachDeep : C.line2}`, color: C.ink }} />
      <p className="text-[10.5px] font-bold mb-3" style={{ color: error ? C.peachDeep : "transparent", minHeight: 14 }}>
        {error || "Нууц үг буруу байна"}
      </p>

      <button onClick={submit} disabled={!pick || !password || loading}
        className="w-full max-w-[240px] rounded-full py-3 text-[13.5px] font-extrabold active:scale-[0.97] disabled:opacity-40"
        style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }}>
        {loading ? "Түр хүлээнэ үү..." : "Нэвтрэх"}
      </button>
    </div>
  );
}

/* ── Нүүр ── */
function HomeScreen({ go, ml, goal, items, gifCount, chatUnread, clock, justReset, avatar, profileName, screenApps, appMin, partner, partnerName, partnerStatus, coupleInfo, day, streak, nextEvent, accountKey, partnerKey, canInstall, isIOS, isStandalone, installDismissed, updateAvailable, onInstall, onDismissInstall, onApplyUpdate, pushState, pushBusy, pushError, pushDismissed, onEnablePush, onDismissPush }) {
  const now = new Date();
  const greet = (clock.h < 11 ? "Өглөөний мэнд" : clock.h < 18 ? "Өдрийн мэнд" : "Оройн мэнд") + (profileName ? `, ${profileName}` : "");
  const done = items.filter((i) => i.done).length;
  const stTotal = screenApps.reduce((s, a) => s + a.min, 0) + appMin;
  const left = 86400 - (clock.h * 3600 + clock.m * 60 + clock.s);

  return (
    <div>
      <div className="sticky top-0 z-10 -mx-5 -mt-7 px-5 pt-7 pb-1 flex items-center gap-3"
        style={{ background: "rgba(253,248,239,.55)", backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)" }}>
        <img src={LOGO} alt="Төвлөрөх Хамтрах" className="w-[52px] h-[52px] rounded-[18px] object-cover shrink-0"
          style={{ border: `1.5px solid ${C.line2}` }} />
        <div className="flex-1">
          <p className="text-[11px] font-bold tracking-wide" style={{ color: C.inkSoft, letterSpacing: ".06em" }}>
            {now.getMonth() + 1}-Р САРЫН {now.getDate()} · {DAYS[now.getDay()].toUpperCase()}
          </p>
          <h1 className="text-[24px] font-extrabold leading-tight" style={{ color: C.ink }}>{greet}</h1>
        </div>
        <button onClick={() => go("profile")} className="shrink-0 active:scale-95" aria-label="Профайл"
          style={{ transition: "transform 150ms ease" }}>
          <img src={avatar} alt="" className="w-9 h-9 rounded-2xl object-cover"
            style={{ border: `1.5px solid ${C.line2}` }} />
        </button>
      </div>

      <img src={WELCOME_HERO} alt="Тавтай морил" className="w-full rounded-[22px] mb-4 object-cover"
        style={{ border: `1.5px solid ${C.line2}` }} />

      {!isStandalone && !installDismissed && (
        <InstallBanner canInstall={canInstall} isIOS={isIOS} onInstall={onInstall} onDismiss={onDismissInstall} />
      )}

      {!pushDismissed && (
        <NotifyBanner state={pushState} busy={pushBusy} error={pushError} onEnable={onEnablePush} onDismiss={onDismissPush} />
      )}

      {justReset && (
        <div className="rounded-full px-4 py-2.5 mb-3 text-[12.5px] font-bold text-center"
          style={{ background: C.sage, color: "#fff" }}>
          Шинэ өдөр эхэллээ — бүртгэл тэглэгдлээ
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <Card tint="#F5FBF3" onClick={() => go("list")}>
          <img src={IC_CAT} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Нэг жагсаалт</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.sageDeep }}>{done}/{items.length}</div>
          <Bar value={done} max={Math.max(items.length, 1)} color={C.sageDeep} />
        </Card>

        <Card tint="#F4FBFE" onClick={() => go("water")}>
          <img src={IC_WATER} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Ус уух</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.waterDeep }}>
            {Math.floor(ml / 250)}/{Math.round(goal / 250)} аяга
          </div>
          <Bar value={ml} max={goal} color={C.waterDeep} />
        </Card>

        <Card tint="#FEF6F1" onClick={() => go("screen")}>
          <img src={IC_TIME} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Дэлгэцийн цаг</div>
          <div className="text-[11.5px] font-bold mb-1.5" style={{ color: C.peachDeep }}>
            {Math.floor(stTotal / 60)}ц {stTotal % 60}м
          </div>
          <Bar value={stTotal} max={240} color={C.peachDeep} />
        </Card>

        <Card tint="#F8F4FC" onClick={() => go("gif")}>
          <img src={IC_GIF} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
            style={{ border: `1.5px solid ${C.line}` }} />
          <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>GIF хийх</div>
          <div className="text-[11.5px] font-bold" style={{ color: C.lilacDeep }}>
            {gifCount ? `${gifCount} кадр` : "Шинээр эхлэх"}
          </div>
        </Card>
      </div>

      {(partnerName || updateAvailable) && (
        <div className="flex gap-3 mb-3">
          {partner ? (
            <Card tint="#FFFAF0" className="flex-1" onClick={() => go("partner")}>
              <img src={partner.avatar || IC_PROFILE} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
                style={{ border: `1.5px solid ${C.line}` }} />
              <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>{partner.name}</div>
              {partnerStatus && (
                <div className="text-[11.5px] font-bold mb-1.5 leading-snug" style={{ color: C.ink }}>{partnerStatus}</div>
              )}
              <div className="text-[11.5px] font-bold" style={{ color: C.peachDeep }}>Явцыг харах →</div>
            </Card>
          ) : partnerName ? (
            /* Хамтрагч хараахан нэвтрээгүй бол чимээгүй өнгөрөхгүй — шалтгааныг хэлнэ */
            <Card tint="#FFFAF0" className="flex-1">
              <img src={IC_PROFILE} alt="" className="w-12 h-12 rounded-2xl object-cover mb-2"
                style={{ border: `1.5px solid ${C.line}`, opacity: 0.45 }} />
              <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>{partnerName}</div>
              <div className="text-[11.5px] font-bold leading-snug" style={{ color: C.inkSoft }}>
                Хараахан нэвтрээгүй байна
              </div>
            </Card>
          ) : null}
          {updateAvailable && (
            <Card tint="#F5FBF3" className="flex-1" onClick={onApplyUpdate}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2" style={{ background: C.sageDeep }}>
                <RefreshCw size={20} strokeWidth={2.2} color="#fff" />
              </div>
              <div className="text-[13.5px] font-extrabold mb-1.5" style={{ color: C.ink }}>Шинэ хувилбар</div>
              <div className="text-[11.5px] font-bold" style={{ color: C.sageDeep }}>Шинэчлэх →</div>
            </Card>
          )}
        </div>
      )}

      <HomeCarousel />

      <TogetherCard info={coupleInfo} today={day} streak={streak} partnerName={partnerName}
        accountKey={accountKey} partnerKey={partnerKey} onOpen={() => go("profile")} />

      <Card tint="#F4FBFE" className="mb-3" onClick={() => go("cal")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.waterDeep }}>
            <CalendarDays size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Хамтын календарь</div>
            <div className="text-[11.5px] font-bold truncate" style={{ color: C.inkSoft }}>
              {nextEvent ? `${nextEvent.title} — ${leftText(nextEvent.left)}` : "Төлөвлөгөө ба дурсамж"}
            </div>
          </div>
          <ChevronLeft size={16} strokeWidth={2.6} style={{ color: C.inkSoft, transform: "rotate(180deg)" }} />
        </div>
      </Card>

      <Card tint="#F8F4FC" className="mb-3" onClick={() => go("qa")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.lilacDeep }}>
            <HelpCircle size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Өдрийн асуулт</div>
            <div className="text-[11.5px] font-bold truncate" style={{ color: C.inkSoft }}>{questionForDay(day)}</div>
          </div>
          <ChevronLeft size={16} strokeWidth={2.6} style={{ color: C.inkSoft, transform: "rotate(180deg)" }} />
        </div>
      </Card>

      <Card tint="#FFFAF0" className="mb-3" onClick={() => go("wish")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.gold }}>
            <Gift size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Хүслийн жагсаалт</div>
            <div className="text-[11.5px] font-bold" style={{ color: C.inkSoft }}>Юу хүсэж байгаагаа бичих</div>
          </div>
          <ChevronLeft size={16} strokeWidth={2.6} style={{ color: C.inkSoft, transform: "rotate(180deg)" }} />
        </div>
      </Card>

      <Card tint="#F4FBFE" className="mb-3" onClick={() => go("map")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.waterDeep }}>
            <MapPin size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Газрын зураг</div>
            <div className="text-[11.5px] font-bold" style={{ color: C.inkSoft }}>Хоёулангийнхаа байршлыг шууд харах</div>
          </div>
          <ChevronLeft size={16} strokeWidth={2.6} style={{ color: C.inkSoft, transform: "rotate(180deg)" }} />
        </div>
      </Card>

      <Card tint="#F8F4FC" className="mb-3" onClick={() => go("chat")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 relative" style={{ background: C.lilacDeep }}>
            <MessageCircle size={17} strokeWidth={2.2} color="#fff" />
            {/* Уншаагүй зурвасын тэмдэг */}
            {chatUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                style={{ background: C.peachDeep, border: "2px solid #F8F4FC" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Чат</div>
            <div className="text-[11.5px] truncate font-medium" style={{ color: C.inkSoft }}>
              {chatUnread ? "Шинэ зурвас ирсэн байна" : "Хайртай хүнтэйгээ шууд бичих"}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-3"><LocationCard /></div>

      <div className="text-center text-[11px] font-bold pb-1" style={{ color: C.inkSoft }}>
        Шинэчлэх хүртэл {pad(Math.floor(left / 3600))}:{pad(Math.floor(left / 60) % 60)}:{pad(left % 60)} · УБ цагаар
      </div>
    </div>
  );
}

/* ── апп ── */
const STORE_KEY = "ankomeow-state-v1";
const loadSaved = () => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
};

export default function App() {
  const saved = useMemo(loadSaved, []);
  const [booted, setBooted] = useState(false);
  const [splashGone, setSplashGone] = useState(false);
  const [tab, setTab] = useState("home");
  const [navDir, setNavDir] = useState("in");

  /* Таб солихдоо шилжилтийн чиглэлийг мөн тогтооно:
     нүүр рүү буцах нь "back", бусад нь "in". setTab-ын оронд үүнийг ашиглана. */
  const go = (next) => {
    setNavDir(next === "home" ? "back" : "in");
    setTab(next);
  };

  useKeyboardInset();
  /* useRef-ийн оронд state ашигладаг нь чухал: энэ div нь authReady
     болон user шалгалтын ард байрладаг тул анхны render дээр огт
     render хийгдэлгүй, зөвхөн хэсэг хугацааны дараа mount болдог.
     useRef байсан үед element mount болоход effect дахин ажиллах баталгаа байхгүй
     (dependency array дотор ref object өөрчлөгддөггүй тул), учир нь
     useSwipeBack/usePullToRefresh дотоод listener хэзээ ч холбогдохгүй
     үлдэх эрсдэлтэй байсан. setScreenEl callback ref нь element бодитоор
     mount/unmount болох мөч бүрд дуудагддаг тул энэ асуудлыг арилгана. */
  /* Өнгөний горим: "auto" бол системийн сонголтыг дагана */
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem("ankomeow-theme") || "auto");
  useEffect(() => {
    localStorage.setItem("ankomeow-theme", themeMode);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    const resolve = () => applyTheme(themeMode === "auto" ? (mq?.matches ? "dark" : "light") : themeMode);
    resolve();
    if (themeMode !== "auto" || !mq) return;
    mq.addEventListener?.("change", resolve);
    return () => mq.removeEventListener?.("change", resolve);
  }, [themeMode]);

  const [screenEl, setScreenEl] = useState(null);
  useSwipeBack(screenEl, () => go("home"), tab !== "home");

  /* Хадгалсан зурвасын id-нууд. Чат дээр товчийн төлөв, профайл дээр тоо
     хоёуланд нь хэрэгтэй тул нэг л listener-ийг энд барина. */
  const [savedIds, setSavedIds] = useState(() => new Set());
  const [myStatus, setMyStatus] = useState("");
  const [partnerStatus, setPartnerStatus] = useState("");
  const [coupleInfo, setCoupleInfo] = useState(null);
  const [doneDays, setDoneDays] = useState([]);
  const [events, setEvents] = useState([]);
  const [ml, setMl] = useState(saved.ml ?? 750);
  const [log, setLog] = useState(saved.log ?? [{ v: 500, t: "08:20" }, { v: 250, t: "11:05" }]);
  const [weight, setWeight] = useState(saved.weight ?? 60);
  const [items, setItems] = useState(saved.items ?? [
    { id: 1, text: "Өглөөний дасгал 15 мин", done: true },
    { id: 2, text: "Ном 10 хуудас унших", done: false },
    { id: 3, text: "Ээжрүү залгах", done: false },
  ]);
  const [frames, setFrames] = useState([]);
  const [day, setDay] = useState(saved.day ?? ubDay());
  const [clock, setClock] = useState(ubParts());
  const [justReset, setJustReset] = useState(false);
  const [avatar, setAvatar] = useState(saved.avatar ?? IC_PROFILE);
  const [avatarThumb, setAvatarThumb] = useState(null);
  const [peekToast, setPeekToast] = useState(null);
  const [chibiEnabled, setChibiEnabled] = useState(() => localStorage.getItem("ankomeow-chibi-off") !== "1");
  useEffect(() => {
    if (chibiEnabled) localStorage.removeItem("ankomeow-chibi-off");
    else localStorage.setItem("ankomeow-chibi-off", "1");
  }, [chibiEnabled]);
  const [chibiHappyAt, setChibiHappyAt] = useState(null);
  const [lastMsg, setLastMsg] = useState(null);       /* { sender, createdAtMs } */
  const [myReadAtMs, setMyReadAtMs] = useState(null);
  const [readsLoaded, setReadsLoaded] = useState(false); /* "уншсан" listener анх удаа ирсэн эсэх */
  const [chatNotice, setChatNotice] = useState(null); /* { text, key, onTap } */
  const [chatAct, setChatAct] = useState(null); /* { key, bubbleRect } */
  const chatActKeyRef = useRef(0);

  /* Чат руу орох бүрд дараалал нэг л удаа эхэлнэ. Дараагийн удаа орох хүртэл
     дахин эхлэхгүй — chatActArmedRef нь энэ хаалгыг барина. */
  const chatActArmedRef = useRef(false);

  useEffect(() => {
    chatActArmedRef.current = tab === "chat";
    if (tab !== "chat") setChatAct(null);
  }, [tab]);

  const handlePartnerBubble = useCallback((rect) => {
    if (!chatActArmedRef.current || !rect) return;
    chatActArmedRef.current = false; /* нэг л удаа */
    chatActKeyRef.current += 1;
    setChatAct({ key: chatActKeyRef.current, bubbleRect: rect });
  }, []);
  const [user, setUser] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const [screenApps, setScreenApps] = useState(saved.screenApps ?? []);
  const [screenHistory, setScreenHistory] = useState(saved.screenHistory ?? {});
  const screenAppsRef = useRef(screenApps);
  screenAppsRef.current = screenApps;
  const [appSeconds, setAppSeconds] = useState(saved.appSeconds ?? 0);
  const appSecondsRef = useRef(appSeconds);
  appSecondsRef.current = appSeconds;
  const appMin = Math.round(appSeconds / 60);
  const [partnerStats, setPartnerStats] = useState(null);
  const [canInstall, setCanInstall] = useState(!!window.deferredInstallPrompt);
  const [installDismissed, setInstallDismissed] = useState(() => localStorage.getItem("ankomeow-install-dismissed") === "1");
  /* main.jsx нь React mount хийхээс өмнө төлөвийг тогтоосон байж болзошгүй */
  const [updateAvailable, setUpdateAvailable] = useState(() => !!window.ankomeowUpdateReady);
  const isIOS = useMemo(() => /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream, []);
  const isStandalone = useMemo(
    () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true,
    []
  );

  const [pushState, setPushState] = useState("default");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");
  const [pushDismissed, setPushDismissed] = useState(() => localStorage.getItem("ankomeow-push-dismissed") === "1");

  const goal = useMemo(() => Math.round((weight * 33) / 50) * 50, [weight]);
  const accountKey = user ? accountKeyFromEmail(user.email) : null;
  const profileName = accountKey ? ACCOUNTS[accountKey].name : "";
  const partnerKey = accountKey === "andela" ? "neko" : accountKey === "neko" ? "andela" : null;

  /* Усны зорилго биелмэгц тухайн өдрийг тэмдэглэнэ. Нэг өдөрт нэг л удаа
     бичихийн тулд ref-ээр хаалга барина — ml өөрчлөгдөх бүрд бичихгүй. */
  const markedDayRef = useRef(null);
  useEffect(() => {
    if (!accountKey || ml < goal) return;
    if (markedDayRef.current === day) return;
    markedDayRef.current = day;
    setDoc(dayDoc(day), { d: day, [accountKey]: true }, { merge: true }).catch(() => {});
  }, [accountKey, ml, goal, day]);

  const nextEvent = useMemo(() => upcoming(events.filter((e) => !e.memory), day, 1)[0] || null, [events, day]);

  /* Цаг нь болсон сануулгыг НЭГ л удаа хөтчийн мэдэгдлээр харуулна.
     Апп нээлттэй үед л ажиллана — PWA дэвсгэрт таймер барьж чадахгүй. */
  const firedRef = useRef(new Set());
  useEffect(() => {
    if (!events.length) return;
    const check = () => {
      const { h, m } = ubParts();
      for (const e of events) {
        if (e.memory || firedRef.current.has(e.id)) continue;
        if (!isDue(e, day, h * 60 + m)) continue;
        firedRef.current.add(e.id);
        try {
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            new Notification("Ankomeow", { body: `🗓 ${e.title}`, tag: `cal-${e.id}` });
          }
        } catch {}
      }
    };
    check();
    const id = setInterval(check, 30000);
    return () => clearInterval(id);
  }, [events, day]);

  const streak = useMemo(
    () => (accountKey && partnerKey ? streakCount(bothDoneDays(doneDays, accountKey, partnerKey), day) : 0),
    [doneDays, accountKey, partnerKey, day]
  );

  useEffect(() => {
    if (!user) return;
    return onSnapshot(coupleDoc(), (s) => setCoupleInfo(s.data() || null), () => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    return onSnapshot(query(eventsCol(), orderBy("d", "desc"), limit(200)),
      (s) => setEvents(s.docs.map((d) => ({ id: d.id, ...d.data() }))), () => {});
  }, [user]);

  /* Сүүлийн 60 хоногийн биелэлт — streak тоолоход энэ хангалттай */
  useEffect(() => {
    if (!user) return;
    const q = query(daysCol(), orderBy("d", "desc"), limit(60));
    return onSnapshot(q, (s) => setDoneDays(s.docs.map((d) => d.data())), () => {});
  }, [user]);

  useEffect(() => {
    if (!accountKey) { setMyStatus(""); return; }
    const unsub = onSnapshot(profileDoc(accountKey), (s) => setMyStatus(s.data()?.status || ""), () => {});
    return unsub;
  }, [accountKey]);

  useEffect(() => {
    if (!partnerKey) { setPartnerStatus(""); return; }
    const unsub = onSnapshot(profileDoc(partnerKey), (s) => setPartnerStatus(s.data()?.status || ""), () => {});
    return unsub;
  }, [partnerKey]);

  useEffect(() => {
    if (!accountKey) { setSavedIds(new Set()); return; }
    const unsub = onSnapshot(savedItemsCol(accountKey), (snap) => {
      setSavedIds(new Set(snap.docs.map((d) => d.id)));
    }, () => {});
    return unsub;
  }, [accountKey]);

  /* Хамтрагчийн өгөгдөл onSnapshot-оор бодит цагт ирдэг ч, iOS дээр PWA удаан
     дэвсгэрт байгаад буцаж ирэхэд listener үхсэн хэвээр үлддэг. Доош татахад
     албадан дахин уншиж, зэрэг шинэ хувилбар байгаа эсэхийг шалгана. */
  const refreshAll = async () => {
    if (partnerKey) {
      try {
        const snap = await getDoc(doc(db, "rooms", CHAT_ROOM, "stats", partnerKey));
        setPartnerStats(snap.exists() ? snap.data() : null);
      } catch {}
    }
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    } catch {}
  };

  const { pull, refreshing, settling } = usePullToRefresh(screenEl, refreshAll, tab !== "chat");

  /* Splash нь урьд нь 2950ms хатуу таймераар хаагддаг байсан — апп хэдийнэ бэлэн
     болсон ч гэсэн 3 секунд зүгээр хүлээдэг байв. Одоо Firebase Auth шийдэгдмэгц
     хаагдана; зөвхөн анимаци нүд ирмэхээс өмнө алга болохгүйн тулд доод хугацаа
     барина. Auth ямар нэг шалтгаанаар хариу өгөхгүй бол хамгаалалтын дээд хугацаа. */
  const bootStartRef = useRef(Date.now());
  const SPLASH_MIN_MS = 650;
  const SPLASH_MAX_MS = 6000;

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), SPLASH_MAX_MS);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!authReady) return;
    const left = Math.max(0, SPLASH_MIN_MS - (Date.now() - bootStartRef.current));
    const t = setTimeout(() => setBooted(true), left);
    return () => clearTimeout(t);
  }, [authReady]);

  /* бүдгэрэх шилжилт (600ms) дууссаны дараа splash-ыг DOM-оос хасна */
  useEffect(() => {
    if (!booted) return;
    const t = setTimeout(() => setSplashGone(true), 650);
    return () => clearTimeout(t);
  }, [booted]);

  /* нэвтэрсэн эсэхийг Firebase Auth-аас сонсоно */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => { setUser(u); setAuthReady(true); });
    return unsub;
  }, []);

  /* төлөв бүрийг утсан дээр хадгалж, апп хаагаад дахин нээхэд алдагдахгүй */
  useEffect(() => {
    /* try/catch ЗААВАЛ хэрэгтэй: localStorage дүүрэх (том аватар, Safari private
       горим) үед setItem нь QuotaExceededError шиднэ. Effect дотор баригдаагүй
       алдаа React-ийн мод бүхэлдээ тасалдаг тул аппыг унагадаг байв. */
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({ ml, log, weight, items, day, avatar, screenApps, screenHistory, appSeconds }));
    } catch {}
  }, [ml, log, weight, items, day, avatar, screenApps, screenHistory, appSeconds]);

  /* Ankomeow дотор өнгөрүүлсэн бодит цагийг хэмжинэ.
     setInterval нь дэвсгэрт удааширдаг тул тоолуур биш, цагийн зөрүүгээр бодно —
     ингэснээр алдаа хуримтлагдахгүй, апп гэнэт хаагдсан ч секунд алдагдахгүй. */
  useEffect(() => {
    let visibleSince = document.visibilityState === "visible" ? Date.now() : null;
    let carryMs = 0;

    const flush = () => {
      if (visibleSince === null) return;
      const now = Date.now();
      carryMs += now - visibleSince;
      visibleSince = now;
      const whole = Math.floor(carryMs / 1000);
      if (whole <= 0) return;
      carryMs -= whole * 1000;
      const next = appSecondsRef.current + whole;
      appSecondsRef.current = next;
      setAppSeconds(next);
    };

    /* апп хаагдах агшинд React-ийн төлөв хадгалагдаж амжихгүй байж болзошгүй тул шууд бичнэ */
    const persistNow = () => {
      try {
        const cur = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
        localStorage.setItem(STORE_KEY, JSON.stringify({ ...cur, appSeconds: appSecondsRef.current }));
      } catch {}
    };

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        visibleSince = Date.now();
      } else {
        flush();
        visibleSince = null;
        persistNow();
      }
    };

    const onHide = () => { flush(); persistNow(); };

    const id = setInterval(flush, 1000);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onHide);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onHide);
      flush();
    };
  }, []);

  /* профайл зургийг жижиг thumbnail болгож, хамтрагчид харуулах бэлэн болгоно */
  useEffect(() => {
    compressDataUrl(avatar, 120, 0.6).then(setAvatarThumb).catch(() => setAvatarThumb(avatar));
  }, [avatar]);

  /* өөрийн ус/жагсаалт/дэлгэцийн цаг/GIF-ийн явцыг Firestore-т бичиж, хамтрагч харж чадахуйц болгоно */
  useEffect(() => {
    if (!accountKey) return;
    const gifFrames = frames.map((f) => f.thumb).filter(Boolean);
    setDoc(doc(db, "rooms", CHAT_ROOM, "stats", accountKey), {
      name: profileName, day, ml, goal, log, items, screenApps, appMin, screenHistory, gifFrames,
      ...(avatarThumb ? { avatar: avatarThumb } : {}),
    }).catch(() => {});
  }, [accountKey, profileName, day, ml, goal, log, items, screenApps, appMin, screenHistory, frames, avatarThumb]);

  /* хамтрагчийн бүртгэлийг бодит цагт сонсоно */
  useEffect(() => {
    if (!partnerKey) return;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "stats", partnerKey), (snap) => {
      setPartnerStats(snap.exists() ? snap.data() : null);
    }, () => {});
    return unsub;
  }, [partnerKey]);

  /* хамтрагч чиний мэдээллийг харлаа гэдгийг мэдэгдэх */
  useEffect(() => {
    if (!accountKey) return;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "peeks", accountKey), (snap) => {
      const at = snap.data()?.at;
      if (!at) return;
      const ms = at.toMillis();
      const lastSeen = Number(localStorage.getItem("ankomeow-last-peek") || 0);
      if (ms > lastSeen) {
        localStorage.setItem("ankomeow-last-peek", String(ms));
        setPeekToast(ACCOUNTS[partnerKey]?.name || "Хамтрагч");
        setTimeout(() => setPeekToast(null), 4000);
      }
    }, () => {});
    return unsub;
  }, [accountKey, partnerKey]);

  /* Chibi товшилтыг хос руу дамжуулах илгээгч — хосын түлхүүр солигдвол шинэчлэгдэнэ */
  const pokeSender = useMemo(() => {
    if (!partnerKey) return null;
    return createPokeSender({
      partnerName: ACCOUNTS[partnerKey]?.name || "Хамтрагч",
      /* merge: true ЗААВАЛ хэрэгтэй — эс бөгөөс баримт бүтнээрээ дарагдаж,
         increment утгагүй болно. */
      writeDoc: () =>
        setDoc(doc(db, "rooms", CHAT_ROOM, "pokes", partnerKey), {
          from: accountKey, total: increment(1), at: serverTimestamp(),
        }, { merge: true }),
      sendPush: ({ title, body, tag }) =>
        notifyPartner(auth, { to: partnerKey, title, body, tag, tab: "home" }),
    });
  }, [accountKey, partnerKey]);

  /* Хамгийн сүүлийн зурвасыг л сонсоно — нэг баримт тул хөнгөн. */
  useEffect(() => {
    if (!accountKey) return;
    const q = query(messagesCol(), orderBy("createdAt", "desc"), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      const d = snap.docs[0];
      if (!d) return setLastMsg(null);
      const data = d.data();
      setLastMsg({ sender: data.sender, createdAtMs: data.createdAt?.toMillis?.() ?? null });
    }, () => {});
    return unsub;
  }, [accountKey]);

  /* Өөрийн уншсан хугацаа */
  useEffect(() => {
    if (!accountKey) return;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "reads", accountKey), (snap) => {
      /* Өөрийн бичилтийн локал цуурай — serverTimestamp хараахан бөглөгдөөгүй
         тул at нь null байна. Үүнийг "хэзээ ч уншаагүй" гэж андуурч болохгүй. */
      if (snap.metadata.hasPendingWrites) return;
      setMyReadAtMs(snap.data()?.at?.toMillis?.() ?? null);
      setReadsLoaded(true);
    }, () => {});
    return unsub;
  }, [accountKey]);

  /* readsLoaded ирэхээс өмнө unread тооцохгүй — эс бөгөөс хоёр listener
     тусдаа snapshot-оор ирдэг тул завсрын render дээр myReadAtMs хараахан
     ачаалагдаагүй null хэвээр байхад lastMsg аль хэдийн ирсэн байж,
     худал "уншаагүй" болж таамаглагдана. */
  const chatUnread = readsLoaded && hasUnread(lastMsg, myReadAtMs, accountKey);

  /* «Уншаагүй биш» → «уншаагүй» болж шилжих агшинд бөмбөлөг нэг удаа гарна.
     Уншаагүй төлөв үргэлжилсэн ч давтан гарахгүй — nav дээрх цэг л үлдэнэ. */
  const prevUnreadRef = useRef(false);
  const noticeKeyRef = useRef(0);

  useEffect(() => {
    const was = prevUnreadRef.current;
    prevUnreadRef.current = chatUnread;

    if (!chatUnread) return setChatNotice(null);
    /* Чат дотор байгаа хүнд зурвас ирснийг мэдэгдэх нь илүүц. */
    if (tab === "chat") return setChatNotice(null);
    if (was) return; /* аль хэдийн уншаагүй байсан — дахин гаргахгүй */

    noticeKeyRef.current += 1;
    setChatNotice({
      text: "Чат ирсэн байна 💌",
      key: noticeKeyRef.current,
      onTap: () => go("chat"),
    });
  }, [chatUnread, tab]);

  /* Хос миний chibi-г товшлоо.

     Хоёр тусдаа зүйл болно:
       1. chibi баярлана — `at` хугацаанд суурилсан хуучин логик хэвээр.
          Апп нээхэд хуучин товшилт байвал ч chibi баярлана.
       2. чичиргээ / iOS-ийн мэдэгдэл — `total` тоолуурын delta-д суурилна.
          Апп нээх үеийн ЭХНИЙ snapshot-д ЭНЭ АЖИЛЛАХГҮЙ, эс бөгөөс өглөө бүр
          шөнийн товшилтуудаар чичрэх болно.

          Persistent cache асаалттай тул `onSnapshot` эхлээд КЭШЛЭГДСЭН баримтаар,
          дараа нь СЕРВЕРИЙН баримтаар дуудагдана. Тиймээс baseline-ыг зөвхөн
          `snap.metadata.fromCache === false` үед л тогтооно — эс бөгөөс кэшийн
          snapshot дээр baseline тогтоод, дараагийн серверийн snapshot дээр
          "шинэ" товшилт мэт үзэж чичирнэ. */
  const pokeBaselineReadyRef = useRef(false);

  useEffect(() => {
    if (!accountKey) return;
    pokeBaselineReadyRef.current = false;

    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "pokes", accountKey), (snap) => {
      const data = snap.data();

      /* ── 1. chibi-гийн баяр ── */
      const at = data?.at;
      if (at) {
        const ms = at.toMillis();
        const lastSeen = Number(localStorage.getItem("ankomeow-last-poke") || 0);
        if (ms > lastSeen) {
          localStorage.setItem("ankomeow-last-poke", String(ms));
          setChibiHappyAt(ms);
        }
      }

      /* ── 2. чичиргээ / iOS-ийн мэдэгдэл ── */
      const total = Number(data?.total ?? 0);
      const prev = Number(localStorage.getItem("ankomeow-poke-total") || 0);
      localStorage.setItem("ankomeow-poke-total", String(total));

      const { action, delta, nextBaselineReady } = shouldBuzz({
        fromCache: snap.metadata.fromCache,
        baselineReady: pokeBaselineReadyRef.current,
        prev,
        total,
        canVibrate: canVibrate(),
        visible: document.visibilityState === "visible",
      });
      pokeBaselineReadyRef.current = nextBaselineReady;

      if (action === "vibrate") {
        navigator.vibrate(vibrationPattern(delta));
        return;
      }

      if (action === "notify") {
        /* iOS — Vibration API байхгүй, апп харагдаж байгаа тул зөвхөн энд л
           мэдэгдэл харуулна (нуугдмал үед sw.js хариуцна).
           Зөвшөөрөл байхгүй бол чимээгүй бүтэлгүйтнэ. */
        const name = partnerKey ? ACCOUNTS[partnerKey]?.name : "Хамтрагч";
        navigator.serviceWorker?.ready
          .then((reg) => reg.showNotification("Ankomeow", {
            body: buzzMessage(name, delta),
            icon: "./icon-192.png",
            tag: `poke-${total}`,
          }))
          .catch(() => {});
      }
    }, () => {});

    return unsub;
  }, [accountKey, partnerKey]);

  /* мэдэгдлийн одоогийн төлөвийг тодорхойлно */
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!NOTIFY_ENDPOINT) { if (alive) setPushState("unconfigured"); return; }
      if (isIOS && !isStandalone) { if (alive) setPushState("needs-install"); return; }
      const ok = await pushSupported();
      if (!alive) return;
      setPushState(ok ? pushPermission() : "unsupported");
    })();
    return () => { alive = false; };
  }, [isIOS, isStandalone]);

  /* зөвшөөрөл байгаа үед FCM token-ыг Firestore-т шинэчилж байна
     (token үе үе солигддог тул апп нээх бүрд дахин бичнэ) */
  useEffect(() => {
    if (pushState !== "granted" || !accountKey) return;
    requestPushToken(fbApp)
      .then((token) => {
        if (!token) return;
        return setDoc(
          doc(db, "rooms", CHAT_ROOM, "tokens", accountKey),
          { tokens: arrayUnion(token), updatedAt: serverTimestamp() },
          { merge: true }
        );
      })
      .catch(() => {});
  }, [pushState, accountKey]);

  const enablePush = async () => {
    setPushBusy(true);
    setPushError("");
    try {
      const token = await requestPushToken(fbApp);
      if (token) setPushState("granted");
      else { setPushState(pushPermission()); setPushError("Зөвшөөрөл өгөгдсөнгүй."); }
    } catch (err) {
      setPushError(err?.message || "Мэдэгдэл асаахад алдаа гарлаа.");
      setPushState(pushPermission());
    } finally {
      setPushBusy(false);
    }
  };

  const dismissPush = () => {
    localStorage.setItem("ankomeow-push-dismissed", "1");
    setPushDismissed(true);
  };

  /* мэдэгдэл дээр дарахад холбогдох таб руу шилжинэ */
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const onMsg = (e) => {
      const { type, tab: target, payload } = e.data || {};
      if (type === "NOTIFICATION_CLICK" && target) go(target);
      if (type === "PUSH_FOREGROUND" && payload?.tab === "chat" && payload?.tag) {
        /* апп нээлттэй үед аль хэдийн бодит цагт шинэчлэгддэг тул нэмэлт үйлдэл хэрэггүй */
      }
    };
    navigator.serviceWorker.addEventListener("message", onMsg);
    return () => navigator.serviceWorker.removeEventListener("message", onMsg);
  }, []);

  /* PWA суулгах сануулгыг сонсох (Android/Chrome-д л ажиллана) */
  useEffect(() => {
    const onAvail = () => setCanInstall(true);
    window.addEventListener("pwa-install-available", onAvail);
    return () => window.removeEventListener("pwa-install-available", onAvail);
  }, []);

  /* шинэ хувилбар бэлэн эсэхийг сонсоно — байхгүй болоход товч мөн алга болно */
  useEffect(() => {
    const onUpdate = (e) => setUpdateAvailable(e.detail !== false);
    window.addEventListener("ankomeow-update-available", onUpdate);
    return () => window.removeEventListener("ankomeow-update-available", onUpdate);
  }, []);

  const applyUpdate = () => window.ankomeowApplyUpdate?.();

  const installApp = async () => {
    const promptEvent = window.deferredInstallPrompt;
    if (!promptEvent) return;
    promptEvent.prompt();
    await promptEvent.userChoice;
    window.deferredInstallPrompt = null;
    setCanInstall(false);
  };

  const dismissInstall = () => {
    localStorage.setItem("ankomeow-install-dismissed", "1");
    setInstallDismissed(true);
  };

  /* УБ цагаар 00:00 болоход өдрийн бүртгэл тэглэгдэнэ */
  useEffect(() => {
    const id = setInterval(() => {
      setClock(ubParts());
      const d = ubDay();
      if (d !== day) {
        const yesterdayTotal = screenAppsRef.current.reduce((s, a) => s + a.min, 0) + Math.round(appSecondsRef.current / 60);
        setScreenHistory((h) => ({ ...h, [day]: yesterdayTotal }));
        setScreenApps([]);
        setAppSeconds(0);
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
    { id: "home", icon: NAV_HOME, label: "Нүүр", c: C.ink, c2: C.inkSoft },
    { id: "water", icon: NAV_WATER, label: "Ус", c: C.waterDeep, c2: C.water },
    { id: "list", icon: NAV_LIST, label: "Жагсаалт", c: C.sageDeep, c2: C.sage },
    { id: "screen", icon: NAV_TIME, label: "Дэлгэц", c: C.peachDeep, c2: C.peach },
    { id: "gif", icon: NAV_GIF, label: "GIF", c: C.lilacDeep, c2: C.lilac },
  ];

  return (
    <div className="w-full min-h-screen flex items-start justify-center app-shell"
      style={{
        background: `linear-gradient(160deg, ${C.paper2} 0%, color-mix(in srgb, ${C.paper2} 80%, ${C.ink}) 100%)`,
        fontFamily: "'Manrope','Inter',system-ui,-apple-system,sans-serif",
      }}>
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
        @keyframes slideIn { from{opacity:0;transform:translateX(26px)} to{opacity:1;transform:none} }
        @keyframes slideBack { from{opacity:0;transform:translateX(-26px)} to{opacity:1;transform:none} }
        @keyframes spin { to{transform:rotate(360deg)} }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(.75)} }
        @keyframes leakL { 0%{transform:translate(0,0) scaleY(.6);opacity:0} 10%{opacity:.9} 70%{transform:translate(-14px,255px) scaleY(1.6);opacity:.7} 100%{transform:translate(-17px,278px) scaleY(1.8);opacity:0} }
        @keyframes leakR { 0%{transform:translate(0,0) scaleY(.6);opacity:0} 10%{opacity:.9} 70%{transform:translate(14px,255px) scaleY(1.6);opacity:.7} 100%{transform:translate(17px,278px) scaleY(1.8);opacity:0} }
        @keyframes puddleBreathe { 0%,100%{transform:scale(1);opacity:.55} 50%{transform:scale(1.06);opacity:.7} }
        .wv-a{animation:wvA 4.5s linear infinite} .wv-b{animation:wvB 6.5s linear infinite}
        .bub{animation:rise 4s ease-in infinite}
        .dropL{animation:dropL 1.5s cubic-bezier(.5,0,.9,.5) forwards}
        .dropR{animation:dropR 1.5s cubic-bezier(.5,0,.9,.5) forwards}
        .puddle{animation:puddle 1.6s ease-out forwards}
        .leakL{animation:leakL 1.9s cubic-bezier(.4,0,.7,.4) infinite}
        .leakR{animation:leakR 1.9s cubic-bezier(.4,0,.7,.4) infinite 0.9s}
        .puddleBreathe{animation:puddleBreathe 2.4s ease-in-out infinite}
        .scr-in{animation:slideIn 280ms cubic-bezier(.32,.72,0,1)}
        .scr-back{animation:slideBack 280ms cubic-bezier(.32,.72,0,1)}
        @media (prefers-reduced-motion: reduce){ .wv-a,.wv-b,.bub,.dropL,.dropR,.puddle,.leakL,.leakR,.puddleBreathe,.scr-in,.scr-back{animation:none} }
        input[type=range]{height:6px;border-radius:99px;background:${C.cardIn};-webkit-appearance:none;outline:none}
        input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${C.waterDeep};border:3px solid #fff;box-shadow:0 1px 4px rgba(92,74,58,.25);cursor:pointer}
        ::-webkit-scrollbar{height:5px;width:5px} ::-webkit-scrollbar-thumb{background:${C.line2};border-radius:99px}
        .hcarousel{scrollbar-width:none;scroll-behavior:smooth}
        .hcarousel::-webkit-scrollbar{display:none}
        .app-shell{padding:24px 16px}
        .app-frame{
          border-radius:46px;
          border:2.5px solid ${C.line2};
          box-shadow:0 24px 54px rgba(92,74,58,.16);
          height:min(760px, calc(100dvh - 48px));
        }
        @media (max-width:640px){
          .app-shell{padding:0;min-height:100dvh;min-height:100svh}
          .app-frame{
            max-width:100%;
            height:calc(100dvh - var(--kb-inset));
            height:calc(100svh - var(--kb-inset));
            border-radius:0;border:none;box-shadow:none;
            padding-top:env(safe-area-inset-top);
          }
          :root[data-kb-anim="1"] .app-frame{transition:height 180ms ease-out}
          /* macOS цонхны 3 цэг нь утсан дээр notch-ны хэсэгт таарах бөгөөд утгагүй */
          .mac-dots{display:none}
          /* Доод nav болон чатны бичих мөр home indicator шугам дээр таарахгүй байх */
          .safe-bottom{margin-bottom:calc(16px + env(safe-area-inset-bottom))}
          .safe-bottom-pad{padding-bottom:env(safe-area-inset-bottom)}
        }
      `}</style>

      <div className="w-full max-w-[400px] overflow-hidden flex flex-col relative app-frame"
        style={{
          /* дэвсгэр зураг ирэхээс өмнө ч цайвар өнгө шууд зурагдана — цагаан анивчихгүй */
          backgroundColor: C.paper2,
          backgroundImage: `${GRAIN}, linear-gradient(180deg, var(--veil-a) 0%, var(--veil-b) 100%), url(${BG_MAIN})`,
          backgroundBlendMode: "var(--frame-blend)",
          backgroundSize: "auto, auto, cover",
          backgroundPosition: "0 0, 0 0, center",
          backgroundRepeat: "repeat, no-repeat, no-repeat",
        }}>

        {/* macOS traffic light — зөвхөн desktop дээр (утсан дээр .mac-dots-оор нуугдана) */}
        <div className="mac-dots absolute top-4 left-5 z-30 flex items-center gap-1.5 pointer-events-none">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FF5F57" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#FEBC2E" }} />
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#28C840" }} />
        </div>

        {/* Хосын chibi — зөвхөн нэвтэрсэн, splash дууссан үед */}
        {booted && user && partnerKey && (
          <ChibiPet
            character={partnerKey}
            enabled={chibiEnabled}
            happyAt={chibiHappyAt}
            notice={chatNotice}
            chatAct={chatAct}
            onPoke={() => pokeSender?.poke(Date.now())}
          />
        )}

        {/* Хамтрагч чиний мэдээллийг харлаа гэсэн богино мэдэгдэл */}
        {peekToast && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 rounded-full px-4 py-2 text-[12px] font-extrabold shadow-lg"
            style={{ background: C.lilacDeep, color: "#fff" }}>
            👀 {peekToast} таны мэдээллийг харлаа
          </div>
        )}

        {/* Splash — бүдгэрч дууссаны дараа DOM-оос бүрмөсөн хасагдана */}
        {!splashGone && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 overflow-hidden"
          style={{
            /* дэвсгэр зургийг эцэг элемент аль хэдийн үзүүлж байгаа тул энд давхардуулахгүй */
            backgroundImage: "linear-gradient(180deg, var(--splash-a) 0%, var(--splash-b) 100%)",
            opacity: booted ? 0 : 1, pointerEvents: booted ? "none" : "auto",
            transition: "opacity 600ms ease",
          }}>
          <LoadingSequence paused={booted} />
        </div>
        )}

        {!authReady ? null : !user ? (
          <div className="flex-1 px-5 pt-7 pb-6 min-h-0 flex flex-col">
            <LoginScreen />
          </div>
        ) : (
          <>
            <div ref={setScreenEl}
              className={`flex-1 px-5 pt-7 min-h-0 flex flex-col ${tab === "chat" ? "pb-3" : "pb-4 overflow-y-auto overscroll-contain"}`}>
              {(pull > 0 || refreshing) && (
                <div className="flex items-center justify-center pointer-events-none shrink-0 overflow-hidden"
                  style={{
                    height: refreshing ? 34 : pull,
                    opacity: refreshing ? 1 : Math.min(1, pull / 70),
                    /* Чирж байх явцад pull хурууны хөдөлгөөнийг шууд (transition-гүй)
                       дагана; харин суллах мөчид (амжилттай ч бай, амжилтгүй ч
                       бай) "settling" true болж, indicator адилхан гөлгөр
                       анимацаар хаагдана. Өмнө нь зөвхөн refreshing үед
                       transition идэвхтэй байсан тул threshold-д хүрэлгүй
                       суллахад indicator нэг frame-д шидэгддэг байсан. */
                    transition: (refreshing || settling) ? "height 180ms ease-out" : "none",
                  }}>
                  <RefreshCw size={16} strokeWidth={2.6}
                    style={{
                      color: C.inkSoft,
                      transform: `rotate(${refreshing ? 0 : pull * 3}deg)`,
                      animation: refreshing ? "spin 800ms linear infinite" : "none",
                    }} />
                </div>
              )}
              <div key={tab} className={`${navDir === "back" ? "scr-back" : "scr-in"} ${tab === "chat" ? "flex-1 flex flex-col min-h-0" : ""}`}>
                {tab === "home" && <HomeScreen go={go} {...{ ml, goal, items, clock, justReset, avatar, profileName, screenApps, appMin, canInstall, isIOS, isStandalone, installDismissed, updateAvailable, pushState, pushBusy, pushError, pushDismissed }} partner={partnerStats} partnerName={partnerKey ? ACCOUNTS[partnerKey].name : ""} partnerStatus={partnerStatus} coupleInfo={coupleInfo} day={day} streak={streak} nextEvent={nextEvent} accountKey={accountKey} partnerKey={partnerKey} onInstall={installApp} onDismissInstall={dismissInstall} onApplyUpdate={applyUpdate} onEnablePush={enablePush} onDismissPush={dismissPush} gifCount={frames.length} chatUnread={chatUnread} />}
                {tab === "water" && <WaterScreen {...{ ml, setMl, log, setLog, weight, setWeight, goal }} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "list" && <ListScreen items={items} setItems={setItems} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "screen" && <ScreenTimeScreen {...{ screenApps, screenHistory, appMin }} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "gif" && <GifScreen frames={frames} setFrames={setFrames} partner={partnerStats} onBack={() => go("home")} />}
                {tab === "profile" && <ProfileScreen {...{ ml, goal, items, screenApps, appMin, avatar, setAvatar, profileName, chibiEnabled, setChibiEnabled }} gifCount={frames.length} savedCount={savedIds.size} onOpenSaved={() => go("saved")} accountKey={accountKey} myStatus={myStatus} coupleInfo={coupleInfo} themeMode={themeMode} setThemeMode={setThemeMode} onBack={() => go("home")} />}
                {tab === "saved" && <SavedChatScreen accountKey={accountKey} onBack={() => go("profile")} />}
                {tab === "cal" && <CalendarScreen accountKey={accountKey} partnerKey={partnerKey}
                  partnerName={partnerKey ? ACCOUNTS[partnerKey].name : ""} profileName={profileName}
                  today={day} coupleInfo={coupleInfo} onBack={() => go("home")} />}
                {tab === "qa" && <DailyQuestionScreen accountKey={accountKey} partnerKey={partnerKey}
                  partnerName={partnerKey ? ACCOUNTS[partnerKey].name : ""} profileName={profileName}
                  today={day} onBack={() => go("home")} />}
                {tab === "wish" && <WishScreen accountKey={accountKey} partnerKey={partnerKey}
                  partnerName={partnerKey ? ACCOUNTS[partnerKey].name : ""} onBack={() => go("home")} />}
                {tab === "map" && <LiveMapScreen accountKey={accountKey} partnerKey={partnerKey} profileName={profileName}
                  partnerName={partnerKey ? ACCOUNTS[partnerKey].name : ""} avatar={avatar} partnerAvatar={partnerStats?.avatar}
                  onBack={() => go("home")} />}
                {tab === "partner" && <PartnerScreen partner={partnerStats} accountKey={accountKey} partnerKey={partnerKey} partnerStatus={partnerStatus} onBack={() => go("home")} />}
                {tab === "chat" && <ChatScreen onBack={() => go("home")} profileName={profileName} accountKey={accountKey} partnerKey={partnerKey} savedIds={savedIds} onPartnerBubble={handlePartnerBubble} />}
              </div>
            </div>

            {tab !== "chat" && (
              <nav className="safe-bottom flex justify-around items-center gap-1 py-2 px-3 mx-4 mb-4 rounded-full shrink-0"
                style={{ background: C.card, border: `1.5px solid ${C.line}`, boxShadow: "0 10px 24px rgba(92,74,58,.14)" }}>
                {nav.map(({ id, icon, label, c, c2 }) => {
                  const on = tab === id;
                  return (
                    <button key={id} onClick={() => go(id)}
                      className="flex flex-col items-center justify-center gap-1 px-1.5 py-1.5 rounded-2xl min-h-[44px]">
                      <span className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: on ? `linear-gradient(155deg, ${c2 || c} 0%, ${c} 100%)` : C.cardIn,
                          boxShadow: on ? "0 3px 8px rgba(92,74,58,.22)" : "none",
                          transition: "background 220ms ease, box-shadow 220ms ease",
                        }}>
                        <img src={icon} alt="" className="w-full h-full object-cover" />
                      </span>
                      <span className="text-[10px] font-extrabold leading-none" style={{ color: on ? C.ink : C.inkSoft }}>{label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
          </>
        )}
      </div>
    </div>
  );
}
