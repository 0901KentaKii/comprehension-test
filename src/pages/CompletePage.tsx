import type { ReactNode } from "react";
import { CheckIcon } from "../components/common/Icons";
import { testConfig } from "../config/testConfig";
import type { DesignKit } from "../designs/types";
import type { TestResult } from "../types/test";

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

        {result.demo && (
          <p className="demo-note">
            デモ送信のため、今回の回答は Spreadsheet に保存されていません。
          </p>
        )}

        <div className="actions actions--single">
          <button type="button" className="btn" onClick={onRestart}>
            最初の画面に戻る
          </button>
        </div>
      </div>
    </design.Frame>
  );
}
