/* Хамтрагч хаана хүртэл уншсаныг олно.

   `reads/{key}.at` нь тухайн хүн чатыг СҮҮЛД нээсэн мөчийг хадгална. Тэр
   мөчөөс өмнө илгээгдсэн бүх зурвасыг уншсан гэж үзнэ.

   Зөвхөн ӨӨРИЙН зурвасыг тоолно: хамтрагчийн өөрийнх нь бичсэн зурвас дээр
   "уншсан" гэж тэмдэглэх нь утгагүй. */

const toMs = (t) => (typeof t?.toMillis === "function" ? t.toMillis() : t ?? null);

/* Хамтрагчийн уншиж амжсан ХАМГИЙН СҮҮЛИЙН миний зурвасын id.
   Нэг ч зурвас уншаагүй бол null. */
export function seenUpToId(messages, seenAt, me) {
  const at = toMs(seenAt);
  if (at == null || !messages?.length) return null;

  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.sender !== me) continue;
    const t = toMs(m.createdAt);
    /* Цаг хараахан бичигдээгүй зурвас (илгээгдэж яваа) — уншсан байх боломжгүй */
    if (t != null && t <= at) return m.id;
  }
  return null;
}
