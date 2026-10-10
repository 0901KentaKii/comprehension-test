import { Link } from "react-router-dom";
import { ArrowLeftIcon } from "./Icons";

/** 「デザイン選択へ戻る」リンク。デザイン確認モードでのみ表示する */
export function BackToSelection() {
  return (
    <Link to="/" className="back-link">
      <ArrowLeftIcon size={16} />
      デザイン選択へ戻る
    </Link>
  );
}
