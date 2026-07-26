import React from "react";
import ReactDOM from "react-dom/client";
import App from "../tovlorokh-khamtrakh.jsx";

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredInstallPrompt = e;
  window.dispatchEvent(new Event("pwa-install-available"));
});

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).then((reg) => {
      const notifyIfWaiting = () => {
        if (reg.waiting && navigator.serviceWorker.controller) {
          window.dispatchEvent(new Event("ankomeow-update-available"));
        }
      };
      notifyIfWaiting();

      reg.addEventListener("updatefound", () => {
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener("statechange", () => {
          if (sw.state === "installed") notifyIfWaiting();
        });
      });

      /* апп дэлгэц рүү дахин гарч ирэх бүрд шинэ хувилбар байгаа эсэхийг шалгана */
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") reg.update().catch(() => {});
      });
    }).catch(() => {});
  });

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (window.ankomeowReloadedForUpdate) return;
    window.ankomeowReloadedForUpdate = true;
    window.location.reload();
  });
}

window.ankomeowApplyUpdate = () => {
  navigator.serviceWorker.getRegistration().then((reg) => {
    reg?.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
};
