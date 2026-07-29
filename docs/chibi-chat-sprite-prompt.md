# Chibi чат реакцийн sprite — AI-д өгөх prompt (v2)

Дүр бүрд тусад нь нэг удаа ажиллуулна.

- **Prompt 1**-д `public/chibi/andela.png`-ыг хавсаргана → `andela-chat.png`
- **Prompt 2**-д `public/chibi/neko.png`-ыг хавсаргана → `neko-chat.png`

Эх зураг (`assets/Chibi/Pasted image.png`) БИШ, **бэлэн sprite хуудсыг** хавсаргана.

## v1-ээс юу өөрчлөгдсөн

| # | Асуудал | Засвар |
|---|---------|--------|
| 1 | v1-д «алтан хавирган сартай таяг» гэж бичсэн нь **буруу** — бодит дүрд таяг байхгүй | Таягийн тухай бүх өгүүлбэр хасагдав |
| 2 | Толгой жижиг, бие урт гарсан — өөр дүр шиг харагдсан | Харьцааг лавлах зурагтай адил байлгах шаардлага онцлон нэмэгдэв |
| 3 | Өмд хар хөх `(52,57,69)` гарсан, хуучин нь хар `(24,28,34)` | «Цэвэр хар, хөх биш» гэж тодорхой заав |
| 4 | Хуруу зүүн тийш заах ёстой байсан | **Дээш заах** болж өөрчлөгдөв — чат босоо жагсаалт тул илүү байгалийн |
| 5 | Өндөр 1024 гарсан | 1536 × 640 болов (өргөсгөсөн гар дээш багтахын тулд) |

Хэмжээ яг таарахгүй байсан ч болно — 3 тэнцүү багана байвал код талд тохируулна.

---

## Prompt 1 — Andela

```
Use the attached sprite sheet as the exact character reference. The attached image is
the existing 3x3 sprite sheet for this character. Match her face, hair, cat ears, eye
color, outfit, colour palette, line weight and cel shading EXACTLY as drawn there. The
new poses must look like they were drawn by the same artist for the same sheet.

CRITICAL — body proportions. Copy the proportions from the reference exactly. She is a
chibi with a LARGE head: her head is roughly 40% of her total height and she is about
2.5 head-lengths tall overall. Do NOT slim her, do NOT lengthen her legs or torso, do
NOT make her look taller or older. If your pose looks like a teenager rather than a
chibi doll, the proportions are wrong.

CRITICAL — colours. Her top and her trousers are both PURE BLACK, the same near-black
as the reference. The trousers must NOT be navy, blue, or blue-grey. Her hair is black
with ONE warm orange highlight strand — do not tint the whole hair brown.

Character: a chibi girl. Black cat ears with pink inner fluff. Long wavy black hair
past her waist with a single orange highlight strand. Large violet-purple eyes. Plain
black short-sleeve top. Plain black trousers. Black-and-white low sneakers. She carries
NO weapon and NO staff — her hands are empty.

Output: ONE image, 1536 x 640 pixels, on a FULLY TRANSPARENT background, containing a
3-column x 1-row grid of three poses of this same character — cells of 512 x 640 pixels.

Absolute rules:
- Transparent background everywhere. No background colour, no white box, no card, no
  gradient, no glow, no decorative frame or border, no letters, no name text, no speech
  bubble, no sparkles, no ground shadow, no grid lines, no numbers, no labels.
- Do NOT include the small black cat companion. The girl only.
- Keep her at the SAME scale in all three cells — same head size, same body height, and
  her feet resting on the SAME horizontal line near the bottom of every cell. Leave
  headroom at the top of each cell for her raised arm.
- Full body visible in every cell, nothing cropped by the cell edge.
- She raises her RIGHT arm (viewer's left) UP above her head and points UPWARD with her
  index finger, at something above and slightly to the viewer's left. That raised
  pointing arm must be in the IDENTICAL position in all three cells — only her head,
  face and body rotation change between cells.

The three poses, left to right — one continuous turn, so keep her feet planted and her
pointing arm frozen in place across all three:
1. Seen mostly from BEHIND, her back to the viewer, head tilted up looking at what she
   is pointing at above her. We see the back of her hair and her cat ears from behind.
2. Turned halfway toward the viewer — a three-quarter view. Her face is now visible,
   eyes open and looking at the viewer, the corners of her mouth just starting to lift.
   Her hair swings slightly with the turn.
3. Turned fully to face the viewer. A warm happy smile, eyes closed in two upward
   curves, soft pink blush on both cheeks. Her arm is still raised and pointing up. Do
   NOT draw any heart symbol — the app adds hearts itself.
```

---

## Prompt 2 — Neko

```
Use the attached sprite sheet as the exact character reference. The attached image is
the existing 3x3 sprite sheet for this character. Match his face, hair, cat ears, eye
colour, outfit, colour palette, line weight and cel shading EXACTLY as drawn there. The
new poses must look like they were drawn by the same artist for the same sheet.

CRITICAL — body proportions. Copy the proportions from the reference exactly. He is a
chibi with a LARGE head: his head is roughly 40% of his total height and he is about
2.5 head-lengths tall overall. Do NOT slim him, do NOT lengthen his legs or torso, do
NOT make him look taller or older. If your pose looks like a teenager rather than a
chibi doll, the proportions are wrong.

CRITICAL — colours. Copy his hoodie and trouser colours from the reference exactly. Do
not shift them bluer, browner, or lighter than they appear there.

Character: a chibi boy. Black cat ears with pink inner fluff. Messy black hair with
spiky bangs. Large dark brown eyes. Light grey hoodie with drawstrings. Dark trousers
matching the reference. Black-and-white sneakers. He carries NO weapon and NO sword —
his hands are empty.

Output: ONE image, 1536 x 640 pixels, on a FULLY TRANSPARENT background, containing a
3-column x 1-row grid of three poses of this same character — cells of 512 x 640 pixels.

Absolute rules:
- Transparent background everywhere. No background colour, no white box, no card, no
  gradient, no glow, no decorative frame or border, no letters, no name text, no speech
  bubble, no sparkles, no ground shadow, no grid lines, no numbers, no labels.
- Do NOT include the small black cat companion. The boy only.
- Keep him at the SAME scale in all three cells — same head size, same body height, and
  his feet resting on the SAME horizontal line near the bottom of every cell. Leave
  headroom at the top of each cell for his raised arm.
- Full body visible in every cell, nothing cropped by the cell edge.
- He raises his RIGHT arm (viewer's left) UP above his head and points UPWARD with his
  index finger, at something above and slightly to the viewer's left. That raised
  pointing arm must be in the IDENTICAL position in all three cells — only his head,
  face and body rotation change between cells.

The three poses, left to right — one continuous turn, so keep his feet planted and his
pointing arm frozen in place across all three:
1. Seen mostly from BEHIND, his back to the viewer, head tilted up looking at what he
   is pointing at above him. We see the back of his hair and his cat ears from behind.
2. Turned halfway toward the viewer — a three-quarter view. His face is now visible,
   eyes open and looking at the viewer, the corners of his mouth just starting to lift.
3. Turned fully to face the viewer. A warm happy smile, eyes closed in two upward
   curves, soft pink blush on both cheeks. His arm is still raised and pointing up. Do
   NOT draw any heart symbol — the app adds hearts itself.
```

---

## Зураг ирсний дараа шалгах

1. **Биеийн харьцаа** — толгой том хэвээр үү? Лавлах зурагтай хажуу хажууд нь тавьж хар.
2. **Өмдний өнгө** — цэвэр хар уу, хар хөх үү?
3. **Хөлний түвшин** гурван нүдэнд ижил үү?
4. **Заасан гар** гурван нүдэнд хөдлөөгүй үү?
5. **Дэвсгэр ил тод** уу — гэрэлтэлт, градиент үлдээгүй эсэх.
6. **Таяг/сэлэм байхгүй**, зүрхний тэмдэг байхгүй.
