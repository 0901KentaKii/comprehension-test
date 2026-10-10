import type { ComponentType, ReactNode } from "react";
import type { AnswerMap, AnswerStats, Question, TimerState } from "../types/test";

/** テスト画面 (回答中) にデザインへ渡す情報。ロジックは含まず、表示と操作の通知だけを行う */
export interface TestScreenProps {
  title: string;
  questions: Question[];
  currentIndex: number;
  answers: AnswerMap;
  stats: AnswerStats;
  timer: TimerState;
  onAnswer: (questionId: number, value: string) => void;
  onPrev: () => void;
  onNext: () => void;
  onJump: (index: number) => void;
  onOpenConfirm: () => void;
  /** 「デザイン選択へ戻る」リンク (本番運用時は null) */
  back: ReactNode;
}

/** 受験者情報入力・回答確認・提出完了の各画面を囲む枠 */
export interface FrameProps {
  title: string;
  back: ReactNode;
  children: ReactNode;
}

/** デザイン1案分の定義。UI だけを持ち、テストのロジックは共通のものを使う */
export interface DesignKit {
  id: 1 | 2 | 3;
  name: string;
  description: string;
  /** デザインごとの CSS を適用するためのクラス名 */
  className: string;
  Frame: ComponentType<FrameProps>;
  TestScreen: ComponentType<TestScreenProps>;
}
