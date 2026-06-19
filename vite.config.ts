import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "/src/style/variables.scss" as *;`,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/vue") || id.includes("node_modules/vue-router")) {
            return "vue";
          }
          if (id.includes("nodes_miner") || id.includes("nodes_botany")) {
            return "data-gathering";
          }
          if (id.includes("nodes_fates") || id.includes("nodes_huntpoints")) {
            return "data-world";
          }
          if (id.includes("nodes_sightseeing") || id.includes("nodes_aethercurrent") || id.includes("data_hunts") || id.includes("data_bluemage")) {
            return "data-content";
          }
        },
      },
    },
  },
});
