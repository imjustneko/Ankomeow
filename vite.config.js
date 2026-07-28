import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

/* Build-ийн дараа sw.js дотор precache жагсаалт болон хувилбарын хэшийг сольж бичнэ.
   Ингэснээр hash-тай asset бүр (index-XXXX.js гэх мэт) офлайн ажиллана. */
function swPrecachePlugin() {
  let outDir = "dist";
  return {
    name: "ankomeow-sw-precache",
    apply: "build",
    configResolved(cfg) {
      outDir = cfg.build.outDir;
    },
    async closeBundle() {
      const swPath = path.resolve(outDir, "sw.js");
      let sw;
      try {
        sw = await readFile(swPath, "utf8");
      } catch {
        return; // sw.js алга бол чимээгүй өнгөрнө
      }

      /* assets/ доторх бүх файл (dynamic chunk, gif.worker г.м. орно).
         gifs/ хавтас 20MB орчим тул precache хийхгүй — эхэлж үзсэн хойноо кэшлэгдэнэ. */
      let assets = [];
      try {
        assets = (await readdir(path.resolve(outDir, "assets"))).map((f) => "./assets/" + f);
      } catch {}

      const files = [
        "./",
        "./index.html",
        "./manifest.webmanifest",
        "./icon-192.png",
        "./icon-512.png",
        "./icon-maskable-512.png",
        ...new Set(assets),
      ];

      const version = createHash("sha256")
        .update(files.join("|"))
        .digest("hex")
        .slice(0, 8);

      sw = sw
        .replace('"__PRECACHE_MANIFEST__"', JSON.stringify(files))
        .replace("__BUILD_VERSION__", version);

      await writeFile(swPath, sw);
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [react(), swPrecachePlugin()],
  server: { port: 5183 },
  test: { environment: "node", include: ["src/**/*.test.js"] },
});
