import type { ReactNode } from "react";
import { testConfig } from "../config/testConfig";
import type { DesignKit } from "../designs/types";
import type { TestController } from "../hooks/useTestSession";
import { useTestTimer } from "../hooks/useTestTimer";
import type { TestSession } from "../types/test";

interface Props {
  design: DesignKit;
  controller: TestController;
  session: TestSession;
  back: ReactNode;
}

/** テスト画面 (回答中)。共通ロジックの状態を、選択中のデザインへ渡すだけの役割 */
export function TestPage({ design, controller, session, back }: Props) {
  const timer = useTestTimer(session);

  return (
    <design.TestScreen
      title={testConfig.title}
      questions={controller.questions}
      currentIndex={Math.min(session.currentIndex, controller.questions.length - 1)}
      answers={session.answers}
      stats={controller.stats}
      timer={timer}
      onAnswer={controller.answer}
      onPrev={controller.prev}
      onNext={controller.next}
      onJump={controller.goTo}
      onOpenConfirm={controller.openConfirm}
      back={back}
    />
  );
}
