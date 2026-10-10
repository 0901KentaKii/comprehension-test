import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
// 共通スタイルを先に読み込み、各デザインの CSS (App 以下で読み込み) が後から上書きできるようにする
import "./styles/base.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
