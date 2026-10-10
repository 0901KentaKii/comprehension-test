import { ArrowLeftIcon, ArrowRightIcon } from "../../components/common/Icons";
import { QuestionNavToggle } from "../../components/QuestionNavToggle";
import { Timer } from "../../components/Timer";
import { QuestionView, questionTypeLabel } from "../../components/questions/QuestionView";
import type { DesignKit, FrameProps, TestScreenProps } from "../types";
import "./design03.css";

/** DESIGN 03: モダン・Webサービス型。上部に回答状況と、開閉できる問題一覧を置く */
function TestScreen(props: TestScreenProps) {
  const { title, questions, currentIndex, answers, stats, timer, back } = props;
  const question = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="d3-shell">
      <header className="d3-top">
        <div className="d3-brand">
          <h1 className="d3-title">{title}</h1>
          {back}
        </div>
        <Timer timer={timer} />
      </header>

      <section className="d3-overview" aria-label="回答状況">
        <div className="d3-overview__inner">
          <p className="d3-counts">
            回答済み <strong>{stats.answered}</strong> / {stats.total}
            <span className="d3-counts__rest">(未回答 {stats.unanswered})</span>
          </p>
          <button type="button" className="btn btn--primary d3-overview__submit" onClick={props.onOpenConfirm}>
            回答を確認して提出
          </button>
          <QuestionNavToggle questions={questions} answers={answers} currentIndex={currentIndex} onJump={props.onJump} />
        </div>
      </section>

      <main className="d3-main">
        <div className="d3-panel">
          <p className="d3-panel__head">
            問題 {currentIndex + 1} / {stats.total}
            <span className="d3-tag">{questionTypeLabel(question)}</span>
          </p>
          <QuestionView
            question={question}
            number={currentIndex + 1}
            value={answers[question.id] ?? ""}
            onAnswer={props.onAnswer}
          />
          <div className="d3-panel__foot">
            <button type="button" className="btn" onClick={props.onPrev} disabled={isFirst}>
              <ArrowLeftIcon size={16} />
              前へ
            </button>
            {isLast ? (
              <button type="button" className="btn btn--primary" onClick={props.onOpenConfirm}>
                回答を確認する
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={props.onNext}>
                次へ
                <ArrowRightIcon size={16} />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function Frame({ title, back, children }: FrameProps) {
  return (
    <div className="d3-shell d3-shell--frame">
      <header className="d3-top">
        <div className="d3-brand">
          <h1 className="d3-title">{title}</h1>
          {back}
        </div>
      </header>
      <main className="d3-main">
        <div className="d3-panel">{children}</div>
      </main>
    </div>
  );
}

export const design03: DesignKit = {
  id: 3,
  name: "モダン",
  description: "Webサービス風。上部に回答状況と提出ボタンを常に表示し、問題一覧はボタンで開閉して移動できます。",
  className: "d3",
  Frame,
  TestScreen,
};
