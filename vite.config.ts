import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base を相対パスにしているため、GitHub Pages のリポジトリ名に依存せず動作します。
// (ルーティングは HashRouter を使用)
export default defineConfig({
  base: "./",
  plugins: [react()],
});
