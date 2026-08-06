/* Хамтрагчийн өдрийн тоонуудыг халамж болгож хувиргана.

   Нүүр дэлгэц дээр "Ус 0 мл, Дэлгэц 3ц 20м" гэсэн тоо харагддаг ч тэр нь юу ч
   бодогдуулдаггүй байв. Энэ модуль тэр тоонуудаас "юу хэлэх вэ" гэдгийг гаргана.

   Хоёр зарчим:
     1. Цаг харгалзана. Өглөө 8 цагт "ус уугаагүй" гэдэг нь мэдээлэл биш —
        хэн ч тэр цагт уугаагүй байна. Үдээс хойш л утга гарна.
     2. Нэг л зөвлөмж. Гурвуулаа зэрэг гарвал халамж биш, зэмлэл болно. */

/* Хамгийн чухлаас нь эрэмбэлсэн дүрмүүд. Эхний тохирсон нь л гарна. */
const RULES = [
  {
    key: "late",
    /* Шөнө оройтож дэлгэц ширтэх нь бусдаас илүү анхаарал татна */
    when: ({ hour, screenMin }) => hour >= 22 && screenMin >= 120,
    text: "Оройтож дэлгэц ширтэж байна",
    cta: "Амраарай гэж хэлэх",
    message: "Амраарай, унтах цаг боллоо 🌙",
  },
  {
    key: "noWater",
    when: ({ hour, ml }) => hour >= 13 && ml === 0,
    text: "Өнөөдөр ус уугаагүй байна",
    cta: "Сануулах",
    message: "Ус уугаарай шүү 💧",
  },
  {
    key: "lowWater",
    when: ({ hour, ml, goal }) => hour >= 18 && goal > 0 && ml > 0 && ml < goal * 0.5,
    text: "Ус дутуу уужээ",
    cta: "Сануулах",
    message: "Ус уугаарай шүү 💧",
  },
  {
    key: "listStuck",
    when: ({ hour, done, total }) => hour >= 20 && total > 0 && done === 0,
    text: "Жагсаалтаа эхлээгүй байна",
    cta: "Дэмжих",
    message: "Чи чадна шүү 💪",
  },
  {
    key: "allDone",
    /* Сайн өдрийг ч анзаарах ёстой — зөвхөн дутууг заавал халамж болохгүй */
    when: ({ ml, goal, done, total }) => goal > 0 && ml >= goal && total > 0 && done === total,
    text: "Өнөөдрийн зорилгоо бүрэн биелүүлжээ",
    cta: "Баярлуулах",
    message: "Бүх зорилгоо биелүүллээ шүү, баяр хүргэе 🎉",
  },
];

/* Хамтрагчийн өгөгдлөөс нэг зөвлөмж. Юу ч хэлэх зүйлгүй бол null. */
export function careHint(partner, hour) {
  if (!partner) return null;
  const list = partner.items || [];
  const facts = {
    hour: Number(hour) || 0,
    ml: Number(partner.ml) || 0,
    goal: Number(partner.goal) || 0,
    done: list.filter((i) => i?.done).length,
    total: list.length,
    screenMin: (partner.screenApps || []).reduce((s, a) => s + (Number(a?.min) || 0), 0) + (Number(partner.appMin) || 0),
  };
  return RULES.find((r) => r.when(facts)) ?? null;
}
