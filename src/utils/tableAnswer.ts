import type { AnswerTable } from "../types/test";

/**
 * 表形式の回答欄の値。
 * 受験中は「行 × 列」のセルを JSON 文字列にして、ほかの回答と同じ場所 (AnswerMap) に保存する。
 * すべて空欄のときは空文字にするので、未回答の判定は通常の記述式と同じになる。
 */

const emptyCells = (table: AnswerTable): string[][] =>
  table.rows.map(() => table.columns.map(() => ""));

/** 保存されている値をセルの配列に戻す。壊れている・形が合わない部分は空欄として扱う */
export function parseTableAnswer(value: string, table: AnswerTable): string[][] {
  const cells = emptyCells(table);
  if (!value) return cells;
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return cells;
  }
  if (!Array.isArray(parsed)) return cells;
  return cells.map((row, r) =>
    row.map((_, c) => {
      const cell: unknown = Array.isArray(parsed[r]) ? parsed[r][c] : undefined;
      return typeof cell === "string" ? cell : "";
    }),
  );
}

export function serializeTableAnswer(cells: string[][]): string {
  return cells.some((row) => row.some((cell) => cell.trim() !== "")) ? JSON.stringify(cells) : "";
}

/**
 * 送信用の文章にする (Spreadsheet の1セルにそのまま入り、人が読める形)。
 *
 *   工程1
 *   AI：…
 *   人：…
 */
export function formatTableAnswer(value: string, table: AnswerTable): string {
  if (!value.trim()) return "";
  const cells = parseTableAnswer(value, table);
  return table.rows
    .map((row, r) =>
      [
        `${table.rowHeader}${row.label}`,
        ...table.columns.map((col, c) => `${col.label}：${cells[r][c].trim()}`),
      ].join("\n"),
    )
    .join("\n\n");
}
