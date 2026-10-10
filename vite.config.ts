import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages の公開先 https://<ユーザー名>.github.io/comprehension-test/ に合わせて、
// ビルド時 (npm run build / npm run preview) は base をリポジトリ名のサブパスにする。
// 開発時 (npm run dev) はこれまでどおり http://localhost:5173/ で開ける。
// リポジトリ名を変更した場合は、ここも合わせて変更すること。
// (ルーティングは HashRouter のため、サブパス配下でもリロードで 404 にならない)
export default defineConfig(({ command, isPreview }) => ({
  base: command === "build" || isPreview ? "/comprehension-test/" : "/",
  plugins: [react()],
}));
