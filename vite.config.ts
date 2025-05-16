import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: ["1725-154-192-40-100.ngrok-free.app","700c-2407-d000-b-75bd-c5fd-6178-3c0c-9d90.ngrok-free.app"],
  },
  plugins: [
    react(),
    mode === "development" &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
