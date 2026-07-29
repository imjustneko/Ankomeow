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
  └─ Firestore  pokes/{partnerKey}: { total: increment(1), from, at }   ← товшилт бүрд
  └─ POST /api/notify   tag: "poke-<at>"                                ← 800мс цонхоор нэгтгэсэн

Хүлээн авагч — апп НЭЭЛТТЭЙ:
  onSnapshot pokes/{accountKey}
    → baseline зөвхөн серверийн (fromCache === false) эхний snapshot дээр тогтооно
    → баримт бэлэн бол: delta = total − (сүүлд харсан)
    ├─ canVibrate()                       : navigator.vibrate(vibrationPattern(delta)) + chibi үсрэх
    ├─ iOS, document.visibilityState === "visible" : registration.showNotification() + chibi үсрэх
    └─ iOS, апп нуугдмал                  : юу ч хийхгүй — sw.js аль хэдийн OS мэдэгдэл харуулсан

Хүлээн авагч — апп ХААЛТТАЙ:
  sw.js push → showNotification({ vibrate: [0, 40, 60, 40] })
```

**Push сувгийн нэгтгэлт (800мс, leading + trailing):** Firestore бичилт
товшилт бүрд яг нэг удаа хийгддэг хэвээр — зөвхөн push сувгийг өөрчилсөн.
Товшилт бүрд тусдаа push илгээвэл 10 хурдан товшилт 10 чимээгүй push болно;
WebKit чимээгүй push-д хязгаар тавьдаг бөгөөд хязгаар давсан subscription-ыг
цуцалдаг — энэ нь iPhone-ий цорын ганц чичиргээний суваг тул алдвал засах
аргагүй болно. Тиймээс: цонх хаалттай үед ирсэн товшилт шууд (0 хойшлолт)
нэг push илгээгээд 800мс цонх нээнэ; цонх нээлттэй үед ирсэн товшилтууд
зөвхөн тоолуурт нэмэгдэнэ; цонх дуусахад хуримтлагдсан тоо эерэг бол нэг
нэгтгэсэн push (тоо `buzzMessage`-ийн олон тооны хувилбараар) илгээгдэнэ.
Ганц товшилт → хойшлолгүй нэг push (апп удахгүй хаагдаж магадгүй тул
чухал). Арван хурдан товшилт → нэг шууд + нэг нэгтгэсэн, нийт хоёр push.

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
- `shouldBuzz({ fromCache, baselineReady, prev, total, canVibrate, visible })` →
  `{ action, delta, nextBaselineReady }`. Хүлээн авах талын шийдвэрийн
  логикийг цэвэр функц болгож гаргасан (2500 мөрт JSX дотор шууд бичихийн
  оронд) — тестээр бүрэн хамрагдана. `canVibrate`, `visible`-ийг plain
  boolean хэлбэрээр гаднаас авдаг тул модуль DOM-оос ангид хэвээр:
  - `baselineReady === false` бол `action: "none"`, `delta: 0`,
    `nextBaselineReady: !fromCache` — baseline зөвхөн серверийн snapshot
    ирэхэд бэлэн болно.
  - Эс бөгөөс `nextBaselineReady: true`, `delta = pokeDelta(prev, total)`:
    `delta <= 0` → `"none"`; `canVibrate` → `"vibrate"`; `visible` → `"notify"`;
    үгүй бол `"none"` (sw.js хариуцна).

### `src/chibi/poke.js` (өөрчлөлт)

`POKE_THROTTLE_MS`, `pending`, `lastSentAt` бүгд хасагдана. `pokeMessage` нь
`buzz.js` руу `buzzMessage` нэрээр шилжинэ; `poke.js` түүнийг импортлон
хэрэглэнэ. `createPokeSender` нь:

- Firestore: товшилт бүрд яг нэг удаа `writeDoc({ at })` дуудна — batching
  байхгүй.
- Push: `PUSH_COALESCE_MS = 800` мс цонхтой leading + trailing нэгтгэлт.
  Цонх хаалттай үед ирсэн товшилт шууд нэг push илгээгээд цонх нээнэ; цонх
  нээлттэй үед ирсэн товшилтууд зөвхөн тоолуурт нэмэгдэнэ; цонх дуусахад
  хуримтлагдсан тоо эерэг бол `sendPush({ title: "Ankomeow",
  body: buzzMessage(partnerName, count), tag: "poke-" + at })` — энд `at`
  тухайн push-ыг өдөөсөн товшилтын хугацаа, `count` нь 1 (шууд илгээлт) эсвэл
  цонхны хуримтлал (нэгтгэсэн илгээлт).

`buzzMessage`-ийн олон тооны хувилбар одоо энд өөрөө хэрэглэгддэг — нэгтгэсэн
push хэд хэдэн товшилтыг илэрхийлж болох тул.

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

**Хүлээн авах тал** — одоогийн `onSnapshot` effect `shouldBuzz`-ийг дуудна:

```js
const pokeBaselineReadyRef = useRef(false);
```

Snapshot ирэхэд:

1. `total = snap.data()?.total ?? 0`
2. `prev = Number(localStorage.getItem("ankomeow-poke-total") || 0)`
3. `localStorage.setItem("ankomeow-poke-total", String(total))` — **шинэ
   `total`-ыг бичихээс өмнө** `prev`-ийг заавал уншина
4. `shouldBuzz({ fromCache: snap.metadata.fromCache, baselineReady:
   pokeBaselineReadyRef.current, prev, total, canVibrate: canVibrate(),
   visible: document.visibilityState === "visible" })`
5. `pokeBaselineReadyRef.current = nextBaselineReady`
6. `action` дээр switch хийнэ:
   - `"vibrate"` → `navigator.vibrate(vibrationPattern(delta))`
   - `"notify"` → `navigator.serviceWorker.ready.then((reg) =>
     reg.showNotification("Ankomeow", { body: buzzMessage(partnerName, delta),
     icon: "./icon-192.png", tag: "poke-" + total }))`, `.catch(() => {})`-тэй
   - `"none"` → юу ч хийхгүй

`"notify"` (iOS-ийн апп доторх мэдэгдэл) зөвхөн `document.visibilityState
=== "visible"` үед л сонгогдоно (`shouldBuzz`-ийн `visible` дамжуулалт
дээр). Апп нуугдмал (дэлгэц түгжигдсэн, tab арын дэвсгэрт) үед `shouldBuzz`
`"none"` буцаана — sw.js аль хэдийн OS мэдэгдлийг харуулсан байх тул давхар
мэдэгдэл гаргахгүйн тулд.

**Chibi-гийн баяр** нь одоо байгаа `at`/`ankomeow-last-poke` логикоороо хэвээр
ажиллана — энэ нь `shouldBuzz`-д ор**оогүй**, тусад нь бичигдсэн хэвээр.
Ингэснээр `setChibiHappyAt` нэг л газраас дуудагдаж, анхны snapshot дээр ч
(апп нээхэд хуучин товшилт байвал) chibi баярласан хэвээр үлдэнэ. `shouldBuzz`
нь **зөвхөн** чичиргээ болон iOS-ийн мэдэгдлийг хариуцна.

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

1. **Апп нээх үеийн хуучин товшилт** — baseline зөвхөн **серверийн** эхний
   snapshot (`snap.metadata.fromCache === false`) дээр тогтооно, ямар ч эхний
   snapshot дээр биш. Учир нь Firestore `persistentLocalCache` ашигладаг тул
   `onSnapshot` эхлээд КЭШЛЭГДСЭН баримтаар, дараа нь СЕРВЕРИЙН баримтаар
   дуудагдана; энгийн "эхний snapshot" гэсэн флаг ашиглавал кэшийн snapshot
   дээр л baseline тогтоод, дараагийн (кэшээс арай хожуу ирэх ч ялгаагүй хуучин)
   серверийн snapshot-ыг "шинэ" товшилт мэт үзэж, апп нээх бүрд шөнийн
   товшилтуудаар чичрэх болно. Chibi-гийн баяр нь тусдаа логиктой (`shouldBuzz`-д
   ороогүй) тул baseline-аас үл хамааран хэвээр гарна.
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
- `shouldBuzz` — салбар бүрд: baseline бэлэн бус + кэш → none/бэлэн бус;
  baseline бэлэн бус + сервер → none/бэлэн; baseline бэлэн + delta ≤ 0 →
  none; canVibrate → vibrate; canVibrate биш + visible → notify; canVibrate
  биш + нуугдмал → none; мөн кэш → сервер → шинэ товшилт дараалал бүхэлдээ

**`src/chibi/poke.test.js` (шинэчлэлт — 800мс нэгтгэлтийн тестүүд)**

`vi.useFakeTimers()` ашиглана:

- ганц товшилт → нэг push шууд (хойшлолгүй) илгээгдэнэ
- цонх дотор ирсэн 3 товшилт → яг 2 push (нэг шууд, тоо 1; нэг нэгтгэсэн,
  тоо 2)
- нэгтгэсэн push-ийн `body` олон тооны хувилбар ашиглана
- цонх хаагдсаны дараах товшилт шинэ цонхтой шинэ шууд push эхлүүлнэ
- дээрх бүх тохиолдолд `writeDoc` товшилт бүрд яг нэг удаа дуудагдана
- `sendPush`-д өгсөн `tag`-ууд хоорондоо давтагдахгүй
- `sendPush` шидсэн ч `writeDoc` дуудагдсан хэвээр, `poke()` алдаа гаргахгүй
- `writeDoc` шидсэн ч `sendPush` дуудагдсан хэвээр

## Хамрахгүй зүйлс

- Чичиргээг унтраах тохиргоо — хэрэгцээ гарвал дараа нэмнэ
- Товшилтын түүх эсвэл статистик
- iOS дээр чичиргээг өөрөөр шийдэх оролдлого — платформын хязгаарлалт
