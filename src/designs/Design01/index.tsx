import { Progress } from "../../components/Progress";
import { Timer } from "../../components/Timer";
import { QuestionView } from "../../components/questions/QuestionView";
import type { DesignKit, FrameProps, TestScreenProps } from "../types";
import "./design01.css";

/** DESIGN 01: シンプル・業務向け。1カラムで問題文を中心に表示する */
function TestScreen(props: TestScreenProps) {
  const { title, questions, currentIndex, answers, stats, timer, back } = props;
  const question = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="d1-page">
      <header className="d1-header">
        <div className="d1-header__inner">
          <div className="d1-header__top">
            <h1 className="d1-title">{title}</h1>
            {back}
          </div>
          <div className="d1-meta">
            <p className="d1-position">
              問題 <strong>{currentIndex + 1}</strong> / {stats.total}
            </p>
            <Timer timer={timer} />
          </div>
          <Progress value={currentIndex + 1} max={stats.total} label="問題の進捗" />
        </div>
      </header>

      <main className="d1-main">
        <QuestionView
          question={question}
          number={currentIndex + 1}
          value={answers[question.id] ?? ""}
          onAnswer={props.onAnswer}
        />
      </main>

      <footer className="d1-footer">
        <div className="d1-footer__nav">
          <button type="button" className="btn" onClick={props.onPrev} disabled={isFirst}>
            前の問題
          </button>
          {isLast ? (
            <button type="button" className="btn btn--primary" onClick={props.onOpenConfirm}>
              回答を確認する
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={props.onNext}>
              次の問題
            </button>
          )}
        </div>
        <div className="d1-footer__sub">
          <p className="d1-stats">
            回答済み {stats.answered} ・ 未回答 {stats.unanswered}
          </p>
          {!isLast && (
            <button type="button" className="link-btn" onClick={props.onOpenConfirm}>
              回答を確認して提出する
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Frame({ title, back, children }: FrameProps) {
  return (
    <div className="d1-page">
      <header className="d1-header d1-header--static">
        <div className="d1-header__inner">
          <div className="d1-header__top">
            <h1 className="d1-title">{title}</h1>
            {back}
          </div>
        </div>
      </header>
      <main className="d1-main">{children}</main>
    </div>
  );
}

export const design01: DesignKit = {
  id: 1,
  name: "シンプル",
  description: "白を基調とした業務向け。情報量を抑え、問題文を中心に表示します。",
  className: "d1",
  Frame,
  TestScreen,
};
