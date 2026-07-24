import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig(() => ({
  plugins: [
    tailwindcss(),
    react(),
    visualizer({
      filename: 'stats.html',
      open: false,
      gzip: true,
    }),
  ],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: {
      "src": path.resolve(__dirname, "src"),
      "layouts": path.resolve(__dirname, "src/layouts"),
      "components": path.resolve(__dirname, "src/components"),
      "context": path.resolve(__dirname, "src/context"),
      "assets": path.resolve(__dirname, "src/assets"),
      "i18n": path.resolve(__dirname, "src/i18n"),
      "App": path.resolve(__dirname, "src/App"),
      "examples": path.resolve(__dirname, "src/examples"),
      "routes": path.resolve(__dirname, "src/routes"),
      "api": path.resolve(__dirname, "src/api"),
      "lib": path.resolve(__dirname, "src/lib"),
      "confiuration": path.resolve(__dirname, "src/confiuration"),
      "utils": path.resolve(__dirname, "src/utils"),
      "platform": path.resolve(__dirname, "src/platform"),
      "luigi": path.resolve(__dirname, "src/luigi.ts"),
      "config": path.resolve(__dirname, "src/config"),
      "locales": path.resolve(__dirname, "src/locales"),
      "page.routes": path.resolve(__dirname, "src/page.routes"),
    },
  },
  server: {
    port: 3000,
    headers: {
      'Content-Security-Policy':
        "frame-ancestors 'self' http://localhost:8080 http://localhost:5173 https://*.vercel.app",
    },
    proxy: {
      "/api": {
        target: "https://api.vesa-tech.com",
        changeOrigin: true,
        secure: true,
      },
      "/tcmb-kurlar": {
        target: "https://www.tcmb.gov.tr",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/tcmb-kurlar/, "/kurlar"),
      },
    },
  },
  define: {
    global: 'window',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  build: {
    // Giris modulunun tum async vendor parcalarini <link rel="modulepreload"> ile onceden cekmeyi kapatir.
    modulePreload: false,
    target: 'es2020',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.info', 'console.debug', 'console.warn'],
        passes: 2,
      },
      mangle: { safari10: true },
      format: { comments: false },
    },
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, '/');

          if (normalized.includes('/src/api/generated/')) return 'api-generated';

          // cn + bağımlılıkları: login/cover lazy chunk ana index.js'i çekmesin diye ayrı parça
          if (
            normalized.includes('node_modules/clsx/') ||
            normalized.includes('node_modules/tailwind-merge/')
          ) {
            return 'shared-cn';
          }
          if (normalized.includes('/src/lib/utils')) return 'shared-cn';

          if (!normalized.includes('node_modules')) return;

          if (
            id.includes('/node_modules/react/') ||
            id.includes('/node_modules/react-dom/') ||
            id.includes('/node_modules/react-router-dom/') ||
            id.includes('/node_modules/react-router/')
          ) {
            return 'vendor-react';
          }

          // Not: React kullanan paketleri (UI5, Formio, MSAL, react-query, Syncfusion, …) ayri
          // manual chunk'a zorlamak Rolldown/Vite 8'de React'in yanlis parcaya tasinmasina ve
          // giris sayfasinin MB seviyesinde vendor indirmesine yol aciyordu.

          if (
            id.includes('/xlsx/') ||
            id.includes('/jspdf/') ||
            id.includes('/html2canvas/')
          ) {
            return 'vendor-export';
          }
        },
      },
    },
  },
}));
