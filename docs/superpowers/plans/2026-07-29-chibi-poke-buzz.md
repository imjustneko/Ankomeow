# Chibi товшилт → хамтрагчид чичиргээ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chibi-г товшиход хамтрагчийн утас чичирч, мэдэгдэл ирдэг болгох.

**Architecture:** Firestore-ийн `pokes/{accountKey}.total` нь монотон өсдөг тоолуур
болно. Илгээгч товшилт бүрд `increment(1)` бичээд давтагдахгүй tag-тай push
илгээнэ. Хүлээн авагч `onSnapshot`-оор ирсэн delta-г тоолж чичрүүлнэ — Android
дээр `navigator.vibrate`, iPhone дээр (Vibration API байхгүй тул) аппаас
`registration.showNotification()` дуудаж системийн мэдэгдлээр нь чичрүүлнэ.
Апп хаалттай үед service worker мэдэгдлийг `vibrate` тохиргоотой үзүүлнэ.

**Tech Stack:** React 18, Firebase Firestore/Messaging, vitest, vanilla service worker.

Spec: `docs/superpowers/specs/2026-07-29-chibi-poke-buzz-design.md`

## Global Constraints

- Бүх сэтгэгдэл (comment), тестийн нэр, хэрэглэгчид харагдах текст **монгол хэлээр**.
- Commit message монголоор, `Co-Authored-By: Claude` мөр **НЭМЭХГҮЙ**.
- `src/chibi/*.js` доторх модулиуд Firebase, DOM, React-аас **ангид** байна —
  vitest нь `environment: "node"`-оор ажилладаг.
- Чичиргээний дээд хязгаар: **5 цохилт**.
- Товшилтын throttle **байхгүй** — товшилт бүр шууд илгээгдэнэ.
- Одоо байгаа 54 тест унах ёсгүй.
- Тест ажиллуулах команд: `npm test`

---

### Task 1: `buzz.js` — цэвэр функцүүд

**Files:**
- Create: `src/chibi/buzz.js`
- Test: `src/chibi/buzz.test.js`

**Interfaces:**
- Consumes: юу ч үгүй — энэ бол суурь модуль.
- Produces:
  - `vibrationPattern(count: number) => number[]`
  - `pokeDelta(prevTotal: number, nextTotal: number) => number`
  - `canVibrate() => boolean`
  - `buzzMessage(name: string, count: number) => string`
  - `MAX_BUZZ_PULSES: number` (утга `5`)

- [ ] **Step 1: Тест бичих**

`src/chibi/buzz.test.js` файлыг бүтнээр нь үүсгэ:

```js
import { describe, it, expect, vi, afterEach } from "vitest";
import { vibrationPattern, pokeDelta, canVibrate, buzzMessage, MAX_BUZZ_PULSES } from "./buzz.js";

describe("vibrationPattern", () => {
  it("нэг товшилтод нэг богино цохилт", () => {
    expect(vibrationPattern(1)).toEqual([35]);
  });

  it("гурван товшилтод гурван цохилт", () => {
    expect(vibrationPattern(3)).toEqual([0, 35, 90, 35, 90, 35]);
  });

  it("олон товшилтыг дээд хязгаараар таслана", () => {
    const p = vibrationPattern(10);
    const pulses = p.filter((_, i) => i % 2 === 1).length;
    expect(pulses).toBe(MAX_BUZZ_PULSES);
  });

  it("тэг эсвэл сөрөг тоонд хоосон массив", () => {
    expect(vibrationPattern(0)).toEqual([]);
    expect(vibrationPattern(-2)).toEqual([]);
  });
});

describe("pokeDelta", () => {
  it("хэвийн өсөлтийг тооцно", () => {
    expect(pokeDelta(5, 8)).toBe(3);
  });

  it("өөрчлөлтгүй бол тэг", () => {
    expect(pokeDelta(5, 5)).toBe(0);
  });

  it("тоолуур дахин тохируулагдвал тэг", () => {
    expect(pokeDelta(9, 2)).toBe(0);
  });

  it("тэгээс эхэлсэн ч зөв тоолно", () => {
    expect(pokeDelta(0, 4)).toBe(4);
  });
});

describe("canVibrate", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("navigator.vibrate байвал үнэн", () => {
    vi.stubGlobal("navigator", { vibrate: () => true });
    expect(canVibrate()).toBe(true);
  });

  it("navigator.vibrate байхгүй бол худал", () => {
    vi.stubGlobal("navigator", {});
    expect(canVibrate()).toBe(false);
  });

  it("navigator огт байхгүй бол худал", () => {
    vi.stubGlobal("navigator", undefined);
    expect(canVibrate()).toBe(false);
  });
});

describe("buzzMessage", () => {
  it("нэг товшилтод ганц тооны текст", () => {
    expect(buzzMessage("Andela", 1)).toBe("Andela чамайг товшлоо 💕");
  });

  it("олон товшилтыг тоогоор нэгтгэнэ", () => {
    expect(buzzMessage("Andela", 5)).toBe("Andela чамайг 5 удаа товшлоо 💕");
  });
});
```

- [ ] **Step 2: Тест унаж байгааг батлах**

Run: `npx vitest run src/chibi/buzz.test.js`
Expected: FAIL — `Failed to resolve import "./buzz.js"`

- [ ] **Step 3: Модулийг бичих**

`src/chibi/buzz.js`:

```js
/* Товшилтын чичиргээ ба мэдэгдлийн цэвэр логик.

   Firebase, DOM, React-аас бүрэн ангид — `canVibrate` нь дэлхийн `navigator`-ыг
   зөвхөн уншиж шалгадаг тул тестэд stub хийхэд хангалттай. */

/* Хүн 5-аас олон цохилтыг ялгаж мэдрэхгүй бөгөөд урт чичиргээ бухимдуулна. */
export const MAX_BUZZ_PULSES = 5;

const PULSE_MS = 35; /* нэг цохилтын урт */
const GAP_MS = 90;   /* цохилт хоорондын завсар */

/* Хэдэн товшилт ирснийг чичиргээний хэв маяг болгоно.
   Нэг товшилт → зүгээр л нэг богино цохилт.
   Олон товшилт → [завсар, цохилт, завсар, цохилт, ...] хэлбэр. */
export function vibrationPattern(count) {
  const n = Math.min(Math.max(Math.floor(count), 0), MAX_BUZZ_PULSES);
  if (n <= 0) return [];
  if (n === 1) return [PULSE_MS];

  const pattern = [];
  for (let i = 0; i < n; i += 1) {
    pattern.push(i === 0 ? 0 : GAP_MS);
    pattern.push(PULSE_MS);
  }
  return pattern;
}

/* Хоёр тоолуурын хооронд хэдэн шинэ товшилт байсныг олно.
   Буурсан утга нь тоолуур дахин тохируулагдсан гэсэн үг — шинэ товшилт биш. */
export function pokeDelta(prevTotal, nextTotal) {
  const diff = Number(nextTotal) - Number(prevTotal);
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

/* Энэ төхөөрөмж чичрэх боломжтой юу. iOS нь Vibration API-г огт дэмждэггүй. */
export function canVibrate() {
  return typeof navigator !== "undefined" && typeof navigator.vibrate === "function";
}

/* Мэдэгдлийн текст. */
export function buzzMessage(name, count) {
  return count > 1 ? `${name} чамайг ${count} удаа товшлоо 💕` : `${name} чамайг товшлоо 💕`;
}
```

- [ ] **Step 4: Тест өнгөрч байгааг батлах**

Run: `npx vitest run src/chibi/buzz.test.js`
Expected: PASS — 13 тест

- [ ] **Step 5: Commit**

```bash
git add src/chibi/buzz.js src/chibi/buzz.test.js
git commit -m "feat: чичиргээний хэв маяг болон delta бодох buzz модуль"
```

---

### Task 2: `poke.js` — throttle-ыг хасаж товшилт бүрийг илгээх

**Files:**
- Modify: `src/chibi/poke.js` (бүтнээр нь солино)
- Modify: `src/chibi/poke.test.js` (бүтнээр нь солино)

**Interfaces:**
- Consumes: `buzzMessage` — Task 1-ээс.
- Produces:
  - `createPokeSender({ writeDoc, sendPush, partnerName }) => { poke(at: number): void }`
  - `writeDoc` нь `{ at: number }` хүлээн авна
  - `sendPush` нь `{ title: string, body: string, tag: string }` хүлээн авна, `tag` нь `"poke-" + at`
- **Хасагдана:** `POKE_THROTTLE_MS`, `pokeMessage` (сүүлийнх нь `buzz.js`-д
  `buzzMessage` нэрээр аль хэдийн байгаа)

- [ ] **Step 1: Тестийг шинэчлэх**

`src/chibi/poke.test.js`-ийг бүтнээр нь дараах агуулгаар солино:

```js
import { describe, it, expect, vi } from "vitest";
import { createPokeSender } from "./poke.js";

const makeSender = (over = {}) => {
  const writeDoc = vi.fn(() => Promise.resolve());
  const sendPush = vi.fn(() => Promise.resolve());
  const sender = createPokeSender({ writeDoc, sendPush, partnerName: "Andela", ...over });
  return { sender, writeDoc, sendPush };
};

describe("createPokeSender", () => {
  it("товшилт бүрийг шууд илгээнэ", () => {
    const { sender, writeDoc, sendPush } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(3000);
    expect(writeDoc).toHaveBeenCalledTimes(3);
    expect(sendPush).toHaveBeenCalledTimes(3);
  });

  it("бичилтэд товшилтын хугацааг дамжуулна", () => {
    const { sender, writeDoc } = makeSender();
    sender.poke(1000);
    expect(writeDoc).toHaveBeenCalledWith({ at: 1000 });
  });

  it("push-ийн гарчиг болон текст зөв", () => {
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    expect(sendPush.mock.calls[0][0].title).toBe("Ankomeow");
    expect(sendPush.mock.calls[0][0].body).toBe("Andela чамайг товшлоо 💕");
  });

  it("tag товшилт бүрд давтагдахгүй", () => {
    const { sender, sendPush } = makeSender();
    sender.poke(1000);
    sender.poke(2000);
    sender.poke(3000);
    const tags = sendPush.mock.calls.map((c) => c[0].tag);
    expect(new Set(tags).size).toBe(3);
    expect(tags[0]).toBe("poke-1000");
  });

  it("push унасан ч бичилт хийгдэнэ", () => {
    const { sender, writeDoc } = makeSender({
      sendPush: () => Promise.reject(new Error("офлайн")),
    });
    expect(() => sender.poke(1000)).not.toThrow();
    expect(writeDoc).toHaveBeenCalledTimes(1);
  });

  it("бичилт унасан ч push илгээгдэнэ", () => {
    const { sender, sendPush } = makeSender({
      writeDoc: () => Promise.reject(new Error("офлайн")),
    });
    expect(() => sender.poke(1000)).not.toThrow();
    expect(sendPush).toHaveBeenCalledTimes(1);
  });

  it("дуудлага өөрөө шидсэн ч UI зогсохгүй", () => {
    const { sender } = makeSender({
      writeDoc: () => { throw new Error("гэнэтийн алдаа"); },
    });
    expect(() => sender.poke(1000)).not.toThrow();
  });
});
```

- [ ] **Step 2: Тест унаж байгааг батлах**

Run: `npx vitest run src/chibi/poke.test.js`
Expected: FAIL — `writeDoc` `{ count: 1 }`-ээр дуудагдаж байна, `{ at: 1000 }` биш;
tag нь `"poke"` байна, `"poke-1000"` биш.

- [ ] **Step 3: `poke.js`-ийг бүтнээр нь солих**

```js
/* Товшилтыг хос руу дамжуулах давхарга.

   Firestore болон push-ыг гаднаас функц хэлбэрээр авдаг тул энэ модуль
   Firebase-ээс бүрэн ангид — тестэд mock л хангалттай.

   Throttle БАЙХГҮЙ: товшилт бүр шууд илгээгдэнэ. Урьд нь 60 секундын цонх
   байсан бөгөөд цонх дотор хуримтлагдсан товшилтууд дараагийн товшилт
   ирэхгүй бол мөнхөд илгээгдэхгүй үлддэг алдаатай байв.

   Ичих анимаци нь эндээс хамаарахгүй: UI шууд ажиллаад, энэ нь зөвхөн
   сүлжээний талыг хариуцна. */

import { buzzMessage } from "./buzz.js";

export function createPokeSender({ writeDoc, sendPush, partnerName }) {
  return {
    poke(at) {
      /* Хоёр суваг бие биенээсээ хамаарахгүй: аль нэг нь унасан ч нөгөө нь явна. */
      try {
        Promise.resolve(writeDoc({ at })).catch(() => {});
      } catch {
        /* дуудлага өөрөө шидсэн ч UI зогсохгүй */
      }

      try {
        Promise.resolve(sendPush({
          title: "Ankomeow",
          /* Товшилт бүр тусдаа илгээгддэг тул энд тоо үргэлж 1.
             Олон тооны хувилбар нь хүлээн авах талд хэрэглэгддэг. */
          body: buzzMessage(partnerName, 1),
          /* Давтагдахгүй tag — эс бөгөөс шинэ мэдэгдэл хуучныг дарж бичнэ. */
          tag: `poke-${at}`,
        })).catch(() => {});
      } catch {
        /* дээрхтэй адил */
      }
    },
  };
}
```

- [ ] **Step 4: Тест өнгөрч байгааг батлах**

Run: `npm test`
Expected: PASS — бүх тест (Task 1-ийн 13 + шинэ 7 + бусад).
`pokeMessage`/`POKE_THROTTLE_MS`-ийг өөр газраас импортлож байвал энд илэрнэ;
илэрвэл тухайн импортыг `buzz.js`-ийн `buzzMessage` руу заа.

- [ ] **Step 5: Commit**

```bash
git add src/chibi/poke.js src/chibi/poke.test.js
git commit -m "fix: товшилтыг алдагдуулдаг 60 секундын throttle-ыг хаслаа"
```

---

### Task 3: Service worker — мэдэгдэлд чичиргээ нэмэх

**Files:**
- Modify: `public/sw.js:95-102`

**Interfaces:**
- Consumes: юу ч үгүй.
- Produces: апп хаалттай үед гарах мэдэгдэл `vibrate` тохиргоотой болно.

- [ ] **Step 1: `options` объектод `vibrate` нэмэх**

`public/sw.js` доторх `push` сонсогчийн `const options = { ... }` хэсгийг ол.
Одоо ийм байна:

```js
  const options = {
    body: payload.body || "",
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    tag: payload.tag || "ankomeow",
    renotify: true,
    data: { url: payload.url || "./", tab: payload.tab || "" },
  };
```

`renotify: true,` мөрийн дараа дараах хоёр мөрийг нэм:

```js
    /* Android дээр мэдэгдэл өөрөө чичрүүлнэ. iOS энэ тохиргоог үл тоомсорлодог
       боловч системийн мэдэгдлийн тохиргоогоороо чичирнэ — алдаа гарахгүй. */
    vibrate: [0, 40, 60, 40],
```

- [ ] **Step 2: Build амжилттай эсэхийг шалгах**

Run: `npm run build`
Expected: алдаагүй дуусна. `dist/sw.js` дотор `vibrate` мөр байгааг батал:

Run: `grep -n "vibrate" dist/sw.js`
Expected: `vibrate: [0, 40, 60, 40],` мөр гарна.

- [ ] **Step 3: Commit**

```bash
git add public/sw.js
git commit -m "feat: апп хаалттай үеийн мэдэгдэл чичиргээтэй болов"
```

---

### Task 4: Илгээх тал — `total` тоолуур бичих

**Files:**
- Modify: `tovlorokh-khamtrakh.jsx:4` (импорт)
- Modify: `tovlorokh-khamtrakh.jsx:2095-2106` (`pokeSender`)

**Interfaces:**
- Consumes: `createPokeSender` — Task 2-ийн шинэ гэрээ (`writeDoc({ at })`).
- Produces: Firestore `rooms/{CHAT_ROOM}/pokes/{partnerKey}` баримт дээр
  монотон өсдөг `total` тоо талбар.

- [ ] **Step 1: `increment`-ийг импортлох**

`tovlorokh-khamtrakh.jsx`-ийн 4-р мөрийн `firebase/firestore` импортод
`increment` нэмнэ. `arrayUnion`-ий дараа таслалаар залгана:

```js
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, arrayUnion, increment } from "firebase/firestore";
```

- [ ] **Step 2: `writeDoc`-ыг тоолуур нэмэгдүүлдэг болгох**

`pokeSender` доторх `writeDoc` хэсгийг ол:

```js
      writeDoc: ({ count }) =>
        setDoc(doc(db, "rooms", CHAT_ROOM, "pokes", partnerKey), {
          from: accountKey, count, at: serverTimestamp(),
        }),
```

Дараахаар соль:

```js
      /* merge: true ЗААВАЛ хэрэгтэй — эс бөгөөс баримт бүтнээрээ дарагдаж,
         increment утгагүй болно. */
      writeDoc: () =>
        setDoc(doc(db, "rooms", CHAT_ROOM, "pokes", partnerKey), {
          from: accountKey, total: increment(1), at: serverTimestamp(),
        }, { merge: true }),
```

- [ ] **Step 3: Build амжилттай эсэхийг шалгах**

Run: `npm run build`
Expected: алдаагүй дуусна.

- [ ] **Step 4: Firestore дүрэм зөвшөөрч байгааг батлах**

Run: `grep -n -A 3 "pokes/{key}" firestore.rules`
Expected: `allow write: if isCouple();` — талбарын нэрээр хязгаарлаагүй тул
`total` шинэ талбар нэмэхэд **дүрэм өөрчлөх шаардлагагүй**. Хэрэв гаралт үүнээс
өөр байвал зогсоод шалтгааныг тодруул.

- [ ] **Step 5: Commit**

```bash
git add tovlorokh-khamtrakh.jsx
git commit -m "feat: товшилтын монотон тоолуурыг Firestore-д бичдэг болов"
```

---

### Task 5: Хүлээн авах тал — чичиргээ ба iOS-ийн мэдэгдэл

**Files:**
- Modify: `tovlorokh-khamtrakh.jsx:11` орчим (импорт)
- Modify: `tovlorokh-khamtrakh.jsx:2108-2122` (poke хүлээн авах `useEffect`)

**Interfaces:**
- Consumes: `pokeDelta`, `vibrationPattern`, `canVibrate`, `buzzMessage` — Task 1-ээс.
- Produces: хэрэглэгчид харагдах эцсийн зан төлөв. Дараагийн task байхгүй.

- [ ] **Step 1: `buzz.js`-ээс импортлох**

`tovlorokh-khamtrakh.jsx` дээрх `import { createPokeSender } from "./src/chibi/poke.js";`
мөрийн дараа нэм:

```js
import { pokeDelta, vibrationPattern, canVibrate, buzzMessage } from "./src/chibi/buzz.js";
```

- [ ] **Step 2: Хүлээн авах effect-ийг өргөтгөх**

Одоогийн effect-ийг ол:

```js
  /* Хос миний chibi-г товшлоо — дэлгэц дээрх chibi баярлана */
  useEffect(() => {
    if (!accountKey) return;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "pokes", accountKey), (snap) => {
      const at = snap.data()?.at;
      if (!at) return;
      const ms = at.toMillis();
      const lastSeen = Number(localStorage.getItem("ankomeow-last-poke") || 0);
      if (ms > lastSeen) {
        localStorage.setItem("ankomeow-last-poke", String(ms));
        setChibiHappyAt(ms);
      }
    }, () => {});
    return unsub;
  }, [accountKey]);
```

Дараахаар бүтнээр нь соль:

```js
  /* Хос миний chibi-г товшлоо.

     Хоёр тусдаа зүйл болно:
       1. chibi баярлана — `at` хугацаанд суурилсан хуучин логик хэвээр.
          Апп нээхэд хуучин товшилт байвал ч chibi баярлана.
       2. чичиргээ / iOS-ийн мэдэгдэл — `total` тоолуурын delta-д суурилна.
          Апп нээх үеийн ПЕРВЫЙ snapshot-д ЭНЭ АЖИЛЛАХГҮЙ, эс бөгөөс өглөө бүр
          шөнийн товшилтуудаар чичрэх болно. */
  const firstPokeSnapRef = useRef(true);

  useEffect(() => {
    if (!accountKey) return;
    firstPokeSnapRef.current = true;

    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "pokes", accountKey), (snap) => {
      const data = snap.data();

      /* ── 1. chibi-гийн баяр ── */
      const at = data?.at;
      if (at) {
        const ms = at.toMillis();
        const lastSeen = Number(localStorage.getItem("ankomeow-last-poke") || 0);
        if (ms > lastSeen) {
          localStorage.setItem("ankomeow-last-poke", String(ms));
          setChibiHappyAt(ms);
        }
      }

      /* ── 2. чичиргээ ── */
      const total = Number(data?.total ?? 0);
      const prev = Number(localStorage.getItem("ankomeow-poke-total") || 0);
      localStorage.setItem("ankomeow-poke-total", String(total));

      if (firstPokeSnapRef.current) {
        firstPokeSnapRef.current = false;
        return;
      }

      const delta = pokeDelta(prev, total);
      if (delta <= 0) return;

      if (canVibrate()) {
        navigator.vibrate(vibrationPattern(delta));
        return;
      }

      /* iOS — Vibration API байхгүй. Системийн мэдэгдлээр нь чичрүүлнэ.
         Зөвшөөрөл байхгүй бол чимээгүй бүтэлгүйтнэ. */
      const name = partnerKey ? ACCOUNTS[partnerKey].name : "Хамтрагч";
      navigator.serviceWorker?.ready
        .then((reg) => reg.showNotification("Ankomeow", {
          body: buzzMessage(name, delta),
          icon: "./icon-192.png",
          tag: `poke-${total}`,
        }))
        .catch(() => {});
    }, () => {});

    return unsub;
  }, [accountKey, partnerKey]);
```

- [ ] **Step 3: Build амжилттай эсэхийг шалгах**

Run: `npm run build`
Expected: алдаагүй дуусна.

- [ ] **Step 4: Бүх тест өнгөрч байгааг батлах**

Run: `npm test`
Expected: PASS — бүх тест.

- [ ] **Step 5: Хөтөч дээр гараар шалгах**

Run: `npm run preview -- --port 4185`

Хоёр өөр хөтөчийн профайлаар (эсвэл нэг нь нууц цонх) Andela, Neko-гоор
нэвтэрч ор. Нэг талд нь chibi-г товшоод нөгөө талд нь шалга:

- Хөгжүүлэгчийн консолд алдаа гарахгүй байх
- Хүлээн авагч талын chibi баярлах
- Desktop Chrome дээр `navigator.vibrate` байдаг ч төхөөрөмж чичрэхгүй —
  консолд `navigator.vibrate` дуудагдсаныг шалгахын тулд түр
  `console.log` нэмж болно, шалгасны дараа заавал ХАС.
- Firestore консол дээр `rooms/ankomeow-couple/pokes/{key}` баримтын `total`
  товшилт бүрд 1-ээр өсөж байгааг харах

Жинхэнэ чичиргээг зөвхөн Android утсан дээр л шалгаж болно.

- [ ] **Step 6: Commit**

```bash
git add tovlorokh-khamtrakh.jsx
git commit -m "feat: товшилт хамтрагчийн утсыг чичрүүлдэг болов"
```

---

### Task 6: Spec-ийг хэрэгжсэн гэж тэмдэглэх

**Files:**
- Modify: `docs/superpowers/specs/2026-07-29-chibi-poke-buzz-design.md`

**Interfaces:**
- Consumes: Task 1-5 бүгд дууссан байх.
- Produces: юу ч үгүй — баримтжуулалт.

- [ ] **Step 1: Гарчгийн дор төлөв нэмэх**

`# Chibi товшилт → хамтрагчид мэдэгдэл ба чичиргээ` гарчгийн дараах
`Огноо: 2026-07-29` мөрийн доор нэм:

```markdown
**Төлөв:** Хэрэгжсэн — `docs/superpowers/plans/2026-07-29-chibi-poke-buzz.md`
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-07-29-chibi-poke-buzz-design.md
git commit -m "docs: poke чичиргээний spec-ийг хэрэгжсэн гэж тэмдэглэв"
```

---

## Хэрэгжсэний дараа

Push хийхийн өмнө:

```bash
npm test && npm run build
git push
```

Android утсан дээр PWA-г шинэчилж (эсвэл дахин суулгаж) жинхэнэ чичиргээг шалга.
iPhone дээр PWA-г Home Screen-д суулгасан байх ёстой — эс бөгөөс web push огт
ажиллахгүй.
