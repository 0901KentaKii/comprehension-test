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
 * 記述式の回答欄 (表形式)。
 * 広い画面では表、狭い画面では行ごとのカードに並べ替えて表示する (並べ替えは CSS)。
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
    <div className="table-answer">
      <table className="table-answer__table" aria-labelledby={labelledBy} aria-describedby={hintId}>
        <thead>
          <tr>
            <th scope="col" className="table-answer__rowhead">
              {table.rowHeader}
            </th>
            {table.columns.map((col) => (
              <th key={col.label} scope="col" className={col.wide ? "is-wide" : undefined}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, r) => (
            <tr key={row.label}>
              <th scope="row" className="table-answer__rowhead">
                <span className="table-answer__rowname">
                  <span className="table-answer__rowprefix">{table.rowHeader}</span>
                  {row.label}
                </span>
                {row.note && <span className="table-answer__rownote">{row.note}</span>}
              </th>
              {table.columns.map((col, c) => (
                <td key={col.label}>
                  <label>
                    <span className="table-answer__celllabel">{col.label}</span>
                    <textarea
                      className="table-answer__input"
                      aria-label={`${table.rowHeader}${row.label} ${col.label}`}
                      rows={3}
                      maxLength={col.maxLength}
                      value={cells[r][c]}
                      onChange={(e) => update(r, c, e.target.value)}
                    />
                  </label>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <div id={hintId} className="text-answer__meta">
        <span>入力内容は自動で保存されます</span>
        <span>
          {table.columns.map((col) => `${col.label} ${col.maxLength}文字`).join(" / ")} まで
        </span>
      </div>
    </div>
  );
}
