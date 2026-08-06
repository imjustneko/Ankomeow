/* Зургийг бүтэн дэлгэцээр харах цонх.

   Утасны хүрээ (аппын гаднах frame) transform хэрэглэдэг тул `position: fixed`
   нь тэр хүрээнд боогдоно. Иймд createPortal-оор шууд <body> дээр гаргана —
   эс бөгөөс "бүтэн дэлгэц" нь утасны дэлгэцийн хэмжээгээр л томорно. */

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Lightbox({ src, alt = "", onClose }) {
  /* Esc-ээр хаах, нээлттэй үед арын хуудас гүйхгүй байх */
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  if (!src) return null;

  return createPortal(
    <div
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Зураг"
      className="fixed inset-0 z-[999] flex items-center justify-center lightbox-in"
      style={{ background: "rgba(0,0,0,.92)" }}>
      <button onClick={onClose} aria-label="Хаах"
        className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center active:scale-90"
        style={{ background: "rgba(255,255,255,.14)", color: "#fff", transition: "transform 120ms ease" }}>
        <X size={20} strokeWidth={2.6} />
      </button>
      {/* Зураг дээр дархад хаагдахгүй — санамсаргүй хүрэлтээс хамгаална */}
      <img src={src} alt={alt} onClick={(e) => e.stopPropagation()}
        className="max-w-full max-h-full block" style={{ objectFit: "contain" }} />
    </div>,
    document.body
  );
}
