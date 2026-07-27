/* Ankomeow service worker
   — precache жагсаалт болон хувилбарыг build үед vite.config.js сольж бичдэг.
   — dev горимд орлуулалт хийгддэггүй тул placeholder нь энгийн текст хэвээр үлдэнэ. */

const PRECACHE_RAW = ["./","./index.html","./manifest.webmanifest","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./assets/gif.worker-CjkyQP34.js","./assets/index-B4cMH3ph.css","./assets/index-BSD_f0w8.js"];
const BUILD_VERSION = "d6a73450";

const PRECACHE = Array.isArray(PRECACHE_RAW)
  ? PRECACHE_RAW
  : ["./", "./manifest.webmanifest", "./icon-192.png", "./icon-512.png"];

const CACHE = "ankomeow-" + (BUILD_VERSION.startsWith("__") ? "dev" : BUILD_VERSION);

/* ── суулгах: бүрхүүл болон бүх hash-тай asset-ыг урьдчилан хадгална ── */
/* Нэг файл ч унавал install бүхэлдээ унах ёсгүй.
   Safari-д Request-ийн cache сонголт синхроноор алдаа өгч болзошгүй тул тусад нь барина. */
const cacheOne = (c, url) => {
  let req;
  try {
    req = new Request(url, { cache: "reload" });
  } catch {
    req = url;
  }
  return c.add(req).catch(() => {});
};

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(PRECACHE.map((u) => cacheOne(c, u)))));
});

self.addEventListener("message", (e) => {
  if (e.data?.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* ── унших стратеги ──
   navigate  : сүлжээ эхэлж, амжилтгүй бол cache-ээс index.html
   ижил эх   : cache эхэлж, байхгүй бол сүлжээнээс аваад хадгална
   гадаад эх : огт хөндөхгүй (Firestore, FCM урсгалыг эвдэхгүйн тулд) */
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put("./index.html", copy));
          return res;
        })
        .catch(() => caches.match("./index.html").then((r) => r || caches.match("./")))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        if (res.ok && res.type === "basic") {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      });
    })
  );
});

/* ── Push мэдэгдэл ──
   Сервер (Vercel /api/notify) зөвхөн data payload илгээдэг тул
   мэдэгдлийг өөрсдөө үүсгэнэ — ингэснээр агуулгыг бүрэн удирдана. */
self.addEventListener("push", (e) => {
  let payload = {};
  try {
    const raw = e.data ? e.data.json() : {};
    payload = raw.data || raw.notification || raw || {};
  } catch {
    payload = { body: e.data ? e.data.text() : "" };
  }

  const title = payload.title || "Ankomeow";
  const options = {
    body: payload.body || "",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: payload.tag || "ankomeow",
    renotify: true,
    data: { url: payload.url || "./", tab: payload.tab || "" },
  };

  /* Апп нээлттэй, харагдаж байвал OS мэдэгдэл давхардуулахгүй — аппад дотогш нь дамжуулна. */
  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      const visible = list.find((c) => c.visibilityState === "visible");
      if (visible) {
        visible.postMessage({ type: "PUSH_FOREGROUND", payload });
        return;
      }
      return self.registration.showNotification(title, options);
    })
  );
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const target = new URL(e.notification.data?.url || "./", self.location.origin + self.location.pathname).href;
  const tab = e.notification.data?.tab;

  e.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.startsWith(self.registration.scope)) {
          client.postMessage({ type: "NOTIFICATION_CLICK", tab });
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    })
  );
});
