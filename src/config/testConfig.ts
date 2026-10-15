export const testConfig = {
  /** テスト名 */
  title: "生成AI 理解度テスト",

  /** 設定時間(分)。目安であり、超過しても強制終了・自動提出はしない */
  durationMinutes: 60,

  /** 記述式問題で maxLength を指定しなかった場合の最大文字数 */
  defaultTextMaxLength: 4000,

  /**
   * デザイン確認モード。
   * true : トップページにデザイン選択画面を表示する (比較・検討用)
   * false: トップページから直接 defaultDesign のテストを表示する (本番運用用)
   */
  designPreviewMode: false,

  /** designPreviewMode が false のときに使用するデザイン (2: カード型) */
  defaultDesign: 2 as const,
};
