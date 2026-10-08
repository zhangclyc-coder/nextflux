import path from "path";
import { fileURLToPath } from "url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa"; // ← 新增

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // ← 以下整块新增
    VitePWA({
      registerType: "autoUpdate",
      // 复用手改过的 public/site.webmanifest，不让插件再生成一份
      manifest: false,
      includeAssets: [
        "favicon.svg",
        "apple-touch-icon.png",
        "web-app-manifest-192x192.png",
        "web-app-manifest-512x512.png",
      ],
      workbox: {
        // 预缓存应用壳：HTML/JS/CSS/字体/图标
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // SPA 必配：离线打开任意路径回退到 index.html
        navigateFallback: "/index.html",
        // Miniflux API 路径不走导航回退，交给下面的 runtimeCaching
        navigateFallbackDenylist: [/^\/v1\//],
        runtimeCaching: [
          {
            // Miniflux API：NetworkFirst，断网回退缓存
            // 不写域名，纯路径匹配，仓库里不暴露你的 Miniflux 地址
            urlPattern: ({ url }) => url.pathname.startsWith("/v1/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "miniflux-api-cache",
              expiration: {
                maxEntries: 300,
                maxAgeSeconds: 60 * 60 * 24 * 7,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // 文章配图：CacheFirst，二次阅读不重复请求
            urlPattern: ({ request }) => request.destination === "image",
            handler: "CacheFirst",
            options: {
              cacheName: "nextflux-image-cache",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    chunkSizeWarningLimit: 750,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": ["@base-ui/react", "lucide-react"],
          "vendor-motion": ["framer-motion"],
          "vendor-data": ["axios", "dexie", "nanostores"],
          "vendor-i18n": ["i18next", "react-i18next"],
          "vendor-app": [
            "dayjs",
            "lodash",
            "m3-ripple",
            "react-virtuoso",
            "sonner",
          ],
        },
      },
    },
  },
});
