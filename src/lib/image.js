/* Зургийн шахалт — Firestore-ийн 1MB хязгаарт багтаахын тулд. */

/* dataUrl-ийн бодит хэмжээ. Зурвастай хамт хадгалснаар хүлээн авагч тал нь
   зураг ирэхээс ӨМНӨ байрыг нь барьж чадна — эс бөгөөс орлуулагчаас жинхэнэ
   хэмжээ рүү үсрэхэд чат доошоо шилжинэ. */
export const imageDims = (dataUrl) => new Promise((resolve) => {
  const img = new Image();
  img.onerror = () => resolve(null); /* хэмжээгүй ч зурвас илгээгдэх ёстой */
  img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight });
  img.src = dataUrl;
});

export const compressImage = (file, maxDim, quality) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = reject;
  reader.onload = () => {
    const img = new Image();
    img.onerror = reject;
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
});

export const compressDataUrl = (dataUrl, maxDim, quality) => new Promise((resolve, reject) => {
  const img = new Image();
  img.onerror = reject;
  img.onload = () => {
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w; canvas.height = h;
    canvas.getContext("2d").drawImage(img, 0, 0, w, h);
    resolve(canvas.toDataURL("image/jpeg", quality));
  };
  img.src = dataUrl;
});
