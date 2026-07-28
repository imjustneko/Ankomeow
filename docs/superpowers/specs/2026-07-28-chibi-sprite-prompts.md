# Chibi sprite — GPT-д өгөх prompt (2026-07-28)

Лавлах зураг: `assets/Chibi/Pasted image.png` (Andela), `assets/Chibi/Pasted image (2).png` (Neko).
Хоёуланг нь GPT-д **хавсаргаж**, доорх prompt-ыг хуулж өгнө. Дүр бүрд тусад нь нэг удаа.

## Техникийн параметр

| Зүйл | Утга |
|------|------|
| Зургийн хэмжээ | **1024 × 1536 пиксел** (босоо) |
| Тор | **3 багана × 4 мөр = 12 нүд** |
| Нүд бүрийн хэмжээ | 341 × 384 пиксел |
| Дэвсгэр | **Бүрэн ил тод (transparent PNG)** |
| Хөдөлгөөний тоо | **12** |
| Файлын нэр | `andela.png`, `neko.png` → `public/chibi/` дотор |

Дэлгэц дээр ~72×81px харагдана. 341px эх нь Retina дээр цэвэрхэн.

## 12 нүдний дараалал (зүүнээс баруун, дээрээс доош)

| # | Төлөв | Хэзээ ажиллах |
|---|-------|----------------|
| 1 | idle — зогсох | Алхааны завсар |
| 2 | walk-a | Алхаа, 1-р кадр |
| 3 | walk-b | Алхаа, 2-р кадр |
| 4 | startle — чочих | Товшсон агшинд |
| 5 | blush — ичингүйрэн инээх | Чочсоны дараа |
| 6 | happy — баярлан үсрэх | Хос товшиход |
| 7 | sit — Neko: компьютер дээр сууж байгаа / Andela: сөхөрч суусан | Neko-гийн **анхны** харагдац |
| 8 | lie — хэвтэх | Andela-гийн **анхны** харагдац |
| 9 | get-up — босох дунд хөдөлгөөн | Хэвтэж байхад товшиход |
| 10 | sleep — унтах | 60 сек хүрэлтгүй |
| 11 | wave — даллах | Хааяа санамсаргүй |
| 12 | held-up — агаарт өргөгдсөн | Чирэх үед |

---

## Prompt 1 — Andela

> Хавсралт: `assets/Chibi/Pasted image.png`

```
Use the attached illustration as the exact character reference. Keep her face, hair,
cat ears, eye color, outfit and color palette identical in every pose — same art style,
same line weight, same soft cel shading.

Character: a chibi girl about 2.5 heads tall. Black cat ears with white inner fluff.
Long wavy black hair down past her waist with several golden-amber highlight strands.
Large violet-purple eyes. Plain black loose long-sleeve top. Dark navy baggy jeans.
Black-and-white low sneakers. She carries a golden crescent-moon staff with a purple
orb and a purple ribbon.

Output: ONE image, 1024 x 1536 pixels, on a FULLY TRANSPARENT background, containing a
3-column x 4-row grid of twelve poses of this same character — cells of 341 x 384 pixels.

Absolute rules:
- Transparent background everywhere. No background color, no white box, no blue card,
  no decorative frame or border, no letters, no name text, no paw prints, no sparkles,
  no ground shadow, no grid lines, no numbers, no labels.
- Do NOT include the small black cat companion. The girl only.
- Keep her at the SAME scale in all twelve cells — same head height, same eye level.
  Center her horizontally in each cell, feet resting near the bottom of the cell with a
  small margin.
- Full body visible in every cell, nothing cropped by the cell edge.

The twelve poses, in reading order (left to right, top to bottom):
1.  Standing still facing the viewer, staff in her right hand resting on the ground,
    calm gentle expression, eyes open.
2.  Walking to the RIGHT seen from the side, left leg forward, staff carried in her hand,
    hair swaying back.
3.  Walking to the RIGHT seen from the side, right leg forward, the opposite step of pose 2.
4.  Startled: facing the viewer, both eyes wide open, mouth a small open "o", shoulders
    jumped up, staff tilting, one small sweat drop at her temple.
5.  Shy happy smile: strong pink blush on both cheeks, eyes closed in two upward curves,
    both hands raised near her face, staff tucked under one arm.
6.  Joyful hop: both arms raised high, feet off the ground, eyes as happy upward curves,
    wide open smile, hair and staff lifted by the motion.
7.  Sitting on the ground facing the viewer, knees drawn up, staff leaning against her
    shoulder, relaxed content expression.
8.  Lying down on her side on the ground, facing the viewer, head resting on one arm,
    hair spread out behind her, staff on the ground beside her, sleepy relaxed face.
9.  Getting up from lying down — caught mid-motion: pushing herself up with one hand,
    upper body raised, legs still folded, slightly surprised expression, hair falling forward.
10. Sleeping curled up on the ground, eyes closed, peaceful smile, hands tucked under her
    cheek. Do NOT draw any zZ symbols.
11. Standing facing the viewer, one arm raised high waving, cheerful open smile, staff in
    the other hand.
12. Held up in the air by an invisible hand: both arms up, legs dangling and kicking,
    hair hanging down, surprised open-mouth expression, staff clutched in one hand.
```

---

## Prompt 2 — Neko

> Хавсралт: `assets/Chibi/Pasted image (2).png`

```
Use the attached illustration as the exact character reference. Keep his face, hair,
cat ears, eye color, outfit and color palette identical in every pose — same art style,
same line weight, same soft cel shading.

Character: a chibi boy about 2.5 heads tall. Black cat ears with white inner fluff.
Messy black hair with spiky bangs. Large dark brown eyes. Light grey hoodie with
drawstrings. Navy blue jeans. Black-and-white sneakers. He carries a short grey sword
with a black hilt.

Output: ONE image, 1024 x 1536 pixels, on a FULLY TRANSPARENT background, containing a
3-column x 4-row grid of twelve poses of this same character — cells of 341 x 384 pixels.

Absolute rules:
- Transparent background everywhere. No background color, no white box, no blue card,
  no decorative frame or border, no letters, no name text, no paw prints, no sparkles,
  no ground shadow, no grid lines, no numbers, no labels.
- Do NOT include the small black cat companion. The boy only.
- Keep him at the SAME scale in all twelve cells — same head height, same eye level.
  Center him horizontally in each cell, feet resting near the bottom of the cell with a
  small margin.
- Full body visible in every cell, nothing cropped by the cell edge.

The twelve poses, in reading order (left to right, top to bottom):
1.  Standing still facing the viewer, sword held point-down at his side, calm neutral
    expression, eyes open.
2.  Walking to the RIGHT seen from the side, left leg forward, sword carried in his hand,
    arms swinging.
3.  Walking to the RIGHT seen from the side, right leg forward, the opposite step of pose 2.
4.  Startled: facing the viewer, both eyes wide open, mouth a small open "o", shoulders
    jumped up, sword slipping in his grip, one small sweat drop at his temple.
5.  Bashful happy smile: strong pink blush on both cheeks, eyes closed in two upward
    curves, one hand rubbing the back of his neck, sword tucked under his other arm,
    looking slightly away.
6.  Joyful hop: both arms raised high, feet off the ground, eyes as happy upward curves,
    wide open smile, sword lifted overhead.
7.  Sitting cross-legged on the floor in front of an open laptop computer, facing the
    viewer over the screen, both hands on the keyboard, focused expression with the
    screen glow on his face. The sword lies on the floor beside him. Draw the laptop
    small and simple — it must fit inside the cell together with him.
8.  Lying on his back on the ground, facing the viewer, hands behind his head, one knee
    up, relaxed expression, sword on the ground beside him.
9.  Getting up from lying down — caught mid-motion: propped up on one elbow, upper body
    raised, legs still down, slightly surprised expression, hair a little messier.
10. Sleeping curled up on the ground, eyes closed, peaceful face, hood slipping slightly
    over his hair. Do NOT draw any zZ symbols.
11. Standing facing the viewer, one arm raised high waving, friendly open smile, sword in
    the other hand.
12. Held up in the air by an invisible hand: both arms up, legs dangling and kicking,
    surprised open-mouth expression, sword clutched in one hand.
```

---

## Зураг ирсний дараах кодын өөрчлөлт

Одоогийн код 3×3 = 9 нүдэнд зохиогдсон. 12 нүд болгоход:

1. `src/chibi/sprites.js` — `GRID` -г `GRID_COLS = 3`, `GRID_ROWS = 4` болгож, `cellPosition`-ыг багана/мөрөөр тусад нь тооцно. `CELL`-д `startle`, `lie`, `getUp` нэмнэ. `SPRITE_HEIGHT` 72 → 81.
2. `src/chibi/brain.js` — гурван шинэ төлөв:
   - `startle` (0.6 сек) → товшилтын эхний хариу, дараа нь `blush`;
   - `lie` → амрах cute action, `sleep`-ийн өмнөх шат;
   - `getUp` (0.5 сек) → `lie`/`sleep` дээр товшиход эхэлж, дараа нь `startle`.
3. Анхны төлөвийг дүрээр ялгана: Neko → `sit` (компьютер дээр), Andela → `lie`.
4. Тестүүд: товшилт `lie` → `getUp` → `startle` → `blush` дараалал зөв эсэх.

Энэ нь одоогийн 42 тесттэй кодын дээр нэмэлт нэг даалгавар (Task 9) болно.
