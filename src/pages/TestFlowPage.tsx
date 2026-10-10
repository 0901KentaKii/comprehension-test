import { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { BackToSelection } from "../components/common/BackToSelection";
import { testConfig } from "../config/testConfig";
import { findDesign } from "../designs";
import { useTestSession } from "../hooks/useTestSession";
import { CompletePage } from "./CompletePage";
import { ConfirmPage } from "./ConfirmPage";
import { TestPage } from "./TestPage";
import { UserInfoPage } from "./UserInfoPage";

/**
 * テスト全体の流れ (受験者情報 → 回答 → 確認 → 完了) を、指定されたデザインで表示する。
 * どの画面を出すかは保存されている受験状態から決まるため、リロードしても続きから再開できる。
 */
export function TestFlowPage({ designId }: { designId?: number }) {
  const params = useParams();
  const design = findDesign(designId ?? Number(params.designId));
  const controller = useTestSession();
  const { session, result } = controller;
  const preview = testConfig.designPreviewMode;

  useEffect(() => {
    document.title = testConfig.title;
  }, []);

  if (!design) return <Navigate to="/" replace />;

  const back = preview ? <BackToSelection /> : null;

  let screen;
  if (session) {
    screen =
      session.view === "confirm" || session.status !== "in_progress" ? (
        <ConfirmPage design={design} controller={controller} session={session} back={back} />
      ) : (
        <TestPage design={design} controller={controller} session={session} back={back} />
      );
  } else if (result) {
    screen = (
      <CompletePage design={design} result={result} back={back} onRestart={controller.reset} />
    );
  } else {
    screen = <UserInfoPage design={design} controller={controller} back={back} />;
  }

  return <div className={`design ${design.className}`}>{screen}</div>;
}
