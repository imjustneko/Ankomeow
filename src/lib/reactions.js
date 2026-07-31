/* Чатын реакц ба тэдгээрийн GIF сан. */

import { IMG } from "./assets.js";

export const REACTIONS = [
  { key: "poke", label: "Тэмтэрлээ", count: 8 },
  { key: "kiss", label: "Үнслээ", count: 8 },
  { key: "punch", label: "Цохилоо", count: 6 },
];
export const REACTION_GIFS = Object.fromEntries(
  REACTIONS.map((r) => [r.key, Array.from({ length: r.count }, (_, i) => `./gifs/${r.key}/${r.key}-${i + 1}.gif`)])
);
export const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢"];
