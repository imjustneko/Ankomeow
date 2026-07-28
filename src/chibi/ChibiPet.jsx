import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createBrain } from "./brain.js";
import { SPRITE_URL, SPRITE_WIDTH, SPRITE_HEIGHT, cellPosition, frameFor } from "./sprites.js";

/* Sprite зураг ачаалагдаагүй үед харагдах энгийн орлуулагч —
   хоосон дөрвөлжин гарахаас сэргийлнэ. */
const PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 72 72">
       <circle cx="36" cy="30" r="20" fill="#F2E3D5" stroke="#4A4038" stroke-width="2"/>
       <circle cx="28" cy="30" r="2.6" fill="#4A4038"/>
       <circle cx="44" cy="30" r="2.6" fill="#4A4038"/>
       <circle cx="24" cy="37" r="4" fill="#F0A6A6" opacity="0.75"/>
       <circle cx="48" cy="37" r="4" fill="#F0A6A6" opacity="0.75"/>
       <rect x="28" y="49" width="16" height="16" rx="6" fill="#C9C2B8" stroke="#4A4038" stroke-width="2"/>
     </svg>`
  );

/* Гар нээлттэй эсэхийг --kb-inset-ээс уншина (useKeyboardInset аль хэдийн бичдэг).
   documentElement-ийн style өөрчлөгдөх бүрт л шалгах тул frame бүрт
   getComputedStyle дуудахгүй. */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const root = document.documentElement;
    const read = () => {
      const raw = root.style.getPropertyValue("--kb-inset") || "0px";
      setOpen(parseInt(raw, 10) > 0);
    };
    read();
    const obs = new MutationObserver(read);
    obs.observe(root, { attributes: true, attributeFilter: ["style"] });
    return () => obs.disconnect();
  }, []);
  return open;
}

export default function ChibiPet({ character, enabled, onPoke, happyAt }) {
  const layerRef = useRef(null);
  const spriteRef = useRef(null);
  const heartsRef = useRef(null);
  const brainRef = useRef(null);
  const rafRef = useRef(0);
  const [cell, setCell] = useState(0);
  const [state, setState] = useState("walk");
  const [hearts, setHearts] = useState(0); /* зүрхний анимацийг дахин эхлүүлэх түлхүүр */
  const [broken, setBroken] = useState(false);
  const keyboardOpen = useKeyboardOpen();

  const visible = enabled && !keyboardOpen;

  /* Тархийг нэг удаа үүсгэж, хүрээний өргөнд тааруулна */
  useLayoutEffect(() => {
    if (!visible) return;
    const width = layerRef.current?.clientWidth || 360;
    if (!brainRef.current) {
      brainRef.current = createBrain({ width, spriteWidth: SPRITE_WIDTH });
    } else {
      brainRef.current.setWidth(width);
    }
  }, [visible]);

  /* Дэлгэц эргэхэд хүрээнд эргэж багтаана */
  useEffect(() => {
    if (!visible) return;
    const onResize = () => {
      const width = layerRef.current?.clientWidth;
      if (width) brainRef.current?.setWidth(width);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visible]);

  /* Хөдөлгөөний цикл. Байрлалыг transform-оор шууд бичих тул
     React дахин render хийхгүй; зөвхөн төлөв/кадр солигдоход л render болно. */
  useEffect(() => {
    if (!visible) return;
    let running = true;

    const loop = (t) => {
      if (!running) return;
      const brain = brainRef.current;
      if (brain) {
        brain.tick(t);
        const s = brain.snapshot();
        if (spriteRef.current) {
          /* Шилжилт ба толин тусгалыг ЗААВАЛ нэг transform мөрөнд бичнэ.
             Тусдаа `scale` шинж чанар transform-ын ДАРАА нэмэгддэг тул
             зүүн тийш харсан chibi-гийн x сөрөг болж дэлгэцнээс гардаг. */
          spriteRef.current.style.transform = `translate3d(${s.x}px, 0, 0) scaleX(${s.facing})`;
        }
        if (heartsRef.current) {
          /* Зүрхэнд scaleX хийхгүй — emoji толин тусгал болно */
          heartsRef.current.style.transform = `translate3d(${s.x + SPRITE_WIDTH / 2}px, 0, 0)`;
        }
        const nextCell = frameFor(s.state, s.elapsed);
        setCell((c) => (c === nextCell ? c : nextCell));
        setState((st) => (st === s.state ? st : s.state));
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafRef.current) return;
      brainRef.current?.resume(performance.now());
      rafRef.current = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);
    if (!document.hidden) start();

    return () => {
      running = false;
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [visible]);

  /* Хос намайг товшсон — happy үсрэлт */
  useEffect(() => {
    if (!happyAt || !brainRef.current) return;
    brainRef.current.happy(performance.now());
    setHearts((h) => h + 1);
  }, [happyAt]);

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture?.(e.pointerId);
    brainRef.current?.pointerDown(performance.now(), e.clientX);
  };

  const onPointerMove = (e) => {
    brainRef.current?.pointerMove(performance.now(), e.clientX);
  };

  const onPointerUp = () => {
    const res = brainRef.current?.pointerUp(performance.now());
    if (!res?.tapped) return;
    brainRef.current?.poke(performance.now());
    setHearts((h) => h + 1);
    navigator.vibrate?.(12);
    onPoke?.();
  };

  /* pointercancel (iOS ирмэгийн swipe, урт дарах цэс, дуудлага) — товшилт БИШ.
     Зөвхөн хурууг суллана: poke, зүрх, чичиргээ, түншид мэдэгдэл байхгүй. */
  const onPointerCancel = () => {
    brainRef.current?.pointerCancel(performance.now());
  };

  if (!visible) return null;

  const url = broken ? PLACEHOLDER : SPRITE_URL[character];
  /* Зүрхний контейнерын анхны байрлал — chibi-гийн голоос эхэлнэ */
  const heartsX = (brainRef.current?.snapshot().x ?? 0) + SPRITE_WIDTH / 2;
  const sheet = broken
    ? { backgroundImage: `url(${url})`, backgroundSize: "100% 100%", backgroundPosition: "0% 0%" }
    : { backgroundImage: `url(${url})`, backgroundSize: "300% 300%", backgroundPosition: cellPosition(cell) };

  return (
    <div ref={layerRef} className="absolute inset-0 z-[25] pointer-events-none overflow-hidden">
      {/* зураг ачаалагдахгүй бол орлуулагч руу шилжинэ */}
      <img src={SPRITE_URL[character]} alt="" className="hidden" onError={() => setBroken(true)} />

      <div
        ref={spriteRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
        className="absolute pointer-events-auto touch-none select-none"
        style={{
          width: SPRITE_WIDTH,
          height: SPRITE_HEIGHT,
          bottom: "calc(var(--chibi-baseline, 84px))",
          left: 0,
          transform: "translate3d(0,0,0)",
          backgroundRepeat: "no-repeat",
          ...sheet,
        }}
      >
        {state === "sleep" && (
          <span className="absolute -top-2 right-0 text-[11px] font-extrabold chibi-float" style={{ color: "#8A8079" }}>
            zZ
          </span>
        )}
      </div>

      {(state === "blush" || state === "happy") && (
        <div
          ref={heartsRef}
          key={hearts}
          className="absolute pointer-events-none"
          style={{
            bottom: "calc(var(--chibi-baseline, 84px) + 48px)",
            left: 0,
            /* key солигдоход дахин mount болдог тул эхний transform-ыг тархины
               одоогийн x-ээс авна — эс бөгөөс нэг фрэйм зүүн ирмэгт анивчина */
            transform: `translate3d(${heartsX}px, 0, 0)`,
          }}
        >
          <span className="chibi-heart" style={{ animationDelay: "0ms" }}>💗</span>
          <span className="chibi-heart" style={{ animationDelay: "160ms" }}>💗</span>
          <span className="chibi-heart" style={{ animationDelay: "320ms" }}>💗</span>
        </div>
      )}

      <style>{`
        .chibi-heart{position:absolute;font-size:13px;opacity:0;animation:chibi-heart-up 1.4s ease-out forwards}
        .chibi-heart:nth-child(2){left:14px}
        .chibi-heart:nth-child(3){left:-12px}
        @keyframes chibi-heart-up{
          0%{opacity:0;transform:translateY(0) scale(.6)}
          25%{opacity:1}
          100%{opacity:0;transform:translateY(-34px) scale(1)}
        }
        .chibi-float{animation:chibi-float 1.8s ease-in-out infinite}
        @keyframes chibi-float{0%,100%{transform:translateY(0);opacity:.5}50%{transform:translateY(-4px);opacity:1}}
        @media (prefers-reduced-motion: reduce){
          .chibi-heart,.chibi-float{animation:none}
        }
      `}</style>
    </div>
  );
}
