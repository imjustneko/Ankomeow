# Chibi хамтрагч — дизайн (2026-07-28)

## Зорилго

Апп дотор хосын chibi дүр байнга алхаж явна. Neko-гийн дэлгэц дээр Andela, Andela-гийн дэлгэц дээр Neko. Товшиход тухайн үедээ хийж байсан үйлдлээ зогсоож, ичингүйрэн инээмсэглэнэ. Чирч зөөж болно, хааяа өөрөө сууж/унтаж/даллаж хөөрхөн үйлдэл хийнэ. Товшилт нь хосод Firestore болон push мэдэгдлээр очиж, тэдний дэлгэц дээрх chibi баярлана.

## Архитектур

Монолит `tovlorokh-khamtrakh.jsx`-д зөвхөн 2 мөр нэмнэ: `ChibiPet`-ийн import, болон `app-frame` дотор нэг render мөр. Үлдсэн бүх код шинэ модульд:

```
src/chibi/
  ChibiPet.jsx      React компонент — overlay давхарга, sprite render, tap/drag хүлээн авагч
  useChibiBrain.js  hook — төлөвийн машин + rAF байрлалын цикл (DOM/Firebase мэдэхгүй)
  sprites.js        sprite зам, торны offset, төлөв→нүд буулгалт (нэг эх сурвалж)
  poke.js           Firestore бичих/сонсох + push дуудалт, throttle
public/chibi/
  andela.png, neko.png   (1024×1024, ил тод дэвсгэр, 3×3 тор)
```

### Хариуцлагын хуваарь

- `useChibiBrain(opts)` → `{ x, facing, state, onPoke, onDragStart, onDragMove, onDragEnd }`. Цэвэр төлөв буцаана, зураг эсвэл сүлжээний талыг мэдэхгүй. Хугацааг props-оор өгч болдог тул тестлэхэд амархан.
- `ChibiPet` — brain-ийн төлөвийг sprite болгон зурж, pointer эвентийг ойлгоно.
- `poke.js` — `sendPoke(...)` / `subscribePokes(...)`. Chibi нь Firebase-ийн талаар юу ч мэдэхгүй.

### Байрлуулалт

`app-frame` (max-w-400px, `position: relative`) дотор `absolute inset-0`, `z-25` — дэлгэцийн агуулгаас дээгүүр, mac-dots (`z-30`) болон toast (`z-40`) -оос доогуур. Давхарга нь `pointer-events: none`, зөвхөн chibi-гийн биед `pointer-events: auto`. Ингэснээр аль ч дэлгэцийн товч, scroll, чат саадгүй хэвээр.

Дүр сонголт: миний дэлгэц дээр **хосын** chibi явна. `accountKey` / `partnerKey` App-д аль хэдийн байгаа тул props-оор дамжина.

## Төлөвийн машин

Үндсэн мөчлөг: `walk → idle → (хааяа cute action) → walk …`

| Төлөв | Оролт | Үргэлжлэх |
|-------|-------|-----------|
| `walk` | мөчлөгийн эхлэл | 3–6 сек, ~20px/сек, ирмэгт хүрвэл эргэнэ |
| `idle` | walk дуусахад | 2–5 сек, хааяа анивчина |
| `sit` / `wave` | 3–4 мөчлөг тутамд санамсаргүй | 4–8 сек |
| `sleep` | 60 сек хүрэлтгүй өнгөрвөл | хүрэлт болтол |
| `blush` | би товшсон (ямар ч төлөвийг тасална) | 2.5 сек, дараа нь `walk` |
| `happy` | хос намайг товшсон | 2 сек, дараа нь `walk` |
| `dragged` | 6px-ээс их хөдөлгөөнтэй дарах | тавих хүртэл |
| `land` | чирэлт тавигдахад | 0.35 сек шахалт, дараа нь `walk` |

### Харьцаа

- **Товшилт** — хөдөлгөөнгүй дарж авахад бүртгэгдэнэ (чирэлт товшилт болж тооцогдохгүй). Ямар ч төлөвийг тасална, унтаж байсан ч сэрнэ. 2.5 сек `blush`, дээгүүр нь 3 зүрх хөвж гарна, `navigator.vibrate(12)` (дэмждэг төхөөрөмж дээр).
- **Чирэх** — pointer 6px-ээс их хөдөлмөгц `dragged`. Хуруунд наалдана. Тавихад доошоо унаж `land`, хэвтээ байрлал нь тавьсан газарт үлдэнэ.
- **Нуугдах** — login дэлгэц, эхний loading дараалал, гар нээлттэй үе (`useKeyboardInset`), профайл дээрх унтраалга унтраалттай үед. `document.hidden` үед rAF зогсоно.

### Профайлын унтраалга

ProfileScreen дээр "Chibi хамтрагч" toggle. `localStorage` -д хадгална (аппын одоогийн `loadSaved` загвартай нийцүүлнэ). Анхдагч утга: асаалттай.

## Хосын холбоос

Одоо байгаа `peeks` механизмтай яг ижил загвар:

- Бичих: `rooms/ankomeow-couple/pokes/{partnerKey}` → `{ from, at, count }`.
- Сонсох: `onSnapshot(doc(..., "pokes", accountKey))` → өөрчлөгдвөл миний дэлгэц дээрх chibi `happy`.
- Firestore rules: `peeks`-тэй адил мөр нэмнэ — хосын аль нь ч бичнэ, зөвхөн эзэн нь уншина.

**Throttle:** товшилтын ичих анимаци үргэлж шууд ажиллана (локал). Firestore бичилт болон push нь **60 секундэд нэг удаа**. Хооронд хуримтлагдсан товшилтыг нэгтгэж `"Andela чамайг 5 удаа товшлоо 💕"` гэж илгээнэ. Нэг удаагийнх бол `"Andela чамайг товшлоо 💕"`.

Push нь одоо байгаа `notifyPartner(auth, { to, title, body, tag, tab })`-ыг ашиглана, `tag: "poke"` (өмнөх мэдэгдлийг дарж бичнэ), `tab: "home"`.

## Sprite-ийн техникийн шаардлага

Дүр тус бүрд нэг PNG: **1024×1024, ил тод дэвсгэр, 3×3 тор**, нүд бүр 341×341. CSS дээр `background-size: 300% 300%` + 50%-ийн алхмаар шууд таарна — зураг хуваах скрипт хэрэггүй.

Нүдний дараалал (зүүнээс баруун, дээрээс доош):

| # | Төлөв | Тайлбар |
|---|-------|---------|
| 1 | idle | Урдаа харан зогсох, нүд нээлттэй |
| 2 | walk-a | Хажуу тийш (баруун) алхаа — зүүн хөл урагш |
| 3 | walk-b | Мөн баруун тийш — баруун хөл урагш |
| 4 | blush | Хацар улаан, гараа нүүр рүүгээ, нүд хагас аньсан инээмсэглэл |
| 5 | happy | Үсрэлт, хоёр гар дээш, нүд `^ ^` |
| 6 | sit | Хөлөө урагш сунган суусан |
| 7 | sleep | Нүд аньсан, толгой хажуу тийш (`zZ` тэмдгийг код нэмнэ) |
| 8 | wave | Нэг гараа өргөн даллах |
| 9 | dragged | Агаарт өлгөөтэй, гар дээш, хөл савсан, бага зэрэг гайхсан |

Зүүн тийш алхахыг код `scaleX(-1)`-ээр эргүүлнэ. Дэлгэц дээр ~72px өндөр.

**Ирэхээс өмнө:** энгийн SVG placeholder-оор бүх логикийг ажиллуулна. Зураг ирмэгц `sprites.js` дотор замыг л сольно.

**Тор хазайсан тохиолдол:** `sprites.js` дотор нүд тус бүрийн offset/масштабыг гараар тохируулах боломжтой бичнэ. Тэр ч хүрэлцэхгүй бол 9 зургийг тусад нь авах нөөц зам нээлттэй.

## GPT-д өгөх зургийн prompt

Зургийн загварыг `assets/Profile template/Template profiles.png`-ээс авав: зөөлөн бүдэг өнгө (цөцгий, sage ногоон, дулаан бежь), нарийн шугам, хавтгай зөөлөн сүүдэр, тайван storybook аниме.

Prompt-ыг англиар бичсэн — зураг үүсгэгч загварууд англи дээр илүү нарийн ажилладаг.

### Andela (охин)

```
A 3x3 sprite sheet on a fully transparent background, 1024x1024 pixels,
each of the nine cells exactly 341x341 pixels, one chibi character per cell,
centered in its cell with a small margin at the bottom. Do not draw grid lines,
borders, labels, numbers, shadows on the ground, or any background — only the
character, fully transparent everywhere else.

Character: a cute chibi girl, about 2.5 heads tall, long straight black hair
past her waist with one thin amber-orange highlight strand falling on the left
side of her face, plain black short-sleeve t-shirt, dark charcoal pants, simple
rounded shoes. Soft muted storybook anime style, gentle thin line art, flat soft
shading, warm desaturated palette. Keep the character design, proportions, colors
and size IDENTICAL in all nine cells — only the pose changes.

The nine cells, in reading order (left to right, top to bottom):
1. Standing still, facing the viewer, eyes open, neutral gentle smile, arms down.
2. Walking to the RIGHT, seen from the side, left leg forward, arms swinging.
3. Walking to the RIGHT, seen from the side, right leg forward, arms swinging.
4. Blushing shyly, facing the viewer, strong pink blush on both cheeks, both
   hands raised near her face, eyes half-closed in a happy embarrassed smile.
5. Joyful little hop, facing the viewer, both arms raised up, feet off the
   ground, eyes as happy upward curves (^ ^), big open smile.
6. Sitting on the ground, facing the viewer, legs stretched forward, hands
   resting beside her, calm content expression.
7. Sleeping while sitting, eyes closed, head tilted to one side, peaceful face.
   Do not draw any zZ symbols.
8. Standing, facing the viewer, one arm raised high waving, cheerful smile.
9. Being held up in the air, facing the viewer, both arms up, legs dangling and
   kicking, slightly surprised open-mouth expression.
```

### Neko (хүү)

```
A 3x3 sprite sheet on a fully transparent background, 1024x1024 pixels,
each of the nine cells exactly 341x341 pixels, one chibi character per cell,
centered in its cell with a small margin at the bottom. Do not draw grid lines,
borders, labels, numbers, shadows on the ground, or any background — only the
character, fully transparent everywhere else.

Character: a cute chibi boy, about 2.5 heads tall, messy short black hair, warm
grey-taupe hoodie with a drawstring hood, dark charcoal pants, simple rounded
shoes. Soft muted storybook anime style, gentle thin line art, flat soft shading,
warm desaturated palette. Keep the character design, proportions, colors and size
IDENTICAL in all nine cells — only the pose changes.

The nine cells, in reading order (left to right, top to bottom):
1. Standing still, facing the viewer, eyes open, calm neutral expression, arms down.
2. Walking to the RIGHT, seen from the side, left leg forward, arms swinging.
3. Walking to the RIGHT, seen from the side, right leg forward, arms swinging.
4. Blushing shyly, facing the viewer, strong pink blush on both cheeks, one hand
   rubbing the back of his neck, eyes half-closed in a bashful smile, looking away.
5. Joyful little hop, facing the viewer, both arms raised up, feet off the ground,
   eyes as happy upward curves (^ ^), big open smile.
6. Sitting on the ground, facing the viewer, legs stretched forward, hands resting
   beside him, relaxed expression.
7. Sleeping while sitting, eyes closed, head tilted to one side, peaceful face,
   hood slightly slipping. Do not draw any zZ symbols.
8. Standing, facing the viewer, one arm raised high waving, friendly smile.
9. Being held up in the air, facing the viewer, both arms up, legs dangling and
   kicking, slightly surprised open-mouth expression.
```

Гарсан зургийг `public/chibi/andela.png`, `public/chibi/neko.png` нэрээр хадгална.

## Алдаа, гүйцэтгэл

- Firestore бичилт болон push унасан ч ичих анимаци заавал ажиллана — сүлжээ чимээгүй унана.
- Sprite ачаалагдаагүй бол `onerror` дээр SVG placeholder руу шилжинэ.
- Нэг rAF цикл, DOM-д зөвхөн `transform: translate3d(...)`. Байрлал нь ref-ээр удирдагдах тул үлдсэн апп дахин render хийхгүй.
- Дэлгэц эргэхэд chibi хүрээнд эргэж багтана.
- Чирж байх үед tab солигдвол чирэлт цуцлагдана.
- Хоёр хуруу зэрэг хүрвэл эхнийх нь л тоологдоно.

## Шалгалт

Unit (`useChibiBrain`, хугацааг гараас өгч):

- Алхаа хүрээний ирмэгт хүрэхэд чиглэл эргэдэг.
- Товшилт `sleep` төлөвийг таслаж `blush` руу оруулдаг.
- Чирэлт (6px-ээс их хөдөлгөөн) товшилт болж тооцогдохгүй.
- Throttle 60 секундэд нэгээс олон push илгээхгүй; хуримтлагдсан тоо зөв нэгтгэгддэг.

Гараар: `npm run dev` дээр хоёр аккаунтаар нэвтэрч, нэг талаас товшиход нөгөө талын chibi баярлаж, push ирж байгааг шалгана.

## Хамрахгүй (YAGNI)

Хооллох/түвшин ахих tamagotchi механик, олон дүр, хувцас солих, товшилтын түүхийн дэлгэц.
