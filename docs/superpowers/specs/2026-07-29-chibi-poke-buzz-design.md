# Chibi товшилт → хамтрагчид мэдэгдэл ба чичиргээ

Огноо: 2026-07-29

**Төлөв:** Хэрэгжсэн — `docs/superpowers/plans/2026-07-29-chibi-poke-buzz.md`

## Зорилго

Chibi-г товшиход хамтрагчийн утас **чичирч**, мэдэгдэл ирдэг болгох. Одоо
товшилт зөвхөн хамтрагчийн chibi-г баярлуулдаг — биет хариу үйлдэл байхгүй.

## Одоогийн байдал

Товших урсгал аль хэдийн байгаа:

```
ChibiPet.onPointerUp → navigator.vibrate(12)   (зөвхөн ӨӨРИЙН утас)
                     → onPoke()
                     → pokeSender.poke(Date.now())
                          ├─ setDoc pokes/{partnerKey} { from, count, at }
                          └─ notifyPartner() → POST /api/notify (tag "poke")

Хүлээн авагч: onSnapshot pokes/{accountKey} → setChibiHappyAt()
```

Гурван дутагдал:

1. **Хамтрагчийн утас чичирдэггүй.** Хүлээн авах тал дээр `vibrate` дуудлага
   огт байхгүй, service worker-ийн `showNotification` дээр ч `vibrate` тохиргоо
   алга.
2. **Апп нээлттэй үед мэдэгдэл огт харагдахгүй.** `sw.js` нь харагдаж буй цонх
   байвал banner үзүүлэхийн оронд аппад `PUSH_FOREGROUND` дамжуулдаг, харин апп
   нь зөвхөн `tab === "chat"`-ыг л боловсруулж, poke-ыг үл тоодог.
3. **Товшилт алдагддаг.** `POKE_THROTTLE_MS = 60000`. Эхний товшилт шууд явна,
   дараагийнх нь `pending`-д хуримтлагдана, гэхдээ **дараагийн товшилт ирэхгүй
   бол хэзээ ч илгээгддэггүй**. 3 удаа товшоод зогсвол 2, 3 дахь нь алга болно.

## Хязгаарлалт

Хос нь **нэг Android, нэг iPhone** ашигладаг.

- **iOS нь Vibration API-г огт дэмждэггүй.** `navigator.vibrate` байхгүй,
  `showNotification`-ий `vibrate` тохиргоо үл тоогдоно. iPhone дээр чичрэх цорын
  ганц зам бол **iOS-ийн системийн мэдэгдэл** өөрөө (хэрэглэгчийн дуугарах/чичрэх
  тохиргооны дагуу). Энэ нь PWA-г Home Screen дээр суулгасан үед л ажиллана —
  push аль хэдийн ийм нөхцөлтэй.
- **Мэдэгдлийг нэгтгэх нь бидний хяналтаас гадна.** Давтагдахгүй `tag` ашиглан
  тус бүрийг тусдаа мэдэгдэл болгож илгээнэ, гэхдээ ялангуяа iOS нь дараалан
  ирсэн web push-ыг өөрөө нэгтгэж, цөөхнийг нь үзүүлж болзошгүй.

## Шийдвэрүүд

| Асуулт | Шийдвэр |
|---|---|
| Апп нээлттэй үед | Платформд тохируулна: Android → апп доторх чичиргээ, OS мэдэгдэлгүй. iPhone → OS мэдэгдэл үзүүлж, түүгээр нь чичрүүлнэ. |
| Товшилтын хэмнэл | Throttle байхгүй — товшилт бүр шууд илгээгдэнэ. |
| Апп хаалттай үед | Товшилт бүр тусдаа мэдэгдэл (давтагдахгүй tag). |
| Дамжуулах суваг | Firestore нь бодит цагийг, push нь хаалттай үеийг хариуцна. |

Сүүлчийн шийдвэрийн шалтгаан: Firestore-ийн `onSnapshot` нь FCM-ээс хурдан
(~150мс vs 0.5–2с) бөгөөд аль хэдийн холбогдсон байдаг. FCM-ийг зөвхөн апп
хаалттай үед л найдвартай суваг болгон ашиглана.

## Архитектур

```
Товших (илгээгч)
  └─ Firestore  pokes/{partnerKey}: { total: increment(1), from, at }
  └─ POST /api/notify   tag: "poke-<timestamp>"

Хүлээн авагч — апп НЭЭЛТТЭЙ:
  onSnapshot pokes/{accountKey}
    → delta = total − (сүүлд харсан)
    ├─ canVibrate()  : navigator.vibrate(vibrationPattern(delta)) + chibi үсрэх
    └─ эсрэг тохиолдол (iOS) : registration.showNotification() + chibi үсрэх
  (sw.js нь харагдаж буй цонх байвал push banner-ыг дардаг тул давхардахгүй)

Хүлээн авагч — апп ХААЛТТАЙ:
  sw.js push → showNotification({ vibrate: [0, 40, 60, 40] })
```

## Модулиуд

### `src/chibi/buzz.js` (шинэ)

Firebase болон DOM-оос ангид цэвэр функцүүд:

- `vibrationPattern(count)` → чичиргээний массив.
  - `1` → `[35]`
  - `n > 1` → n ширхэг цохилт: `[0, 35, 90, 35, ...]`
  - **дээд тал нь 5 цохилт** — хүн түүнээс олныг ялгаж мэдрэхгүй, урт чичиргээ
    бухимдуулна. `count` 5-аас их бол 5 цохилт өгнө.
  - `count <= 0` → `[]`
- `pokeDelta(prevTotal, nextTotal)` → шинэ товшилтын тоо.
  - хэвийн: `nextTotal − prevTotal`
  - `nextTotal <= prevTotal` (тоолуур дахин тохируулагдсан эсвэл өөрчлөгдөөгүй) → `0`
- `canVibrate()` → `typeof navigator.vibrate === "function"`
- `buzzMessage(name, count)` → мэдэгдлийн текст. `count > 1` бол
  `"{name} чамайг {count} удаа товшлоо 💕"`, эс бөгөөс `"{name} чамайг товшлоо 💕"`.
  (Одоогийн `pokeMessage`-ийг энд шилжүүлж, `poke.js` дотроос хасна.)

### `src/chibi/poke.js` (өөрчлөлт)

`POKE_THROTTLE_MS`, `pending`, `lastSentAt` бүгд хасагдана. `pokeMessage` нь
`buzz.js` руу `buzzMessage` нэрээр шилжинэ; `poke.js` түүнийг импортлон
хэрэглэнэ. `createPokeSender` нь товшилт бүрд:

- `writeDoc({ at })` дуудна
- `sendPush({ title: "Ankomeow", body: buzzMessage(partnerName, 1), tag: "poke-" + at })`
  дуудна — `tag` давтагдахгүй тул товшилт бүр тусдаа мэдэгдэл болно

`body` дэх тоо үргэлж `1`: товшилт бүр тусдаа илгээгддэг тул багцлах зүйл байхгүй.
`buzzMessage`-ийн олон тооны хувилбар нь **хүлээн авах тал** дээр хэрэглэгддэг —
хэд хэдэн товшилт нэг snapshot-д нийлж ирэхэд.

Аль нэг нь шидсэн ч нөгөө нь болон UI зогсохгүй (одоогийн `catch` загвар хэвээр).

### `tovlorokh-khamtrakh.jsx` (өөрчлөлт)

**Илгээх тал** — `writeDoc` нь `total`-ыг нэмэгдүүлнэ:

```js
setDoc(doc(db, "rooms", CHAT_ROOM, "pokes", partnerKey), {
  from: accountKey, total: increment(1), at: serverTimestamp(),
}, { merge: true })
```

`increment`-ийг `firebase/firestore`-оос импортлоно. `merge: true` шаардлагатай —
эс бөгөөс `increment` нь баримтыг бүтнээр нь дарж бичихэд утгагүй болно.

**Хүлээн авах тал** — одоогийн `onSnapshot` effect өргөжинө:

```js
const firstSnapRef = useRef(true);   // mount-ын дараах анхны snapshot уу?
```

Snapshot ирэхэд:

1. `total = snap.data()?.total ?? 0`
2. `prev = Number(localStorage.getItem("ankomeow-poke-total") || 0)`
3. `localStorage.setItem("ankomeow-poke-total", String(total))`
4. Хэрэв `firstSnapRef.current` бол `firstSnapRef.current = false` болгоод
   **чичиргээ ба мэдэгдэл алгасна**
5. Эс бөгөөс `delta = pokeDelta(prev, total)`; `delta > 0` бол:
   - `canVibrate()` → `navigator.vibrate(vibrationPattern(delta))`
   - эс бөгөөс → `navigator.serviceWorker.ready.then((reg) =>
     reg.showNotification("Ankomeow", { body: buzzMessage(partnerName, delta),
     icon: "./icon-192.png", tag: "poke-" + total }))`, `.catch(() => {})`-тэй

**Chibi-гийн баяр** нь одоо байгаа `at`/`ankomeow-last-poke` логикоороо хэвээр
ажиллана — үүнийг хөндөхгүй. Ингэснээр `setChibiHappyAt` нэг л газраас
дуудагдаж, анхны snapshot дээр ч (апп нээхэд хуучин товшилт байвал) chibi
баярласан хэвээр үлдэнэ. Шинэ delta логик нь **зөвхөн** чичиргээ болон iOS-ийн
мэдэгдлийг хариуцна.

**`PUSH_FOREGROUND` боловсруулагч** — poke-д нэмэлт үйлдэл хийхгүй. Апп нээлттэй
үед Firestore аль хэдийн хариу үйлдлийг өгсөн байна; push-аас дахин чичрүүлбэл
давхардана. Одоогийн `chat`-ын салбар хэвээр.

### `public/sw.js` (өөрчлөлт)

`showNotification` тохиргоонд нэмнэ:

```js
vibrate: [0, 40, 60, 40],
```

Android дээр ажиллана, iOS дээр үл тоогдоно (алдаа гарахгүй).

## Ирмэгийн тохиолдлууд

1. **Апп нээх үеийн хуучин товшилт** — mount-ын дараах анхны snapshot чичиргээ ба
   мэдэгдэл гаргахгүй, зөвхөн тоолуурыг тэмдэглэнэ. Эс тэгвэл өглөө бүр шөнийн
   товшилтуудаар чичрэх болно. Chibi-гийн баяр нь тусдаа логиктой тул хэвээр гарна.
2. **Өөрийн товшилт өөрт эргэж ирэхгүй** — `pokes/{partnerKey}` руу бичээд
   `pokes/{accountKey}`-г сонсдог тул тусгаарлагдсан. `api/notify` мөн
   `to === sender` бол таслана.
3. **Олон төхөөрөмж / таб** — `total` нь Firestore-д нэгдсэн, «сүүлд харсан» нь
   төхөөрөмж бүрийн localStorage-д. Төхөөрөмж бүр өөрийн delta-г зөв бодно.
4. **Шинэ төхөөрөмж (localStorage хоосон)** — `prev = 0`, гэхдээ анхны snapshot
   дүрмээр чичиргээ гарахгүй, зөвхөн тоолуур тэмдэглэгдэнэ.
5. **Чичиргээ чимээгүй бүтэлгүйтэх** — Android дээр хэрэглэгч хуудастай огт
   харилцаагүй бол `navigator.vibrate` `false` буцаана. Алдаа шидэхгүй, үл тооно.
6. **Мэдэгдлийн зөвшөөрөлгүй iPhone** — `showNotification` унана → `catch`,
   chibi-гийн үсрэлт л үлдэнэ.
7. **Сүлжээгүй** — Firestore-ийн persistence бичилтийг дараалалд оруулж, холбогдох
   үед илгээнэ. Push `fetch` унавал `notifyPartner` аль хэдийн залгидаг.
8. **`total` талбаргүй хуучин баримт** — `?? 0`.

## Тест

Одоо байгаа 54 тест дээр нэмэгдэнэ. Бүгд vitest, `environment: "node"`.

**`src/chibi/buzz.test.js` (шинэ)**

- `vibrationPattern(1)` → `[35]`
- `vibrationPattern(3)` → 3 цохилт
- `vibrationPattern(10)` → 5 цохилт (дээд хязгаар)
- `vibrationPattern(0)` болон сөрөг → `[]`
- `pokeDelta(5, 8)` → `3`
- `pokeDelta(5, 5)` → `0`
- `pokeDelta(9, 2)` → `0` (тоолуур дахин тохируулагдсан)
- `pokeDelta(0, 4)` → `4`
- `buzzMessage("Neko", 1)` болон `buzzMessage("Neko", 3)`

**`src/chibi/poke.test.js` (шинэчлэлт)**

Throttle-ийн тестүүд хасагдаж, оронд нь:

- 3 товшилт → `writeDoc` 3 удаа, `sendPush` 3 удаа дуудагдана
- `sendPush`-д өгсөн `tag`-ууд хоорондоо давтагдахгүй
- `sendPush` шидсэн ч `writeDoc` дуудагдсан хэвээр, `poke()` алдаа гаргахгүй
- `writeDoc` шидсэн ч `sendPush` дуудагдсан хэвээр

## Хамрахгүй зүйлс

- Чичиргээг унтраах тохиргоо — хэрэгцээ гарвал дараа нэмнэ
- Товшилтын түүх эсвэл статистик
- iOS дээр чичиргээг өөрөөр шийдэх оролдлого — платформын хязгаарлалт
