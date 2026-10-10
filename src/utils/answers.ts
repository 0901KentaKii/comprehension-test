import type { AnswerMap, AnswerStats, Question } from "../types/test";

/** 選択肢の位置 (0, 1, 2 …) を記号 (A, B, C …) にする */
export const choiceLetter = (index: number) => String.fromCharCode(65 + index);

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
