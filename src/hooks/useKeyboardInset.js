import { useEffect } from "react";

/* iOS дээр гар нээгдэхэд layout viewport өөрчлөгддөггүй тул агуулга гарын доор
   дарагддаг. visualViewport-оос гарын эзэлж буй өндрийг хэмжиж --kb-inset
   хувьсагчид бичнэ; CSS түүнийг ашиглаж frame-ийн өндрийг багасгана.

   Дэмжигдээгүй хөтөч дээр юу ч хийхгүй — --kb-inset нь 0px хэвээр үлдэнэ. */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;

    const apply = () => {
      /* vv.offsetTop нь хуудас дээшээ гулссан хэмжээ — түүнийг хасахгүй бол
         гар нээгдэх агшинд өндөр давхар тоологдоно. */
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      /* 40px-ээс бага зөрүүг гар гэж үзэхгүй — Safari-гийн хаягийн мөр
         агшиж тэлэхэд ч мөн адил зөрүү гардаг. */
      const kb = hidden > 40 ? Math.round(hidden) : 0;
      root.style.setProperty("--kb-inset", `${kb}px`);
    };

    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);

    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      root.style.setProperty("--kb-inset", "0px");
    };
  }, []);
}
