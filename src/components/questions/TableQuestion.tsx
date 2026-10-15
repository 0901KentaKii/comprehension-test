import { useId, useState } from "react";
import type { AnswerTable } from "../../types/test";
import { parseTableAnswer, serializeTableAnswer } from "../../utils/tableAnswer";
import { ChevronDownIcon } from "../common/Icons";

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
 * カードは右上のボタンでたためる。カード上部には行の補足と入力状況を出す。
 */
export function TableQuestion({ table, value, onChange, labelledBy }: Props) {
  const baseId = useId();
  const hintId = `${baseId}-hint`;
  const cells = parseTableAnswer(value, table);
  // 最初は先頭の行だけ開いておく
  const [collapsed, setCollapsed] = useState<boolean[]>(() => table.rows.map((_, r) => r !== 0));

  const update = (r: number, c: number, text: string) => {
    const next = cells.map((row) => [...row]);
    next[r][c] = text;
    onChange(serializeTableAnswer(next));
  };

  const toggle = (r: number) => setCollapsed((prev) => prev.map((v, i) => (i === r ? !v : v)));
  const setAll = (v: boolean) => setCollapsed(table.rows.map(() => v));
  const allCollapsed = collapsed.every(Boolean);
  const allOpen = collapsed.every((v) => !v);

  return (
    <div className="table-answer" role="group" aria-labelledby={labelledBy} aria-describedby={hintId}>
      <div className="table-answer__toolbar">
        <button
          type="button"
          className="table-answer__bulk"
          onClick={() => setAll(false)}
          disabled={allOpen}
        >
          すべて開く
        </button>
        <button
          type="button"
          className="table-answer__bulk"
          onClick={() => setAll(true)}
          disabled={allCollapsed}
        >
          すべて閉じる
        </button>
      </div>
      {table.rows.map((row, r) => {
        const isCollapsed = collapsed[r];
        const fieldsId = `${baseId}-fields-${r}`;
        const filled = cells[r].filter((cell) => cell.trim() !== "").length;
        const total = table.columns.length;
        const status = filled === 0 ? "未入力" : filled === total ? "入力済み" : `${filled}/${total} 入力`;
        const statusMod = filled === 0 ? "empty" : filled === total ? "done" : "partial";
        return (
          <div
            key={row.label}
            className={`table-answer__row${isCollapsed ? " is-collapsed" : ""}`}
            role="group"
            aria-label={`${table.rowHeader}${row.label}`}
          >
            <div className="table-answer__rowhead">
              <span className="table-answer__rowname">{table.rowHeader}</span>
              <span className="table-answer__rownum">{row.label}</span>
            </div>
            <div className="table-answer__body">
              <div className="table-answer__bar">
                <div className="table-answer__summary">
                  {row.note && <span className="table-answer__rownote">{row.note}</span>}
                  <span className={`table-answer__status table-answer__status--${statusMod}`}>
                    {status}
                  </span>
                </div>
                <button
                  type="button"
                  className="table-answer__toggle"
                  aria-expanded={!isCollapsed}
                  aria-controls={fieldsId}
                  onClick={() => toggle(r)}
                >
                  <span className="visually-hidden">
                    {table.rowHeader}
                    {row.label}を
                  </span>
                  {isCollapsed ? "開く" : "閉じる"}
                  <ChevronDownIcon size={18} />
                </button>
              </div>
              <div id={fieldsId} className="table-answer__fields" hidden={isCollapsed}>
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
          </div>
        );
      })}
      <div id={hintId} className="text-answer__meta">
        <span>入力内容は自動で保存されます</span>
        <span>
          {table.columns.map((col) => `${col.label} ${col.maxLength}文字`).join(" / ")} まで
        </span>
      </div>
    </div>
  );
}
