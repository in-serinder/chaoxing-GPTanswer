import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // 往后非原始内容
  build: {
    lib: {
      entry: "src/main.ts",
      name: "ChaoxingGPT", // 全局变量名
      formats: ["iife"],
      fileName: () => "index.js",
    },
    rollupOptions: {
      external: [],
      output: {
        // globals: {
        //   vue: "Vue",
        //   pinia: "Pinia",
        //   "vue-demi": "VueDememi",
        // },
        inlineDynamicImports: true,
      },
    },
    commonjsOptions: {
      include: [/node_modules/],
    },
  },
});
