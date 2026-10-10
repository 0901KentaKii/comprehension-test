import { useState } from "react";
import type { TestController } from "../../hooks/useTestSession";
import { simulateFailure } from "../../services/submitTest";

const PRESETS: { label: string; seconds: number }[] = [
  { label: "残り 10:05", seconds: 605 },
  { label: "残り 5:05", seconds: 305 },
  { label: "残り 1:05", seconds: 65 },
  { label: "残り 0:05", seconds: 5 },
  { label: "超過 3:20", seconds: -200 },
];

/**
 * デザイン確認用の補助ツール (デザイン確認モードでのみ表示)。
 * 30分待たなくても、残り時間の警告表示や超過時間表示を各デザインで確認できる。
 */
export function PreviewTools({ controller }: { controller: TestController }) {
  const { session, result, debugSetRemaining, reset } = controller;
  const [failNext, setFailNext] = useState(simulateFailure.get);
  const inProgress = session?.status === "in_progress";

  return (
    <aside className="preview-tools" aria-label="デザイン確認ツール">
      <details>
        <summary>デザイン確認ツール(本番では表示されません)</summary>
        <div className="preview-tools__body">
          <div className="preview-tools__row">
            <span className="preview-tools__label">タイマー表示を切り替える</span>
            {PRESETS.map((p) => (
              <button key={p.label} type="button" disabled={!inProgress} onClick={() => debugSetRemaining(p.seconds)}>
                {p.label}
              </button>
            ))}
          </div>
          <div className="preview-tools__row">
            <label>
              <input
                type="checkbox"
                checked={failNext}
                onChange={(e) => {
                  simulateFailure.set(e.target.checked);
                  setFailNext(e.target.checked);
                }}
              />
              次回の送信を失敗させる(送信失敗画面の確認)
            </label>
            <button type="button" disabled={!session && !result} onClick={reset}>
              受験データを消して最初から
            </button>
          </div>
          {!inProgress && <p className="preview-tools__hint">タイマーの切り替えはテスト開始後(回答中)に使用できます。</p>}
        </div>
      </details>
    </aside>
  );
}
