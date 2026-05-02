import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  build: {
    // Remove source maps in production to prevent code inspection
    sourcemap: false,
    // Aggressive minification with terser
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: mode === "production",
        drop_debugger: true,
        passes: 2,
        dead_code: true,
        conditionals: true,
        evaluate: true,
        unused: true,
      },
      mangle: {
        toplevel: true,
        properties: {
          regex: /^_/, // Mangle properties starting with _
        },
      },
      format: {
        comments: false,
      },
    },
    // Split sensitive code into separate chunks with obfuscated names
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("lib/matrizes")) {
            return "m-" + Math.random().toString(36).substring(2, 6);
          }
          if (id.includes("lib/fechamento") || id.includes("lib/desdobramento")) {
            return "e-" + Math.random().toString(36).substring(2, 6);
          }
        },
        // Obfuscate chunk file names
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name?.startsWith("m-") || chunkInfo.name?.startsWith("e-")) {
            return `assets/[hash].js`;
          }
          return `assets/[name]-[hash].js`;
        },
      },
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "robots.txt", "logo.png", "pwa-192x192.png", "pwa-512x512.png"],
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallbackDenylist: [/^\/~oauth/, /^\/push\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,woff,ttf}"],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "images-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "fonts-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 365 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /\.(?:js|css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "static-resources",
              expiration: {
                maxEntries: 60,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60,
              },
            },
          },
        ],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
      },
      manifest: {
        name: "Palpite Tech - Análise de Loterias",
        short_name: "Palpite Tech",
        description: "As melhores ferramentas de análise para Lotofácil, Mega-Sena e Dupla Sena. Resultados, tendências, gerador e muito mais.",
        theme_color: "#1e3a5f",
        background_color: "#1e3a5f",
        display: "standalone",
        orientation: "portrait",
        start_url: "/admin",
        scope: "/",
        categories: ["entertainment", "utilities"],
        icons: [
          { src: "/pwa-72x72.png", sizes: "72x72", type: "image/png" },
          { src: "/pwa-96x96.png", sizes: "96x96", type: "image/png" },
          { src: "/pwa-128x128.png", sizes: "128x128", type: "image/png" },
          { src: "/pwa-144x144.png", sizes: "144x144", type: "image/png" },
          { src: "/pwa-152x152.png", sizes: "152x152", type: "image/png" },
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-384x384.png", sizes: "384x384", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
