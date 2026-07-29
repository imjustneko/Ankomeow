/* Ankomeow — push мэдэгдлийн клиент тал (FCM Web Push).
   Тохируулах 2 утга (.env файлд):
     VITE_VAPID_KEY        — Firebase Console → Project settings → Cloud Messaging → Web Push certificates
     VITE_NOTIFY_ENDPOINT  — Vercel дээрх функцийн хаяг, ж: https://ankomeow-notify.vercel.app/api/notify */

/* firebase/messaging нь ~70KB бөгөөд зөвхөн push тохируулах үед хэрэгтэй.
   Статикаар импортловол эхний ачаалалтын шаталсан замд орно — тиймээс динамикаар татна. */
let messagingModPromise = null;
const messagingMod = () => (messagingModPromise ||= import("firebase/messaging"));

export const VAPID_KEY = import.meta.env.VITE_VAPID_KEY || "";
export const NOTIFY_ENDPOINT = import.meta.env.VITE_NOTIFY_ENDPOINT || "";

export const isIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent);

export const isStandalone = () =>
  window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;

/* Хөтөч push дэмжих эсэх. iOS дээр зөвхөн Home Screen-д суулгасан үед дэмжинэ. */
export async function pushSupported() {
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) return false;
  try {
    const { isSupported } = await messagingMod();
    return await isSupported();
  } catch {
    return false;
  }
}

export const pushPermission = () => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

/* Зөвшөөрөл асууж, FCM token авна. Амжилтгүй бол null буцаана. */
export async function requestPushToken(fbApp) {
  if (!VAPID_KEY) throw new Error("VITE_VAPID_KEY тохируулаагүй байна");

  /* Синхрон шалгалтууд — доорх requestPermission-оос өмнө await байж БОЛОХГҮЙ.
     iOS/Safari нь зөвшөөрөл асуухыг хэрэглэгчийн даралтын мөчид л зөвшөөрдөг тул
     дунд нь await орвол хүсэлт чимээгүй няцаагдана. */
  if (typeof Notification === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    throw new Error("Энэ хөтөч push мэдэгдэл дэмжихгүй");
  }

  if (Notification.permission !== "granted") {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") return null;
  }

  /* Зөвшөөрөл авсны дараа л удаан шалгалтуудыг хийнэ */
  if (!(await pushSupported())) throw new Error("Энэ хөтөч push мэдэгдэл дэмжихгүй");

  const registration = await navigator.serviceWorker.ready;
  const { getMessaging, getToken } = await messagingMod();
  const messaging = getMessaging(fbApp);
  const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration });
  return token || null;
}

/* Хамтрагч руу мэдэгдэл илгээнэ. Сүлжээ/тохиргоо унасан ч аппыг зогсоохгүй. */
export async function notifyPartner(auth, { to, title, body, tag, tab }) {
  if (!NOTIFY_ENDPOINT) return;
  const user = auth.currentUser;
  if (!user) return;

  try {
    const idToken = await user.getIdToken();
    await fetch(NOTIFY_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + idToken },
      body: JSON.stringify({ to, title, body, tag, tab }),
    });
  } catch {
    /* мэдэгдэл хүрэхгүй байх нь аппын үндсэн ажиллагаанд саад болохгүй */
  }
}
