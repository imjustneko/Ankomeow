/* Модулиуд хоорондын дутуу импортыг барина.

   Яагаад хэрэгтэй вэ: `vite build` нь ЗӨВХӨН олдоогүй файл, синтаксийн алдааг
   барьдаг. Нэг модуль нөгөөгийнхөө нэрийг импортгүйгээр ашиглавал bundler
   түүнийг глобал гэж үзэж дуугүй өнгөрдөг — алдаа нь зөвхөн хэрэглэгчийн
   дэлгэц дээр ReferenceError болж гарна. Дэлгэцүүдийг тусад нь салгасны дараа
   энэ эрсдэл бодитой болсон тул build бүрийн өмнө үүнийг ажиллуулна.

   Ажиллуулах: npm run check   (эсвэл npm run build дотор автоматаар) */

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOTS = ["src"];
const EXTRA = ["tovlorokh-khamtrakh.jsx"];

/* Функцийн параметр, локал хувьсагчийг дээд түвшний нэртэй андуурч болзошгүй
   тул мэдэгдэж байгаа хуурамч дохиог алгасна. */
const IGNORE = new Set(["auth", "fbApp", "isIOS", "isStandalone"]);

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

const files = [...ROOTS.flatMap((r) => walk(r)), ...EXTRA];
const src = new Map(files.map((f) => [f, readFileSync(f, "utf8")]));

/* нэр → аль файлд тодорхойлогдсон */
const owner = new Map();
for (const [f, s] of src) {
  for (const n of declared(s)) if (!owner.has(n)) owner.set(n, f);
}

let bad = 0;
for (const [f, s] of src) {
  const have = new Set([...declared(s), ...imported(s)]);
  const body = stripComments(s);
  const missing = [...owner]
    .filter(([n, from]) => from !== f && !have.has(n) && !IGNORE.has(n)
      && new RegExp(`\\b${n.replace(/\$/g, "\\$")}\\b`).test(body))
    .map(([n, from]) => `${n} (${from})`);
  if (missing.length) {
    bad++;
    console.error(`✗ ${f}\n    дутуу импорт: ${missing.join(", ")}`);
  }
}

if (bad) {
  console.error(`\n${bad} файлд дутуу импорт байна.`);
  process.exit(1);
}
console.log(`✓ ${files.length} файлын импорт бүрэн`);
