/* Чат — зурвас, зураг, зурсан зураг, дуут зурвас, байршил, хариулт. */

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { C } from "../lib/theme.js";
import { Header, Pill } from "../ui/primitives.jsx";
import { CHAT_ROOM, auth, blobDoc, db, messageDoc, messagesCol, savedItemDoc, scheduledCol, stickerDoc, stickersCol } from "../lib/firebase.js";
import { Timestamp, addDoc, deleteDoc, doc, getDoc, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { DRAW_CHECKER } from "../lib/drawing.js";
import { notifyPartner } from "../push.js";
import { Bookmark, BookmarkCheck, Brush, Check, ChevronDown, Copy, Heart, Image as ImageIcon, MapPin, Mic, Plus, Reply, Clock, Search, Send, Sticker, Sunrise, Trash2, X } from "lucide-react";
import { MessageBody, copyableText, durText, loadBlob, messagePreview, putBlob, savedSnapshot, writeClipboard } from "../ui/message.jsx";
import { DrawPad, DrawingView } from "../ui/drawing.jsx";
import { chatStamp, ubDayOf } from "../lib/time.js";
import { groupMessages } from "../lib/chatGroup.js";
import { bigEmoji } from "../lib/emoji.js";
import { listChange, restoreTop } from "../lib/chatList.js";
import { seenUpToId } from "../lib/seen.js";
import { searchMessages, snippet } from "../lib/chatSearch.js";
import { mediaItems } from "../lib/media.js";
import { MediaGrid } from "../ui/mediaGrid.jsx";
import { greetingDoc } from "../ui/greeting.jsx";
import { compressImage, imageDims } from "../lib/image.js";
import { QUICK_REACTIONS, REACTIONS, REACTION_GIFS } from "../lib/reactions.js";
import { reactionChips } from "../lib/reactionChips.js";
import { useBubbleGestures } from "../hooks/useBubbleGestures.js";
import { TYPING_STALE_MS, TYPING_STOP_MS, isTyping, shouldPing } from "../lib/typing.js";
import { parseWhen, pending } from "../lib/scheduled.js";

/* Бөмбөлгийн булангийн радиус. Бүлгийн дунд байгаа булан нь MERGED болж
   хумигдана — Instagram-ийн адил нэг урт бөмбөлөг мэт харагдуулна. */
const BUBBLE_R = 18;
const BUBBLE_R_MERGED = 6;

const HEART = "❤️";

/* Доод хэсэгт "байгаа" гэж үзэх зай. Яг 0 болгож болохгүй — зурвасын өндөр,
   зургийн ачаалалт зэргээс болж хэдэн px зөрөх нь энгийн үзэгдэл. */
const NEAR_BOTTOM_PX = 80;

/* Нэг удаад хэдэн зурвас нээх вэ. Дээд хэсэгт энэ зайд ойртоход дараагийнх
   нь өөрөө ачаалагдана — товч дарахыг хүлээхгүй. */
const PAGE = 100;
const NEAR_TOP_PX = 200;

/* Нисэх зүрхнүүдийн налуу ба хэмжээ. Санамсаргүй биш тогтмол — зурвас бүр
   ижилхэн нисэх нь энд давуу тал: жагсаалт дахин зурагдах бүрд утга солигдвол
   анимаци дунд нь үсэрнэ. */
const HEART_OFFSETS = [
  { x: 0, s: 1.1 }, { x: -18, s: 0.8 }, { x: 16, s: 0.9 }, { x: -8, s: 0.7 }, { x: 10, s: 0.75 },
];

export function ChatScreen({ onBack, profileName, accountKey, partnerKey, savedIds, onPartnerBubble, partnerAvatar }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [showReact, setShowReact] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [partnerSeenAt, setPartnerSeenAt] = useState(null);
  const [reactingTo, setReactingTo] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [showDraw, setShowDraw] = useState(false);
  const [showAttach, setShowAttach] = useState(false);
  const [showStickers, setShowStickers] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recSecs, setRecSecs] = useState(0);
  const recRef = useRef(null);
  const recStartRef = useRef(0);
  const recCancelRef = useRef(false);
  const [sendError, setSendError] = useState("");
  const [replyTo, setReplyTo] = useState(null);   /* { id, senderName, preview } */
  const [flashId, setFlashId] = useState(null);   /* иш татсан зурвас руу үсрэхэд гэрэлтүүлнэ */
  const [bursts, setBursts] = useState([]);       /* давхар товшиход нисэх зүрхнүүд */
  const [unread, setUnread] = useState(0);        /* доош гүйлгээгүй байхад ирсэн зурвас */
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [pageSize, setPageSize] = useState(PAGE);   /* хуучин зурвас нээхэд өснө */
  const [hasMore, setHasMore] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const restoreRef = useRef(null);                  /* ачаалахын өмнөх гүйлгэлтийн байрлал */
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showMedia, setShowMedia] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [schedText, setSchedText] = useState("");
  const [schedWhen, setSchedWhen] = useState("");
  const [scheduled, setScheduled] = useState([]);
  const burstSeq = useRef(0);
  const bubbleRefs = useRef(new Map());
  const [stickers, setStickers] = useState([]);
  const listRef = useRef(null);
  const lastPartnerBubbleRef = useRef(null);
  const imgFileRef = useRef(null);

  /* ── Зурвас татах ──
     Хязгаарыг ӨСГӨХ замаар хуучин зурвасыг нээнэ. Тусдаа хуудаслалт хийж
     сонсогчтой нийлүүлэхээс хамаагүй энгийн бөгөөд Firestore-ийн офлайн кэш
     давхардсан уншилтыг өөрөө шингээдэг. Зурвас бүр хөнгөн (хүнд хавсралт нь
     blobs дотор тусдаа) тул хязгаар өсөх нь бодит зардал болохгүй. */
  useEffect(() => {
    const q = query(messagesCol(), orderBy("createdAt", "desc"), limit(pageSize));
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })).reverse());
      /* Хүссэнээс цөөн ирвэл цааш юу ч алга */
      setHasMore(snap.size >= pageSize);
      setLoadingOlder(false);
    }, () => setLoadingOlder(false));
    return unsub;
  }, [pageSize]);

  /* Товлосон зурвасууд — цуцлах, хүлээгдэж буйг харуулахад хэрэгтэй.
     Хүргэлтийг өөрөө useScheduledDelivery (аппын үндэст) хариуцна. */
  useEffect(() => {
    const unsub = onSnapshot(scheduledCol(), (snap) => {
      setScheduled(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, []);

  const waiting = pending(scheduled, Date.now());

  const scheduleMessage = () => {
    const t = schedText.trim();
    const ms = parseWhen(schedWhen);
    if (!t || !ms) return;
    addDoc(scheduledCol(), {
      from: accountKey, fromName: profileName, to: partnerKey,
      text: t, at: Timestamp.fromMillis(ms), createdAt: serverTimestamp(),
    }).catch(() => setSendError("Товлож чадсангүй. Firestore дүрмээ шалгана уу."));
    setSchedText("");
    setSchedWhen("");
  };

  const loadOlder = () => {
    if (loadingOlder || !hasMore) return;
    const el = listRef.current;
    /* Одоогийн харагдацыг тэмдэглэнэ — дээрээс зурвас нэмэгдэхэд байрлалыг
       сэргээхэд хэрэгтэй. Эс бөгөөс уншиж байсан газраасаа хөөгдөнө. */
    if (el) restoreRef.current = { height: el.scrollHeight, top: el.scrollTop };
    setLoadingOlder(true);
    setPageSize((n) => n + PAGE);
  };

  useEffect(() => {
    if (!accountKey) return;
    const q = query(stickersCol(accountKey), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setStickers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {});
    return unsub;
  }, [accountKey]);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "reads", partnerKey), (snap) => {
      setPartnerSeenAt(snap.exists() ? snap.data().at : null);
    }, () => {});
    return unsub;
  }, [partnerKey]);

  useEffect(() => {
    setDoc(doc(db, "rooms", CHAT_ROOM, "reads", accountKey), { at: serverTimestamp() }).catch(() => {});
  }, [messages.length, accountKey]);

  /* ── Доош гүйлгэх ──
     Өмнө нь шинэ зурвас ирэх бүрд БОЛЗОЛГҮЙ доош татдаг байсан тул хуучин
     зурвас уншиж байхад чинь хүчээр буцаадаг байв. Одоо доод хэсэгт байвал л
     дагана; дээгүүр байвал "Шинэ зурвас" товч гаргана. */
  const atBottom = () => {
    const el = listRef.current;
    return !el || el.scrollHeight - el.scrollTop - el.clientHeight < NEAR_BOTTOM_PX;
  };

  const scrollToBottom = (smooth = true) => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: smooth ? "smooth" : "auto" });
    setUnread(0);
  };

  const prevListRef = useRef({ count: 0, lastId: null });

  /* useLayoutEffect — DOM шинэчлэгдсэн ч ЗУРАГДААГҮЙ байхад ажиллана.
     Хуучин зурвас нэмэгдэхэд байрлалыг энд сэргээснээр үсрэлт нүдэнд
     харагдахгүй; энгийн useEffect бол нэг фрэйм үсэрч анивчина. */
  useLayoutEffect(() => {
    const next = { count: messages.length, lastId: messages[messages.length - 1]?.id ?? null };
    const { kind, added } = listChange(prevListRef.current, next);
    prevListRef.current = next;

    if (kind === "none") return;

    if (kind === "first") { scrollToBottom(false); return; }

    if (kind === "older") {
      const el = listRef.current, before = restoreRef.current;
      if (el && before) el.scrollTop = restoreTop(before, { height: el.scrollHeight });
      restoreRef.current = null;
      return;
    }

    /* Өөрийн илгээсэн зурвас бол хаана ч байсан доош дагана */
    const mineLast = messages[messages.length - 1]?.sender === accountKey;
    if (mineLast || atBottom()) scrollToBottom();
    else setUnread((n) => n + added);
  }, [messages, accountKey]);

  /* ── "Бичиж байна" ──
     Товч дарах бүрд бичихгүй — TYPING_PING_MS-д нэг л удаа. Бичихээ болиход
     тодорхой хугацааны дараа өөрөө унтарна. */
  const typingDoc = doc(db, "rooms", CHAT_ROOM, "typing", accountKey);
  const lastPingRef = useRef(0);
  const stopTypingRef = useRef(null);

  const setTyping = (on) => {
    lastPingRef.current = on ? Date.now() : 0;
    setDoc(typingDoc, { typing: on, at: serverTimestamp() }).catch(() => {});
  };

  const pingTyping = () => {
    if (shouldPing(lastPingRef.current, Date.now())) setTyping(true);
    clearTimeout(stopTypingRef.current);
    stopTypingRef.current = setTimeout(() => setTyping(false), TYPING_STOP_MS);
  };

  const clearTyping = () => {
    clearTimeout(stopTypingRef.current);
    if (lastPingRef.current) setTyping(false);
  };

  /* Чатаас гарахад унтраана — эс бөгөөс хамтрагчид мөнхөд "бичиж байна" харагдана */
  useEffect(() => () => {
    clearTimeout(stopTypingRef.current);
    setDoc(doc(db, "rooms", CHAT_ROOM, "typing", accountKey), { typing: false, at: serverTimestamp() }).catch(() => {});
  }, [accountKey]);

  /* Хамтрагчийн төлөв. Хуучирсан төлөвийг өөрөө хүчингүй болгохын тулд
     хугацаа хэмжинэ — апп унтарсан бол унтраах бичилт хэзээ ч ирэхгүй. */
  useEffect(() => {
    let expire = null;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "typing", partnerKey), (snap) => {
      clearTimeout(expire);
      const on = snap.exists() && isTyping(snap.data(), Date.now());
      setPartnerTyping(on);
      if (on) expire = setTimeout(() => setPartnerTyping(false), TYPING_STALE_MS);
    }, () => {});
    return () => { clearTimeout(expire); unsub(); };
  }, [partnerKey]);

  const send = (payload) => {
    clearTyping();
    /* Алдааг чимээгүй залгихгүй — өмнө нь илгээгдээгүйг мэдэх арга байхгүй байв */
    addDoc(messagesCol(), {
      sender: accountKey, senderName: profileName, createdAt: serverTimestamp(),
      ...(replyTo ? { replyTo } : {}),
      ...payload,
    }).catch((e) => setSendError(e?.code === "permission-denied"
      ? "Илгээх эрх алга. Firestore дүрмээ шалгана уу."
      : "Илгээж чадсангүй. Холболтоо шалгаад дахин оролдоно уу."));

    notifyPartner(auth, {
      to: partnerKey,
      title: profileName,
      body: messagePreview(payload),
      tag: "chat",
      tab: "chat",
    });

    setReplyTo(null); /* хариулт нэг л зурваст хамаарна */
  };

  /* Иш татсан зурвас руу үсэрч, богино хугацаанд гэрэлтүүлнэ.

     requestAnimationFrame нь заавал хэрэгтэй: дуудагч нь ихэвчлэн зэрэг нэг
     самбарыг хаадаг (хайлтын үр дүн г.м.). React тэр өөрчлөлтийг энэ дуудлагын
     ДАРАА хэрэгжүүлдэг тул шууд гүйлгэвэл жагсаалтын өндөр хуучин утгаараа
     тооцогдоно — хэмжихэд 386px байснаа 588px болж, зорилтот зурвас голоос
     ~100px зөрч, зарим тохиолдолд гүйлгэлт бүр цуцлагдаж байв. */
  const jumpTo = (id) => {
    requestAnimationFrame(() => {
      const el = bubbleRefs.current.get(id);
      if (!el) return;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setFlashId(id);
      setTimeout(() => setFlashId((f) => (f === id ? null : f)), 1400);
    });
  };

  const startReply = (m) => {
    setReplyTo({ id: m.id, senderName: m.senderName || (m.sender === accountKey ? profileName : ""), preview: messagePreview(m).slice(0, 90) });
    setReactingTo(null);
  };

  const onSend = () => {
    const t = text.trim();
    if (!t) return;
    send({ type: "text", text: t });
    setText("");
  };

  const react = (m, emoji) => {
    const next = { ...(m.reactions || {}) };
    if (next[accountKey] === emoji) delete next[accountKey]; else next[accountKey] = emoji;
    updateDoc(messageDoc(m.id), { reactions: next }).catch(() => {});
    setReactingTo(null);
  };

  const heart = (m) => {
    const had = m.reactions?.[accountKey] === HEART;
    react(m, HEART);
    if (had) return; /* хоёр дахь давхар товшилт нь зүрхийг авдаг — нисгэх нь ойлгомжгүй */
    navigator.vibrate?.(12);
    const id = ++burstSeq.current;
    setBursts((b) => [...b, { id, msgId: m.id }]);
    setTimeout(() => setBursts((b) => b.filter((x) => x.id !== id)), 900);
  };

  /* Давхар товшилт → зүрх, удаан дарах → цэс, баруун шудрах → хариулах */
  const gestures = useBubbleGestures({
    onDoubleTap: heart,
    onLongPress: (m) => setReactingTo((id) => (id === m.id ? null : m.id)),
    onReply: startReply,
  });

  const copyMessage = async (m) => {
    const t = copyableText(m);
    if (!t) return;
    try {
      await writeClipboard(t);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((id) => (id === m.id ? null : id)), 1200);
    } catch {}
  };

  /* Хадгалах/буцаах. Хадгалахдаа тухайн үеийн агуулгыг бүтнээр нь хуулна. */
  const toggleSave = async (m) => {
    if (savedIds.has(m.id)) {
      const item = await getDoc(savedItemDoc(accountKey, m.id)).catch(() => null);
      const bid = item?.data()?.blobId;
      deleteDoc(savedItemDoc(accountKey, m.id)).catch(() => {});
      if (bid) deleteDoc(blobDoc(bid)).catch(() => {});
      return;
    }
    /* Хавсралтыг ТУСДАА хуулбарлана. Эх зурвасаа устгахад blob нь ч устдаг тул
       заагчийг хуваалцвал хадгалсан хуулбар хоосорно. Хуулбар нь мөн жагсаалтыг
       хөнгөн байлгана — өгөгдөл нь saved баримт дотор биш, тусдаа хэвтэнэ. */
    const snap = savedSnapshot(m);
    if (m.blobId) {
      const data = await loadBlob(m.blobId);
      snap.blobId = data ? await putBlob(data, m.type).catch(() => null) : null;
      if (!snap.blobId) delete snap.blobId;
    }
    setDoc(savedItemDoc(accountKey, m.id), { ...snap, savedAt: serverTimestamp() }).catch(() => {});
  };

  const deleteMessage = (id) => {
    const m = messages.find((x) => x.id === id);
    deleteDoc(messageDoc(id)).catch(() => {});
    /* Хавсралтыг ч устгана — эс бөгөөс зураг устгасан ч сангаас арилахгүй */
    if (m?.blobId) deleteDoc(blobDoc(m.blobId)).catch(() => {});
    setReactingTo(null);
  };

  const sendReaction = (r) => {
    setShowReact(false);
    const pool = REACTION_GIFS[r.key] || [];
    const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
    send({ type: "reaction", key: r.key, label: r.label, gifUrl: pick });
  };

  /* Зурах самбар хоёр зорилгод үйлчилнэ: ердийн зурсан зураг, эсвэл
     мэндчилгээ. Аль болохыг нээх мөчид тэмдэглэнэ. */
  const [greetMode, setGreetMode] = useState(false);

  const sendDrawing = (strokes) => {
    setShowDraw(false);
    if (greetMode) {
      setGreetMode(false);
      /* Чатын зурвас БИШ — хамтрагч аппаа нээхэд бүтэн дэлгэцээр угтана */
      setDoc(greetingDoc(partnerKey), {
        from: accountKey, fromName: profileName, strokes, at: serverTimestamp(),
      }).catch(() => setSendError("Мэндчилгээг үлдээж чадсангүй."));
      notifyPartner(auth, {
        to: partnerKey, title: profileName, body: "🌅 Чамд мэндчилгээ үлдээлээ", tag: "greet", tab: "home",
      });
      return;
    }
    send({ type: "drawing", strokes });
  };

  const saveSticker = (strokes) => {
    addDoc(stickersCol(accountKey), { strokes, createdAt: serverTimestamp() }).catch(() => {});
  };

  const deleteSticker = (id) => {
    deleteDoc(stickerDoc(accountKey, id)).catch(() => {});
  };

  const sendLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((p) => {
      send({ type: "location", lat: p.coords.latitude, lng: p.coords.longitude });
    });
  };

  const onImageChange = async (e) => {
    setShowAttach(false);
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      let quality = 0.6;
      let dataUrl = await compressImage(file, 900, quality);
      while (dataUrl.length > 700000 && quality > 0.25) {
        quality -= 0.15;
        dataUrl = await compressImage(file, 900, quality);
      }
      if (dataUrl.length <= 900000) {
        /* Хэмжээг зурвастай хамт явуулна — хүлээн авагч тал зураг ирэхээс өмнө
           байрыг барьж чадна. Хэмжээ олдохгүй ч зурвас илгээгдэнэ. */
        const dims = await imageDims(dataUrl);
        const blobId = await putBlob(dataUrl, "image");
        send({ type: "image", blobId, ...(dims || {}) });
      } else {
        setSendError("Зураг хэт том байна. Өөр зураг сонгоно уу.");
      }
    } catch {
      setSendError("Зургийг илгээж чадсангүй.");
    }
    setUploading(false);
  };

  /* ── Дуут зурвас ──
     iOS Safari нь webm дэмждэггүй тул дэмжигдэх төрлийг эрэмбээр шалгана. */
  const pickMime = () => {
    const opts = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/aac", ""];
    return opts.find((t) => !t || (window.MediaRecorder?.isTypeSupported?.(t) ?? false)) ?? "";
  };

  const startRec = async () => {
    setShowAttach(false);
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setSendError("Энэ хөтөч дуу бичихийг дэмжихгүй байна.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const secs = Math.round((Date.now() - recStartRef.current) / 1000);
        setRecording(false);
        setRecSecs(0);
        if (recCancelRef.current || !chunks.length || secs < 1) return;
        try {
          const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          const dataUrl = await new Promise((res, rej) => {
            const r = new FileReader();
            r.onerror = rej;
            r.onload = () => res(r.result);
            r.readAsDataURL(blob);
          });
          /* Firestore-ийн нэг баримт 1MB. base64 нь 33% нэмэгддэг тул шалгана. */
          if (dataUrl.length > 900000) { setSendError("Бичлэг хэт урт байна. Богиноор оролдоно уу."); return; }
          const blobId = await putBlob(dataUrl, "voice");
          send({ type: "voice", blobId, dur: secs });
        } catch {
          setSendError("Дуут зурвасыг илгээж чадсангүй.");
        }
      };
      recRef.current = rec;
      recCancelRef.current = false;
      recStartRef.current = Date.now();
      rec.start();
      setRecording(true);
    } catch {
      setSendError("Микрофоны зөвшөөрөл өгөгдөөгүй байна.");
    }
  };

  const stopRec = (cancel) => {
    recCancelRef.current = !!cancel;
    try { recRef.current?.stop(); } catch {}
  };

  /* Бичиж байх хугацааг харуулах ба 60 секундэд автоматаар зогсоох */
  useEffect(() => {
    if (!recording) return;
    const id = setInterval(() => {
      const s = Math.round((Date.now() - recStartRef.current) / 1000);
      setRecSecs(s);
      if (s >= 60) stopRec(false);
    }, 250);
    return () => clearInterval(id);
  }, [recording]);

  const lastMineId = [...messages].reverse().find((m) => m.sender === accountKey)?.id;
  /* Хамтрагчийн хамгийн сүүлийн зурвас — chibi үүн рүү очиж заана */
  const lastPartnerId = [...messages].reverse().find((m) => m.sender !== accountKey)?.id;

  /* Хамтрагч ХААНА хүртэл уншсан. "Үзсэн" бичиг нь зөвхөн сүүлийн зурвасын
     тухай хэлдэг тул хэрэв тэр 5 зурвасын өмнө уншихаа больсон бол хаана
     зогссоныг мэдэх арга байсангүй. Тэмдэг нь тэр байрлалыг харуулна. */
  const partnerReadId = seenUpToId(messages, partnerSeenAt, accountKey);

  /* Хайлт ба медиа хоёул ачаалагдсан зурвасууд дотроос гарна — дээш гүйлгэх
     тусам хамрах хүрээ нь тэлнэ. Нээгээгүй үед огт тооцохгүй. */
  const results = useMemo(
    () => (showSearch ? searchMessages(messages, searchTerm) : []),
    [showSearch, messages, searchTerm]
  );
  const media = useMemo(() => (showMedia ? mediaItems(messages) : []), [showMedia, messages]);

  /* Зурвасын жагсаалт зурагдаж дууссаны дараа байрлалыг эцэгт өгнө.
     requestAnimationFrame нь хоёр зорилготой:
       1. layout (DOM commit) тогтсоны дараа хэмжинэ.
          Санамж: жагсаалт `behavior: "smooth"`-оор гүйлгэдэг тул энэ rAF нь
          гүйлгэлтийн ЭХНИЙ фрэйм дээр л ажиллана — гүйлгэлт дуусахыг хүлээхгүй.
          Одоогоор `bubbleTarget` зөвхөн `x`-ийг ашиглаад `y`-г үл тоомсорлодог
          (chibi ердийн алхах шугам дээрээ л зогсдог) тул энэ хамаагүй; хэрвээ
          ирээдүйд босоо байрлалыг ч тооцох шаардлагатай болвол гүйлгэлт бодитоор
          дуусахыг (жишээ нь `scrollend` эвент) хүлээх хэрэгтэй болно.
       2. React-д ХҮҮХДИЙН effect эцгийнхээс ӨМНӨ ажилладаг. Эцэг нь чат руу
          орсныг rAF-гүйгээр хараахан тэмдэглээгүй байх тул анхны дуудлага
          алдагдана. rAF нь бүх effect дууссаны дараа ажиллана.
     Тиймээс энэ rAF-ыг энгийн дуудлага болгож "хялбарчилж" БОЛОХГҮЙ. */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      onPartnerBubble?.(lastPartnerBubbleRef.current?.getBoundingClientRect() ?? null);
    });
    return () => cancelAnimationFrame(id);
  }, [messages, onPartnerBubble]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <Header title="Чат" sub="Хайртай хүнтэйгээ шууд бичих" onBack={onBack}
        action={
          <div className="flex gap-1.5">
            {[
              { key: "media", on: showMedia, icon: <ImageIcon size={17} strokeWidth={2.2} />, label: "Зургууд",
                toggle: () => { setShowSearch(false); setShowMedia((s) => !s); } },
              { key: "search", on: showSearch, icon: <Search size={17} strokeWidth={2.2} />, label: "Хайх",
                toggle: () => { setShowMedia(false); setSearchTerm(""); setShowSearch((s) => !s); } },
            ].map((b) => (
              <button key={b.key} onClick={b.toggle}
                className="w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
                style={{
                  border: `1.6px solid ${C.line2}`,
                  background: b.on ? C.lilacDeep : "transparent",
                  color: b.on ? "#fff" : C.ink,
                  transition: "transform 120ms ease",
                }}
                aria-label={b.on ? `${b.label} — хаах` : b.label}>
                {b.on ? <X size={17} strokeWidth={2.6} /> : b.icon}
              </button>
            ))}
          </div>
        } />

      {showMedia && (
        <div className="mb-3 overflow-y-auto" style={{ maxHeight: 320 }}>
          <MediaGrid items={media} onJump={(id) => { setShowMedia(false); jumpTo(id); }} />
        </div>
      )}

      {showSearch && (
        <div className="mb-3">
          <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Зурвас хайх…" autoFocus
            className="w-full rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
            style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />

          {searchTerm.trim() && (
            <div className="mt-2">
              <div className="text-[10.5px] font-bold px-1 pb-1.5" style={{ color: C.inkSoft }}>
                {results.length === 0
                  ? "Олдсонгүй. Дээш гүйлгэвэл хуучин зурвас нэмж ачаалагдана."
                  : `${results.length} зурвас олдлоо`}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 260 }}>
                {results.map((m) => (
                  <button key={m.id}
                    onClick={() => { setShowSearch(false); setSearchTerm(""); jumpTo(m.id); }}
                    className="w-full text-left rounded-2xl px-3 py-2 mb-1.5 active:scale-[0.99]"
                    style={{ background: C.card, border: `1.5px solid ${C.line}`, transition: "transform 120ms ease" }}>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-[10px] font-extrabold shrink-0" style={{ color: C.lilacDeep }}>
                        {m.sender === accountKey ? "Би" : (m.senderName || "Хамтрагч")}
                      </span>
                      <span className="text-[9.5px] font-bold shrink-0" style={{ color: C.inkSoft }}>
                        {m.createdAt?.toDate ? chatStamp(m.createdAt.toDate()) : ""}
                      </span>
                    </div>
                    <div className="text-[12px] font-semibold line-clamp-2" style={{ color: C.ink }}>
                      {snippet(m.text, searchTerm)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div ref={listRef}
        onScroll={() => {
          if (atBottom()) setUnread(0);
          if (listRef.current?.scrollTop < NEAR_TOP_PX) loadOlder();
        }}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain mb-3">
        {messages.length === 0 ? (
          <p className="text-[12px] py-8 text-center font-medium" style={{ color: C.inkSoft }}>
            Одоогоор мессеж алга. Эхний мессежээ бичээрэй.
          </p>
        ) : (
          <>
          {/* Дээд талд түүх үргэлжилж байгааг мэдэгдэнэ */}
          {(loadingOlder || hasMore) && (
            <div className="text-center text-[10.5px] font-bold py-3" style={{ color: C.inkSoft }}>
              {loadingOlder ? "Хуучин зурвас ачаалж байна…" : "Дээш гүйлгэвэл хуучин зурвас гарна"}
            </div>
          )}
          {groupMessages(messages, ubDayOf).map(({ m, stamp, groupStart, groupEnd }) => {
            const mine = m.sender === accountKey;
            const draw = m.type === "drawing";
            /* Зурсан зураг, "санаж байна", цэвэр эможи гурав бөмбөлөггүй хөвнө —
               эхний хоёр нь өөрсдийн бүрхүүлээ зурдаг, эможи нь Instagram-ийн
               адил том бичиг болж бөмбөлөгт багтахаа больдог. */
            const bare = (draw || m.type === "miss"
              || (m.type === "text" && bigEmoji(m.text))) && !m.replyTo;
            const isMedia = m.type === "image" || draw || m.type === "location" || (m.type === "reaction" && m.gifUrl);
            const seen = mine && m.createdAt && partnerSeenAt && m.createdAt.toMillis() <= partnerSeenAt.toMillis();
            const myReaction = m.reactions?.[accountKey];
            const chips = reactionChips(m.reactions, accountKey);
            /* Бүлгийн дотоод булангууд нийлж, нэг урт бөмбөлөг мэт харагдана.
               Зөвхөн илгээгчийн талын булангууд нийлнэ — нөгөө тал нь бүтэн
               дугуй хэвээр. Бөмбөлөггүй зурвас (зурсан зураг, "санаж байна")
               өөрийн хэлбэртэй тул үүнээс гадуур. */
            const side = mine ? "Right" : "Left";
            /* Дохионы боловсруулагчид — зурвас бүрд нэг л удаа тооцоолно.
               `el` нь функц: ref газардахаас өмнө дуудагдаж болзошгүй тул
               элементийг шууд биш, хожим уншина. */
            const g = gestures(m, () => bubbleRefs.current.get(m.id));
            return (
              <div key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}
                /* Чип нь бөмбөлгөөс доош унждаг тул реакцтай зурваст илүү зай */
                style={{ marginTop: groupStart ? 8 : 2, marginBottom: chips.length ? 8 : 0 }}>
                {stamp && m.createdAt?.toDate && (
                  <div className="w-full text-center text-[10px] font-bold py-3" style={{ color: C.inkSoft }}>
                    {chatStamp(m.createdAt.toDate())}
                  </div>
                )}
                {!mine && groupStart && m.senderName && (
                  <div className="text-[9.5px] font-bold mb-1 px-1" style={{ color: C.inkSoft }}>{m.senderName}</div>
                )}
                {/* max-w-[75%] нь ЭНД байх ёстой. Бөмбөлөг дээр байвал 75% нь
                    жагсаалтын биш, энэ ороолтын өргөнөөс тооцогдоно — ороолт нь
                    агуулгаараа өргөсдөг тул бөмбөлгүүд ирмэг давж, эмх замбараагүй
                    болно. */}
                <div className="relative max-w-[75%]">
                  {/* Давхар товшилтын зүрхнүүд — бөмбөлгийн дээгүүр нисэж бүдгэрнэ */}
                  <div className="absolute inset-x-0 bottom-full h-24 pointer-events-none overflow-hidden">
                    {bursts.filter((b) => b.msgId === m.id).map((b) => (
                      HEART_OFFSETS.map((o, i) => (
                        <span key={`${b.id}-${i}`} className="absolute left-1/2 bottom-0 miss-heart"
                          role="img" aria-label="зүрх"
                          style={{ transform: `translateX(${o.x}px) scale(${o.s})`, fontSize: 20, lineHeight: 1,
                            animationDelay: `${i * 60}ms` }}>
                          {HEART}
                        </span>
                      ))
                    ))}
                  </div>
                {/* Шудрахад гарч ирэх хариултын дүрс — зөвхөн чирэх үед ил */}
                <span className="swipe-hint absolute left-0 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: C.lilacDeep }}>
                  <Reply size={16} strokeWidth={2.4} />
                </span>
                <div
                  ref={(el) => {
                    if (el) bubbleRefs.current.set(m.id, el); else bubbleRefs.current.delete(m.id);
                    if (m.id === lastPartnerId) lastPartnerBubbleRef.current = el;
                  }}
                  {...g}
                  /* `relative` — хариултын дүрс absolute тул байрлуулаагүй
                     элементийн ДЭЭР зурагддаг. Бөмбөлгийг ч байрлуулснаар DOM
                     дараалал шийднэ: бөмбөлөг сүүлд байгаа тул дүрсийг далдална. */
                  /* chat-bubble — iOS дээр текст сонголтыг хааж, урт дарах
                     дохиог сонголтын томруулагчид булаалгахгүй (ios.css) */
                  className={`chat-bubble relative w-fit text-[13px] font-semibold cursor-pointer ${isMedia && !m.replyTo ? "p-1.5" : "px-3.5 py-2.5"}`}
                  style={{
                    ...g.style,
                    ...(bare
                      ? { background: "transparent", border: "none", padding: 0 }
                      : {
                        background: mine ? C.lilacDeep : C.card, color: mine ? "#fff" : C.ink,
                        border: mine ? "none" : `1.5px solid ${C.line}`,
                        borderRadius: BUBBLE_R,
                        [`borderTop${side}Radius`]: groupStart ? BUBBLE_R : BUBBLE_R_MERGED,
                        [`borderBottom${side}Radius`]: groupEnd ? BUBBLE_R : BUBBLE_R_MERGED,
                      }),
                    ...(flashId === m.id ? { outline: `2.5px solid ${C.gold}`, outlineOffset: 2 } : {}),
                    transition: "outline-color 300ms ease",
                  }}>
                  {m.replyTo && (
                    <button onClick={(e) => { e.stopPropagation(); jumpTo(m.replyTo.id); }}
                      className="w-full text-left rounded-[12px] px-2.5 py-1.5 mb-1.5 block active:scale-[0.98]"
                      style={{
                        background: mine ? "rgba(255,255,255,.18)" : C.cardIn,
                        borderLeft: `3px solid ${mine ? "#fff" : C.lilacDeep}`,
                        transition: "transform 120ms ease",
                      }}>
                      <span className="text-[9.5px] font-extrabold block opacity-90">{m.replyTo.senderName || "Зурвас"}</span>
                      <span className="text-[11px] font-semibold block opacity-80 line-clamp-2">{m.replyTo.preview}</span>
                    </button>
                  )}
                  <MessageBody m={m} mine={mine} />
                </div>

                {/* Реакцийн чип — бөмбөлгийн доод буланд наалдана.
                    absolute тул зурвасын өндрийг нэмэхгүй; -mb нь дараагийн
                    зурвастай мөргөлдөхгүйн тулд эцэгт зай үлдээнэ. */}
                {chips.length > 0 && (
                  <div className={`absolute -bottom-2 flex gap-0.5 ${mine ? "right-2" : "left-2"}`}>
                    {chips.map((c) => (
                      <span key={c.emoji}
                        className="flex items-center gap-0.5 rounded-full px-1.5 text-[11px] leading-none"
                        style={{
                          height: 18,
                          background: C.card,
                          border: `1.5px solid ${c.mine ? C.lilacDeep : C.line}`,
                          boxShadow: "0 1px 4px rgba(0,0,0,.10)",
                        }}>
                        {c.emoji}
                        {c.count > 1 && (
                          <span className="text-[9px] font-extrabold" style={{ color: C.inkSoft }}>{c.count}</span>
                        )}
                      </span>
                    ))}
                  </div>
                )}
                </div>

                {reactingTo === m.id && (
                  <>
                    {/* Зурвас бүрийн доор цаг бичихийг больсон тул дарахад л харуулна */}
                    {m.createdAt?.toDate && (
                      <div className="text-[9.5px] font-bold mt-1 px-1" style={{ color: C.inkSoft }}>
                        {chatStamp(m.createdAt.toDate())}
                      </div>
                    )}
                    <div className="flex items-center gap-1 mt-1 px-1.5 py-1 rounded-full" style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
                      {QUICK_REACTIONS.map((e) => (
                        <button key={e} onClick={() => react(m, e)}
                          className="w-7 h-7 rounded-full flex items-center justify-center text-[15px] active:scale-90"
                          style={{ background: myReaction === e ? C.cardIn : "transparent", transition: "transform 120ms ease" }}>
                          {e}
                        </button>
                      ))}
                      <div className="w-[1.5px] self-stretch my-0.5" style={{ background: C.line2 }} />
                      <button onClick={() => startReply(m)}
                        className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                        style={{ color: C.inkSoft, transition: "transform 120ms ease" }} aria-label="Хариулах">
                        <Reply size={14} strokeWidth={2.2} />
                      </button>
                      <button onClick={() => toggleSave(m)}
                        className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                        style={{ color: savedIds.has(m.id) ? C.lilacDeep : C.inkSoft, transition: "transform 120ms ease" }}
                        aria-label={savedIds.has(m.id) ? "Хадгалснаас хасах" : "Хадгалах"}>
                        {savedIds.has(m.id)
                          ? <BookmarkCheck size={14} strokeWidth={2.4} />
                          : <Bookmark size={14} strokeWidth={2.2} />}
                      </button>
                      {draw && (
                        <button onClick={() => saveSticker(m.strokes || [])}
                          className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                          style={{ color: C.inkSoft, transition: "transform 120ms ease" }}
                          aria-label="Sticker болгож хадгалах">
                          <Sticker size={14} strokeWidth={2.2} />
                        </button>
                      )}
                      {copyableText(m) && (
                        <>
                          <button onClick={() => copyMessage(m)}
                            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                            style={{ color: copiedId === m.id ? C.waterDeep : C.inkSoft, transition: "transform 120ms ease" }}
                            aria-label={copiedId === m.id ? "Хуулагдлаа" : "Хуулах"}>
                            {copiedId === m.id
                              ? <Check size={14} strokeWidth={2.6} />
                              : <Copy size={14} strokeWidth={2.2} />}
                          </button>
                        </>
                      )}
                      {mine && (
                        <>
                          <div className="w-[1.5px] self-stretch my-0.5" style={{ background: C.line2 }} />
                          <button onClick={() => deleteMessage(m.id)}
                            className="w-7 h-7 rounded-full flex items-center justify-center active:scale-90"
                            style={{ color: C.peachDeep, transition: "transform 120ms ease" }} aria-label="Устгах">
                            <Trash2 size={14} strokeWidth={2.2} />
                          </button>
                        </>
                      )}
                    </div>
                  </>
                )}

                {/* Уншсан төлөв зөвхөн өөрийн сүүлийн зурвасын доор — Instagram шиг */}
                {/* Хамтрагч хаана хүртэл уншсаныг тэр зурвас дээр нь заана.
                    Сүүлийн зурвас хүртэл уншсан бол ердийн "Үзсэн" — тусад нь
                    аватар харуулах шаардлагагүй. */}
                {m.id === partnerReadId && m.id !== lastMineId && (
                  <div className="flex items-center gap-1 mt-1 px-1">
                    {partnerAvatar
                      ? <img src={partnerAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover"
                          style={{ border: `1px solid ${C.line2}` }} />
                      : <span className="w-3.5 h-3.5 rounded-full" style={{ background: C.line2 }} />}
                    <span className="text-[9px] font-bold" style={{ color: C.inkSoft }}>энд хүртэл уншсан</span>
                  </div>
                )}

                {m.id === lastMineId && (
                  <div className="text-[9.5px] font-bold mt-1 px-1" style={{ color: C.inkSoft }}>
                    {seen ? "Үзсэн" : "Илгээгдсэн"}
                  </div>
                )}
              </div>
            );
          })}
          </>
        )}

        {/* Хамтрагч бичиж байна — жагсаалтын доор, зурвасын байранд */}
        {partnerTyping && (
          <div className="flex items-start" style={{ marginTop: 8 }}>
            <div className="flex items-center gap-1 px-3.5 py-3 rounded-[18px]"
              style={{ background: C.card, border: `1.5px solid ${C.line}` }}>
              {[0, 1, 2].map((i) => (
                <span key={i} className="typing-dot rounded-full"
                  style={{ width: 6, height: 6, background: C.inkSoft, animationDelay: `${i * 160}ms` }} />
              ))}
            </div>
          </div>
        )}
      </div>

      {showReact && (
        <div className="flex gap-2 mb-2">
          {REACTIONS.map((r) => (
            <Pill key={r.key} onClick={() => sendReaction(r)} className="flex-1 py-2 text-[12px]">{r.label}</Pill>
          ))}
        </div>
      )}

      {sendError && (
        <button onClick={() => setSendError("")}
          className="w-full text-left text-[11.5px] font-bold rounded-2xl px-3 py-2 mb-2"
          style={{ background: `color-mix(in srgb, ${C.peach} 18%, ${C.card})`, border: `1.5px solid ${C.peach}`, color: C.peachDeep }}>
          {sendError} (хаах)
        </button>
      )}

      {showDraw && (
        <DrawPad stickers={stickers} onClose={() => { setShowDraw(false); setGreetMode(false); }} onSend={sendDrawing}
          onSaveSticker={saveSticker} onDeleteSticker={deleteSticker}
          onSendSticker={(s) => sendDrawing(s.strokes || [])} />
      )}

      {/* Хавсралтын панел. Дөрвөн товчийг оролтын мөрөнд зэрэгцүүлэхэд бичих
          талбар хэт нарийсдаг байсан тул нэг "+"-ийн ард цуглуулав. */}
      {showAttach && (
        <div className="grid grid-cols-3 gap-2 mb-2">
          {[
            { key: "draw", label: "Зурах", icon: <Brush size={18} strokeWidth={2.2} />, c: C.lilacDeep,
              on: () => { setShowAttach(false); setShowReact(false); setShowDraw(true); } },
            { key: "sticker", label: "Sticker", icon: <Sticker size={18} strokeWidth={2.2} />, c: C.gold,
              on: () => { setShowAttach(false); setShowReact(false); setShowStickers(true); } },
            { key: "img", label: "Зураг", icon: <ImageIcon size={18} strokeWidth={2.2} />, c: C.sageDeep,
              on: () => imgFileRef.current?.click() },
            { key: "loc", label: "Байршил", icon: <MapPin size={18} strokeWidth={2.2} />, c: C.waterDeep,
              on: () => { setShowAttach(false); sendLocation(); } },
            { key: "react", label: "Реакц", icon: <Heart size={18} strokeWidth={2.2} />, c: C.peachDeep,
              on: () => { setShowAttach(false); setShowDraw(false); setShowReact(true); } },
            { key: "voice", label: "Дуу хоолой", icon: <Mic size={18} strokeWidth={2.2} />, c: C.ink,
              on: startRec },
            { key: "greet", label: "Мэндчилгээ", icon: <Sunrise size={18} strokeWidth={2.2} />, c: C.gold,
              on: () => { setShowAttach(false); setShowReact(false); setGreetMode(true); setShowDraw(true); } },
            { key: "later", label: "Дараа илгээх", icon: <Clock size={18} strokeWidth={2.2} />, c: C.waterDeep,
              on: () => { setShowAttach(false); setShowReact(false); setShowSchedule(true); } },
          ].map((a) => (
            <button key={a.key} onClick={a.on} disabled={a.key === "img" && uploading}
              className="flex flex-col items-center gap-1 py-2 rounded-2xl active:scale-95 disabled:opacity-40"
              style={{ background: C.card, border: `1.6px solid ${C.line}`, transition: "transform 150ms ease" }}>
              <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: a.c, color: "#fff" }}>
                {a.icon}
              </span>
              <span className="text-[9.5px] font-extrabold" style={{ color: C.inkSoft }}>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Товлосон зурвас — одоо бичээд ирээдүйд хүргэгдэнэ */}
      {showSchedule && (
        <div className="mb-2 rounded-2xl p-3" style={{ background: C.card, border: `1.6px solid ${C.line}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11.5px] font-extrabold" style={{ color: C.ink }}>Дараа илгээх</span>
            <button onClick={() => { setShowSchedule(false); setSchedText(""); setSchedWhen(""); }}
              className="text-[11px] font-extrabold px-2 py-1" style={{ color: C.inkSoft }}>Хаах</button>
          </div>

          <input value={schedText} onChange={(e) => setSchedText(e.target.value)} placeholder="Юу гэж бичих вэ…"
            className="w-full rounded-2xl px-3.5 py-2.5 text-[16px] font-medium outline-none mb-2"
            style={{ background: C.cardIn, border: `1.5px solid ${C.line}`, color: C.ink }} />

          <input type="datetime-local" value={schedWhen} onChange={(e) => setSchedWhen(e.target.value)}
            className="w-full rounded-2xl px-3.5 py-2.5 text-[16px] font-medium outline-none mb-2"
            style={{ background: C.cardIn, border: `1.5px solid ${C.line}`, color: C.ink }} />

          <button onClick={scheduleMessage} disabled={!schedText.trim() || !parseWhen(schedWhen)}
            className="w-full rounded-full py-2.5 text-[12.5px] font-extrabold active:scale-[0.98] disabled:opacity-40"
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 120ms ease" }}>
            Товлох
          </button>

          {/* Хүлээгдэж буй зурвасууд — товлочихоод мартах нь амархан */}
          {waiting.length > 0 && (
            <div className="mt-2.5">
              {waiting.map((s) => (
                <div key={s.id} className="flex items-center gap-2 rounded-xl px-2.5 py-1.5 mb-1"
                  style={{ background: C.cardIn }}>
                  <span className="text-[11px] font-semibold flex-1 min-w-0 truncate" style={{ color: C.ink }}>{s.text}</span>
                  <span className="text-[9.5px] font-bold shrink-0" style={{ color: C.inkSoft }}>
                    {s.at?.toDate ? chatStamp(s.at.toDate()) : ""}
                  </span>
                  {s.from === accountKey && (
                    <button onClick={() => deleteDoc(doc(scheduledCol(), s.id)).catch(() => {})}
                      aria-label="Товлолтыг цуцлах" className="shrink-0 active:scale-90"
                      style={{ color: C.peachDeep, transition: "transform 120ms ease" }}>
                      <X size={13} strokeWidth={2.6} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticker сан — зурах самбар нээхгүйгээр шууд илгээх */}
      {showStickers && (
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11.5px] font-extrabold" style={{ color: C.ink }}>Миний sticker</span>
            <button onClick={() => setShowStickers(false)} className="text-[11px] font-extrabold px-2 py-1 rounded-full"
              style={{ color: C.inkSoft }}>Хаах</button>
          </div>
          {stickers.length === 0 ? (
            <p className="text-[11.5px] font-semibold py-3 text-center" style={{ color: C.inkSoft }}>
              Sticker алга. Зурах самбар дээр зураад 🔖 дар.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              {stickers.map((s) => (
                <button key={s.id} onClick={() => { setShowStickers(false); sendDrawing(s.strokes || []); }}
                  aria-label="Sticker илгээх"
                  className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center active:scale-90"
                  style={{ background: DRAW_CHECKER, border: `1.6px solid ${C.line2}`, transition: "transform 120ms ease" }}>
                  <DrawingView strokes={s.strokes} />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Дээгүүр уншиж байхад ирсэн зурвасыг мэдэгдэнэ — хүчээр татахгүй */}
      {unread > 0 && (
        <button onClick={() => scrollToBottom()}
          className="self-center mb-2 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11.5px] font-extrabold active:scale-95"
          style={{ background: C.lilacDeep, color: "#fff", boxShadow: "0 4px 14px rgba(0,0,0,.18)",
            transition: "transform 150ms ease" }}>
          <ChevronDown size={14} strokeWidth={2.8} />
          {unread > 1 ? `${unread} шинэ зурвас` : "Шинэ зурвас"}
        </button>
      )}

      {/* Хариулж буй зурвас */}
      {replyTo && (
        <div className="flex items-center gap-2 mb-2 rounded-2xl px-3 py-2"
          style={{ background: C.cardIn, borderLeft: `3px solid ${C.lilacDeep}` }}>
          <div className="flex-1 min-w-0">
            <div className="text-[9.5px] font-extrabold" style={{ color: C.lilacDeep }}>
              {replyTo.senderName || "Зурвас"}-д хариулж байна
            </div>
            <div className="text-[11px] font-semibold truncate" style={{ color: C.inkSoft }}>{replyTo.preview}</div>
          </div>
          <button onClick={() => setReplyTo(null)} aria-label="Болих"
            className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 active:scale-90"
            style={{ color: C.inkSoft, transition: "transform 120ms ease" }}>
            <X size={13} strokeWidth={2.6} />
          </button>
        </div>
      )}

      {recording && (
        <div className="flex items-center gap-3 mb-2 rounded-[20px] px-4 py-3"
          style={{ background: `color-mix(in srgb, ${C.peach} 18%, ${C.card})`, border: `1.6px solid ${C.peach}` }}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ background: C.peachDeep, animation: "pulse 1s ease-in-out infinite" }} />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Бичиж байна… {durText(recSecs)}</div>
            <div className="text-[10.5px] font-bold" style={{ color: C.inkSoft }}>Дээд тал нь 60 секунд</div>
          </div>
          <button onClick={() => stopRec(true)} aria-label="Болих"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: C.card, border: `1.6px solid ${C.line2}`, color: C.inkSoft, transition: "transform 120ms ease" }}>
            <X size={15} strokeWidth={2.6} />
          </button>
          <button onClick={() => stopRec(false)} aria-label="Илгээх"
            className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center active:scale-90"
            style={{ background: C.lilacDeep, color: "#fff", transition: "transform 120ms ease" }}>
            <Send size={15} strokeWidth={2.4} />
          </button>
        </div>
      )}

      <div className="safe-bottom-pad flex gap-2 items-center pb-1">
        <button onClick={() => {
          setShowDraw(false); setShowReact(false); setShowStickers(false);
          setShowAttach((s) => !s);
        }}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
          style={{
            background: showAttach ? C.lilacDeep : C.card, border: `1.8px solid ${C.line2}`,
            color: showAttach ? "#fff" : C.ink,
            transform: showAttach ? "rotate(45deg)" : "none",
            transition: "transform 200ms cubic-bezier(.2,.8,.3,1)",
          }} aria-label="Хавсаргах">
          <Plus size={19} strokeWidth={2.6} />
        </button>
        <input ref={imgFileRef} type="file" accept="image/*" onChange={onImageChange} className="hidden" />
        <input value={text}
          onChange={(e) => {
            setText(e.target.value);
            /* Бүх текстээ устгасан бол бичихээ больсонтой адил */
            if (e.target.value) pingTyping(); else clearTyping();
          }}
          onBlur={clearTyping}
          onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="Мессеж бичих..."
          onFocus={() => {
            /* гар нээгдэж frame агшсаны дараа гулсана */
            setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 300);
          }}
          enterKeyHint="send" autoCapitalize="sentences" autoCorrect="off"
          className="flex-1 min-w-0 rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
        <button onClick={onSend}
          className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95"
          style={{ background: C.lilacDeep, color: "#fff", transition: "transform 150ms ease" }} aria-label="Илгээх">
          <Send size={16} strokeWidth={2.4} />
        </button>
      </div>
    </div>
  );
}
