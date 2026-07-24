import React from "react";
import ReactDOM from "react-dom/client";
import App from "../tovlorokh-khamtrakh.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("sw.js", { scope: "./" }).catch(() => {});
  });
}
