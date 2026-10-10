import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { testConfig } from "./config/testConfig";
import { DesignSelectionPage } from "./pages/DesignSelectionPage";
import { TestFlowPage } from "./pages/TestFlowPage";

/**
 * ルーティング。
 *   /            デザイン選択 (designPreviewMode が false の場合は defaultDesign のテスト)
 *   /design/1〜3 各デザインのテスト画面
 *
 * GitHub Pages はサーバー側のURL書き換えができないため HashRouter を使用する
 * (URLは …/#/design/1 の形式になり、リロードしても 404 にならない)。
 */
export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            testConfig.designPreviewMode ? (
              <DesignSelectionPage />
            ) : (
              <TestFlowPage designId={testConfig.defaultDesign} />
            )
          }
        />
        {testConfig.designPreviewMode && <Route path="/design/:designId" element={<TestFlowPage />} />}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
