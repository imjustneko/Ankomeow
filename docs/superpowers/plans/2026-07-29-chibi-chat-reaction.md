# Chibi чат реакц ба уншаагүй мэдэгдэл Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Уншаагүй зурвасыг chibi болон nav-аар мэдэгдэж, чат руу орох бүрд chibi
хамтрагчийн сүүлийн зурвас руу алхаж очоод зааж, дэлгэц рүү эргэн инээмсэглэнэ.

**Architecture:** Цэвэр логикийг `src/chibi/chatSignal.js`-д тусгаарлана (уншаагүй
эсэх, зорилтот цэг). `brain.js`-д зорилтот цэг рүү алхах `walkTo` команд болон
автономит зан зогсоох `hold`/`release` нэмнэ. Дүрийн зургууд нь үндсэн хуудсыг
хөндөхгүй, `WALK_SHEET`-ийн адил **тусдаа** 3 нүдтэй хуудсаар нэмэгдэнэ.

**Tech Stack:** React 18, Firebase Firestore, vitest, CSS sprite sheet.

Spec: `docs/superpowers/specs/2026-07-29-chibi-chat-reaction-design.md`

## Global Constraints

- Бүх сэтгэгдэл, тестийн нэр, хэрэглэгчид харагдах текст **монгол хэлээр**.
- Commit message монголоор, `Co-Authored-By: Claude` мөр **НЭМЭХГҮЙ**.
- `src/chibi/*.js` модулиуд Firebase, DOM, React-аас **ангид** (`environment: "node"`).
- Үндсэн 9 нүдийн sprite хуудсыг (`public/chibi/andela.png`, `neko.png`) **өөрчлөхгүй**.
- Sprite хуудас аль хэдийн бэлэн (Task 5 дууссан): `andela-chat.png` 1086×590 (нүд 362×590),
  `neko-chat.png` 984×546 (нүд 328×546). Нүдний хэмжээ дүр бүрд өөр — `WALK_SHEET` ч мөн адил.
- Хүрэлт (товшилт, чирэлт) нь анимациас **үргэлж давуу**.
- Одоо байгаа тестүүд унах ёсгүй.
- Тест ажиллуулах команд: `npm test`

## Task-ийн дараалал ба блокер

Task 1-4 нь **зурагнаас хамаарахгүй** — шууд хийж болно.
Task 5 (зураг үүсгэх) нь 2026-07-29-нд ДУУССАН — хоёр хуудас public/chibi/ дотор бэлэн.
Тиймээс Task 1-4, 6-8 бүгд шууд хийгдэнэ, блокергүй.

---

### Task 1: `chatSignal.js` — уншаагүй эсэх

**Files:**
- Create: `src/chibi/chatSignal.js`
- Test: `src/chibi/chatSignal.test.js`

**Interfaces:**
- Consumes: юу ч үгүй.
- Produces: `hasUnread(lastMsg, myReadAtMs, accountKey) => boolean`
  - `lastMsg` нь `{ sender: string, createdAtMs: number } | null | undefined`
  - `myReadAtMs` нь `number | null | undefined`

> **Анхаар:** зурвасын илгээгчийн талбарын нэр нь `sender` (`firestore.rules`
> дотор `request.resource.data.sender == myKey()` гэж баталгаажуулдаг), `from` биш.

- [ ] **Step 1: Тест бичих**

`src/chibi/chatSignal.test.js`:

```js
import { describe, it, expect } from "vitest";
import { hasUnread } from "./chatSignal.js";

describe("hasUnread", () => {
  it("зурвас огт байхгүй бол худал", () => {
    expect(hasUnread(null, 1000, "neko")).toBe(false);
    expect(hasUnread(undefined, 1000, "neko")).toBe(false);
  });

  it("сүүлийн зурвас өөрийнх бол худал", () => {
    expect(hasUnread({ sender: "neko", createdAtMs: 5000 }, 1000, "neko")).toBe(false);
  });

  it("хамтрагчийнх бөгөөд уншсанаас хойш бол үнэн", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 5000 }, 1000, "neko")).toBe(true);
  });

  it("хамтрагчийнх боловч уншсанаас өмнө бол худал", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 500 }, 1000, "neko")).toBe(false);
  });

  it("яг уншсан агшны зурвасыг уншсанд тооцно", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 1000 }, 1000, "neko")).toBe(false);
  });

  it("хэзээ ч уншаагүй бол хамтрагчийн зурвас уншаагүй", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: 5000 }, null, "neko")).toBe(true);
  });

  it("хугацаа нь тодорхойгүй зурвасыг уншаагүйд тооцохгүй", () => {
    expect(hasUnread({ sender: "andela", createdAtMs: null }, 1000, "neko")).toBe(false);
  });
});
```

- [ ] **Step 2: Тест унаж байгааг батлах**

Run: `npx vitest run src/chibi/chatSignal.test.js`
Expected: FAIL — `Failed to resolve import "./chatSignal.js"`

- [ ] **Step 3: Модулийг бичих**

`src/chibi/chatSignal.js`:

```js
/* Чатын дохионы цэвэр логик.

   Firebase, DOM, React-аас бүрэн ангид: Firestore-ийн Timestamp-ыг гаднаас
   миллисекунд болгож хөрвүүлээд дамжуулна. */

/* Уншаагүй зурвас байна уу.

   lastMsg    — { sender, createdAtMs } хамгийн сүүлийн зурвас, эсвэл null
   myReadAtMs — энэ хэрэглэгч чатыг хамгийн сүүлд нээсэн хугацаа (мс), эсвэл null
   accountKey — энэ хэрэглэгчийн түлхүүр */
export function hasUnread(lastMsg, myReadAtMs, accountKey) {
  if (!lastMsg) return false;
  if (lastMsg.sender === accountKey) return false;

  const created = Number(lastMsg.createdAtMs);
  if (!Number.isFinite(created)) return false;

  /* Хэзээ ч нээгээгүй бол хамтрагчийн аливаа зурвас уншаагүй. */
  if (myReadAtMs === null || myReadAtMs === undefined) return true;

  return created > Number(myReadAtMs);
}
```

- [ ] **Step 4: Тест өнгөрч байгааг батлах**

Run: `npx vitest run src/chibi/chatSignal.test.js`
Expected: PASS — 7 тест

- [ ] **Step 5: Commit**

```bash
git add src/chibi/chatSignal.js src/chibi/chatSignal.test.js
git commit -m "feat: уншаагүй зурвасыг тодорхойлох chatSignal модуль"
```

---

### Task 2: `chatSignal.js` — зорилтот цэг бодох

**Files:**
- Modify: `src/chibi/chatSignal.js`
- Modify: `src/chibi/chatSignal.test.js`

**Interfaces:**
- Consumes: Task 1-ийн модуль.
- Produces: `bubbleTarget({ bubble, frame, spriteWidth, offset }) => { x, facing }`
  - `bubble`, `frame` нь `{ left, top, width, height }` — `DOMRect` дамжуулж болно
  - `x` нь frame-ийн зүүн ирмэгээс хэмжигдэх пиксел (brain-ийн `x`-тэй ижил тэнхлэг)
  - `facing` нь `-1` (зурсан хэвээр) эсвэл `1` (толилно)
  - `offset` нь өгөгдөөгүй бол `12`

> **Чухал:** sprite нь **дээш** заасан байдлаар зурагдсан (зүүн тийш биш).
> Тиймээс chibi зурвасын хажууд биш, **доор** нь очиж, ердийн алхах шугам дээрээ
> (`y = 0`) зогсоно — босоо авирах шаардлагагүй. `y` буцаахгүй.

- [ ] **Step 1: Тест нэмэх**

`src/chibi/chatSignal.test.js`-ийн импортын мөрийг шинэчил:

```js
import { hasUnread, bubbleTarget } from "./chatSignal.js";
```

Файлын төгсгөлд нэм:

```js
describe("bubbleTarget", () => {
  /* 400px өргөнтэй frame, 72px өргөнтэй chibi */
  const frame = { left: 0, top: 0, width: 400, height: 800 };
  const base = { frame, spriteWidth: 72 };

  it("бөмбөлгийн голын доор, багахан баруун тийш шилжиж зогсоно", () => {
    /* бөмбөлгийн гол = 120; 120 − 36 + 12 = 96 */
    const bubble = { left: 20, top: 300, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).x).toBe(96);
  });

  it("бөмбөлгөөс баруун тийш шилжсэн тул зурсан хэвээр заана", () => {
    const bubble = { left: 20, top: 300, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble }).facing).toBe(-1);
  });

  it("баруун ирмэгт дарагдвал frame дотор багтана", () => {
    const bubble = { left: 300, top: 300, width: 100, height: 60 };
    const t = bubbleTarget({ ...base, bubble });
    expect(t.x).toBe(400 - 72);
  });

  it("зүүн ирмэгт дарагдаж бөмбөлгийн зүүн талд үлдвэл толино", () => {
    const bubble = { left: 0, top: 300, width: 60, height: 60 };
    const t = bubbleTarget({ ...base, bubble });
    expect(t.x).toBe(0);
    expect(t.facing).toBe(1);
  });

  it("frame шилжсэн байрлалтай байсан ч харьцангуй утга буцаана", () => {
    const shifted = { left: 100, top: 50, width: 400, height: 800 };
    const bubble = { left: 120, top: 350, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, frame: shifted, bubble }).x).toBe(96);
  });

  it("offset-ыг гаднаас өгч болно", () => {
    const bubble = { left: 20, top: 300, width: 200, height: 60 };
    expect(bubbleTarget({ ...base, bubble, offset: 0 }).x).toBe(84);
  });
});
```

- [ ] **Step 2: Тест унаж байгааг батлах**

Run: `npx vitest run src/chibi/chatSignal.test.js`
Expected: FAIL — `bubbleTarget is not a function`

- [ ] **Step 3: Функцийг нэмэх**

`src/chibi/chatSignal.js`-ийн төгсгөлд нэм:

```js
/* Бөмбөлгийн доор зогсох цэгийг бодно.

   Оролт нь `{ left, top, width, height }` хэлбэрийн энгийн объект — DOMRect
   тохирно, гэхдээ функц өөрөө DOM мэдэхгүй тул тестлэхэд хялбар.

   Sprite нь ДЭЭШ (бага зэрэг зүүн тийш хазайж) заасан байдлаар зурагдсан тул
   chibi зурвасын доор очно. Босоо байрлал нь ердийн алхах шугам (y = 0) тул
   энд буцаахгүй.

   `offset` нь chibi-г бөмбөлгийн голоос багахан баруун тийш шилжүүлнэ —
   ингэснээр дээш-зүүн тийш заасан хуруу нь бөмбөлөг рүү оносон харагдана. */
export function bubbleTarget({ bubble, frame, spriteWidth, offset = 12 }) {
  const maxX = Math.max(0, frame.width - spriteWidth);
  const centreX = bubble.left - frame.left + bubble.width / 2;

  const wanted = centreX - spriteWidth / 2 + offset;
  const x = Math.min(Math.max(wanted, 0), maxX);

  /* Ирмэгт дарагдаад бөмбөлгийн зүүн талд үлдвэл дээш-баруун тийш заахаар толино. */
  const facing = x + spriteWidth / 2 < centreX ? 1 : -1;

  return { x, facing };
}
```

- [ ] **Step 4: Тест өнгөрч байгааг батлах**

Run: `npm test`
Expected: PASS — бүх тест (chatSignal 13 + бусад).

- [ ] **Step 5: Commit**

```bash
git add src/chibi/chatSignal.js src/chibi/chatSignal.test.js
git commit -m "feat: бөмбөлгийн доор зогсох цэгийг бодох bubbleTarget"
```

---

### Task 3: `brain.js` — `walkTo`, `hold`, `release`

**Files:**
- Modify: `src/chibi/brain.js`
- Modify: `src/chibi/brain.test.js` (тест нэмнэ)

**Interfaces:**
- Consumes: юу ч үгүй.
- Produces: `createBrain(...)` буцаах объектод дараах гишүүд нэмэгдэнэ:
  - `walkTo(targetX: number, targetY: number, at: number) => void` — `goto` төлөвт оруулна
  - `consumeArrival() => boolean` — хүрсэн бол **нэг л удаа** `true`
  - `hold(at: number) => void` — автономит төлөв сонголтыг зогсооно
  - `release(at: number) => void` — автономит зан руу буцаана (`walk` төлөвөөс эхэлнэ)
  - `ARRIVE_EPSILON: number` экспорт (утга `2`)
- `snapshot()`-ийн `state` нь `"goto"` утга буцаах боломжтой болно.

- [ ] **Step 1: Тест нэмэх**

`src/chibi/brain.test.js`-ийн төгсгөлд нэм. Файлын эхэнд байгаа импортод
`ARRIVE_EPSILON` нэмэх шаардлагатай бол нэм — эс бөгөөс шинэ `describe` дотор
`brain.js`-ээс шууд импортол:

```js
import { createBrain, ARRIVE_EPSILON } from "./brain.js";

describe("walkTo", () => {
  /* rand-ыг тогтмол болгож санамсаргүй байдлыг арилгана */
  const makeBrain = () => createBrain({ width: 400, rise: 200, spriteWidth: 72, rand: () => 0.5 });

  it("зорилтот цэг рүү ойртоно", () => {
    const b = makeBrain();
    const startX = b.snapshot().x;
    b.walkTo(startX + 100, 0, 0);
    b.tick(1000);
    const { x, state } = b.snapshot();
    expect(state).toBe("goto");
    expect(x).toBeGreaterThan(startX);
    expect(x).toBeLessThan(startX + 100);
  });

  it("зорилтот цэг рүү харна", () => {
    const b = makeBrain();
    const startX = b.snapshot().x;
    b.walkTo(startX - 100, 0, 0);
    b.tick(100);
    expect(b.snapshot().facing).toBe(-1);
    expect(b.snapshot().dir).toBe("left");
  });

  it("хүрэхэд зогсож, цаашид хөдлөхгүй", () => {
    const b = makeBrain();
    b.walkTo(10, 20, 0);
    for (let t = 100; t <= 60000; t += 100) b.tick(t);
    const a = b.snapshot();
    expect(Math.abs(a.x - 10)).toBeLessThanOrEqual(ARRIVE_EPSILON);
    expect(Math.abs(a.y - 20)).toBeLessThanOrEqual(ARRIVE_EPSILON);
  });

  it("зорилтот цэгийг frame дотор багтаана", () => {
    const b = makeBrain();
    b.walkTo(99999, 99999, 0);
    for (let t = 100; t <= 60000; t += 100) b.tick(t);
    const a = b.snapshot();
    expect(a.x).toBeLessThanOrEqual(400 - 72);
    expect(a.y).toBeLessThanOrEqual(200);
  });

  it("consumeArrival эхний удаад үнэн, дараа нь худал", () => {
    const b = makeBrain();
    b.walkTo(10, 0, 0);
    for (let t = 100; t <= 60000; t += 100) b.tick(t);
    expect(b.consumeArrival()).toBe(true);
    expect(b.consumeArrival()).toBe(false);
  });

  it("хүрээгүй байхад consumeArrival худал", () => {
    const b = makeBrain();
    b.walkTo(b.snapshot().x + 300, 0, 0);
    b.tick(100);
    expect(b.consumeArrival()).toBe(false);
  });
});

describe("hold ба release", () => {
  const makeBrain = () => createBrain({ width: 400, rise: 200, spriteWidth: 72, rand: () => 0.5 });

  it("hold үед автономит төлөв солигдохгүй", () => {
    const b = makeBrain();
    b.hold(0);
    const before = b.snapshot().state;
    for (let t = 1000; t <= 30000; t += 1000) b.tick(t);
    expect(b.snapshot().state).toBe(before);
  });

  it("hold үед унтахгүй", () => {
    const b = makeBrain();
    b.hold(0);
    for (let t = 1000; t <= 120000; t += 1000) b.tick(t);
    expect(b.snapshot().state).not.toBe("sleep");
  });

  it("release хийсний дараа автономит зан сэргэнэ", () => {
    const b = makeBrain();
    b.hold(0);
    b.release(1000);
    expect(b.snapshot().state).toBe("walk");
    for (let t = 2000; t <= 30000; t += 1000) b.tick(t);
    /* автономит мөчлөг дахин ажиллаж эхэлсэн эсэх — walk-аас өөр төлөвт
       нэг ч удаа орсон байх ёстой */
    expect(["walk", "idle", "sit", "wave", "climb"]).toContain(b.snapshot().state);
  });

  it("hold үед ч товшилт ажиллана", () => {
    const b = makeBrain();
    b.hold(0);
    b.pointerDown(100, 50, 50);
    const res = b.pointerUp(200);
    expect(res.tapped).toBe(true);
  });

  it("hold үед poke дуудвал blush төлөвт орно", () => {
    const b = makeBrain();
    b.hold(0);
    b.poke(100);
    expect(b.snapshot().state).toBe("blush");
  });
});
```

- [ ] **Step 2: Тест унаж байгааг батлах**

Run: `npx vitest run src/chibi/brain.test.js`
Expected: FAIL — `b.walkTo is not a function`

- [ ] **Step 3: `brain.js`-ийг өөрчлөх**

**3a.** Файлын дээд хэсэгт, `CLIMB_CHANCE` тогтмолын дараа нэм:

```js
/* Зорилтот цэгээс энэ зайд орвол хүрсэн гэж үзнэ */
export const ARRIVE_EPSILON = 2;
```

**3b.** `createBrain` доторх хувьсагчдын жагсаалтад (`let pointer = null;` мөрийн дараа) нэм:

```js
  let held = false;          /* автономит төлөв сонголт зогссон эсэх */
  let targetX = 0;           /* walkTo-гийн зорилтот x */
  let gotoTargetY = 0;       /* walkTo-гийн зорилтот y */
  let arrived = false;       /* хүрсэн ба хараахан уншигдаагүй */
```

**3c.** `tick` доторх `if (state === "climb") { ... }` блокийн ӨМНӨ дараах блокийг нэм:

```js
      if (state === "goto") {
        const stepX = (SPEED * dt) / 1000;
        const stepY = (CLIMB_SPEED * dt) / 1000;
        const gapX = targetX - x;
        const gapY = gotoTargetY - y;

        if (Math.abs(gapX) <= stepX) x = targetX;
        else x += Math.sign(gapX) * stepX;

        if (Math.abs(gapY) <= stepY) y = gotoTargetY;
        else y += Math.sign(gapY) * stepY;

        clampX();
        clampY();

        /* Хэвтээ хөдөлгөөн нь харцны чиглэлийг тодорхойлно; хэвтээгээр
           хүрчихсэн бол сүүлчийн чиглэлээ хадгална. */
        if (Math.abs(gapX) > ARRIVE_EPSILON) {
          facing = gapX > 0 ? 1 : -1;
          dir = facing === 1 ? "right" : "left";
        } else if (Math.abs(gapY) > ARRIVE_EPSILON) {
          dir = gapY > 0 ? "up" : "down";
        }

        if (Math.abs(targetX - x) <= ARRIVE_EPSILON && Math.abs(gotoTargetY - y) <= ARRIVE_EPSILON) {
          arrived = true;
          enter("idle", at, Infinity);
        }
        return;
      }
```

**3d.** `tick`-ийн доод хэсэгт байгаа унтах болон мөчлөгийн шалгалтыг `held` үед
алгасна. Одоо ийм байна:

```js
      if (at - lastTouch >= DUR.sleepAfter) {
        enter("sleep", at, Infinity);
        return;
      }

      if (elapsed >= stateDur) nextInCycle(at);
```

Дараахаар соль:

```js
      /* Дараалал явж байх үед chibi өөрөө төлөвөө сольж, унтаж болохгүй. */
      if (held) return;

      if (at - lastTouch >= DUR.sleepAfter) {
        enter("sleep", at, Infinity);
        return;
      }

      if (elapsed >= stateDur) nextInCycle(at);
```

**3e.** Буцаах объектод (`setWidth`-ийн дараа, хаалтын өмнө) дөрвөн шинэ гишүүн нэм:

```js
    /* ── Заасан цэг рүү явах ── */

    /* Зорилтот цэг рүү алхаж эхэлнэ. Зорилтот утгыг frame дотор багтаана. */
    walkTo(nextX, nextY, at) {
      now = at;
      targetX = Math.min(Math.max(nextX, 0), maxX());
      gotoTargetY = Math.min(Math.max(nextY, 0), maxY());
      arrived = false;
      enter("goto", at, Infinity);
    },

    /* Хүрсэн эсэхийг НЭГ Л УДАА мэдээлнэ — дараалал давхар эхлэхээс сэргийлнэ. */
    consumeArrival() {
      if (!arrived) return false;
      arrived = false;
      return true;
    },

    /* Автономит зан зогсоно. Хүрэлт, чирэлт, poke хэвээр ажиллана. */
    hold(at) {
      now = at;
      held = true;
    },

    /* Автономит зан руугаа буцна. */
    release(at) {
      now = at;
      held = false;
      arrived = false;
      lastTouch = at; /* дарааллын үргэлжилсэн хугацаагаар шууд унтахаас сэргийлнэ */
      startWalk(at);
    },
```

- [ ] **Step 4: Тест өнгөрч байгааг батлах**

Run: `npm test`
Expected: PASS — бүх тест. Одоо байгаа brain тестүүд ч унах ёсгүй.

- [ ] **Step 5: Commit**

```bash
git add src/chibi/brain.js src/chibi/brain.test.js
git commit -m "feat: brain-д зорилтот цэг рүү алхах walkTo болон hold/release"
```

---

### Task 4: Уншаагүй мэдэгдэл — нүүр дэлгэцийн тэмдэг ба chibi бөмбөлөг

**Files:**
- Modify: `tovlorokh-khamtrakh.jsx` (импорт, шинэ effect-үүд, nav, chibi бөмбөлөг)
- Modify: `src/chibi/ChibiPet.jsx` (гаднаас өгсөн бөмбөлгийн текстийг дэмжих)

**Interfaces:**
- Consumes: `hasUnread` — Task 1-ээс.
- Produces:
  - `ChibiPet`-д шинэ prop: `notice: { text: string, key: number, onTap?: () => void } | null`
  - App түвшинд `chatUnread: boolean` төлөв

- [ ] **Step 1: `ChibiPet`-д `notice` prop нэмэх**

Одоо байгаа бөмбөлөг нь `bubbleRef`-ээр rAF цикл дотроос байрлалаа авдаг.
Тиймээс **шинэ бөмбөлөг нэмэхгүй** — тэр элементийг дахин ашиглаж, зөвхөн
агуулгыг нь сольно. Ингэснээр байрлуулах логик давхардахгүй.

**1a.** `src/chibi/ChibiPet.jsx` доторх компонентын гарын үсгийг ол:

```js
export default function ChibiPet({ character, enabled, onPoke, happyAt }) {
```

Дараахаар соль:

```js
export default function ChibiPet({ character, enabled, onPoke, happyAt, notice }) {
```

**1b.** `const [phrase, setPhrase] = useState(null);` мөрийн дор нэм:

```js
  /* Гаднаас өгсөн мэдэгдэл (жишээ нь «Чат ирсэн байна»). Санамсаргүй үгсээс
     ялгаатай нь дүрээс үл хамааран, blush төлөвгүйгээр ч харагдана. */
  const [noticeShown, setNoticeShown] = useState(null);

  useEffect(() => {
    if (!notice) return setNoticeShown(null);
    setNoticeShown(notice);
    const t = setTimeout(() => setNoticeShown(null), 5000);
    return () => clearTimeout(t);
  }, [notice?.key]);
```

**1c.** Бөмбөлгийг зурдаг блокийг бүтнээр нь ол:

```js
      {phrase && state === "blush" && (
        <div
          ref={bubbleRef}
          key={phrase.key}
          className="absolute pointer-events-none chibi-bubble"
          style={{ bottom: "calc(var(--chibi-baseline, 84px) + 74px)", left: 0, transform: `translate3d(${heartsX}px, ${heartsY}px, 0)` }}
        >
          <span className="chibi-bubble-body">{phrase.text}</span>
        </div>
      )}
```

Дараахаар соль:

```js
      {bubbleContent && (
        <div
          ref={bubbleRef}
          key={bubbleContent.key}
          onPointerUp={(e) => { e.stopPropagation(); bubbleContent.onTap?.(); }}
          className={`absolute chibi-bubble ${bubbleContent.onTap ? "pointer-events-auto cursor-pointer" : "pointer-events-none"}`}
          style={{ bottom: "calc(var(--chibi-baseline, 84px) + 74px)", left: 0, transform: `translate3d(${heartsX}px, ${heartsY}px, 0)` }}
        >
          <span className="chibi-bubble-body">{bubbleContent.text}</span>
        </div>
      )}
```

**1d.** `bubbleContent`-ыг тодорхойл. `const heartsY = ...;` мөрийн дор нэм:

```js
  /* Бөмбөлгийн агуулга: мэдэгдэл нь санамсаргүй үгнээс давуу. `key` нь
     дахин mount хийлгэж анимацийг эхнээс нь тоглуулна. */
  const bubbleContent = noticeShown
    ? { text: noticeShown.text, key: `notice-${noticeShown.key}`, onTap: noticeShown.onTap }
    : phrase && state === "blush"
      ? { text: phrase.text, key: `phrase-${phrase.key}`, onTap: null }
      : null;
```

- [ ] **Step 2: App түвшинд уншаагүй төлөвийг тооцох**

`tovlorokh-khamtrakh.jsx`-д `chatSignal`-ыг импортол. `createPokeSender`-ийн
импортын дараа нэм:

```js
import { hasUnread } from "./src/chibi/chatSignal.js";
```

`const [chibiHappyAt, setChibiHappyAt] = useState(null);` мөрийн дор нэм:

```js
  const [lastMsg, setLastMsg] = useState(null);       /* { sender, createdAtMs } */
  const [myReadAtMs, setMyReadAtMs] = useState(null);
  const [chatNotice, setChatNotice] = useState(null); /* { text, key, onTap } */
```

`pokeSender`-ийн `useMemo`-гийн дараа хоёр шинэ effect нэм:

```js
  /* Хамгийн сүүлийн зурвасыг л сонсоно — нэг баримт тул хөнгөн. */
  useEffect(() => {
    if (!accountKey) return;
    const q = query(collection(db, "rooms", CHAT_ROOM, "messages"), orderBy("createdAt", "desc"), limit(1));
    const unsub = onSnapshot(q, (snap) => {
      const d = snap.docs[0];
      if (!d) return setLastMsg(null);
      const data = d.data();
      setLastMsg({ sender: data.sender, createdAtMs: data.createdAt?.toMillis?.() ?? null });
    }, () => {});
    return unsub;
  }, [accountKey]);

  /* Өөрийн уншсан хугацаа */
  useEffect(() => {
    if (!accountKey) return;
    const unsub = onSnapshot(doc(db, "rooms", CHAT_ROOM, "reads", accountKey), (snap) => {
      setMyReadAtMs(snap.data()?.at?.toMillis?.() ?? null);
    }, () => {});
    return unsub;
  }, [accountKey]);

  const chatUnread = hasUnread(lastMsg, myReadAtMs, accountKey);
```

- [ ] **Step 3: Бөмбөлгийг шилжих агшинд нэг удаа гаргах**

Дээрх мөрүүдийн дараа нэм:

```js
  /* «Уншаагүй биш» → «уншаагүй» болж шилжих агшинд бөмбөлөг нэг удаа гарна.
     Уншаагүй төлөв үргэлжилсэн ч давтан гарахгүй — nav дээрх цэг л үлдэнэ. */
  const prevUnreadRef = useRef(false);
  const noticeKeyRef = useRef(0);

  useEffect(() => {
    const was = prevUnreadRef.current;
    prevUnreadRef.current = chatUnread;

    if (!chatUnread) return setChatNotice(null);
    if (was) return; /* аль хэдийн уншаагүй байсан — дахин гаргахгүй */

    noticeKeyRef.current += 1;
    setChatNotice({
      text: "Чат ирсэн байна 💌",
      key: noticeKeyRef.current,
      onTap: () => go("chat"),
    });
  }, [chatUnread]);
```

> `prevUnreadRef`-ийн эхний утга `false` тул апп нээхэд аль хэдийн уншаагүй
> байвал бөмбөлөг нэг удаа гарна — spec-ийн шаардлагын дагуу.

- [ ] **Step 4: `ChibiPet`-д `notice` дамжуулах**

`<ChibiPet ... />` дуудлагыг ол (`character={partnerKey}` гэсэн мөртэй).
`happyAt={chibiHappyAt}` мөрийн дор нэм:

```js
            notice={chatNotice}
```

- [ ] **Step 5: Нүүр дэлгэцийн чат картан дээр тэмдэг нэмэх**

Доод nav-д чат товч **байхгүй** (`nav` массивт зөвхөн home/water/list/screen/gif
байгаа) — чат руу нүүр дэлгэцийн картаас ордог. Тиймээс тэмдгийг тэр карт дээр
харуулна.

**5a.** `HomeScreen`-ийн гарын үсэгт `chatUnread` нэм. `gifCount` дараа нь
таслалаар залгана:

```js
function HomeScreen({ go, ml, goal, items, gifCount, chatUnread, clock, justReset, avatar, profileName, screenApps, appMin, partner, partnerName, canInstall, isIOS, isStandalone, installDismissed, updateAvailable, onInstall, onDismissInstall, onApplyUpdate, pushState, pushBusy, pushError, pushDismissed, onEnablePush, onDismissPush }) {
```

**5b.** Чатын картыг ол:

```js
      <Card tint="#F8F4FC" className="mb-3" onClick={() => go("chat")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: C.lilacDeep }}>
            <MessageCircle size={17} strokeWidth={2.2} color="#fff" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Чат</div>
            <div className="text-[11.5px] truncate font-medium" style={{ color: C.inkSoft }}>Хайртай хүнтэйгээ шууд бичих</div>
          </div>
        </div>
      </Card>
```

Дараахаар соль:

```js
      <Card tint="#F8F4FC" className="mb-3" onClick={() => go("chat")}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 relative" style={{ background: C.lilacDeep }}>
            <MessageCircle size={17} strokeWidth={2.2} color="#fff" />
            {/* Уншаагүй зурвасын тэмдэг */}
            {chatUnread && (
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full"
                style={{ background: C.peachDeep, border: "2px solid #F8F4FC" }} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-extrabold" style={{ color: C.ink }}>Чат</div>
            <div className="text-[11.5px] truncate font-medium" style={{ color: C.inkSoft }}>
              {chatUnread ? "Шинэ зурвас ирсэн байна" : "Хайртай хүнтэйгээ шууд бичих"}
            </div>
          </div>
        </div>
      </Card>
```

**5c.** `HomeScreen`-ийн дуудлагад `chatUnread`-ыг дамжуул. `{tab === "home" && <HomeScreen ...>`
мөрөнд `gifCount={frames.length}` байгаа — түүний дэргэд нэм:

```js
chatUnread={chatUnread}
```

- [ ] **Step 6: Build ба тест**

Run: `npm run build && npm test`
Expected: хоёулаа алдаагүй.

- [ ] **Step 7: Хөтөч дээр шалгах**

Run: `npm run preview -- --port 4185`

Хоёр профайлаар нэвтэрч, нэг талаас зурвас илгээ. Нөгөө талд:
- chibi «Чат ирсэн байна 💌» гэж хэлэх, товшиход чат руу шилжих
- нүүр дэлгэцийн чат картан дээр тэмдэг гарч, тайлбар текст солигдох
- чат руу орсны дараа тэмдэг алга болох
- өөрөө зурвас илгээхэд тэмдэг ГАРАХГҮЙ байх

- [ ] **Step 8: Commit**

```bash
git add tovlorokh-khamtrakh.jsx src/chibi/ChibiPet.jsx
git commit -m "feat: уншаагүй зурвасыг chibi болон nav дээр мэдэгддэг болов"
```

---

### Task 5: Sprite хуудсыг үүсгэх (гараар — AI зураг)

**Files:**
- Create: `public/chibi/andela-chat.png`
- Create: `public/chibi/neko-chat.png`

**Interfaces:**
- Consumes: юу ч үгүй.
- Produces: Task 6-д хэрэгтэй хоёр PNG файл.

> **Энэ task-ыг хэрэглэгч гүйцэтгэнэ.** Агент нь prompt-ыг гаргаж өгөөд,
> файл ирэхийг хүлээнэ.

- [ ] **Step 1: Prompt-ыг хэрэглэгчид өгөх**

`docs/superpowers/specs/2026-07-29-chibi-chat-reaction-design.md` доторх
«AI-д өгөх prompt» хэсгээс **Prompt 1 — Andela** болон **Prompt 2 — Neko**-г
бүтнээр нь хуулж хэрэглэгчид өг. Хамт дараах зааврыг хэл:

- Prompt 1-д `public/chibi/andela.png`-ыг хавсаргана
- Prompt 2-д `public/chibi/neko.png`-ыг хавсаргана
- Эх зураг (`assets/Chibi/Pasted image.png`) биш, **бэлэн sprite хуудсыг**
  хавсаргах нь чухал — шугам, өнгө, хэмжээ нь одоогийн дүрүүдтэй таарна

- [ ] **Step 2: Ирсэн файлыг шалгах**

Файлуудыг `public/chibi/` дотор байрлуулсны дараа:

```bash
python3 -c "
import struct
for f in ['public/chibi/andela-chat.png','public/chibi/neko-chat.png']:
    d=open(f,'rb').read(26)
    w,h=struct.unpack('>II',d[16:24])
    print(f, w,'x',h)
"
```

Expected: `1536 x 512` хоёуланд нь.

Хэрэв өөр хэмжээтэй ирвэл Task 6-ийн `CHAT_SHEET` доторх `cellW`/`cellH`-г
бодит хэмжээнд тааруул (`cellW = өргөн / 3`, `cellH = өндөр`).

- [ ] **Step 3: Дэвсгэр ил тод эсэхийг шалгах**

```bash
python3 -c "
from struct import unpack
for f in ['public/chibi/andela-chat.png','public/chibi/neko-chat.png']:
    d=open(f,'rb').read(26)
    print(f, 'өнгөний төрөл:', d[25], '(6 = RGBA, 4 = grey+alpha)')
"
```

Expected: `6` — альфа сувагтай. `2` эсвэл `0` бол ил тод байдал алга, дахин үүсгүүл.

- [ ] **Step 4: Нүдээр шалгах**

Зургийг нээж дараахыг батал:
- Гурван дүрийн өндөр, хөлний түвшин ижил
- Заасан гар гурван нүдэнд адилхан байрлалтай
- Хуруу **зүүн тийш** заасан (баруун тийш бол Task 6-д `CHAT_SHEET_FACING`-ыг `1` болго)
- Зүрхний тэмдэг **байхгүй**
- Цагаан дөрвөлжин, хүрээ, текст байхгүй

- [ ] **Step 5: Commit**

```bash
git add public/chibi/andela-chat.png public/chibi/neko-chat.png
git commit -m "feat: чат реакцийн chibi sprite хуудсууд"
```

---

### Task 6: `sprites.js` — чат хуудсыг бүртгэх

**Files:**
- Modify: `src/chibi/sprites.js`
- Modify: `src/chibi/sprites.test.js`

**Interfaces:**
- Consumes: Task 5-ийн PNG файлууд.
- Produces:
  - `CHAT_SHEET: { andela: {url, cols, rows, cellW, cellH}, neko: {...} }`
  - `CHAT_CELL: { look: 0, turn: 1, smile: 2 }`
  - `CHAT_SHEET_FACING: number` (`-1`)
  - `CHAT_STEPS: Array<{ cell: number, ms: number }>` — дарааллын хугацаа

- [ ] **Step 1: Тест нэмэх**

`src/chibi/sprites.test.js`-ийн импортод нэм, дараа нь шинэ `describe` нэм:

```js
import { CHAT_SHEET, CHAT_CELL, CHAT_STEPS, gridPosition } from "./sprites.js";

describe("чат реакцийн хуудас", () => {
  it("хоёр дүрд хоёулаа хуудастай", () => {
    expect(CHAT_SHEET.andela).toBeTruthy();
    expect(CHAT_SHEET.neko).toBeTruthy();
  });

  it("гурван нүдтэй нэг мөр", () => {
    for (const key of ["andela", "neko"]) {
      expect(CHAT_SHEET[key].cols).toBe(3);
      expect(CHAT_SHEET[key].rows).toBe(1);
    }
  });

  it("нүдний хэмжээ болон renderH заагдсан", () => {
    for (const key of ["andela", "neko"]) {
      expect(CHAT_SHEET[key].cellW).toBeGreaterThan(0);
      expect(CHAT_SHEET[key].cellH).toBeGreaterThan(0);
      expect(CHAT_SHEET[key].renderH).toBeGreaterThan(0);
    }
  });

  it("нүд бүр gridPosition-оор зөв хувь буцаана", () => {
    const { cols, rows } = CHAT_SHEET.neko;
    expect(gridPosition(CHAT_CELL.look, 0, cols, rows)).toBe("0% 0%");
    expect(gridPosition(CHAT_CELL.turn, 0, cols, rows)).toBe("50% 0%");
    expect(gridPosition(CHAT_CELL.smile, 0, cols, rows)).toBe("100% 0%");
  });

  it("дараалал гурван алхамтай бөгөөд эерэг хугацаатай", () => {
    expect(CHAT_STEPS).toHaveLength(3);
    for (const step of CHAT_STEPS) {
      expect(step.ms).toBeGreaterThan(0);
    }
  });

  it("дарааллын алхмууд look → turn → smile дараалалтай", () => {
    expect(CHAT_STEPS.map((s) => s.cell)).toEqual([CHAT_CELL.look, CHAT_CELL.turn, CHAT_CELL.smile]);
  });
});
```

- [ ] **Step 2: Тест унаж байгааг батлах**

Run: `npx vitest run src/chibi/sprites.test.js`
Expected: FAIL — `CHAT_SHEET` тодорхойлогдоогүй.

- [ ] **Step 3: `sprites.js`-д нэмэх**

Файлын төгсгөлд нэм:

```js
/* ── Чат реакцийн хуудас ──
   renderH — энэ хуудсыг дэлгэц дээр хэдэн пикселийн өндрөөр зурах вэ.
   Үндсэн хуудсын SPRITE_HEIGHT (72) биш: чат дүрүүд нүдэндээ арай бага
   талбай эзэлдэг тул 72-оор зурвал хуучин дүрээс мэдэгдэхүйц жижиг
   харагдана. 80 нь нүдээр тааруулсан утга — Task 7-ийн хөтөчийн шалгалтад
   баталгаажуулна.

   Чат руу орох үед л ажиллах гурван дүр. Үндсэн 9 нүдийн хуудсыг хөндөхгүйн
   тулд WALK_SHEET-ийн адил тусдаа файлаар байрлана. */
export const CHAT_SHEET = {
  andela: { url: "/chibi/andela-chat.png", cols: 3, rows: 1, cellW: 362, cellH: 590, renderH: 80 },
  neko: { url: "/chibi/neko-chat.png", cols: 3, rows: 1, cellW: 328, cellH: 546, renderH: 80 },
};

export const CHAT_CELL = { look: 0, turn: 1, smile: 2 };

/* Зурсан дүр зүүн тийш заасан. Баруун тийш заах шаардлагатай үед код
   scaleX-ээр толино. Зураг баруун тийш заасан бол энийг 1 болгоно. */
export const CHAT_SHEET_FACING = -1;

/* Дарааллын алхмууд: аль нүд, хэдэн мс. */
export const CHAT_STEPS = [
  { cell: CHAT_CELL.look, ms: 700 },
  { cell: CHAT_CELL.turn, ms: 250 },
  { cell: CHAT_CELL.smile, ms: 1400 },
];
```

- [ ] **Step 4: Тест өнгөрч байгааг батлах**

Run: `npm test`
Expected: PASS — бүх тест.

- [ ] **Step 5: Commit**

```bash
git add src/chibi/sprites.js src/chibi/sprites.test.js
git commit -m "feat: чат реакцийн sprite хуудсыг бүртгэв"
```

---

### Task 7: Дарааллыг ажиллуулах

**Files:**
- Modify: `src/chibi/ChibiPet.jsx`
- Modify: `tovlorokh-khamtrakh.jsx`
- Modify: `tovlorokh-khamtrakh.jsx` доторх `ChatScreen`

**Interfaces:**
- Consumes: `bubbleTarget` (Task 2), `walkTo`/`consumeArrival`/`hold`/`release`
  (Task 3), `CHAT_SHEET`/`CHAT_CELL`/`CHAT_STEPS`/`CHAT_SHEET_FACING` (Task 6).
- Produces: эцсийн зан төлөв. Дараагийн task байхгүй.
  - `ChibiPet`-д шинэ prop: `chatAct: { key: number, bubbleRect: DOMRect } | null`
  - `ChatScreen`-д шинэ prop: `onPartnerBubble: (rect: DOMRect | null) => void`

- [ ] **Step 1: `ChatScreen`-ээс сүүлийн хамтрагчийн бөмбөлгийн байрлалыг мэдээлэх**

`ChatScreen`-ийн гарын үсэгт `onPartnerBubble` нэм:

```js
function ChatScreen({ onBack, profileName, accountKey, partnerKey, onPartnerBubble }) {
```

`listRef`-ийн дэргэд шинэ ref нэм:

```js
  const lastPartnerBubbleRef = useRef(null);
```

`const lastMineId = ...` мөрийн дор хамтрагчийн сүүлийн зурвасын id-г ол —
`lastMineId`-тэй яг ижил загвараар:

```js
  /* Хамтрагчийн хамгийн сүүлийн зурвас — chibi үүн рүү очиж заана */
  const lastPartnerId = [...messages].reverse().find((m) => m.sender !== accountKey)?.id;
```

Зурвасын бөмбөлгийн `<div>`-г ол (`className={\`max-w-[75%] rounded-[18px] ...\`}`
гэсэн мөртэй, `onClick={() => setReactingTo(...)}` агуулсан). Түүний
`onClick`-ийн өмнө `ref` нэм:

```js
                <div ref={m.id === lastPartnerId ? lastPartnerBubbleRef : null}
                  onClick={() => setReactingTo((id) => (id === m.id ? null : m.id))}
```

Дараа нь зурвас өөрчлөгдөх бүрд эцэгт мэдэгдэх effect нэм:

```js
  /* Зурвасын жагсаалт зурагдаж дууссаны дараа байрлалыг эцэгт өгнө.
     requestAnimationFrame нь хоёр зорилготой:
       1. layout тогтсоны дараа хэмжинэ (гар нээлттэй үед ч зөв),
       2. React-д ХҮҮХДИЙН effect эцгийнхээс ӨМНӨ ажилладаг. Эцэг нь чат руу
          орсныг rAF-гүйгээр хараахан тэмдэглээгүй байх тул анхны дуудлага
          алдагдана. rAF нь бүх effect дууссаны дараа ажиллана.
     Тиймээс энэ rAF-ыг энгийн дуудлага болгож "хялбарчилж" БОЛОХГҮЙ. */
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      onPartnerBubble?.(lastPartnerBubbleRef.current?.getBoundingClientRect() ?? null);
    });
    return () => cancelAnimationFrame(id);
  }, [messages, onPartnerBubble]);
```

- [ ] **Step 2: App түвшинд `chatAct`-ыг угсрах**

`tovlorokh-khamtrakh.jsx`-д нэм (`chatNotice`-ийн дэргэд):

```js
  const [chatAct, setChatAct] = useState(null); /* { key, bubbleRect } */
  const chatActKeyRef = useRef(0);
```

`ChatScreen`-ийн дуудлагад prop нэм:

```js
{tab === "chat" && <ChatScreen onBack={() => go("home")} profileName={profileName} accountKey={accountKey} partnerKey={partnerKey} onPartnerBubble={handlePartnerBubble} />}
```

`handlePartnerBubble`-ыг тодорхойл (`useCallback` ашиглана — эс бөгөөс
`ChatScreen`-ийн effect дахин дахин ажиллана):

```js
  /* Чат руу орох бүрд дараалал нэг л удаа эхэлнэ. Дараагийн удаа орох хүртэл
     дахин эхлэхгүй — chatActArmedRef нь энэ хаалгыг барина. */
  const chatActArmedRef = useRef(false);

  useEffect(() => {
    chatActArmedRef.current = tab === "chat";
    if (tab !== "chat") setChatAct(null);
  }, [tab]);

  const handlePartnerBubble = useCallback((rect) => {
    if (!chatActArmedRef.current || !rect) return;
    chatActArmedRef.current = false; /* нэг л удаа */
    chatActKeyRef.current += 1;
    setChatAct({ key: chatActKeyRef.current, bubbleRect: rect });
  }, []);
```

`useCallback`-ыг React импортод нэм:

```js
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
```

`<ChibiPet ... />`-д prop нэм:

```js
            chatAct={chatAct}
```

- [ ] **Step 3: `ChibiPet`-д дарааллыг хэрэгжүүлэх**

`src/chibi/ChibiPet.jsx`-ийн импортод нэм:

```js
import { CHAT_SHEET, CHAT_STEPS, CHAT_SHEET_FACING } from "./sprites.js";
import { bubbleTarget } from "./chatSignal.js";
```

Компонентын гарын үсэгт `chatAct` нэм:

```js
export default function ChibiPet({ character, enabled, onPoke, happyAt, notice, chatAct }) {
```

Төлөв нэм (`noticeShown`-ий дэргэд):

```js
  /* Чат реакцийн дараалал: null бол ажиллахгүй, эс бөгөөс алхмын дугаар. */
  const [chatStep, setChatStep] = useState(null);
  const chatTimerRef = useRef(null);
  const chatActiveRef = useRef(false);
```

Дарааллыг эхлүүлэх effect нэм:

```js
  /* Чат руу орлоо — бөмбөлгийн дэргэд очиж заана. */
  useEffect(() => {
    if (!chatAct || !enabled) return;
    const brain = brainRef.current;
    const layer = layerRef.current;
    if (!brain || !layer) return;

    const frame = layer.getBoundingClientRect();
    const { x, facing } = bubbleTarget({
      bubble: chatAct.bubbleRect,
      frame,
      spriteWidth: SPRITE_WIDTH,
    });
    chatFacingRef.current = facing;

    chatActiveRef.current = true;
    brain.hold(performance.now());
    brain.walkTo(x, 0, performance.now()); /* ердийн алхах шугам дээр — босоо авирахгүй */

    /* Дараалал дуусаагүй байхад чатаас гарвал chibi мөнхөд хөлдөхгүй байх ёстой. */
    return () => {
      clearTimeout(chatTimerRef.current);
      chatActiveRef.current = false;
      setChatStep(null);
      brainRef.current?.release(performance.now());
    };
  }, [chatAct?.key, enabled]);
```

rAF цикл дотор (`brainRef.current.tick(...)` дуудагддаг газар) хүрэлтийг шалга.
`tick`-ийн дараа нэм:

```js
      if (chatActiveRef.current && brainRef.current.consumeArrival()) {
        runChatStep(0);
      }
```

`runChatStep`-ыг компонентын дотор тодорхойл:

```js
  /* Дүрүүдийг ээлжлүүлнэ. Сүүлийн алхамд зүрх гаргаад автономит зан руу буцна. */
  const runChatStep = (i) => {
    if (!chatActiveRef.current) return;
    setChatStep(i);

    if (CHAT_STEPS[i].cell === CHAT_STEPS[CHAT_STEPS.length - 1].cell) {
      setHearts((h) => h + 1);
    }

    clearTimeout(chatTimerRef.current);
    chatTimerRef.current = setTimeout(() => {
      if (i + 1 < CHAT_STEPS.length) return runChatStep(i + 1);
      chatActiveRef.current = false;
      setChatStep(null);
      brainRef.current?.release(performance.now());
    }, CHAT_STEPS[i].ms);
  };
```

Товшилт дарааллыг таслах — `onPointerUp` доторх `if (!res?.tapped) return;`
мөрийн ДАРАА нэм:

```js
    /* Хэрэглэгчийн үйлдэл анимациас давуу. */
    if (chatActiveRef.current) {
      clearTimeout(chatTimerRef.current);
      chatActiveRef.current = false;
      setChatStep(null);
      brainRef.current?.release(performance.now());
    }
```

- [ ] **Step 4: Sprite-ыг зурах**

Байрлал болон кадрыг rAF цикл дотор **императивээр** тавьдаг тул чат дүрийг
мөн тэндээс удирдана. `backgroundImage`/`backgroundSize` нь React-ийн `sheet`
объектоос ирдэг тул түүнд ч нэмнэ.

**4a.** Алхаж яваа эсэхийг тодорхойлдог мөрийг ол:

```js
  const walking = state === "walk" || state === "climb";
```

`goto` төлөвийг нэм — эс бөгөөс зорилтот цэг рүү явахдаа хөлөө хөдөлгөхгүй,
зогсоо дүрээрээ гулсана:

```js
  const walking = state === "walk" || state === "climb" || state === "goto";
```

**4b.** `sprites.js` доторх `frameFor`-д мөн `goto` нэм. Одоо ийм байна:

```js
  if (state === "walk" || state === "climb") {
```

Дараахаар соль:

```js
  if (state === "walk" || state === "climb" || state === "goto") {
```

**4c.** `walkSheet` тодорхойлолтын дор чат хуудсыг нэм:

```js
  const walkSheet = !broken && walking ? WALK_SHEET[character] : null;
  walkSheetRef.current = walkSheet;

  /* Чат реакцийн дүр нь алхааны хуудаснаас давуу — дараалал зөвхөн зогссон
     үед ажилладаг тул мөргөлдөхгүй, гэхдээ дараалал нь тодорхой байх ёстой. */
  const chatSheet = !broken && chatStep !== null ? CHAT_SHEET[character] : null;
  chatSheetRef.current = chatSheet;
  chatStepRef.current = chatStep;
```

`chatSheetRef` болон `chatStepRef`-ыг компонентын дээд хэсэгт зарла
(`walkSheetRef`-ийн дэргэд):

```js
  const chatSheetRef = useRef(null);
  const chatStepRef = useRef(null);
```

**4d.** `boxW` тооцооллыг чат хуудсыг тооцдог болго. Одоо ийм байна:

```js
  const boxW = walkSheet
    ? Math.round((SPRITE_HEIGHT * walkSheet.cellW) / walkSheet.cellH)
    : SPRITE_WIDTH;
```

Дараахаар соль:

```js
  const activeSheet = chatSheet || walkSheet;
  /* Чат хуудас өөрийн renderH-ээр зурагдана — хуучин дүртэй ижил хэмжээтэй
     харагдахын тулд. Бусад тохиолдолд ердийн SPRITE_HEIGHT. */
  const spriteH = chatSheet ? chatSheet.renderH : SPRITE_HEIGHT;
  const boxW = activeSheet
    ? Math.round((spriteH * activeSheet.cellW) / activeSheet.cellH)
    : SPRITE_WIDTH;
```

Дараа нь sprite элементийн `style` доторх `height: SPRITE_HEIGHT` мөрийг
`height: spriteH` болго. `bottom` нь хэвээр — хайрцаг дээшээ өснө, хөл нь
доод шугам дээрээ үлдэнэ.

**4e.** `sheet` объектод чат хуудсыг нэм. Одоо ийм байна:

```js
  const sheet = broken
    ? { backgroundImage: `url(${PLACEHOLDER})`, backgroundSize: "100% 100%", backgroundPosition: "0% 0%" }
    : walkSheet
      ? {
          backgroundImage: `url(${walkSheet.url})`,
          backgroundSize: `${walkSheet.cols * 100}% ${walkSheet.rows * 100}%`,
        }
      : { backgroundImage: `url(${SPRITE_URL[character]})`, backgroundSize: "300% 300%" };
```

Дараахаар соль:

```js
  const sheet = broken
    ? { backgroundImage: `url(${PLACEHOLDER})`, backgroundSize: "100% 100%", backgroundPosition: "0% 0%" }
    : chatSheet
      ? {
          backgroundImage: `url(${chatSheet.url})`,
          backgroundSize: `${chatSheet.cols * 100}% ${chatSheet.rows * 100}%`,
        }
      : walkSheet
        ? {
            backgroundImage: `url(${walkSheet.url})`,
            backgroundSize: `${walkSheet.cols * 100}% ${walkSheet.rows * 100}%`,
          }
        : { backgroundImage: `url(${SPRITE_URL[character]})`, backgroundSize: "300% 300%" };
```

**4f.** Чат хуудсыг урьдчилан ачаална — дараалал эхлэхэд нэг фрэйм хоосон
харагдахгүйн тулд. `{WALK_SHEET[character] && <img ... className="hidden" />}`
мөрийн дор нэм:

```js
      {CHAT_SHEET[character] && <img src={CHAT_SHEET[character].url} alt="" className="hidden" />}
```

**4g.** rAF цикл дотор кадр болон толилтыг тавь. Одоо ийм байна:

```js
          const flip = walkSheet ? 1 : SHEET_FACING * s.facing;
          const off = (boxWRef.current - SPRITE_WIDTH) / 2;
          spriteRef.current.style.transform =
            `translate3d(${s.x - off}px, ${-s.y}px, 0) scaleX(${flip})`;
          spriteRef.current.style.backgroundPosition = walkSheet
            ? gridPosition(walkFrame(s.elapsed, walkSheet), WALK_ROW[s.dir] ?? WALK_ROW.down,
                           walkSheet.cols, walkSheet.rows)
            : cellPosition(frameFor(s.state, s.elapsed));
```

Дараахаар соль:

```js
          const chatSheet = chatSheetRef.current;
          /* Чат дүр нь bubbleTarget-ийн тогтоосон зүг рүү харна — brain-ийн
             facing нь зөвхөн явж ирсэн чиглэлийг заана. */
          const flip = chatSheet
            ? CHAT_SHEET_FACING * chatFacingRef.current
            : walkSheet ? 1 : SHEET_FACING * s.facing;
          const off = (boxWRef.current - SPRITE_WIDTH) / 2;
          spriteRef.current.style.transform =
            `translate3d(${s.x - off}px, ${-s.y}px, 0) scaleX(${flip})`;
          spriteRef.current.style.backgroundPosition = chatSheet
            ? gridPosition(CHAT_STEPS[chatStepRef.current].cell, 0, chatSheet.cols, chatSheet.rows)
            : walkSheet
              ? gridPosition(walkFrame(s.elapsed, walkSheet), WALK_ROW[s.dir] ?? WALK_ROW.down,
                             walkSheet.cols, walkSheet.rows)
              : cellPosition(frameFor(s.state, s.elapsed));
```

`gridPosition`, `CHAT_SHEET`, `CHAT_STEPS`, `CHAT_SHEET_FACING` импортлогдсон
эсэхийг шалга.

**4h.** `chatFacingRef`-ыг зарлаж, дараалал эхлэхэд утгыг нь тавь.
`chatSheetRef`-ийн дэргэд:

```js
  const chatFacingRef = useRef(-1);
```

Step 3-д бичсэн дарааллын effect дотор `bubbleTarget`-ийн үр дүнгээс `facing`-ыг
мөн ав:

```js
    const { x, facing } = bubbleTarget({ ... });
    chatFacingRef.current = facing;
```

- [ ] **Step 5: Build ба тест**

Run: `npm run build && npm test`
Expected: хоёулаа алдаагүй.

- [ ] **Step 6: Хөтөч дээр шалгах**

Run: `npm run preview -- --port 4185`

- Чат руу орох бүрд chibi сүүлийн хамтрагчийн зурвас руу **алхаж** очих
- Заасны дараа толгойгоо эргүүлж инээмсэглэх, зүрх гарах
- Дараа нь автономит алхаа руугаа буцах
- Дараалал явж байхад chibi-г товшвол дараалал тасарч, ичих зан гарах
- Дараалал явж байхад чатаас гарвал chibi хөлдөхгүй, автономит зан руугаа буцах
- Хамтрагчийн зурвас байхгүй шинэ чат дээр дараалал огт эхлэхгүй

- [ ] **Step 7: Commit**

```bash
git add src/chibi/ChibiPet.jsx tovlorokh-khamtrakh.jsx
git commit -m "feat: чат руу орох үед chibi зурвасыг зааж инээмсэглэдэг болов"
```

---

### Task 8: Spec-ийг хэрэгжсэн гэж тэмдэглэх

**Files:**
- Modify: `docs/superpowers/specs/2026-07-29-chibi-chat-reaction-design.md`

**Interfaces:**
- Consumes: Task 1-7 бүгд дууссан байх.
- Produces: юу ч үгүй.

- [ ] **Step 1: Гарчгийн дор төлөв нэмэх**

`Огноо: 2026-07-29` мөрийн доор нэм:

```markdown
**Төлөв:** Хэрэгжсэн — `docs/superpowers/plans/2026-07-29-chibi-chat-reaction.md`
```

- [ ] **Step 2: Commit**

```bash
git add docs/superpowers/specs/2026-07-29-chibi-chat-reaction-design.md
git commit -m "docs: чат реакцийн spec-ийг хэрэгжсэн гэж тэмдэглэв"
```

---

## Хэрэгжсэний дараа

```bash
npm test && npm run build
git push
```
