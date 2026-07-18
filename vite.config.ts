import { defineConfig, type Plugin } from "vite";
import vue from "@vitejs/plugin-vue";

function lodestoneDevApi(): Plugin {
  return {
    name: "ffxiv-radar:lodestone-dev-api",
    configureServer(server) {
      server.middlewares.use("/api/character", async (req, res) => {
        if (req.method && req.method !== "GET") {
          res.statusCode = 405;
          res.setHeader("Allow", "GET");
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Method not allowed" }));
          return;
        }

        try {
          const mod = await server.ssrLoadModule("/api/_lodestone.ts");
          const data = await mod.getCharacter();
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify(data));
        } catch (err: any) {
          console.error("[vite:lodestone-dev-api] failed to load Lodestone profile", err);
          res.statusCode = 502;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: err?.message ?? "Failed to load character profile" }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [vue(), lodestoneDevApi()],
  server: {
    port: 6020,
    proxy: {
    '/s3/': {
      target: 'https://ffxivradar-952854879717-ca-central-1-an.s3.ca-central-1.amazonaws.com/',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/s3/, '')
    }
  }
  },
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
