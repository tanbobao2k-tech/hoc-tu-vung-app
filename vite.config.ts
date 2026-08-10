import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "/hoc-tu-vung-app/",
  plugins: [react()],
});
