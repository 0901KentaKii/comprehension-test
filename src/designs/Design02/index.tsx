import { ArrowLeftIcon, ArrowRightIcon } from "../../components/common/Icons";
import { Progress } from "../../components/Progress";
import { QuestionNavToggle } from "../../components/QuestionNavToggle";
import { Timer } from "../../components/Timer";
import { QuestionView, questionTypeLabel } from "../../components/questions/QuestionView";
import type { DesignKit, FrameProps, TestScreenProps } from "../types";
import "./design02.css";

/** DESIGN 02: カード型。問題を1枚の大きなカードに、選択肢も大きなカードにして押しやすくする */
function TestScreen(props: TestScreenProps) {
  const { title, questions, currentIndex, answers, stats, timer, back } = props;
  const question = questions[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === questions.length - 1;

  return (
    <div className="d2-page">
      <header className="d2-top">
        <div className="d2-top__inner">
          <div className="d2-top__text">
            <h1 className="d2-title">{title}</h1>
            {back}
          </div>
          <Timer timer={timer} />
        </div>
      </header>

      <div className="d2-body">
        <div className="d2-progress">
          <div className="d2-progress__row">
            <p className="d2-position">
              問題 <strong>{currentIndex + 1}</strong> / {stats.total}
            </p>
            <p className="d2-stats">
              回答済み <strong>{stats.answered}</strong>
              <span aria-hidden="true">|</span>
              未回答 <strong>{stats.unanswered}</strong>
            </p>
          </div>
          <Progress value={currentIndex + 1} max={stats.total} label="問題の進捗" />
          {/* 問題数が多いので、一覧は必要なときだけ開く */}
          <QuestionNavToggle questions={questions} answers={answers} currentIndex={currentIndex} onJump={props.onJump} />
        </div>

        <main className="d2-card">
          <p className="d2-type">{questionTypeLabel(question)}</p>
          <QuestionView
            question={question}
            number={currentIndex + 1}
            value={answers[question.id] ?? ""}
            onAnswer={props.onAnswer}
          />
        </main>

        {!isLast && (
          <p className="d2-submit">
            <button type="button" className="link-btn" onClick={props.onOpenConfirm}>
              回答を確認して提出する
            </button>
          </p>
        )}
      </div>

      <footer className="d2-nav">
        <div className="d2-nav__inner">
          <button type="button" className="btn" onClick={props.onPrev} disabled={isFirst}>
            <ArrowLeftIcon size={18} />
            前の問題
          </button>
          {isLast ? (
            <button type="button" className="btn btn--primary" onClick={props.onOpenConfirm}>
              回答を確認する
            </button>
          ) : (
            <button type="button" className="btn btn--primary" onClick={props.onNext}>
              次の問題
              <ArrowRightIcon size={18} />
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Frame({ title, back, children }: FrameProps) {
  return (
    <div className="d2-page">
      <header className="d2-top">
        <div className="d2-top__inner">
          <div className="d2-top__text">
            <h1 className="d2-title">{title}</h1>
            {back}
          </div>
        </div>
      </header>
      <div className="d2-body">
        <main className="d2-card">{children}</main>
      </div>
    </div>
  );
}

export const design02: DesignKit = {
  id: 2,
  name: "カード型",
  description: "問題と選択肢を大きなカードで表示。文字とボタンを大きめにし、スマートフォンでも押しやすくします。",
  className: "d2",
  Frame,
  TestScreen,
};
