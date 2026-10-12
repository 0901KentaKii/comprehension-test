import { useId } from "react";
import type { AnswerTable } from "../../types/test";
import { parseTableAnswer, serializeTableAnswer } from "../../utils/tableAnswer";

interface Props {
  table: AnswerTable;
  value: string;
  onChange: (value: string) => void;
  /** 問題文の要素ID */
  labelledBy: string;
}

/**
 * 記述式の回答欄 (表形式)。行ごとに1枚のカードにして、列の入力欄を並べる。
 * 広い画面では入力欄を横に並べ (wide の列は下段に全幅)、狭い画面では縦に並べる (切り替えは CSS)。
 */
export function TableQuestion({ table, value, onChange, labelledBy }: Props) {
  const hintId = useId();
  const cells = parseTableAnswer(value, table);

  const update = (r: number, c: number, text: string) => {
    const next = cells.map((row) => [...row]);
    next[r][c] = text;
    onChange(serializeTableAnswer(next));
  };

  return (
    <div className="table-answer" role="group" aria-labelledby={labelledBy} aria-describedby={hintId}>
      {table.rows.map((row, r) => (
        <div
          key={row.label}
          className="table-answer__row"
          role="group"
          aria-label={`${table.rowHeader}${row.label}`}
        >
          <div className="table-answer__rowhead">
            <span className="table-answer__rowname">{table.rowHeader}</span>
            <span className="table-answer__rownum">{row.label}</span>
            {row.note && <span className="table-answer__rownote">{row.note}</span>}
          </div>
          <div className="table-answer__fields">
            {table.columns.map((col, c) => (
              <label
                key={col.label}
                className={`table-answer__field${col.wide ? " table-answer__field--wide" : ""}`}
              >
                <span className="table-answer__label">{col.label}</span>
                <textarea
                  className="table-answer__input"
                  aria-label={`${table.rowHeader}${row.label} ${col.label}`}
                  placeholder="入力してください"
                  rows={3}
                  maxLength={col.maxLength}
                  value={cells[r][c]}
                  onChange={(e) => update(r, c, e.target.value)}
                />
              </label>
            ))}
          </div>
        </div>
      ))}
      <div id={hintId} className="text-answer__meta">
        <span>入力内容は自動で保存されます</span>
        <span>
          {table.columns.map((col) => `${col.label} ${col.maxLength}文字`).join(" / ")} まで
        </span>
      </div>
    </div>
  );
}
