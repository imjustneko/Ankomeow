import React from "react";
import ReactDOM from "react-dom/client";
import App from "../tovlorokh-khamtrakh.jsx";
import "./index.css";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
  window.dispatchEvent(new Event("pwa-install-available"));
});

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

/* Шинэ хувилбар бэлэн эсэхийг React-д мэдэгдэнэ.
   window дээр ч хадгална — React mount хийхээс өмнө үйл явдал гарвал алдагдахгүй. */
const setUpdateReady = (ready) => {
  window.ankomeowUpdateReady = ready;
  window.dispatchEvent(new CustomEvent("ankomeow-update-available", { detail: ready }));
};

const reloadOnce = () => {
  if (window.ankomeowReloadedForUpdate) return;
  window.ankomeowReloadedForUpdate = true;
  window.location.reload();
};

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    /* updateViaCache:"none" — GitHub Pages нь sw.js-ийг max-age=600-аар өгдөг тул
       хөтөч хуучин хуулбарыг ашиглахаас сэргийлнэ. */
    navigator.serviceWorker
      .register("sw.js", { scope: "./", updateViaCache: "none" })
      .then((reg) => {
        const check = () => setUpdateReady(!!reg.waiting && !!navigator.serviceWorker.controller);
        check();

        reg.addEventListener("updatefound", () => {
          const sw = reg.installing;
          if (!sw) return;
          sw.addEventListener("statechange", check);
        });

        /* апп дэлгэц рүү дахин гарч ирэх бүрд шинэ хувилбар байгаа эсэхийг шалгана */
        document.addEventListener("visibilitychange", () => {
          if (document.visibilityState !== "visible") return;
          reg.update().then(check).catch(() => {});
        });
      })
      .catch(() => {});
  });

  navigator.serviceWorker.addEventListener("controllerchange", reloadOnce);
}

/* Шинэчлэх товч. Ямар ч төлөвт "юу ч болохгүй" гэсэн байдалд орохгүй байх ёстой:
   - хүлээж буй worker байвал түүнийг идэвхжүүлнэ
   - байхгүй бол дахин шалгана
   - controllerchange ирэхгүй байсан ч (iOS дээр тохиолддог) хугацаагаар албадан дахин ачаална */
window.ankomeowApplyUpdate = async () => {
  const reg = await navigator.serviceWorker.getRegistration().catch(() => null);
  if (!reg) return reloadOnce();

  const activate = (worker) => {
    worker.addEventListener("statechange", () => {
      if (worker.state === "activated") reloadOnce();
    });
    worker.postMessage({ type: "SKIP_WAITING" });
    setTimeout(reloadOnce, 2500);
  };

  if (reg.waiting) return activate(reg.waiting);

  try {
    await reg.update();
  } catch {}

  if (reg.waiting) return activate(reg.waiting);

  /* Хүлээж буй хувилбар алга — товч хуучирсан байна. Төлөвийг цэвэрлээд шинэчилнэ. */
  setUpdateReady(false);
  reloadOnce();
};
