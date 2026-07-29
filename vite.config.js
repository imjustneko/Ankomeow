import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
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

      /* img/ доторх зургууд нийтдээ ~1.1MB. Бүгдийг precache хийвэл SW суулгах
         явц хүндэрнэ. Тиймээс зөвхөн бүрхүүлд шаардлагатай жижиг зургуудыг (лого,
         nav icon) урьдчилан хадгална — үлдсэн нь эхэлж үзсэн хойноо runtime-д кэшлэгдэнэ. */
      const PRECACHE_IMG_MAX = 10 * 1024;
      let images = [];
      try {
        const imgDir = path.resolve(outDir, "img");
        const names = await readdir(imgDir);
        const picked = await Promise.all(
          names.map(async (f) => {
            const { size } = await stat(path.join(imgDir, f));
            return size <= PRECACHE_IMG_MAX ? "./img/" + f : null;
          })
        );
        images = picked.filter(Boolean);
      } catch {}

      const files = [
        "./",
        "./index.html",
        "./manifest.webmanifest",
        "./icon-192.png",
        "./icon-512.png",
        "./icon-maskable-512.png",
        ...new Set(assets),
        ...new Set(images),
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
  /* Firebase болон React-ыг тусад нь салгана. Аппын код өөрчлөгдөх бүрд эдгээр нь
     дахин татагдахгүй тул давтан зочлолт бараг шууд нээгдэнэ. */
  build: {
    /* Source map огт гаргахгүй — үүнгүйгээр bundle-аас эх кодыг сэргээх боломжгүй. */
    sourcemap: false,
    /* esbuild-ийн энгийн minify нэрийг бүрэн богиносгодоггүй тул terser ашиглана. */
    minify: "terser",
    terserOptions: {
      compress: {
        /* Production дээр console/debugger үлдэхгүй — дотоод логик задрахгүй. */
        drop_console: true,
        drop_debugger: true,
        passes: 2,
      },
      mangle: {
        /* Функц, хувьсагч, класс болон объектын дотоод property-нүүдийн нэрийг богиносгоно.
           Тайлбартай нэр алга болсноор кодыг уншиж ойлгоход хэцүү болно. */
        toplevel: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          react: ["react", "react-dom"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
        },
      },
    },
  },
  server: { port: 5183 },
  test: { environment: "node", include: ["src/**/*.test.js"] },
});
