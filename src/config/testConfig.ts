export const testConfig = {
  /** テスト名 */
  title: "生成AI 理解度テスト",

  /** 設定時間(分)。目安であり、超過しても強制終了・自動提出はしない */
  durationMinutes: 30,

  /**
   * 提出完了画面に正解数を表示するか。
   * true にする場合は gas/Code.gs の RETURN_SCORE も true にすること。
   */
  showScoreToExaminee: false,

  /** 提出完了画面に 設定時間・所要時間・超過時間 を表示するか */
  showTimeSummaryOnComplete: true,

  /** 記述式問題で maxLength を指定しなかった場合の最大文字数 */
  defaultTextMaxLength: 1000,

  /**
   * デザイン確認モード。
   * true : トップページにデザイン選択画面を表示する (比較・検討用)
   * false: トップページから直接 defaultDesign のテストを表示する (本番運用用)
   */
  designPreviewMode: true,

  /** designPreviewMode が false のときに使用するデザイン (1 | 2 | 3) */
  defaultDesign: 1 as 1 | 2 | 3,
};
