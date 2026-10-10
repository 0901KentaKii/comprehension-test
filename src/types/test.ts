/** 問題データ。選択式・記述式を共通の配列で管理する。 */
export type Question =
  | {
      id: number;
      type: "choice";
      question: string;
      choices: string[];
    }
  | {
      id: number;
      type: "text";
      question: string;
      maxLength?: number;
    };

/**
 * 回答。キーは問題ID。
 * 選択式は "A" "B" "C" "D"、記述式は入力された文章。未回答はキーなし(または空文字)。
 */
export type AnswerMap = Record<number, string>;

/**
 * 受験状態。
 * - in_progress   : 回答中(回答を変更できる)
 * - submitting    : 送信中(回答は変更できない)
 * - submit_failed : 送信失敗(回答は変更できない・再送信のみ可能)
 * 送信に成功すると受験中データ自体を削除する。
 */
export type SessionStatus = "in_progress" | "submitting" | "submit_failed";

/** localStorage に保存する受験中データ */
export interface TestSession {
  attemptId: string;
  userName: string;
  /** テスト開始日時 (ISO 8601) */
  startedAt: string;
  /** 基準終了日時 = startedAt + 設定時間 (ISO 8601) */
  targetEndAt: string;
  /** 現在の問題番号 (0始まり) */
  currentIndex: number;
  answers: AnswerMap;
  /** 表示中の画面 */
  view: "test" | "confirm";
  status: SessionStatus;
  /** 提出ボタンを押した日時。再送信しても変わらない */
  submittedAt?: string;
}

export interface SubmitAnswer {
  questionId: number;
  type: Question["type"];
  answer: string;
}

/** Google Apps Script へ送信するデータ */
export interface SubmitPayload {
  attemptId: string;
  userName: string;
  startedAt: string;
  targetEndAt: string;
  submittedAt: string;
  durationSeconds: number;
  timeExceeded: boolean;
  overtimeSeconds: number;
  answers: SubmitAnswer[];
}

export interface Score {
  choiceCount: number;
  correctCount: number;
  /** 0〜1 */
  correctRate: number;
}

/** Google Apps Script からの応答 */
export interface SubmitResponse {
  ok: boolean;
  /** 同じ attemptId が登録済みだった場合 true */
  duplicate?: boolean;
  /** Spreadsheet には保存していないデモ送信の場合 true */
  demo?: boolean;
  score?: Score;
  error?: string;
}

/** 提出完了画面に表示するための記録 (回答内容は含まない)。端末には保存しない */
export interface TestResult {
  attemptId: string;
  userName: string;
  submittedAt: string;
  durationMinutes: number;
  durationSeconds: number;
  timeExceeded: boolean;
  overtimeSeconds: number;
  demo: boolean;
  score?: Score;
}

export type TimerLevel = "normal" | "notice" | "warning" | "critical" | "overtime";

export interface TimerState {
  /** 設定時間(秒) */
  totalSeconds: number;
  /** 開始からの経過秒数 */
  elapsedSeconds: number;
  /** 残り秒数 (超過後は 0) */
  remainingSeconds: number;
  /** 超過秒数 (時間内は 0) */
  overtimeSeconds: number;
  isOvertime: boolean;
  level: TimerLevel;
}

export interface AnswerStats {
  total: number;
  answered: number;
  unanswered: number;
  /** 未回答の問題番号 (1始まり) */
  unansweredNumbers: number[];
}
