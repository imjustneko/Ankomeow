/* Өдрийн сэтгэл санаа — нэг эможи.

   Урт статус бичих нь хүчин чармайлт шаарддаг тул ихэвчлэн хоосон үлддэг.
   Нэг товшилт нь өдөр бүр биелдэг: "өнөөдөр яаж байна" гэдгийг хамтрагч
   асуухаас өмнө мэднэ.

   Муу өдрийг зүгээр л харуулаад орхивол хагас ажил болно. Тиймээс сэтгэл
   санаа бүрд хамтрагч нь юу хэлж болохыг санал болгоно. */

export const MOODS = [
  { key: "great", emoji: "😄", label: "Сайхан",  reply: null },
  { key: "ok",    emoji: "🙂", label: "Зүгээр",  reply: null },
  { key: "meh",   emoji: "😐", label: "Тааруу",  reply: "Юу болов? Ярих уу 💬" },
  { key: "tired", emoji: "😮‍💨", label: "Ядарсан", reply: "Амраарай, би энд байна 🫂" },
  { key: "sad",   emoji: "🥺", label: "Гунигтай", reply: "Тэвэрмээр байна 🫂 Залгах уу?" },
];

export const moodByKey = (key) => MOODS.find((m) => m.key === key) ?? null;

/* Тухайн өдрийн сэтгэл санаа. Өчигдрийнхийг өнөөдөр харуулах нь худал
   мэдээлэл тул өдөр солигдоход өөрөө хоосорно. */
export function moodToday(profile, todayISO) {
  if (!profile?.mood || profile.moodDay !== todayISO) return null;
  return moodByKey(profile.mood);
}

/* Хамтрагчийн сэтгэл санаанд хариу үйлдэл санал болгох уу.
   Сайн байгаа хүнд "юу болов?" гэж бичих нь утгагүй. */
export const moodReply = (mood) => mood?.reply ?? null;
