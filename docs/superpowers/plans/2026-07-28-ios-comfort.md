# iPhone дээрх хэрэглэхүйг сайжруулах — хэрэгжүүлэлтийн төлөвлөгөө

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ankomeow PWA-г iPhone-ы нүүр дэлгэцэд суулгасан (standalone) горимд native апп шиг тухтай болгох.

**Architecture:** iOS-ын логикийг 2211 мөртэй `tovlorokh-khamtrakh.jsx`-д хийхгүй. Глобал хүрэлтийн зан үйл нь `src/ios.css`-д, хөдөлгөөний логик нь `src/hooks/`-д тус тусдаа hook болж сална. Гол файлд зөвхөн холболт болон layout-д уягдсан safe-area/хэмжээний засварууд орно.

**Tech Stack:** React 18, Vite 5, Tailwind CSS 3, Firebase 12 (Firestore/Auth), lucide-react. Тест framework **байхгүй** — шинээр нэмэхгүй.

## Global Constraints

- Гол горим нь **standalone** (Add to Home Screen). Safari дотор эвдрэхгүй байх ёстой, гэхдээ Safari-д тусгай тохируулга хийхгүй.
- Дизайны ерөнхий аяс, өнгө, бүтэц хэвээр. Зөвхөн жижиг хэмжээний тохируулга зөвшөөрөгдөнө.
- `apple-mobile-web-app-status-bar-style` нь `default` хэвээр — `black-translucent` руу **шилжүүлэхгүй**.
- `maximum-scale=1` эсвэл `user-scalable=no`-г **ашиглахгүй** (accessibility эвддэг).
- Гар утасны хил: `@media (max-width: 640px)` — одоогийн кодод хэрэглэж буй утга.
- Тайлбар бичвэр бүгд монголоор, одоогийн кодын хэв маягаар.
- Commit message монголоор, `Co-Authored-By: Claude` мөр **нэмэхгүй**.
- Баталгаажуулалт бүр `npm run build` алдаагүй өнгөрөх шаардлагатай. Автомат тест байхгүй тул үлдсэн шалгалт нь бодит iPhone дээр гараар хийгдэнэ.

## File Structure

| Файл | Үүрэг | Төлөв |
|---|---|---|
| `src/ios.css` | Глобал iOS хүрэлтийн давхарга, `--kb-inset` хувьсагчийн анхны утга | Шинэ |
| `src/hooks/useKeyboardInset.js` | `visualViewport`-оос гарын өндрийг `--kb-inset` болгон гаргана | Шинэ |
| `src/hooks/useSwipeBack.js` | Зүүн ирмэгийн шударлагыг барьж буцах callback дуудна | Шинэ |
| `src/hooks/usePullToRefresh.js` | Scroll дээд цэгээс доош татах хөдөлгөөнийг барина | Шинэ |
| `src/main.jsx` | `ios.css`-ийг импортлоно | Засвар |
| `tovlorokh-khamtrakh.jsx` | Safe-area, input хэмжээ, hook-уудын холболт, шилжилт | Засвар |

---

### Task 1: Глобал iOS хүрэлтийн давхарга

iOS Safari-д дэлгэц резин мэт дүүжлэгдэх, дарахад саарал дөрвөлжин гарах, урт дарахад "Copy/Share" цэс гарах гэсэн 3 зан үйл нь аппыг вэб мэт мэдрүүлдэг. Бүгдийг нэг CSS давхаргаар хаана.

**Files:**
- Create: `src/ios.css`
- Modify: `src/main.jsx:4`

**Interfaces:**
- Consumes: юу ч үгүй
- Produces: `--kb-inset` CSS хувьсагч (анхны утга `0px`) — Task 4 бөглөнө

- [ ] **Step 1: `src/ios.css` үүсгэх**

```css
/* iOS-д зориулсан хүрэлтийн давхарга.
   index.css (Tailwind)-ийн дараа ачаалагдана — base давхаргыг дарж бичнэ. */

:root {
  /* Гарын эзэлж буй өндөр. useKeyboardInset бөглөнө. */
  --kb-inset: 0px;
}

html,
body {
  /* Бүх дэлгэц резин мэт дүүжлэгдэх, санамсаргүй pull-to-refresh хийгдэхийг зогсооно */
  overscroll-behavior: none;
}

@media (max-width: 640px) {
  /* Гар утсан дээр frame нь яг viewport-ын өндөртэй тул баримт бичиг гүйх ёсгүй */
  html,
  body {
    height: 100%;
    overflow: hidden;
  }
}

* {
  /* Дарахад гарах саарал дөрвөлжин гэрэлтэлт */
  -webkit-tap-highlight-color: transparent;
}

button,
a,
nav,
img,
svg {
  /* Урт дарахад гарах Copy/Share цэс болон зураг чирэх */
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  -webkit-user-drag: none;
}

button,
a {
  /* Давхар товшилтын 300ms саатал */
  touch-action: manipulation;
}

/* Бичих талбарыг сонгох боломжтой үлдээнэ. Чатны мессежийн текст нь энгийн div
   дотор байгаа тул дээрх user-select:none дүрэмд хамрагдахгүй — сонгогдох хэвээр. */
input,
textarea {
  -webkit-user-select: text;
  user-select: text;
}
```

- [ ] **Step 2: `src/main.jsx`-д импортлох**

`src/main.jsx:4` мөр одоо ингэж байна:

```jsx
import "./index.css";
```

Дараах болгож солино (дараалал чухал — `ios.css` нь Tailwind-ийн дараа байх ёстой):

```jsx
import "./index.css";
import "./ios.css";
```

- [ ] **Step 3: Build ажиллаж байгааг шалгах**

Ажиллуулах: `npm run build`
Хүлээгдэх үр дүн: алдаагүй дуусах, `dist/` дотор шинэ CSS үүсэх.

- [ ] **Step 4: Commit**

```bash
git add src/ios.css src/main.jsx
git commit -m "feat: iOS хүрэлтийн глобал давхарга — bounce, tap highlight, урт дарах цэс хаав"
```

**Гараар шалгах (iPhone, standalone):** дэлгэцийг доош чангаахад дүүжлэгдэхгүй байх; товч дарахад саарал гэрэлтэлт гарахгүй байх; зураг/товч дээр урт дарахад цэс гарахгүй байх; чатны мессежийн текст сонгогдох боломжтой хэвээр байх.

---

### Task 2: Safe-area зай ба доод nav-ын хэмжээ

`index.html`-д `viewport-fit=cover` байгаа тул `env(safe-area-inset-*)` утга өгнө, гэвч код хаана ч ашиглаагүй. Үүнээс болж толгойн хэсэг Dynamic Island-ын доор орж, доод nav нь home indicator шугам дээр таарч байна.

**Files:**
- Modify: `tovlorokh-khamtrakh.jsx:2124-2127` (mobile media query)
- Modify: `tovlorokh-khamtrakh.jsx:2137-2143` (macOS traffic light)
- Modify: `tovlorokh-khamtrakh.jsx:2185-2202` (nav)

**Interfaces:**
- Consumes: юу ч үгүй
- Produces: `.app-frame` нь mobile дээр дээд safe-area padding-тай болно — Task 4 үүний `height`-ыг өөрчилнө

- [ ] **Step 1: Mobile media query-д safe-area padding нэмэх**

`tovlorokh-khamtrakh.jsx:2124-2127` одоо ингэж байна:

```
        @media (max-width:640px){
          .app-shell{padding:0;min-height:100dvh;min-height:100svh}
          .app-frame{max-width:100%;height:100dvh;height:100svh;border-radius:0;border:none;box-shadow:none}
        }
```

Дараах болгож солино:

```
        @media (max-width:640px){
          .app-shell{padding:0;min-height:100dvh;min-height:100svh}
          .app-frame{
            max-width:100%;
            height:100dvh;height:100svh;
            border-radius:0;border:none;box-shadow:none;
            padding-top:env(safe-area-inset-top);
          }
          /* macOS цонхны 3 цэг нь утсан дээр notch-ны хэсэгт таарах бөгөөд утгагүй */
          .mac-dots{display:none}
          /* Доод nav болон чатны бичих мөр home indicator шугам дээр таарахгүй байх */
          .safe-bottom{margin-bottom:calc(16px + env(safe-area-inset-bottom))}
          .safe-bottom-pad{padding-bottom:env(safe-area-inset-bottom)}
        }
```

- [ ] **Step 2: macOS 3 цэгт класс өгөх**

`tovlorokh-khamtrakh.jsx:2137-2138` одоо ингэж байна:

```jsx
        {/* macOS traffic light — бүх дэлгэц дээр байнга зүүн дээд буланд */}
        <div className="absolute top-4 left-5 z-30 flex items-center gap-1.5 pointer-events-none">
```

Дараах болгож солино:

```jsx
        {/* macOS traffic light — зөвхөн desktop дээр (утсан дээр .mac-dots-оор нуугдана) */}
        <div className="mac-dots absolute top-4 left-5 z-30 flex items-center gap-1.5 pointer-events-none">
```

- [ ] **Step 3: Доод nav-д safe-area болон томруулсан хэмжээ өгөх**

`tovlorokh-khamtrakh.jsx:2185-2202` одоо ингэж байна:

```jsx
            {tab !== "chat" && (
              <nav className="flex justify-around items-center gap-1 py-2.5 px-3 mx-4 mb-4 rounded-full shrink-0"
                style={{ background: C.card, border: `1.5px solid ${C.line}`, boxShadow: "0 10px 24px rgba(92,74,58,.14)" }}>
                {nav.map(({ id, icon, label, c, c2 }) => {
                  const on = tab === id;
                  return (
                    <button key={id} onClick={() => setTab(id)}
                      className="flex flex-col items-center gap-1 px-1.5 py-1 rounded-2xl">
                      <span className="w-9 h-9 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: on ? `linear-gradient(155deg, ${c2 || c} 0%, ${c} 100%)` : C.cardIn,
                          boxShadow: on ? "0 3px 8px rgba(92,74,58,.22)" : "none",
                          transition: "background 220ms ease, box-shadow 220ms ease",
                        }}>
                        <img src={icon} alt="" className="w-full h-full object-cover" />
                      </span>
                      <span className="text-[9px] font-extrabold" style={{ color: on ? C.ink : C.inkSoft }}>{label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
```

Дараах болгож солино (`safe-bottom` класс, icon 36px→40px, дарагдах талбай 44px хүрэв, шошго 9px→10px):

```jsx
            {tab !== "chat" && (
              <nav className="safe-bottom flex justify-around items-center gap-1 py-2 px-3 mx-4 mb-4 rounded-full shrink-0"
                style={{ background: C.card, border: `1.5px solid ${C.line}`, boxShadow: "0 10px 24px rgba(92,74,58,.14)" }}>
                {nav.map(({ id, icon, label, c, c2 }) => {
                  const on = tab === id;
                  return (
                    <button key={id} onClick={() => go(id)}
                      className="flex flex-col items-center justify-center gap-1 px-1.5 py-1.5 rounded-2xl min-h-[44px]">
                      <span className="w-10 h-10 rounded-2xl flex items-center justify-center overflow-hidden"
                        style={{
                          background: on ? `linear-gradient(155deg, ${c2 || c} 0%, ${c} 100%)` : C.cardIn,
                          boxShadow: on ? "0 3px 8px rgba(92,74,58,.22)" : "none",
                          transition: "background 220ms ease, box-shadow 220ms ease",
                        }}>
                        <img src={icon} alt="" className="w-full h-full object-cover" />
                      </span>
                      <span className="text-[10px] font-extrabold leading-none" style={{ color: on ? C.ink : C.inkSoft }}>{label}</span>
                    </button>
                  );
                })}
              </nav>
            )}
```

**ЧУХАЛ:** дээрх код `go(id)`-г дуудаж байгаа. `go` функц Task 6-д нэмэгдэнэ. Энэ таскийг дангаар нь гүйцэтгэж байгаа бол `go(id)`-г **`setTab(id)`** гэж үлдээгээд Task 6 дээр солино.

- [ ] **Step 4: Чатны бичих мөрд доод safe-area өгөх**

`tovlorokh-khamtrakh.jsx:1202` одоо ингэж байна:

```jsx
      <div className="flex gap-2 items-center pb-1">
```

Дараах болгож солино:

```jsx
      <div className="safe-bottom-pad flex gap-2 items-center pb-1">
```

- [ ] **Step 5: Build шалгах**

Ажиллуулах: `npm run build`
Хүлээгдэх үр дүн: алдаагүй дуусах.

- [ ] **Step 6: Commit**

```bash
git add tovlorokh-khamtrakh.jsx
git commit -m "feat: safe-area зай, доод nav-ыг томсгож, macOS цэгүүдийг утсан дээр нуув"
```

**Гараар шалгах (iPhone, standalone):** толгойн хэсэг Dynamic Island-ын доор бүрэн харагдах; доод nav home indicator шугам дээр таарахгүй байх; macOS 3 цэг харагдахгүй байх; nav товч дарахад хялбар болсон эсэх.

---

### Task 3: Input-ууд 16px болгож zoom-ыг зогсоох

iOS Safari нь фокустай `<input>`-ын `font-size` 16px-ээс жижиг бол албаар zoom хийж, буцаад жижгэрдэггүй. Одоогийн бүх текст талбар 13-14px байна.

**Files:**
- Modify: `tovlorokh-khamtrakh.jsx:574-577` (жагсаалт нэмэх)
- Modify: `tovlorokh-khamtrakh.jsx:1224-1227` (чат)
- Modify: `tovlorokh-khamtrakh.jsx:1410-1417` (нууц үг солих, 2 талбар)
- Modify: `tovlorokh-khamtrakh.jsx:1643-1646` (нэвтрэх)

**Interfaces:**
- Consumes: юу ч үгүй
- Produces: юу ч үгүй

- [ ] **Step 1: Жагсаалтын талбар**

`tovlorokh-khamtrakh.jsx:574-577` одоо ингэж байна:

```jsx
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Юу хийх вэ?"
              className="flex-1 rounded-full px-5 py-2.5 text-[14px] font-medium outline-none"
              style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
```

Дараах болгож солино:

```jsx
            <input value={text} onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()} placeholder="Юу хийх вэ?"
              enterKeyHint="done" autoCapitalize="sentences" autoCorrect="off"
              className="flex-1 rounded-full px-5 py-2.5 text-[16px] font-medium outline-none"
              style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
```

- [ ] **Step 2: Чатны талбар**

`tovlorokh-khamtrakh.jsx:1224-1227` одоо ингэж байна:

```jsx
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="Мессеж бичих..."
          className="flex-1 min-w-0 rounded-full px-4 py-2.5 text-[13.5px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
```

Дараах болгож солино:

```jsx
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="Мессеж бичих..."
          enterKeyHint="send" autoCapitalize="sentences" autoCorrect="off"
          className="flex-1 min-w-0 rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
```

- [ ] **Step 3: Нууц үг солих 2 талбар**

`tovlorokh-khamtrakh.jsx:1410-1417` одоо ингэж байна:

```jsx
        <input type="password" value={cur} onChange={(e) => { setCur(e.target.value); setMsg(null); }}
          placeholder="Одоогийн нууц үг"
          className="w-full rounded-full px-4 py-2.5 text-[13px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
        <input type="password" value={next} onChange={(e) => { setNext(e.target.value); setMsg(null); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Шинэ нууц үг"
          className="w-full rounded-full px-4 py-2.5 text-[13px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
```

Дараах болгож солино:

```jsx
        <input type="password" value={cur} onChange={(e) => { setCur(e.target.value); setMsg(null); }}
          placeholder="Одоогийн нууц үг"
          autoComplete="current-password" enterKeyHint="next"
          className="w-full rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
        <input type="password" value={next} onChange={(e) => { setNext(e.target.value); setMsg(null); }}
          onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Шинэ нууц үг"
          autoComplete="new-password" enterKeyHint="done"
          className="w-full rounded-full px-4 py-2.5 text-[16px] font-medium outline-none"
          style={{ background: C.card, border: `1.8px solid ${C.line2}`, color: C.ink }} />
```

- [ ] **Step 4: Нэвтрэх талбар**

`tovlorokh-khamtrakh.jsx:1643-1646` одоо ингэж байна:

```jsx
      <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Нууц үг" disabled={!pick} autoFocus
        className="w-full max-w-[240px] rounded-full px-4 py-2.5 text-[13.5px] font-medium text-center outline-none mb-1 disabled:opacity-40"
        style={{ background: C.card, border: `1.8px solid ${error ? C.peachDeep : C.line2}`, color: C.ink }} />
```

Дараах болгож солино:

```jsx
      <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }}
        onKeyDown={(e) => e.key === "Enter" && submit()} placeholder="Нууц үг" disabled={!pick} autoFocus
        autoComplete="current-password" enterKeyHint="go"
        className="w-full max-w-[240px] rounded-full px-4 py-2.5 text-[16px] font-medium text-center outline-none mb-1 disabled:opacity-40"
        style={{ background: C.card, border: `1.8px solid ${error ? C.peachDeep : C.line2}`, color: C.ink }} />
```

- [ ] **Step 5: Үлдсэн текст талбар байхгүйг баталгаажуулах**

Ажиллуулах:

```bash
awk 'length($0)<400 {printf "%d: %s\n", FNR, $0}' tovlorokh-khamtrakh.jsx | grep -E "<input|<textarea" | grep -v 'type="file"' | grep -v 'type="range"'
```

Хүлээгдэх үр дүн: гарсан мөр бүр `text-[16px]` агуулсан байх. Хэрэв 16px-ээс жижиг талбар үлдсэн бол түүнийг мөн адил засах.

- [ ] **Step 6: Build шалгах**

Ажиллуулах: `npm run build`
Хүлээгдэх үр дүн: алдаагүй дуусах.

- [ ] **Step 7: Commit**

```bash
git add tovlorokh-khamtrakh.jsx
git commit -m "fix: бичих талбаруудыг 16px болгож iOS-ын албадан zoom-ыг зогсоов"
```

**Гараар шалгах (iPhone):** чат, жагсаалт, нэвтрэх, нууц үг солих талбар тус бүр дээр дарахад дэлгэц ойртохгүй байх; гарын баруун доод товч "Илгээх"/"Болсон" гэж зөв гарч ирэх.

---

### Task 4: Гар гарахад layout тохируулах (`useKeyboardInset`)

iOS дээр гар нээгдэхэд layout viewport өөрчлөгддөггүй тул чатны бичих мөр гарын доор дарагддаг. `visualViewport` API-аар гарын өндрийг хэмжиж frame-ийн өндрийг багасгана.

**Files:**
- Create: `src/hooks/useKeyboardInset.js`
- Modify: `tovlorokh-khamtrakh.jsx:1` (import)
- Modify: `tovlorokh-khamtrakh.jsx` (App дотор hook дуудах)
- Modify: `tovlorokh-khamtrakh.jsx:2124-2127` (mobile media query — Task 2-т засагдсан блок)
- Modify: `tovlorokh-khamtrakh.jsx:1017-1041` (ChatScreen — фокус дээр доош гулсах)

**Interfaces:**
- Consumes: `--kb-inset` хувьсагчийн анхны утга `src/ios.css`-ээс (Task 1)
- Produces: `useKeyboardInset(): void` — параметргүй, буцаах утгагүй. `document.documentElement.style`-д `--kb-inset` бичнэ.

- [ ] **Step 1: `src/hooks/useKeyboardInset.js` үүсгэх**

```js
import { useEffect } from "react";

/* iOS дээр гар нээгдэхэд layout viewport өөрчлөгддөггүй тул агуулга гарын доор
   дарагддаг. visualViewport-оос гарын эзэлж буй өндрийг хэмжиж --kb-inset
   хувьсагчид бичнэ; CSS түүнийг ашиглаж frame-ийн өндрийг багасгана.

   Дэмжигдээгүй хөтөч дээр юу ч хийхгүй — --kb-inset нь 0px хэвээр үлдэнэ. */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const root = document.documentElement;

    const apply = () => {
      /* vv.offsetTop нь хуудас дээшээ гулссан хэмжээ — түүнийг хасахгүй бол
         гар нээгдэх агшинд өндөр давхар тоологдоно. */
      const hidden = window.innerHeight - vv.height - vv.offsetTop;
      /* 40px-ээс бага зөрүүг гар гэж үзэхгүй — Safari-гийн хаягийн мөр
         агшиж тэлэхэд ч мөн адил зөрүү гардаг. */
      const kb = hidden > 40 ? Math.round(hidden) : 0;
      root.style.setProperty("--kb-inset", `${kb}px`);
    };

    apply();
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);

    return () => {
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
      root.style.setProperty("--kb-inset", "0px");
    };
  }, []);
}
```

- [ ] **Step 2: Import нэмэх**

`tovlorokh-khamtrakh.jsx:8` мөрийн дараа (`./src/push.js` импортын дараа) дараах мөрийг нэмнэ:

```jsx
import { useKeyboardInset } from "./src/hooks/useKeyboardInset.js";
```

- [ ] **Step 3: App дотор hook дуудах**

`tovlorokh-khamtrakh.jsx:1808` мөр одоо ингэж байна:

```jsx
  const [tab, setTab] = useState("home");
```

Мөрийн **дараа** дараахыг нэмнэ:

```jsx

  useKeyboardInset();
```

- [ ] **Step 4: Mobile media query-д `--kb-inset` ашиглах**

Task 2-т засагдсан `.app-frame` дүрмийн `height` мөрийг олно:

```
            height:100dvh;height:100svh;
```

Дараах болгож солино:

```
            height:calc(100dvh - var(--kb-inset));
            height:calc(100svh - var(--kb-inset));
            transition:height 180ms ease-out;
```

- [ ] **Step 5: Чатад фокус авахад сүүлийн мессеж рүү гулсах**

`tovlorokh-khamtrakh.jsx:1040` орчимд ChatScreen дотор доош гулсах туслах аль хэдийн байна:

```jsx
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
```

`tovlorokh-khamtrakh.jsx:1224` дээрх чатны `<input>`-д `onFocus` нэмнэ. Task 3-ын дараа тухайн элемент ингэж байна:

```jsx
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="Мессеж бичих..."
          enterKeyHint="send" autoCapitalize="sentences" autoCorrect="off"
```

Дараах болгож солино:

```jsx
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()} placeholder="Мессеж бичих..."
          onFocus={() => {
            /* гар нээгдэж frame агшсаны дараа гулсана */
            setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 300);
          }}
          enterKeyHint="send" autoCapitalize="sentences" autoCorrect="off"
```

- [ ] **Step 6: Build шалгах**

Ажиллуулах: `npm run build`
Хүлээгдэх үр дүн: алдаагүй дуусах.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useKeyboardInset.js tovlorokh-khamtrakh.jsx
git commit -m "feat: гар гарахад frame агшиж, чатны бичих мөр дарагдахаа болив"
```

**Гараар шалгах (iPhone, standalone):** чатад орж бичих талбар дээр дарахад бичих мөр гарын дээр бүрэн харагдах; сүүлийн мессеж рүү автоматаар гулсах; гар хаагдахад layout буцаж хэвийн болох.

---

### Task 5: Зүүн ирмэгээс шударч буцах (`useSwipeBack`)

iOS-д дэд дэлгэцээс буцахад зүүн ирмэгээс шударах нь хэвшсэн зан үйл. Standalone горимд Safari-гийн өөрийн ирмэгийн шударлага байхгүй тул зөрчилдөхгүй.

**Files:**
- Create: `src/hooks/useSwipeBack.js`
- Modify: `tovlorokh-khamtrakh.jsx` (import, App дотор ref + hook, агуулгын div-д ref)

**Interfaces:**
- Consumes: юу ч үгүй
- Produces: `useSwipeBack(ref, onBack, enabled): void`
  - `ref` — `React.RefObject<HTMLElement>`, гулсах элемент
  - `onBack` — `() => void`, шударлага амжилттай дууссан үед дуудагдана
  - `enabled` — `boolean`, `false` үед hook юу ч хийхгүй

- [ ] **Step 1: `src/hooks/useSwipeBack.js` үүсгэх**

```js
import { useEffect, useRef } from "react";

const EDGE = 24;              /* ирмэгээс хэдэн px дотор эхэлсэн шударлагыг барих вэ */
const DIRECTION_LOCK = 8;     /* чиглэл тодорхойлохын өмнө хэдэн px хүлээх вэ */
const COMMIT_RATIO = 0.4;     /* өргөний хэдэн хувийг давбал буцах вэ */
const COMMIT_VELOCITY = 0.5;  /* px/ms — үүнээс хурдан бол зайнаас үл хамааран буцна */

/* Зүүн ирмэгээс баруун тийш шударахад элементийг хуруу дагуулж гулсуулна.
   Хангалттай хол эсвэл хурдан бол onBack дуудагдана; эс бөгөөс байрандаа буцна.

   Босоо хөдөлгөөн давамгайлбал шударлагыг тэр дор нь орхино — эс бөгөөс
   ердийн scroll хийхэд саад болно. */
export function useSwipeBack(ref, onBack, enabled) {
  const backRef = useRef(onBack);
  backRef.current = onBack;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let startX = 0;
    let startY = 0;
    let startT = 0;
    let tracking = false;    /* ирмэгээс эхэлсэн үү */
    let horizontal = null;   /* null — чиглэл хараахан тодорхойгүй */

    const settle = (animate) => {
      el.style.transition = animate ? "transform 220ms ease-out" : "";
      el.style.transform = "";
      tracking = false;
      horizontal = null;
    };

    const onDown = (e) => {
      if (e.pointerType === "mouse") return;
      if (e.clientX > EDGE) return;
      startX = e.clientX;
      startY = e.clientY;
      startT = e.timeStamp;
      tracking = true;
      horizontal = null;
      el.style.transition = "";
    };

    const onMove = (e) => {
      if (!tracking) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      if (horizontal === null) {
        if (Math.abs(dx) < DIRECTION_LOCK && Math.abs(dy) < DIRECTION_LOCK) return;
        horizontal = Math.abs(dx) > Math.abs(dy);
        if (!horizontal) { tracking = false; return; }
      }

      /* Зөвхөн баруун тийш чирэхийг зөвшөөрнө */
      el.style.transform = dx > 0 ? `translateX(${dx}px)` : "";
    };

    const onUp = (e) => {
      if (!tracking || !horizontal) { settle(false); return; }
      const dx = e.clientX - startX;
      const dt = Math.max(1, e.timeStamp - startT);
      const passed = dx > el.clientWidth * COMMIT_RATIO || dx / dt > COMMIT_VELOCITY;
      settle(true);
      if (passed) backRef.current();
    };

    const onCancel = () => settle(true);

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onCancel);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onCancel);
      settle(false);
    };
  }, [ref, enabled]);
}
```

- [ ] **Step 2: Import нэмэх**

Task 4-т нэмсэн импортын дараа дараах мөрийг нэмнэ:

```jsx
import { useSwipeBack } from "./src/hooks/useSwipeBack.js";
```

- [ ] **Step 3: App дотор ref үүсгэж hook дуудах**

Task 4-т нэмсэн `useKeyboardInset();` мөрийн **дараа** дараахыг нэмнэ:

```jsx
  const screenRef = useRef(null);
  useSwipeBack(screenRef, () => go("home"), tab !== "home");
```

**ЧУХАЛ:** `go` функц Task 6-д нэмэгдэнэ. Энэ таскийг дангаар нь гүйцэтгэж байгаа бол `go("home")`-г **`setTab("home")`** гэж бичээд Task 6 дээр солино.

- [ ] **Step 4: Агуулгын div-д ref холбох**

`tovlorokh-khamtrakh.jsx:2171` одоо ингэж байна:

```jsx
            <div className={`flex-1 px-5 pt-7 min-h-0 flex flex-col ${tab === "chat" ? "pb-3" : "pb-4 overflow-y-auto overscroll-contain"}`}>
```

Дараах болгож солино:

```jsx
            <div ref={screenRef}
              className={`flex-1 px-5 pt-7 min-h-0 flex flex-col ${tab === "chat" ? "pb-3" : "pb-4 overflow-y-auto overscroll-contain"}`}>
```

- [ ] **Step 5: Build шалгах**

Ажиллуулах: `npm run build`
Хүлээгдэх үр дүн: алдаагүй дуусах.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useSwipeBack.js tovlorokh-khamtrakh.jsx
git commit -m "feat: зүүн ирмэгээс шударч нүүр рүү буцах"
```

**Гараар шалгах (iPhone, standalone):** ус/жагсаалт/чат дэлгэц дээр зүүн ирмэгээс баруун тийш шударахад дэлгэц хуруу дагаж гулсах, талаас нь хэтрэхэд нүүр рүү буцах; хагас замаас суллахад байрандаа буцах; нүүр дэлгэц дээр шударахад юу ч болохгүй байх; ердийн дээш/доош scroll саадгүй ажиллах.

---

### Task 6: Чиглэлтэй дэлгэцийн шилжилт

Одоогийн `.scr` нь бүх шилжилтэд ижил fade-up хийдэг. iOS шиг чиглэл мэдрүүлэхийн тулд нүүрээс дэд рүү орохад баруунаас, буцахад зүүнээс гулсуулна.

**Files:**
- Modify: `tovlorokh-khamtrakh.jsx:2098` (`fadeUp` keyframe)
- Modify: `tovlorokh-khamtrakh.jsx:2110-2111` (`.scr` ба reduced-motion)
- Modify: `tovlorokh-khamtrakh.jsx:1808` орчим (`go` функц)
- Modify: `tovlorokh-khamtrakh.jsx:2015` (мэдэгдэл дээр дарах)
- Modify: `tovlorokh-khamtrakh.jsx:2172-2180` (дэлгэцүүдийн `onBack`, `go` prop)
- Modify: `tovlorokh-khamtrakh.jsx:2190` (nav товч)

**Interfaces:**
- Consumes: `screenRef` (Task 5)
- Produces: `go(next: string): void` — таб солихдоо шилжилтийн чиглэлийг мөн тохируулна. `setTab`-ын оронд **бүх газар** үүнийг ашиглана.

- [ ] **Step 1: Keyframe-үүд нэмэх**

`tovlorokh-khamtrakh.jsx:2098` одоо ингэж байна:

```
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
```

Дараах болгож солино (`fadeUp` нь өөр газар ашиглагдаж болзошгүй тул үлдээнэ):

```
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes slideIn { from{opacity:0;transform:translateX(26px)} to{opacity:1;transform:none} }
        @keyframes slideBack { from{opacity:0;transform:translateX(-26px)} to{opacity:1;transform:none} }
```

- [ ] **Step 2: `.scr` класс болон reduced-motion шинэчлэх**

`tovlorokh-khamtrakh.jsx:2110-2111` одоо ингэж байна:

```
        .scr{animation:fadeUp 320ms ease-out}
        @media (prefers-reduced-motion: reduce){ .wv-a,.wv-b,.bub,.dropL,.dropR,.puddle,.leakL,.leakR,.puddleBreathe,.scr{animation:none} }
```

Дараах болгож солино:

```
        .scr-in{animation:slideIn 280ms cubic-bezier(.32,.72,0,1)}
        .scr-back{animation:slideBack 280ms cubic-bezier(.32,.72,0,1)}
        @media (prefers-reduced-motion: reduce){ .wv-a,.wv-b,.bub,.dropL,.dropR,.puddle,.leakL,.leakR,.puddleBreathe,.scr-in,.scr-back{animation:none} }
```

- [ ] **Step 3: `go` функц нэмэх**

`tovlorokh-khamtrakh.jsx:1808` одоо ингэж байна:

```jsx
  const [tab, setTab] = useState("home");
```

Дараах болгож солино (Task 4, Task 5-ын мөрүүд аль хэдийн доор нь байгаа бол тэдгээрийн өмнө байрлана):

```jsx
  const [tab, setTab] = useState("home");
  const [navDir, setNavDir] = useState("in");

  /* Таб солихдоо шилжилтийн чиглэлийг мөн тогтооно:
     нүүр рүү буцах нь "back", бусад нь "in". setTab-ын оронд үүнийг ашиглана. */
  const go = (next) => {
    setNavDir(next === "home" ? "back" : "in");
    setTab(next);
  };
```

- [ ] **Step 4: Шилжилтийн классыг хэрэглэх**

`tovlorokh-khamtrakh.jsx:2172` одоо ингэж байна:

```jsx
              <div key={tab} className={`scr ${tab === "chat" ? "flex-1 flex flex-col min-h-0" : ""}`}>
```

Дараах болгож солино:

```jsx
              <div key={tab} className={`${navDir === "back" ? "scr-back" : "scr-in"} ${tab === "chat" ? "flex-1 flex flex-col min-h-0" : ""}`}>
```

- [ ] **Step 5: Бүх `setTab` дуудлагыг `go` болгох**

Дараах мөрүүдийг засна:

`tovlorokh-khamtrakh.jsx:2015`:

```jsx
      if (type === "NOTIFICATION_CLICK" && target) setTab(target);
```

→

```jsx
      if (type === "NOTIFICATION_CLICK" && target) go(target);
```

`tovlorokh-khamtrakh.jsx:2173` дээрх HomeScreen-ийн `go` prop аль хэдийн `go={setTab}` байна:

```jsx
                {tab === "home" && <HomeScreen go={setTab} {...{ ml, goal, ...
```

→

```jsx
                {tab === "home" && <HomeScreen go={go} {...{ ml, goal, ...
```

`tovlorokh-khamtrakh.jsx:2174-2180` дээрх 7 дэлгэцийн `onBack={() => setTab("home")}` бүрийг `onBack={() => go("home")}` болгоно. Ажиллуулах:

```bash
sed -i 's/onBack={() => setTab("home")}/onBack={() => go("home")}/g' tovlorokh-khamtrakh.jsx
```

`tovlorokh-khamtrakh.jsx:2190` (Task 2-т засагдсан nav товч) — хэрэв `setTab(id)` хэвээр байвал `go(id)` болгоно.

- [ ] **Step 6: `setTab`-ын үлдэгдэл дуудлага байхгүйг баталгаажуулах**

Ажиллуулах:

```bash
grep -n "setTab(" tovlorokh-khamtrakh.jsx
```

Хүлээгдэх үр дүн: зөвхөн `go` функцийн дотор байгаа нэг дуудлага гарах. Өөр газар байвал `go(` болгож солино.

- [ ] **Step 7: `scr` класс үлдээгүйг баталгаажуулах**

Ажиллуулах:

```bash
grep -n '"scr \|`scr \|\.scr{' tovlorokh-khamtrakh.jsx
```

Хүлээгдэх үр дүн: юу ч гарахгүй.

- [ ] **Step 8: Build шалгах**

Ажиллуулах: `npm run build`
Хүлээгдэх үр дүн: алдаагүй дуусах.

- [ ] **Step 9: Commit**

```bash
git add tovlorokh-khamtrakh.jsx
git commit -m "feat: дэлгэц солигдоход чиглэлтэй гулсах шилжилт"
```

**Гараар шалгах (iPhone):** нүүрээс дэд дэлгэц рүү орход баруунаас гулсаж орох; буцахад зүүнээс гулсаж орох; мэдэгдэл дээр дарж орсон таб мөн зөв шилжих.

---

### Task 7: Доош татаж шинэчлэх (`usePullToRefresh`)

Task 1-д хөтчийн өөрийн pull-to-refresh хаагдсан. Оронд нь өөрийн хувилбарыг тавина.

Хамтрагчийн өгөгдөл `onSnapshot`-оор бодит цагт ирдэг тул ердийн үед татах зүйлгүй. Гэвч iOS дээр PWA удаан дэвсгэрт байгаад буцаж ирэхэд listener үхсэн хэвээр үлддэг. Тиймээс refresh нь: (1) `getDoc`-оор хамтрагчийн бүртгэлийг албадан татах, (2) service worker-ын шинэчлэл шалгах.

**Files:**
- Create: `src/hooks/usePullToRefresh.js`
- Modify: `tovlorokh-khamtrakh.jsx:6` (`getDoc` импорт нэмэх)
- Modify: `tovlorokh-khamtrakh.jsx` (import, App дотор hook + indicator)

**Interfaces:**
- Consumes: `screenRef` (Task 5), `partnerKey`, `setPartnerStats` (App-д аль хэдийн байгаа)
- Produces: `usePullToRefresh(ref, onRefresh, enabled): { pull: number, refreshing: boolean }`
  - `ref` — `React.RefObject<HTMLElement>`, гүйдэг элемент
  - `onRefresh` — `() => Promise<void>` буюу `() => void`
  - `enabled` — `boolean`
  - `pull` — одоогийн татсан зай px-ээр (0..110)
  - `refreshing` — `onRefresh` ажиллаж байгаа эсэх

- [ ] **Step 1: `src/hooks/usePullToRefresh.js` үүсгэх**

```js
import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70;   /* энэ зайнаас хэтэрч суллавал шинэчилнэ */
const MAX = 110;        /* хамгийн их татагдах зай */
const RESISTANCE = 0.5; /* хурууны хөдөлгөөний хэдэн хувь нь татагдах вэ */

/* Гүйдэг элемент хамгийн дээд цэгтээ байхад доош татах хөдөлгөөнийг барина.
   THRESHOLD-оос хэтэрч суллавал onRefresh дуудагдана; эс бөгөөс байрандаа буцна.

   onRefresh алдаа өгвөл indicator хаагдаж, одоогийн өгөгдөл хэвээр үлдэнэ. */
export function usePullToRefresh(ref, onRefresh, enabled) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const cbRef = useRef(onRefresh);
  cbRef.current = onRefresh;

  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled) return;

    let startY = 0;
    let tracking = false;
    let active = false;   /* доош чирэх нь эхэлсэн үү */
    let distance = 0;
    let cancelled = false;

    const onDown = (e) => {
      if (e.pointerType === "mouse") return;
      if (el.scrollTop > 0) return;
      startY = e.clientY;
      tracking = true;
      active = false;
      distance = 0;
    };

    const onMove = (e) => {
      if (!tracking) return;
      const dy = e.clientY - startY;

      /* дээш чирэх эсвэл аль хэдийн гүйсэн бол орхино */
      if (dy <= 0 || el.scrollTop > 0) {
        if (active) { active = false; distance = 0; setPull(0); }
        tracking = false;
        return;
      }

      active = true;
      distance = Math.min(MAX, dy * RESISTANCE);
      setPull(distance);
    };

    const finish = async () => {
      if (!tracking) return;
      tracking = false;
      const passed = active && distance >= THRESHOLD;
      setPull(0);
      distance = 0;
      active = false;
      if (!passed) return;

      setRefreshing(true);
      try {
        await cbRef.current();
      } catch {
        /* алдаа гарсан ч indicator хаагдана — хоосон дэлгэц гаргахгүй */
      } finally {
        if (!cancelled) setRefreshing(false);
      }
    };

    const onCancel = () => {
      tracking = false;
      active = false;
      distance = 0;
      setPull(0);
    };

    el.addEventListener("pointerdown", onDown, { passive: true });
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerup", finish);
    el.addEventListener("pointercancel", onCancel);

    return () => {
      cancelled = true;
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", finish);
      el.removeEventListener("pointercancel", onCancel);
      setPull(0);
    };
  }, [ref, enabled]);

  return { pull, refreshing };
}
```

- [ ] **Step 2: `getDoc`-ыг Firestore импортод нэмэх**

`tovlorokh-khamtrakh.jsx:6` одоо ингэж байна:

```jsx
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, arrayUnion } from "firebase/firestore";
```

Дараах болгож солино (`getDoc` нэмэгдэв):

```jsx
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, collection, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, onSnapshot, query, orderBy, limit, serverTimestamp, arrayUnion } from "firebase/firestore";
```

- [ ] **Step 3: Hook импорт нэмэх**

Task 5-д нэмсэн импортын дараа:

```jsx
import { usePullToRefresh } from "./src/hooks/usePullToRefresh.js";
```

- [ ] **Step 4: App дотор refresh логик нэмэх**

Task 5-д нэмсэн `useSwipeBack(...)` мөрийн **дараа** нэмнэ. `partnerKey` нь `tovlorokh-khamtrakh.jsx:1853` орчимд тодорхойлогддог тул энэ блокийг **түүний дараа** байрлуулна — өөрөөр хэлбэл `const partnerKey = ...` мөрийн доор:

```jsx

  /* Хамтрагчийн өгөгдөл onSnapshot-оор бодит цагт ирдэг ч, iOS дээр PWA удаан
     дэвсгэрт байгаад буцаж ирэхэд listener үхсэн хэвээр үлддэг. Доош татахад
     албадан дахин уншиж, зэрэг шинэ хувилбар байгаа эсэхийг шалгана. */
  const refreshAll = async () => {
    if (partnerKey) {
      try {
        const snap = await getDoc(doc(db, "rooms", CHAT_ROOM, "stats", partnerKey));
        setPartnerStats(snap.exists() ? snap.data() : null);
      } catch {}
    }
    try {
      const reg = await navigator.serviceWorker?.getRegistration();
      await reg?.update();
    } catch {}
  };

  const { pull, refreshing } = usePullToRefresh(screenRef, refreshAll, tab !== "chat");
```

**ЧУХАЛ:** `screenRef` нь `useSwipeBack`-ийн хамт дээр тодорхойлогдсон байх ёстой. Хэрэв `const partnerKey = ...` мөр `screenRef`-ээс дээр байвал `screenRef`-ийн тодорхойлолтыг мөн энэ блокийн дээр зөөнө.

- [ ] **Step 5: Indicator харуулах**

`tovlorokh-khamtrakh.jsx:2171` (Task 5-д `ref` нэмэгдсэн) блокийн **дотор**, хамгийн эхний хүүхэд болгож дараахыг нэмнэ:

```jsx
              {(pull > 0 || refreshing) && (
                <div className="flex items-center justify-center pointer-events-none shrink-0 overflow-hidden"
                  style={{
                    height: refreshing ? 34 : pull,
                    opacity: refreshing ? 1 : Math.min(1, pull / 70),
                    transition: refreshing ? "height 180ms ease-out" : "none",
                  }}>
                  <RefreshCw size={16} strokeWidth={2.6}
                    style={{
                      color: C.inkSoft,
                      transform: `rotate(${refreshing ? 0 : pull * 3}deg)`,
                      animation: refreshing ? "spin 800ms linear infinite" : "none",
                    }} />
                </div>
              )}
```

`RefreshCw` нь `tovlorokh-khamtrakh.jsx:2` дээр аль хэдийн импортлогдсон — нэмэх шаардлагагүй.

- [ ] **Step 6: `spin` keyframe нэмэх**

Task 6-д нэмсэн `slideBack` keyframe-ийн дараа нэмнэ:

```
        @keyframes spin { to{transform:rotate(360deg)} }
```

- [ ] **Step 7: Build шалгах**

Ажиллуулах: `npm run build`
Хүлээгдэх үр дүн: алдаагүй дуусах.

- [ ] **Step 8: Commit**

```bash
git add src/hooks/usePullToRefresh.js tovlorokh-khamtrakh.jsx
git commit -m "feat: доош татаж хамтрагчийн мэдээлэл болон шинэчлэлт шалгах"
```

**Гараар шалгах (iPhone, standalone):** нүүр дэлгэц дээр дээд цэгээс доош татахад эргэлдэх icon гарах; суллахад богино эргэлдээд алга болох; хагасаас нь суллавал юу ч болохгүй байх; чат дээр татахад ажиллахгүй байх; дунд нь гүйж байхад санамсаргүй ажиллахгүй байх.

---

## Эцсийн баталгаажуулалт

- [ ] `npm run build` алдаагүй өнгөрөх
- [ ] `npm run dev -- --host` ажиллуулж, iPhone-оос локал IP-ээр нээж standalone горимд суулгаад дээрх 7 таскийн "Гараар шалгах" зүйл бүрийг давах
- [ ] `git log --oneline -8` — 7 commit цэвэрхэн байрласан эсэх
