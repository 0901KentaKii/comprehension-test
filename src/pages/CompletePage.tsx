import type { ReactNode } from "react";
import { CheckIcon } from "../components/common/Icons";
import { testConfig } from "../config/testConfig";
import type { DesignKit } from "../designs/types";
import type { TestResult } from "../types/test";
import { formatDuration } from "../utils/time";

interface Props {
  design: DesignKit;
  result: TestResult;
  back: ReactNode;
  /** 氏名入力の画面に戻る (同じ端末で次の人が受験するとき) */
  onRestart: () => void;
}

/**
 * 提出完了画面。
 * この時点で受験中データは端末から削除済み (自動ログアウト)。
 * 完了の記録も保存していないため、ページを開き直すと氏名入力の画面になる。
 */
export function CompletePage({ design, result, back, onRestart }: Props) {
  const score = testConfig.showScoreToExaminee ? result.score : undefined;

  return (
    <design.Frame title={testConfig.title} back={back}>
      <div className="panel panel--center">
        <span className="complete-mark" aria-hidden="true">
          <CheckIcon size={34} />
        </span>
        <h2 className="panel__title">テストを提出しました。</h2>
        <p className="complete-text">
          お疲れさまでした。
          <br />
          回答は正常に送信されました。
        </p>

        {testConfig.showTimeSummaryOnComplete && (
          <dl className={`timeinfo${result.timeExceeded ? " timeinfo--overtime" : ""}`}>
            <div>
              <dt>設定時間</dt>
              <dd>{result.durationMinutes}分</dd>
            </div>
            <div>
              <dt>所要時間</dt>
              <dd>{formatDuration(result.durationSeconds)}</dd>
            </div>
            {result.timeExceeded && (
              <div className="timeinfo__over">
                <dt>超過時間</dt>
                <dd>{formatDuration(result.overtimeSeconds)}</dd>
              </div>
            )}
          </dl>
        )}

        {score && (
          <p className="complete-score">
            選択式の正解数: <strong>{score.correctCount}</strong> / {score.choiceCount}(正答率{" "}
            {Math.round(score.correctRate * 100)}%)
          </p>
        )}

        {result.demo && (
          <p className="demo-note">
            デモ送信のため、今回の回答は Spreadsheet に保存されていません。
          </p>
        )}

        <p className="complete-close">
          この端末から氏名と回答は消去されました。この画面は閉じて構いません。
          <br />
          続けて別の方が受験する場合は、下のボタンを押してください。
        </p>

        <div className="actions actions--single">
          <button type="button" className="btn" onClick={onRestart}>
            最初の画面に戻る
          </button>
        </div>
      </div>
    </design.Frame>
  );
}
