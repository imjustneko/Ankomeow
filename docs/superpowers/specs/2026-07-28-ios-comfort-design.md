# iPhone дээрх хэрэглэхүйг сайжруулах — дизайн

Огноо: 2026-07-28

## Зорилго

Ankomeow PWA-г iPhone-ы нүүр дэлгэцэд суулгасан (standalone) горимд жинхэнэ
native апп шиг тухтай болгох. Дизайны ерөнхий аяс хэвээр үлдэнэ; зөвхөн
хэрэглэхүйд шууд саад болж буй зүйлсийг засаад, iOS-ын хэвшсэн 3 зан үйлийг
нэмнэ.

## Хамрах хүрээ

Гол горим нь **standalone** (Add to Home Screen). Safari дотор нээсэн үед ч
эвдрэхгүй байх ёстой, гэхдээ Safari-д зориулсан тусгай тохируулга хийхгүй.

Хамрахгүй зүйлс:
- `tovlorokh-khamtrakh.jsx`-ийг дэлгэц тус бүрээр задлах refactor
- Тab bar болон дэлгэцийн бүтцийн дахин зохион байгуулалт
- Android/desktop-д зориулсан шинэ зан үйл

## Архитектур

Одоогийн код нэг том файлд (`tovlorokh-khamtrakh.jsx`, 2211 мөр) төвлөрсөн.
iOS-ын логикийг тэр файл руу хийхгүй, тусад нь салгана:

| Нэгж | Үүрэг | Хамаарал |
|---|---|---|
| `src/ios.css` | Глобал iOS CSS давхрага: overscroll, tap highlight, callout, touch-action | Байхгүй |
| `src/hooks/useKeyboardInset.js` | `visualViewport`-оос гарын өндрийг тооцож CSS хувьсагч болгож гаргана | Browser API |
| `src/hooks/useSwipeBack.js` | Зүүн ирмэгийн шударлагыг барьж буцах callback дуудна | Browser API |
| `src/hooks/usePullToRefresh.js` | Scroll дээд цэгээс доош татах хөдөлгөөнийг барьж refresh callback дуудна | Browser API |

Hook бүр цэвэр функц: DOM ref болон callback авч, идэвхжүүлэх/цуцлах logic-оо
өөртөө хадгална. `tovlorokh-khamtrakh.jsx` дотор зөвхөн дуудалт нэмэгдэнэ.

Safe-area болон компонентын хэмжээний засварууд нь `tovlorokh-khamtrakh.jsx`
дотрох одоогийн inline `<style>` блок болон JSX-д шууд орно — тэдгээр нь тухайн
layout-д уягдсан тул салгах утгагүй.

`src/ios.css`-ийг `src/main.jsx`-д `src/index.css`-ийн дараа импортлоно.

## 1. Safe-area ба байрлал

`index.html`-д `viewport-fit=cover` аль хэдийн байгаа тул `env(safe-area-inset-*)`
утга өгнө. Одоогийн кодод хаана ч ашиглаагүй.

- Гар утасны media query (`max-width:640px`) дотор `.app-frame`-д
  `padding-top: env(safe-area-inset-top)` нэмнэ.
- Доод nav-ын `mb-4` → `margin-bottom: calc(16px + env(safe-area-inset-bottom))`.
- Чатны композер мөн доод inset нэмнэ.
- macOS-ын 3 цэгийн чимэглэлийг `max-width:640px` дээр `display:none` болгоно.
- Nav товчны icon 36px → 40px, дарагдах талбай 44px хүрнэ, шошго
  `text-[9px]` → `text-[10px]`.

`apple-mobile-web-app-status-bar-style` нь `default` хэвээр. `black-translucent`
руу шилжвэл давхар зай тооцох эрсдэл гарна.

## 2. Бичих туршлага

iOS Safari нь фокустай input-ын `font-size` 16px-ээс жижиг бол албаар zoom хийж,
буцаад жижгэрдэггүй.

- Бүх `<input>` / `<textarea>`-ийн font-size 16px болно. Одоогийн утгууд:
  чат `13.5px`, жагсаалт `14px`, нууц үг болон бусад мөн 16px-ээс доош.
- `maximum-scale=1` ашиглахгүй — accessibility-г эвддэг.
- `useKeyboardInset`: `visualViewport`-ын `resize`/`scroll` event-ийг сонсож
  `window.innerHeight - visualViewport.height` -ийг `--kb-inset` CSS хувьсагчид
  бичнэ. Чатны хэсэг үүнийг доод padding болгож ашиглана. Гар нээгдэхэд сүүлийн
  мессеж рүү автоматаар гулсана.
- Атрибутууд: нууц үг талбарт `autocomplete="current-password"`, чат болон
  жагсаалтын талбарт `enterkeyhint="send"` / `"done"`,
  `autocapitalize="sentences"`, тоон талбарт `inputmode="numeric"`.

## 3. Хүрэлт ба хөдөлгөөн (`src/ios.css`)

```
html, body        → overscroll-behavior: none
*                 → -webkit-tap-highlight-color: transparent
button, img, nav  → -webkit-touch-callout: none; user-select: none;
                    -webkit-user-drag: none
button, a         → touch-action: manipulation
```

Чатны мессежийн текст дээр `user-select: text` -ийг тодорхой үлдээнэ — хэрэглэгч
хуулж авах шаардлагатай.

## 4. Гурван нэмэлт зан үйл

### Зүүн ирмэгээс шударч буцах (`useSwipeBack`)

- Зөвхөн дэд дэлгэц дээр идэвхжинэ (`tab !== "home"`).
- Шударлага зүүн ирмэгийн 24px-ийн дотроос эхэлсэн байх ёстой.
- Standalone горимд Safari-гийн өөрийн ирмэгийн шударлага байхгүй тул зөрчилдөхгүй.
  Safari дотор нээсэн үед хоёулаа ажиллаж магадгүй — энэ нь standalone-д тулгуурласан
  зорилготой тул хүлээн зөвшөөрөгдөх зөрчил.
- Хэвтээ зөрөө нь босоогоос давсан үед л барина (эс бөгөөс scroll-д саад болно).
- Хуруу дагаж дэлгэц баруун тийш гулсана. Дэлгэцийн 40%-иас хэтэрвэл эсвэл
  хурд өндөр байвал `home` руу буцна; үгүй бол буцаж байрандаа очно.

### Дэлгэц солигдох шилжилт

- Одоогийн `.scr` fade-ийг чиглэлтэй slide болгоно: нүүрээс дэд рүү орох үед
  баруунаас, буцах үед зүүнээс.
- Чиглэлийг `home → дэд` эсвэл `дэд → home` гэдгээр тодорхойлно.
- `prefers-reduced-motion: reduce` дээр одоогийнх шиг унтарна.

### Доош татаж шинэчлэх (`usePullToRefresh`)

- Гол scroll контейнер `scrollTop === 0` үед доош татах хөдөлгөөнийг барина.
- 70px-ээс хэтэрвэл суллахад refresh дуудагдана; түүнээс бага бол буцна.
- Refresh нь Firestore-оос хамтрагчийн өгөгдөл болон өөрийн статистикийг дахин
  уншина.
- Чатны дэлгэц дээр идэвхгүй (тэнд дээшээ scroll хийх нь хуучин мессеж ачаалах
  утгатай).

## Алдаа боловсруулалт

- `visualViewport` дэмжигдээгүй бол `useKeyboardInset` юу ч хийхгүй, `--kb-inset`
  нь `0px` хэвээр үлдэнэ.
- Шударлага/татах hook-ууд `pointerdown`-оос эхэлж, `pointercancel` дээр төлвөө
  бүрэн цэвэрлэнэ — таслагдсан хөдөлгөөн дэлгэцийг хагас гулссан байдалд
  орхихгүй.
- `usePullToRefresh`-ийн refresh алдаа өгвөл indicator хаагдаж, одоогийн
  өгөгдөл хэвээр үлдэнэ (хоосон дэлгэц гаргахгүй).

## Баталгаажуулалт

Төсөлд тест framework байхгүй, шинээр нэмэхгүй. Баталгаажуулалт:

1. `npm run build` алдаагүй өнгөрөх.
2. `npm run dev`-ийг сүлжээнд нээж бодит iPhone дээр standalone горимд шалгах:
   - толгой болон доод nav safe-area-д таарсан эсэх
   - input дээр дарахад zoom хийхгүй эсэх
   - гар гарахад чатны бичих мөр харагдаж байгаа эсэх
   - дэлгэц дүүжлэгдэхгүй, урт дарахад цэс гарахгүй эсэх
   - зүүн ирмэгээс шударахад буцаж байгаа эсэх
   - доош татахад шинэчлэгдэж байгаа эсэх

Хэсэг бүр тусдаа commit болно.
