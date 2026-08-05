/* Firebase холболт, хосын бүртгэл, Firestore-ийн зам бүтэц.
   Аппын бүх өгөгдлийн цэг энд төвлөрнө — зам өөрчлөгдвөл нэг л газар засна. */

import { initializeApp } from "firebase/app";
import {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  collection, doc,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";

/* ── Firebase (хос chat) ── */
const firebaseConfig = {
  apiKey: "AIzaSyAr_ryueRKTmjdFawhcqjXMag0mVS6lDzo",
  authDomain: "ankomeow-9852b.firebaseapp.com",
  projectId: "ankomeow-9852b",
  storageBucket: "ankomeow-9852b.firebasestorage.app",
  messagingSenderId: "905222050926",
  appId: "1:905222050926:web:de0f3841c701fa2c18027f",
  measurementId: "G-ZQ7BB8B1ER",
};
export const fbApp = initializeApp(firebaseConfig);
/* Офлайн кэш: интернэтгүй үед уншина, бичсэн зүйл дараалалд орж дараа нь илгээгдэнэ.
   Хэрэв хөтөч дэмжихгүй бол (Private mode г.м.) энгийн санах ойн кэш рүү шилжинэ. */
export let db;
try {
  db = initializeFirestore(fbApp, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
  });
} catch {
  db = initializeFirestore(fbApp, {});
}
export const auth = getAuth(fbApp);
export const CHAT_ROOM = "ankomeow-couple";

/* ── хос бүртгэл (зөвхөн 2 fixed account, бүртгүүлэх боломжгүй) ── */
export const ACCOUNTS = {
  andela: { email: "andela@ankomeow.app", name: "Andela" },
  neko: { email: "neko@ankomeow.app", name: "Neko" },
};
export const accountKeyFromEmail = (email) => (email || "").split("@")[0];

/* ── Firestore-ийн зам бүтэц ──
   Бүх коллекц/баримтын зам энд. Дүрэм (firestore.rules) эдгээртэй нэг мөр байна. */

/* Чатын хүнд хавсралт (зураг, дуу) — зурвас нь зөвхөн blobId агуулна */
export const blobsCol = () => collection(db, "rooms", CHAT_ROOM, "blobs");
export const blobDoc = (id) => doc(db, "rooms", CHAT_ROOM, "blobs", id);
/* Өдрийн асуулт — өдөр бүрд нэг баримт, хоёулангийн хариулт дотор нь */
export const qaCol = () => collection(db, "rooms", CHAT_ROOM, "qa");
export const qaDoc = (d) => doc(db, "rooms", CHAT_ROOM, "qa", d);
/* Хамтын календарь — төлөвлөгөө ба дурсамж */
export const eventsCol = () => collection(db, "rooms", CHAT_ROOM, "events");
export const eventDocRef = (id) => doc(db, "rooms", CHAT_ROOM, "events", id);
/* Хадгалсан газрууд (geofence) */
export const placesCol = () => collection(db, "rooms", CHAT_ROOM, "places");
export const placeDocRef = (id) => doc(db, "rooms", CHAT_ROOM, "places", id);
/* Хосын нийтлэг мэдээлэл: танилцсан огноо, төрсөн өдрүүд */
export const coupleDoc = () => doc(db, "rooms", CHAT_ROOM, "couple", "info");
/* Өдөр бүрийн биелэлт — streak тоолоход */
export const daysCol = () => collection(db, "rooms", CHAT_ROOM, "days");
export const dayDoc = (d) => doc(db, "rooms", CHAT_ROOM, "days", d);
/* Хүслийн жагсаалт — эзэн нь бичнэ, хос нь харна */
export const wishesCol = (key) => collection(db, "rooms", CHAT_ROOM, "wishes", key, "items");
export const wishDoc = (key, id) => doc(db, "rooms", CHAT_ROOM, "wishes", key, "items", id);
/* Бодит цагийн байршил — эзэн нь бичиж, хос нь уншина */
export const liveDoc = (key) => doc(db, "rooms", CHAT_ROOM, "live", key);
/* Статус — өөрийн мөр/эможи */
export const profileDoc = (key) => doc(db, "rooms", CHAT_ROOM, "profiles", key);
/* Профайлын зураг — эзэн нь нэмж, хос нь харна */
export const postsCol = (key) => collection(db, "rooms", CHAT_ROOM, "posts", key, "items");
export const postDoc = (key, id) => doc(db, "rooms", CHAT_ROOM, "posts", key, "items", id);
/* Хадгалсан чат — зурвасын хуулбар өөрийн аккаунтын дор */
export const savedItemsCol = (accountKey) => collection(db, "rooms", CHAT_ROOM, "saved", accountKey, "items");
export const savedItemDoc = (accountKey, id) => doc(db, "rooms", CHAT_ROOM, "saved", accountKey, "items", id);
/* Өөрийн sticker сан */
export const stickersCol = (accountKey) => collection(db, "rooms", CHAT_ROOM, "stickers", accountKey, "items");
export const stickerDoc = (accountKey, id) => doc(db, "rooms", CHAT_ROOM, "stickers", accountKey, "items", id);
/* Чатын зурвасууд */
export const messagesCol = () => collection(db, "rooms", CHAT_ROOM, "messages");
export const messageDoc = (id) => doc(db, "rooms", CHAT_ROOM, "messages", id);
