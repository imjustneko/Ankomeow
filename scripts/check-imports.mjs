/* Модулиуд хоорондын дутуу импортыг барина.

   Яагаад хэрэгтэй вэ: `vite build` нь ЗӨВХӨН олдоогүй файл, синтаксийн алдааг
   барьдаг. Нэг модуль нөгөөгийнхөө нэрийг импортгүйгээр ашиглавал bundler
   түүнийг глобал гэж үзэж дуугүй өнгөрдөг — алдаа нь зөвхөн хэрэглэгчийн
   дэлгэц дээр ReferenceError болж гарна. Дэлгэцүүдийг тусад нь салгасны дараа
   энэ эрсдэл бодитой болсон тул build бүрийн өмнө үүнийг ажиллуулна.

   Ажиллуулах: npm run check   (эсвэл npm run build дотор автоматаар) */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, normalize } from "node:path";

const ROOTS = ["src"];
const EXTRA = ["tovlorokh-khamtrakh.jsx"];

/* Функцийн параметр, локал хувьсагчийг дээд түвшний нэртэй андуурч болзошгүй
   тул мэдэгдэж байгаа хуурамч дохиог алгасна. */
const IGNORE = new Set(["auth", "fbApp", "isIOS", "isStandalone"]);

/* Нэрийг ГАНЦААР нь олох загвар.
   Энгийн `\b` нь зурааст нэрийн дотроос ч олдог: className="safe-bottom-pad"
   доторх "pad" нь `\bpad\b`-д тохирч, `pad`-ыг импортлоогүй файлыг худал
   буруутгадаг байв. Тиймээс зураасыг ч үсэгтэй адилтган зааг гэж үзэхгүй. */
const alone = (n) => new RegExp(`(?<![-\\w$])${n.replace(/\$/g, "\\$")}(?![-\\w$])`);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.jsx?$/.test(p) && !p.includes(".test.")) out.push(p);
  }
  return out;
}

const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/^\s*\/\/.*$/gm, "");

/* "Энэ файл нэрийг ашиглаж байна уу" гэдгийг шалгах биет.

   import мөрүүдийг хасна: замын мөр өөрөө нэр агуулж болно
   (`from "./useSwipeBack.js"` доторх useSwipeBack), тэр нь хэрэглээ БИШ.
   Эс бөгөөс модулийг нэрийнх нь дагуу нэрлэсэн болгон өөрийгөө импортлоогүй
   гэж буруутгагдана. */
const usageBody = (s) => stripComments(s).replace(/^\s*import\s[\s\S]*?from\s*["'][^"']*["'];?/gm, "");

const declared = (s) => {
  const out = new Set();
  const re = /^(?:export\s+)?(?:async\s+)?(?:function|const|let|var)\s+([A-Za-z_$][\w$]*)/gm;
  for (const m of s.matchAll(re)) out.add(m[1]);
  return out;
};

const imported = (s) => {
  const out = new Set();
  for (const m of s.matchAll(/import\s*\{([\s\S]*?)\}\s*from/g)) {
    for (const part of m[1].split(",")) {
      const n = part.trim();
      if (n) out.add(n.split(" as ").pop().trim());
    }
  }
  for (const m of s.matchAll(/import\s+([A-Za-z_$][\w$]*)\s+from/g)) out.add(m[1]);
  return out;
};

/* Модулиас ГАДАГШ гаргаж буй нэрс — `export const X`, `export function X`,
   `export class X`, мөн `export { a, b as c }`. */
const exported = (s) => {
  const out = new Set();
  for (const m of s.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|var|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    out.add(m[1]);
  }
  for (const m of s.matchAll(/^export\s*\{([^}]*)\}/gm)) {
    for (const part of m[1].split(",")) {
      const n = part.trim();
      if (n) out.add(n.split(/\s+as\s+/).pop().trim());
    }
  }
  return out;
};

/* `import { a, b as c } from "./x.js"` мөрүүдийг задлана (зөвхөн харьцангуй зам) */
const relImports = (s) => {
  const out = [];
  /* `[^{}]` — хаалтын доторх агуулга нь хаагдах хаалтыг давж чадахгүй.
     Ердийн `[\s\S]*?` бол `} from "react"`-ыг алгасч, дараагийн import руу
     үсэрч, "react"-ийн нэрсийг харьцангуй модулийнх гэж андуурч байв. */
  for (const m of s.matchAll(/import\s*\{([^{}]*?)\}\s*from\s*["'](\.[^"']*)["']/g)) {
    const names = m[1].split(",").map((p) => p.trim().split(/\s+as\s+/)[0].trim()).filter(Boolean);
    out.push({ names, spec: m[2] });
  }
  return out;
};

const files = [...ROOTS.flatMap((r) => walk(r)), ...EXTRA];
const src = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

/* нэр → аль файлд тодорхойлогдсон */
const owner = new Map();
for (const [f, s] of src) {
  for (const n of declared(s)) if (!owner.has(n)) owner.set(n, f);
}

let bad = 0;

/* Импортолсон нэр тэр модульд ҮНЭХЭЭР байгаа эсэх.

   Дээрх шалгалтууд нь "импорт дутуу"-г л барьдаг. Гэтэл нэрийг өөр модуль руу
   ЗӨӨХӨД хуучин импорт нь үлддэг — `vite build` үүнийг зөвхөн сануулга болгож
   өнгөрөөдөг тул алдаа нь хөтөч дээр цагаан дэлгэц болж гарна. `chatTime`-ыг
   ui/message.jsx-ээс lib/time.js руу зөөхөд яг ингэж эвдэрсэн. */
for (const [f, s] of src) {
  const dir = dirname(f);
  const missing = [];
  for (const { names, spec } of relImports(s)) {
    const target = normalize(join(dir, spec));
    const t = src.get(target);
    if (!t) continue; /* энэ шалгалтын хамрах хүрээнээс гадуурх файл */
    const has = exported(t);
    for (const n of names) if (!has.has(n)) missing.push(`${n} (${target})`);
  }
  if (missing.length) {
    bad++;
    console.error(`✗ ${f}\n    байхгүй экспортыг импортолсон: ${missing.join(", ")}`);
  }
}

for (const [f, s] of src) {
  const have = new Set([...declared(s), ...imported(s)]);
  const body = usageBody(s);
  const missing = [...owner]
    .filter(([n, from]) => from !== f && !have.has(n) && !IGNORE.has(n)
      && alone(n).test(body))
    .map(([n, from]) => `${n} (${from})`);
  if (missing.length) {
    bad++;
    console.error(`✗ ${f}\n    дутуу импорт: ${missing.join(", ")}`);
  }
}

/* Гаднын сангийн функцууд импортлогдсон эсэх.

   Дээрх хоёр шалгалт нь төслийн нэрс болон JSX бүрэлдэхүүнийг л мэднэ.
   Гэтэл `updatePassword(...)` эсвэл `useRef(...)` гэх мэт гаднын дуудлага
   импортгүй үлдвэл bundler дуугүй өнгөрч, товч дарах эсвэл бөмбөлөг
   зурагдах мөчид л ReferenceError болдог. Задаргааны дараа ProfileScreen
   (нууц үг солих) ба message.jsx (дуут зурвас) хоёр яг ингэж эвдэрсэн. */
const EXTERNAL = {
  "firebase/auth": ["onAuthStateChanged", "signInWithEmailAndPassword", "updatePassword",
    "EmailAuthProvider", "reauthenticateWithCredential", "getAuth", "signOut"],
  "firebase/firestore": ["collection", "addDoc", "doc", "getDoc", "setDoc", "updateDoc",
    "deleteDoc", "onSnapshot", "query", "orderBy", "limit", "serverTimestamp",
    "arrayUnion", "increment", "where", "getDocs"],
  react: ["useState", "useEffect", "useRef", "useMemo", "useCallback", "useReducer"],
};

for (const [f, s] of src) {
  const have = imported(s);
  /* import мөрүүдийг өөрсдийг нь хасна — эс бөгөөс өөрийгөө олно */
  const body = usageBody(s);
  for (const [mod, names] of Object.entries(EXTERNAL)) {
    const missing = names.filter((n) => !have.has(n)
      && new RegExp(`\\b${n}\\s*[.(]`).test(body));
    if (missing.length) {
      bad++;
      console.error(`✗ ${f}\n    "${mod}"-оос дутуу: ${missing.join(", ")}`);
    }
  }
}

/* JSX доторх бүрэлдэхүүн бүр тодорхойлогдсон эсэх.

   Дээрх шалгалт нь зөвхөн ЭНЭ ТӨСЛИЙН нэрсийг мэддэг тул гаднаас ирдэг
   бүрэлдэхүүн (жишээ нь lucide-react-ийн дүрс) импортгүй үлдвэл барихгүй.
   Яг ийм алдаанаас болж primitives.jsx-ийн Header нь ChevronLeft-гүй үлдэж,
   Header агуулсан БҮХ дэлгэц ажиллах үедээ унасан. Vite build үүнийг
   мэдээлээгүй — зөвхөн хэрэглэгчийн дэлгэц хар болсон. */
const HTML_TAG = /^[a-z]/;
for (const [f, s] of src) {
  if (!f.endsWith(".jsx")) continue;
  /* Энд догол мөрт (функц доторх) тодорхойлолтыг ч тооцно — DrawPad доторх
     IconBtn шиг локал бүрэлдэхүүн олон бий. */
  const local = new Set();
  for (const m of s.matchAll(/(?:const|let|var|function|class)\s+([A-Z][\w$]*)/g)) local.add(m[1]);
  const have = new Set([...declared(s), ...imported(s), ...local]);
  const body = stripComments(s);
  const used = new Set();
  for (const m of body.matchAll(/<([A-Za-z][\w.]*)/g)) {
    const tag = m[1].split(".")[0];
    if (!HTML_TAG.test(tag)) used.add(tag);
  }
  const missing = [...used].filter((n) => !have.has(n));
  if (missing.length) {
    bad++;
    console.error(`✗ ${f}\n    тодорхойлогдоогүй бүрэлдэхүүн: ${missing.join(", ")}`);
  }
}

if (bad) {
  console.error(`\n${bad} файлд асуудал байна.`);
  process.exit(1);
}
console.log(`✓ ${files.length} файлын импорт бүрэн`);
