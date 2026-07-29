# Chibi — чат руу орох реакц ба «Чат ирсэн байна» мэдэгдэл

Огноо: 2026-07-29

## Зорилго

Чат руу орох бүрд chibi нь хамтрагчийн сүүлийн зурвас руу **алхаж очоод**,
хуруугаараа заан, толгойгоо эргүүлж дэлгэц рүү харан **инээмсэглээд зүрх
гаргана**. Мөн уншаагүй зурвас байвал chibi «Чат ирсэн байна 💌» гэж хэлж, nav
дээр тэмдэг гарна.

## Одоогийн байдал

- `ChibiPet` нь дэлгэцийн дээгүүр глобалаар зурагддаг (`tab`-аас үл хамаарна).
- **Дэлгэц дээр хамтрагчийн дүр алхдаг**: `character={partnerKey}`. Өөрөөр
  хэлбэл Andela-гийн дэлгэцэн дээр Neko-гийн chibi байна. Тиймээс энэ фийчер нь
  «Neko өөрийн бичсэн зурвасаа зааж, чам руу инээмсэглэж байна» гэсэн утгатай.
- `brain.js` нь автономит: `walk`, `idle`, `sit`, `wave`, `sleep`, `climb`,
  `dragged` төлөвүүдийг өөрөө сонгодог. **Зорилтот цэг рүү явах команд байхгүй.**
- `sprites.js` — үндсэн хуудас 1024×1024, 3×3 = 9 нүд. Алхаа нь **тусдаа**
  хуудсаар (`WALK_SHEET`), дүр бүрд өөр нүдний хэмжээтэй. Энэ загварыг дагана.
- Зүрхний эффект (`HEARTS`) нь DOM элемент — **шинэ зураг шаардахгүй**.
- Чат уншсан төлөв аль хэдийн бий: `rooms/{room}/reads/{accountKey}.at` нь чат
  нээх бүрд `serverTimestamp()`-аар шинэчлэгддэг.

> **Анхаар:** `docs/superpowers/specs/2026-07-28-chibi-sprite-prompts.md` нь
> 3×4 = 12 нүд, 1024×1536 гэж бичсэн боловч **хэрэгжээгүй** — бодит код болон
> зураг 3×3 = 9 нүд, 1024×1024 хэвээр. Тэр баримтыг лавлагаа болгож болохгүй.

## Шийдвэрүүд

| Асуулт | Шийдвэр |
|---|---|
| Хэзээ ажиллах | Чат руу орох **бүрд** (уншаагүй эсэхээс үл хамаарна) |
| Хөдөлгөөн | Зурвас руу **алхаж** очно |
| «Чат ирсэн» мэдэгдэл | Chibi бөмбөлөг **ба** nav дээрх тэмдэг, хоёулаа |
| Шинэ зураг | Үндсэн хуудсыг хөндөхгүй, **тусдаа** 3 нүдтэй хуудас |

## Дараалал

```
Чат нээгдэв
  │
  ├─ Хамтрагчийн сүүлийн зурвасын бөмбөлгийг DOM-оос олно
  │    (байхгүй бол эсвэл chibi унтраалттай бол ЭНД ЗОГСОНО)
  │
  ├─ brain.hold()          — автономит зан зогсоно
  ├─ brain.walkTo(x, y)    — одоо байгаа алхааны sprite-аар алхана
  │
  ├─ ирэхэд:  look   700мс — зурвас руу харан хуруугаараа заана
  │           turn   250мс — толгойгоо эргүүлж эхэлнэ
  │           smile 1400мс — дэлгэц рүү харан инээмсэглэнэ + зүрх гарна
  │
  └─ brain.release()       — автономит зан руугаа буцна
```

Зорилтот цэг: бөмбөлгийн **баруун ирмэгээс 8px зайд**, босоо голд нь. Хэрэв
баруун талд зай хүрэхгүй бол зүүн талд нь зогсоно (дараа нь `scaleX`-ээр
толино). Бөмбөлөг дэлгэцээс гарсан бол чат аль хэдийн доош гүйлгэдэг тул
хүлээгээд байрлалыг дахин хэмжинэ.

## Шинэ sprite хуудас

| Зүйл | Утга |
|---|---|
| Файл | `public/chibi/andela-chat.png`, `public/chibi/neko-chat.png` |
| Хэмжээ | **1536 × 512** пиксел |
| Тор | **3 багана × 1 мөр** |
| Нүд | 512 × 512 |
| Дэвсгэр | Бүрэн ил тод PNG |

`sprites.js`-д нэмэгдэнэ:

```js
export const CHAT_SHEET = {
  andela: { url: "/chibi/andela-chat.png", cols: 3, rows: 1, cellW: 512, cellH: 512 },
  neko:   { url: "/chibi/neko-chat.png",   cols: 3, rows: 1, cellW: 512, cellH: 512 },
};
export const CHAT_CELL = { look: 0, turn: 1, smile: 2 };
export const CHAT_SHEET_FACING = -1;  /* зурсан дүр зүүн тийш заасан */
```

Байршлыг одоо байгаа `gridPosition(col, row, cols, rows)` функцээр тооцно —
шинэ функц хэрэггүй.

### AI-д өгөх prompt

**Хавсаргах лавлах зураг:** одоогийн бэлэн хуудсыг өөрийг нь хавсаргана —
`public/chibi/andela.png` эсвэл `public/chibi/neko.png`. Эх зургийг
(`assets/Chibi/Pasted image.png`) биш **бэлэн sprite-ыг** хавсаргах нь чухал:
ингэснээр шугамын зузаан, өнгө, хэмжээ нь одоо ажиллаж байгаа дүрүүдтэй яг таарна.

#### Prompt 1 — Andela

```
Use the attached sprite sheet as the exact character reference. The attached image is
the existing 3x3 sprite sheet for this character. Match her face, hair, cat ears, eye
color, outfit, color palette, line weight and soft cel shading EXACTLY as drawn there.
The new poses must look like they came from that same sheet.

Character: a chibi girl about 2.5 heads tall. Black cat ears with white inner fluff.
Long wavy black hair down past her waist with several golden-amber highlight strands.
Large violet-purple eyes. Plain black loose long-sleeve top. Dark navy baggy jeans.
Black-and-white low sneakers. She carries a golden crescent-moon staff with a purple
orb and a purple ribbon.

Output: ONE image, 1536 x 512 pixels, on a FULLY TRANSPARENT background, containing a
3-column x 1-row grid of three poses of this same character — cells of 512 x 512 pixels.

Absolute rules:
- Transparent background everywhere. No background color, no white box, no card,
  no decorative frame or border, no letters, no name text, no speech bubble, no
  sparkles, no ground shadow, no grid lines, no numbers, no labels.
- Do NOT include the small black cat companion. The girl only.
- Keep her at the SAME scale in all three cells — same head height, same eye level,
  same distance from the bottom of the cell. Center her horizontally in each cell.
- Full body visible in every cell, nothing cropped by the cell edge.
- She keeps the staff in her LEFT hand (viewer's right) in all three cells, so her
  RIGHT arm (viewer's left) is free to point.
- She points toward the LEFT edge of the image in all three cells. The pointing arm
  must stay in the same place across all three cells — only her head, eyes and mouth
  change.

The three poses, left to right — this is one continuous motion, so keep her feet and
pointing arm identical in all three:
1. She stands in profile turned to the LEFT, looking at something off-screen to her
   left. Her right arm is raised and extended toward the left edge, index finger
   clearly pointing. Her eyes are open and interested, mouth a small soft line. Her
   body is turned left, weight on her front foot.
2. The same stance and the same pointing arm, but her head is now turned halfway
   toward the viewer — a three-quarter view. Her eyes are beginning to look at the
   viewer, the corners of her mouth just starting to lift. Her hair swings slightly
   with the head turn.
3. The same stance and the same pointing arm, but her head is now fully turned to
   face the viewer. She gives a warm happy smile with her eyes closed in two upward
   curves, soft pink blush on both cheeks. Her body still faces left; only the head
   has come around. Do NOT draw any heart symbol — the app adds hearts itself.
```

#### Prompt 2 — Neko

```
Use the attached sprite sheet as the exact character reference. The attached image is
the existing 3x3 sprite sheet for this character. Match his face, hair, cat ears, eye
color, outfit, color palette, line weight and soft cel shading EXACTLY as drawn there.
The new poses must look like they came from that same sheet.

Character: a chibi boy about 2.5 heads tall. Black cat ears with white inner fluff.
Messy black hair with spiky bangs. Large dark brown eyes. Light grey hoodie with
drawstrings. Navy blue jeans. Black-and-white sneakers. He carries a short grey sword
with a black hilt.

Output: ONE image, 1536 x 512 pixels, on a FULLY TRANSPARENT background, containing a
3-column x 1-row grid of three poses of this same character — cells of 512 x 512 pixels.

Absolute rules:
- Transparent background everywhere. No background color, no white box, no card,
  no decorative frame or border, no letters, no name text, no speech bubble, no
  sparkles, no ground shadow, no grid lines, no numbers, no labels.
- Do NOT include the small black cat companion. The boy only.
- Keep him at the SAME scale in all three cells — same head height, same eye level,
  same distance from the bottom of the cell. Center him horizontally in each cell.
- Full body visible in every cell, nothing cropped by the cell edge.
- He keeps the sword in his LEFT hand (viewer's right) in all three cells, so his
  RIGHT arm (viewer's left) is free to point.
- He points toward the LEFT edge of the image in all three cells. The pointing arm
  must stay in the same place across all three cells — only his head, eyes and mouth
  change.

The three poses, left to right — this is one continuous motion, so keep his feet and
pointing arm identical in all three:
1. He stands in profile turned to the LEFT, looking at something off-screen to his
   left. His right arm is raised and extended toward the left edge, index finger
   clearly pointing. His eyes are open and interested, mouth a small soft line. His
   body is turned left, weight on his front foot.
2. The same stance and the same pointing arm, but his head is now turned halfway
   toward the viewer — a three-quarter view. His eyes are beginning to look at the
   viewer, the corners of his mouth just starting to lift. His bangs shift slightly
   with the head turn.
3. The same stance and the same pointing arm, but his head is now fully turned to
   face the viewer. He gives a warm happy smile with his eyes closed in two upward
   curves, soft pink blush on both cheeks. His body still faces left; only the head
   has come around. Do NOT draw any heart symbol — the app adds hearts itself.
```

### Зураг ирсний дараах шалгалт

1. Хэмжээ яг 1536×512 эсэх; биш бол `cellW`/`cellH`-г бодит хэмжээнд тааруулна.
2. Дэвсгэр үнэхээр ил тод эсэх (цагаан дөрвөлжин үлдээгүй).
3. Гурван нүдэнд дүрийн өндөр, хөлний түвшин ижил эсэх — зөрвөл дэлгэц дээр
   үсэрч харагдана.
4. Хуруу зүүн тийш заасан эсэх; баруун тийш заасан бол `CHAT_SHEET_FACING`-ийг
   `1` болгоно.

## «Чат ирсэн байна» мэдэгдэл

**Уншаагүй нөхцөл:** хамтрагчаас ирсэн хамгийн сүүлийн зурвасын `createdAt` нь
`reads/{accountKey}.at`-аас хойш байх.

App түвшинд хоёр хөнгөн сонсогч нэмнэ:

- `messages` цуглуулгаас `orderBy("createdAt","desc"), limit(1)`
- `reads/{accountKey}` баримт

Хоёулангаас `hasUnread(lastMsg, myReadAt, accountKey)` цэвэр функцээр тооцно.

Уншаагүй үед:

- **Nav-ын чат icon дээр цэг.** Chibi унтраалттай ч мэдэгдэл үлдэнэ.
- **Chibi бөмбөлөг** нүүр дэлгэц дээр: «Чат ирсэн байна 💌». Товшиход чат руу
  шилжинэ. Бөмбөлөг нь одоо байгаа `phrase` системийг ашиглана, гэхдээ
  **дүрээс үл хамааран** гарна — санамсаргүй үгс зөвхөн Neko-д гардаг дүрэм
  (`TALKATIVE`) хэвээр үлдэнэ.

Бөмбөлөг гарах дүрэм: «уншаагүй биш» → «уншаагүй» болж **шилжих агшинд** нэг
удаа гарна. Апп нээхэд аль хэдийн уншаагүй байвал мөн нэг удаа гарна. Уншаагүй
төлөв үргэлжилсэн ч давтан гарахгүй — nav дээрх цэг л үлдэнэ. Чат руу орж
уншсаны дараа хоёулаа алга болно.

## Модулиуд

### `src/chibi/brain.js`

Шинэ команд ба төлөв:

- `walkTo(targetX, targetY, at)` — `goto` төлөвт орж, зорилтот цэг рүү одоогийн
  `SPEED`/`CLIMB_SPEED`-ээр шилжинэ. `facing` болон `dir`-ыг чиглэлд нь тохируулна.
- `consumeArrival()` — хүрсэн эсэхийг **нэг л удаа** `true` буцаана.
- `hold(at)` / `release(at)` — `held` тугийг тавьж/авна. `held` үед
  `nextInCycle` автономит төлөв сонгохгүй; хүрэлт, чирэлт хэвээр ажиллана.

Хүрсэн гэж үзэх зай: `ARRIVE_EPSILON = 2` пиксел.

### `src/chibi/chatSignal.js` (шинэ)

Firebase болон DOM-оос ангид цэвэр функцүүд:

- `hasUnread(lastMsg, myReadAtMs, accountKey)` → `boolean`.
  `lastMsg` байхгүй, эсвэл `lastMsg.from === accountKey` бол `false`.
  `myReadAtMs` байхгүй бол `true` (хэзээ ч уншаагүй).
- `bubbleTarget({ bubble, frame, spriteWidth, spriteHeight })` → `{ x, y, facing }`.
  `bubble`, `frame` нь `{ left, top, width, height }` хэлбэрийн энгийн объект —
  `DOMRect` дамжуулж болно, гэхдээ функц нь DOM мэддэггүй тул тестлэхэд хялбар.
  Баруун талд зай хүрэхгүй бол зүүн тал руу шилжүүлж `facing`-ыг эргүүлнэ.

### `src/chibi/ChibiPet.jsx`

Шинэ prop: `chatAct` — `{ key, bubbleRect } | null`.

`key` өөрчлөгдөх бүрд дараалал эхэлнэ: `hold` → `walkTo` → хүрэхэд
`look`/`turn`/`smile` дүрүүдийг timer-ээр солино → `smile`-д орохдоо зүрх
гаргана (`setHearts`) → дуусахад `release`.

Дараалал явж байх үед chibi-г **товшиж болно**; товшилт нь дарааллыг тасалж,
одоо байгаа `blush`/poke зан руу шилжинэ (`release` дуудагдана). Хэрэглэгчийн
үйлдэл анимациас давуу.

### `tovlorokh-khamtrakh.jsx`

- Уншаагүй төлөвийн хоёр сонсогч, `hasUnread`-аар тооцоолол
- `tab === "chat"` болох агшинд `ChatScreen`-ээс сүүлчийн хамтрагчийн зурвасын
  `DOMRect`-ыг авч `chatAct`-ыг шинэчилнэ (`ChatScreen`-д `onPartnerBubble`
  callback prop нэмнэ)
- Nav-ын чат icon дээр цэг
- Chibi бөмбөлгийн текст ба товшилтын үйлдэл

## Ирмэгийн тохиолдлууд

1. **Хамтрагчийн зурвас байхгүй** (шинэ чат) — дараалал огт эхлэхгүй.
2. **Chibi унтраалттай** (`chibiEnabled === false`) — дараалал эхлэхгүй, гэхдээ
   nav дээрх цэг хэвээр ажиллана.
3. **Гар нээлттэй** — `useKeyboardOpen` аль хэдийн бий; гар нээлттэй үед
   бөмбөлгийн байрлал өөрчлөгдөнө. Дараалал эхлэхээс өмнө нэг frame хүлээгээд
   `DOMRect`-ыг дахин уншина.
4. **Хэрэглэгч дарааллын дунд чатаас гарвал** — `hold` заавал `release`
   хийгдэнэ (`useEffect` цэвэрлэгээнд), эс тэгвэл chibi мөнхөд хөлдөнө.
5. **Хэрэглэгч дарааллын дунд chibi-г товшвол** — дараалал тасарна, poke зан
   ялна.
6. **Зурвас маш урт / бөмбөлөг дэлгэцээс өндөр** — зорилтот `y`-г frame-ийн
   доторх хүрээнд `clamp` хийнэ.
7. **Дараалал явж байхад шинэ зурвас ирвэл** — одоогийнх нь дуустал хүлээнэ,
   дахин эхлүүлэхгүй.

## Тест

Одоо байгаа тестүүд дээр нэмэгдэнэ. Бүгд vitest, `environment: "node"`.

**`src/chibi/chatSignal.test.js` (шинэ)**

- `hasUnread` — зурвасгүй → `false`
- `hasUnread` — сүүлийн зурвас өөрийнх → `false`
- `hasUnread` — хамтрагчийнх, уншсанаас хойш → `true`
- `hasUnread` — хамтрагчийнх, уншсанаас өмнө → `false`
- `hasUnread` — `myReadAtMs` байхгүй → `true`
- `bubbleTarget` — баруун талд зай байвал баруун талд, `facing` зүүн тийш
- `bubbleTarget` — баруун талд зай байхгүй бол зүүн тал руу шилжиж `facing` эргэнэ
- `bubbleTarget` — `y` нь frame-ийн хүрээнд clamp хийгдэнэ

**`src/chibi/brain.test.js` (нэмэлт)**

- `walkTo` — зорилтот цэг рүү ойртоно, `facing` зөв тохирно
- `walkTo` — хүрэхэд зогсоно, цаашид хөдлөхгүй
- `consumeArrival` — эхний дуудалтад `true`, дараагийнхад `false`
- `hold` — автономит төлөв сонголт зогсоно
- `release` — автономит зан сэргэнэ
- `hold` үед товшилт ажилласаар байна

**`src/chibi/sprites.test.js` (нэмэлт)**

- `CHAT_CELL`-ийн бүх нүд `gridPosition`-оор зөв хувь буцаана

## Хэрэгжүүлэх дараалал

Шинэ зураг нь **гадаад блокер** — AI-гаар үүсгэж, шалгаж, `public/chibi/` дотор
байрлуулах хүртэл анимацийг дуусгах боломжгүй. Тиймээс зургаас хамааралгүй
ажлыг эхэлж хийнэ:

1. **Уншаагүй мэдэгдэл** — `chatSignal.js`, сонсогчид, nav дээрх цэг, chibi
   бөмбөлөг. Зураг огт хэрэггүй, дангаараа ашигтай.
2. **Brain-ийн хөдөлгөөн** — `walkTo`, `hold`/`release`, `consumeArrival` ба
   тестүүд. Одоо байгаа алхааны sprite-аар шалгаж болно.
3. **Sprite хуудас ба дараалал** — зураг ирсний дараа `CHAT_SHEET`, `ChibiPet`
   дээрх дүрийн дараалал.

## Хамрахгүй зүйлс

- Үндсэн 9 нүдийн хуудсыг өөрчлөх
- Хуучин 12 нүдийн төлөвлөгөөг хэрэгжүүлэх (тусдаа ажил)
- Чатын зурвас бүрд реакц — зөвхөн чат руу орох үед
- Chibi-гээр дамжуулан зурвас бичих
