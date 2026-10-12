import { useEffect, useRef } from "react";
import { testConfig } from "../../config/testConfig";
import type { Question } from "../../types/test";
import { ChoiceQuestion } from "./ChoiceQuestion";
import { QuestionContent } from "./QuestionContent";
import { TableQuestion } from "./TableQuestion";
import { TextQuestion } from "./TextQuestion";

interface Props {
  question: Question;
  /** 問題番号 (1始まり) */
  number: number;
  value: string;
  onAnswer: (questionId: number, value: string) => void;
}

export const questionTypeLabel = (q: Question) => (q.type === "choice" ? "選択式" : "記述式");

/**
 * 1問分の表示 (問題文 + 回答欄)。
 * 問題の type に応じて回答欄を切り替えるので、問題を追加しても画面側の修正は不要。
 */
export function QuestionView({ question, number, value, onAnswer }: Props) {
  const headingId = `question-heading-${question.id}`;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const isFirstRender = useRef(true);

  // 問題を移動したら、ページを先頭に戻して問題文の最初から読めるようにする。
  // あわせて見出しへフォーカスを移す (キーボード・読み上げ利用時に現在位置が分かる)
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    headingRef.current?.focus({ preventScroll: true });
  }, [question.id]);

  return (
    <section className="question" aria-labelledby={headingId}>
      <h2 id={headingId} ref={headingRef} tabIndex={-1} className="question__number">
        問{number}
      </h2>
      <QuestionContent body={question.question} />
      {question.type === "choice" ? (
        <ChoiceQuestion
          key={question.id}
          questionId={question.id}
          choices={question.choices}
          value={value}
          onChange={(v) => onAnswer(question.id, v)}
          labelledBy={headingId}
        />
      ) : question.answerTable ? (
        <TableQuestion
          key={question.id}
          table={question.answerTable}
          value={value}
          onChange={(v) => onAnswer(question.id, v)}
          labelledBy={headingId}
        />
      ) : (
        <TextQuestion
          key={question.id}
          value={value}
          maxLength={question.maxLength ?? testConfig.defaultTextMaxLength}
          onChange={(v) => onAnswer(question.id, v)}
          labelledBy={headingId}
        />
      )}
    </section>
  );
}
