import { choiceLetter } from "../../utils/answers";
import { CheckIcon } from "../common/Icons";

interface Props {
  questionId: number;
  choices: string[];
  /** 選択中の記号 ("A" など)。未選択は空文字 */
  value: string;
  onChange: (value: string) => void;
  /** 問題文の要素ID (選択肢グループの名前として読み上げられる) */
  labelledBy: string;
}

/**
 * 選択式 (単一選択) の回答欄。
 * ネイティブのラジオボタンを使うため、Tab と矢印キーで操作できる。
 * 選択状態は色だけでなく、チェックマークと枠線の太さでも示す。
 */
export function ChoiceQuestion({ questionId, choices, value, onChange, labelledBy }: Props) {
  return (
    <div className="choice-list" role="radiogroup" aria-labelledby={labelledBy}>
      {choices.map((text, i) => {
        const letter = choiceLetter(i);
        const selected = value === letter;
        return (
          <label key={letter} className={`choice${selected ? " is-selected" : ""}`}>
            <input
              className="choice__input"
              type="radio"
              name={`question-${questionId}`}
              value={letter}
              checked={selected}
              onChange={() => onChange(letter)}
            />
            <span className="choice__letter" aria-hidden="true">
              {letter}
            </span>
            <span className="choice__text">{text}</span>
            <span className="choice__check" aria-hidden="true">
              {selected && <CheckIcon size={18} />}
            </span>
          </label>
        );
      })}
    </div>
  );
}
