import type { AnswerMap, AnswerStats, Question } from "../types/test";

const CHOICE_LETTERS = "アイウエオカキクケコ";

/** 選択肢の位置 (0, 1, 2 …) を記号 (ア, イ, ウ, エ …) にする。回答もこの記号で保存・送信する */
export const choiceLetter = (index: number) => CHOICE_LETTERS[index] ?? String(index + 1);

export function isAnswered(question: Question, answers: AnswerMap): boolean {
  return (answers[question.id] ?? "").trim() !== "";
}

export function computeStats(questions: Question[], answers: AnswerMap): AnswerStats {
  const unansweredNumbers = questions
    .map((q, i) => (isAnswered(q, answers) ? 0 : i + 1))
    .filter((n) => n > 0);
  return {
    total: questions.length,
    answered: questions.length - unansweredNumbers.length,
    unanswered: unansweredNumbers.length,
    unansweredNumbers,
  };
}
