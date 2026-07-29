/* Домейн түгжээ — апп зөвхөн зөвшөөрөгдсөн хаяг дээр ажиллана.
 *
 * Хэн нэгэн dist/ хавтсыг хуулж аваад өөрийн хостинг дээр тавибал апп нээгдэхгүй.
 * Энэ нь кодыг нуудаггүй (браузерын код нуугдах боломжгүй), харин хуулбарыг
 * ашиглах боломжгүй болгодог. Жинхэнэ хамгаалалт нь Firebase талд:
 *   - API key-г HTTP referrer-ээр хязгаарлах
 *   - Authentication → Settings → Authorized domains-д зөвхөн энэ хаягийг үлдээх
 *   - api/notify.js дахь ALLOWED_ORIGIN
 *
 * Зөвшөөрөгдөх хаягуудыг .env файлд VITE_ALLOWED_HOSTS="a.com,b.com" гэж
 * дарж бичиж болно.
 */

const DEFAULT_HOSTS = ["imjustneko.github.io"];

/* Хөгжүүлэлт/локал тест — localhost, 127.0.0.1 болон дотоод сүлжээний IP.
   Утсан дээр LAN-аар турших үед ч ажиллах ёстой. */
const isLocalHost = (host) =>
  host === "localhost" ||
  host === "127.0.0.1" ||
  host === "[::1]" ||
  host.endsWith(".local") ||
  /^192\.168\.\d+\.\d+$/.test(host) ||
  /^10\.\d+\.\d+\.\d+$/.test(host) ||
  /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/.test(host);

export function allowedHosts() {
  const raw = import.meta.env?.VITE_ALLOWED_HOSTS;
  if (!raw) return DEFAULT_HOSTS;
  return raw
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedHost(host, hosts = allowedHosts()) {
  const h = String(host || "").toLowerCase();
  if (!h) return false; // file:// зэрэг hostname-гүй тохиолдол
  if (isLocalHost(h)) return true;
  return hosts.includes(h);
}

/* Зөвшөөрөөгүй хаяг дээр байвал root-ыг цэвэрлээд богино мэдэгдэл үлдээнэ. */
export function enforceHostLock(doc = document, host = location.hostname) {
  if (isAllowedHost(host)) return true;

  doc.body.innerHTML =
    '<div style="font:16px/1.6 system-ui,sans-serif;color:#5C4A3A;' +
    'display:flex;align-items:center;justify-content:center;' +
    'height:100vh;padding:24px;text-align:center">' +
    "Энэ апп зөвхөн албан ёсны хаягтаа ажиллана." +
    "</div>";
  return false;
}
