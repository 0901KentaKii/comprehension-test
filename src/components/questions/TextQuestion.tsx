import { useId } from "react";

interface Props {
  value: string;
  maxLength: number;
  onChange: (value: string) => void;
  /** 問題文の要素ID */
  labelledBy: string;
}

/** 記述式の回答欄 (複数行入力) */
export function TextQuestion({ value, maxLength, onChange, labelledBy }: Props) {
  const hintId = useId();
  return (
    <div className="text-answer">
      <textarea
        className="text-answer__input"
        aria-labelledby={labelledBy}
        aria-describedby={hintId}
        placeholder="回答を入力してください"
        rows={8}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <div id={hintId} className="text-answer__meta">
        <span>入力内容は自動で保存されます</span>
        <span className="text-answer__count">
          {value.length} / {maxLength} 文字
        </span>
      </div>
    </div>
  );
}
