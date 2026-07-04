import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ mode }) => {
  const unityBuild = mode === "unity" || process.env.VITE_UNITY_WEBVIEW === "1";

  return {
    base: unityBuild ? "./" : "/",
    plugins: [react(), tailwindcss(), tsconfigPaths()],
    define: {
      "import.meta.env.VITE_UNITY_WEBVIEW": JSON.stringify(unityBuild ? "1" : ""),
      "import.meta.env.VITE_SHOW_TECH": JSON.stringify(process.env.VITE_SHOW_TECH ?? ""),
    },
    server: {
      host: "127.0.0.1",
      port: 4177,
    },
    build: {
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            const normalized = id.replaceAll("\\", "/");
            if (
              normalized.includes("/node_modules/react/") ||
              normalized.includes("/node_modules/react-dom/") ||
              normalized.includes("/node_modules/react-router-dom/")
            ) {
              return "react";
            }
            if (normalized.includes("/node_modules/framer-motion/")) {
              return "motion";
            }
            if (
              normalized.includes("/node_modules/@radix-ui/react-slot/") ||
              normalized.includes("/node_modules/lucide-react/")
            ) {
              return "ui";
            }
          },
        },
      },
    },
  };
});
