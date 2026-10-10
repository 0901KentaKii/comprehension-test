import { useState, type ReactNode } from "react";
import { AnswerSummary } from "../components/AnswerSummary";
import { ConfirmDialog } from "../components/common/ConfirmDialog";
import { AlertIcon } from "../components/common/Icons";
import { testConfig } from "../config/testConfig";
import type { DesignKit } from "../designs/types";
import type { TestController } from "../hooks/useTestSession";
import { useTestTimer } from "../hooks/useTestTimer";
import { isDemoSubmit } from "../services/submitTest";
import type { TestSession } from "../types/test";
import { formatClock, formatDuration } from "../utils/time";

interface Props {
  design: DesignKit;
  controller: TestController;
  session: TestSession;
  back: ReactNode;
}

/** 回答確認画面。提出・送信中・送信失敗 (再送信) の表示もここで行う */
export function ConfirmPage({ design, controller, session, back }: Props) {
  const { stats, submit, submitError } = controller;
  const timer = useTestTimer(session);
  const [dialogOpen, setDialogOpen] = useState(false);

  const isSubmitting = session.status === "submitting";
  const isFailed = session.status === "submit_failed";
  const isLocked = isSubmitting || isFailed;

  const handleConfirm = () => {
    setDialogOpen(false);
    void submit();
  };

  return (
    <design.Frame title={testConfig.title} back={isLocked ? null : back}>
      <div className="panel">
        <h2 className="panel__title">回答確認</h2>

        <AnswerSummary stats={stats} onJump={isLocked ? undefined : controller.goTo} />

        <dl className={`timeinfo${timer.isOvertime ? " timeinfo--overtime" : ""}`}>
          <div>
            <dt>設定時間</dt>
            <dd>{testConfig.durationMinutes}分</dd>
          </div>
          <div>
            <dt>{isLocked ? "所要時間" : "現在の経過時間"}</dt>
            <dd>{formatDuration(timer.elapsedSeconds)}</dd>
          </div>
          {timer.isOvertime ? (
            <div className="timeinfo__over">
              <dt>超過時間</dt>
              <dd>{formatDuration(timer.overtimeSeconds)}</dd>
            </div>
          ) : (
            <div>
              <dt>残り時間</dt>
              <dd>{formatClock(timer.remainingSeconds)}</dd>
            </div>
          )}
        </dl>

        {isFailed && (
          <div className="alert" role="alert">
            <span className="alert__icon">
              <AlertIcon size={22} />
            </span>
            <div>
              <p className="alert__title">回答の送信に失敗しました。</p>
              <p>回答内容はこの端末に保存されています。</p>
              <p>インターネット接続を確認し、もう一度送信してください。</p>
              {submitError && <p className="alert__detail">詳細: {submitError}</p>}
            </div>
          </div>
        )}

        {isSubmitting && (
          <p className="sending" role="status">
            回答を送信しています。画面を閉じずにお待ちください…
          </p>
        )}

        {isDemoSubmit && !isLocked && (
          <p className="demo-note">
            デモ送信: 送信先(VITE_GAS_ENDPOINT)が未設定のため、提出しても Spreadsheet には保存されません。
          </p>
        )}

        {isLocked ? (
          <div className="actions actions--single">
            <button type="button" className="btn btn--primary btn--lg" onClick={() => void submit()} disabled={isSubmitting}>
              {isSubmitting ? "送信中…" : "再送信"}
            </button>
          </div>
        ) : (
          <div className="actions">
            <button type="button" className="btn btn--lg" onClick={controller.backToTest}>
              回答に戻る
            </button>
            <button type="button" className="btn btn--primary btn--lg" onClick={() => setDialogOpen(true)}>
              テストを提出する
            </button>
          </div>
        )}
        {isLocked && <p className="locked-note">提出操作を行ったため、回答内容は変更できません。</p>}
      </div>

      <ConfirmDialog
        open={dialogOpen}
        title={stats.unanswered > 0 ? "未回答の問題があります。" : "テストを提出します。"}
        confirmLabel="提出する"
        cancelLabel="キャンセル"
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      >
        {stats.unanswered > 0 ? (
          <p>
            未回答が {stats.unanswered} 問あります。
            <br />
            このまま提出しますか？
          </p>
        ) : (
          <p>このまま提出しますか？</p>
        )}
        <p className="dialog__note">提出後は回答を修正できません。</p>
      </ConfirmDialog>
    </design.Frame>
  );
}
