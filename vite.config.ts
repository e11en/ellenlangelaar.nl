import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Netlify publishes `build/` (the old Create React App output folder), so keep that name.
export default defineConfig({
  plugins: [react()],
  build: { outDir: "build" },
});
