/**
 * オンラインテスト 回答受付 (Google Apps Script)
 *
 * ブラウザから送信された回答を受け取り、選択式を採点して Spreadsheet に1受験1行で保存します。
 * 正解と配点はこのファイルには書かず、Spreadsheet の「正解」シートから読み込みます。
 * 設定は下の「設定」だけを変更すれば足ります。
 * コードを変更したら、必ず「デプロイを管理」から新しいバージョンとして再デプロイしてください。
 */

// ============================== 設定 ==============================

/**
 * 保存先 Spreadsheet の ID。
 * https://docs.google.com/spreadsheets/d/【ここがID】/edit
 * 空文字のままの場合は、このスクリプトが紐づいている Spreadsheet
 * (Spreadsheet の「拡張機能 > Apps Script」から作成した場合) に保存します。
 */
const SPREADSHEET_ID = '';

/** 回答を保存するシート名 (無ければ自動作成) */
const SHEET_NAME = '回答';

/**
 * 選択式の正解と配点を置くシート名。
 * 1行目は見出し、2行目以降に A列: 問題番号 / B列: 正解 (ア・イ・ウ・エ) / C列: 配点 を入力します。
 * このシートが無い・空の場合は採点せず、回答だけを保存します。
 */
const ANSWER_SHEET_NAME = '正解';

/** 日時を記録するときのタイムゾーン */
const TIME_ZONE = 'Asia/Tokyo';

/**
 * 問題ID。フロント側 src/data/questions.ts の id と一致させます。
 *
 * 【重要】このファイルは公開リポジトリに含まれます。
 * 正解・配点・解説・採点基準・模範解答は、ここには絶対に書かないでください。
 * 選択式の正解と配点は Spreadsheet の「正解」シートに置きます (Spreadsheet は受験者に共有しない)。
 * 記述式は自動採点しません。確認者が、別途保管している模範解答・採点基準と照らして採点します。
 */

/** 選択式問題の問題ID (問1〜問45)。回答 (ア・イ・ウ・エ) をそのまま保存 */
const CHOICE_QUESTION_IDS = range_(1, 45);

/** 記述式問題の問題ID (問46〜問49)。回答全文を保存 */
const TEXT_QUESTION_IDS = range_(46, 49);

function range_(from, to) {
  const ids = [];
  for (let i = from; i <= to; i++) ids.push(i);
  return ids;
}

// ============================== 入口 ==============================

/** 回答の受付 */
function doPost(e) {
  try {
    const data = validate_(parseRequest_(e));

    // 同時に届いたリクエストを1件ずつ処理し、二重登録を防ぐ
    const lock = LockService.getScriptLock();
    lock.waitLock(25000);
    try {
      const sheet = getSheet_();
      if (attemptExists_(sheet, data.attemptId)) {
        // 登録済み: 追加せずに成功として返す (再送信・二重POST対策)
        return json_({ ok: true, duplicate: true });
      }
      const score = grade_(data.answers, loadAnswerKey_(sheet.getParent()));
      appendAttempt_(sheet, data, score);
      SpreadsheetApp.flush();
      return json_({ ok: true, duplicate: false });
    } finally {
      lock.releaseLock();
    }
  } catch (err) {
    console.error(err);
    return json_({ ok: false, error: String((err && err.message) || err) });
  }
}

/** 動作確認用。WebアプリURLをブラウザで開くと表示されます */
function doGet() {
  return json_({ ok: true, message: 'online test endpoint is running' });
}

/**
 * 初回セットアップ用。エディタで一度実行すると、権限の承認とシート・見出し行の作成を行います。
 */
function setup() {
  const sheet = getSheet_();
  ensureHeaders_(sheet, buildHeaders_());

  // 「正解」シートが無ければ、見出しだけの空のシートを作る (正解と配点は手で貼り付ける)
  const ss = sheet.getParent();
  let answerSheet = ss.getSheetByName(ANSWER_SHEET_NAME);
  if (!answerSheet) {
    answerSheet = ss.insertSheet(ANSWER_SHEET_NAME);
    answerSheet.getRange(1, 1, 1, 3).setValues([['問題番号', '正解', '配点']]).setFontWeight('bold').setBackground('#eef1f5');
    answerSheet.setFrozenRows(1);
  }
  const key = loadAnswerKey_(ss);
  const count = key ? Object.keys(key).length : 0;
  console.log('準備ができました: ' + ss.getUrl());
  console.log('「正解」シートに登録されている問題数: ' + count + ' / ' + CHOICE_QUESTION_IDS.length);
}

/**
 * 「回答」シートを新しい列構成で作り直す。エディタで手動実行します。
 * 列の構成を変えたあとや、古い形式の列が混ざってしまったときに使います。
 * 今ある「回答」シートは削除せず、「回答_旧_日時」という名前に変えて残します。
 */
function rebuildAnswerSheet() {
  const ss = getSpreadsheet_();
  const old = ss.getSheetByName(SHEET_NAME);
  if (old) {
    const backupName = SHEET_NAME + '_旧_' + Utilities.formatDate(new Date(), TIME_ZONE, 'yyyyMMdd_HHmmss');
    old.setName(backupName);
    console.log('これまでの「' + SHEET_NAME + '」シートは「' + backupName + '」として残しました');
  }
  const sheet = getSheet_();
  ensureHeaders_(sheet, buildHeaders_());
  console.log('新しい「' + SHEET_NAME + '」シートを作成しました: ' + ss.getUrl());
}

// ============================== 処理 ==============================

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** リクエスト本文 (text/plain の JSON 文字列) を解析する。フォーム形式の payload にも対応 */
function parseRequest_(e) {
  let raw = '';
  if (e && e.parameter && e.parameter.payload) raw = e.parameter.payload;
  else if (e && e.postData && e.postData.contents) raw = e.postData.contents;
  if (!raw) throw new Error('リクエスト本文がありません');
  if (raw.length > 200000) throw new Error('リクエストが大きすぎます');
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error('リクエストの形式が正しくありません');
  }
}

/** 入力チェック。問題のある場合は例外を投げる */
function validate_(d) {
  if (!d || typeof d !== 'object') throw new Error('データが不正です');

  const attemptId = text_(d.attemptId, 'attemptId', 64);
  if (!/^[A-Za-z0-9-]{8,64}$/.test(attemptId)) throw new Error('attemptId が不正です');

  const startedAt = date_(d.startedAt, 'startedAt');
  const targetEndAt = date_(d.targetEndAt, 'targetEndAt');
  const submittedAt = date_(d.submittedAt, 'submittedAt');
  if (targetEndAt < startedAt) throw new Error('targetEndAt が不正です');
  if (submittedAt < startedAt) throw new Error('submittedAt が不正です');

  if (!Array.isArray(d.answers) || d.answers.length > 500) throw new Error('answers が不正です');
  const answers = {};
  d.answers.forEach(function (a) {
    if (!a || typeof a !== 'object') throw new Error('answers が不正です');
    const id = Number(a.questionId);
    if (!isFinite(id)) throw new Error('questionId が不正です');
    const value = a.answer == null ? '' : String(a.answer);
    if (value.length > 5000) throw new Error('回答が長すぎます (問題ID ' + id + ')');
    answers[id] = value;
  });

  return {
    attemptId: attemptId,
    userName: text_(d.userName, '氏名', 100),
    startedAt: startedAt,
    targetEndAt: targetEndAt,
    submittedAt: submittedAt,
    answers: answers,
  };
}

function text_(value, name, maxLength) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) throw new Error(name + ' がありません');
  if (s.length > maxLength) throw new Error(name + ' が長すぎます');
  return s;
}

function date_(value, name) {
  const d = new Date(value);
  if (typeof value !== 'string' || isNaN(d.getTime())) throw new Error(name + ' が不正です');
  return d;
}

function getSpreadsheet_() {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet が見つかりません。SPREADSHEET_ID を設定してください');
  return ss;
}

function getSheet_() {
  const ss = getSpreadsheet_();
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

/** 同じ attemptId が登録済みか (見出しが attemptId の列を完全一致で検索) */
function attemptExists_(sheet, attemptId) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return false;
  const column = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String).indexOf(ATTEMPT_ID_HEADER) + 1;
  if (column < 1) return false;
  const found = sheet
    .getRange(2, column, lastRow - 1, 1)
    .createTextFinder(attemptId)
    .matchEntireCell(true)
    .matchCase(true)
    .findNext();
  return found !== null;
}

/**
 * 「正解」シートから { 問題ID: { answer: 正解, points: 配点 } } を読み込む。
 * シートが無い・1件も登録されていない場合は null を返す (採点しない)。
 */
function loadAnswerKey_(ss) {
  const sheet = ss.getSheetByName(ANSWER_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return null;
  const rows = sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues();
  const key = {};
  let count = 0;
  rows.forEach(function (r) {
    const id = Number(r[0]);
    const answer = String(r[1] == null ? '' : r[1]).trim();
    if (!id || !answer) return;
    const points = Number(r[2]);
    key[id] = { answer: answer, points: isFinite(points) && points > 0 ? points : 1 };
    count++;
  });
  return count ? key : null;
}

/**
 * 選択式を採点する。
 * 正解が登録されていない問題は採点対象から外し、その数を missing として返す。
 */
function grade_(answers, key) {
  if (!key) return null;
  const result = { correctCount: 0, score: 0, maxScore: 0, missing: 0, correct: {} };
  CHOICE_QUESTION_IDS.forEach(function (id) {
    const k = key[id];
    if (!k) {
      result.missing++;
      return;
    }
    result.maxScore += k.points;
    if (answers[id] && answers[id] === k.answer) {
      result.correctCount++;
      result.score += k.points;
      result.correct[id] = true;
    } else {
      result.correct[id] = false;
    }
  });
  return result;
}

/**
 * 二重登録の防止に使う受験ごとの識別子の列。
 * 確認者が見る必要はないので、右端に置いて非表示にする (削除すると二重登録を防げなくなる)。
 */
const ATTEMPT_ID_HEADER = 'attemptId';

const BASE_HEADERS = [
  '氏名',
  '開始日時',
  '基準終了日時',
  '提出日時',
  '所要時間',
  '時間超過',
  '超過時間',
  '選択式回答数',
  '記述式回答数',
  '正解数',
  '選択式得点',
  '選択式満点',
  '採点メモ',
];

const choiceHeader_ = function (id) {
  return 'Q' + id;
};
const textHeader_ = function (id, i) {
  return '記述' + (i + 1) + '(Q' + id + ')';
};

function buildHeaders_() {
  return BASE_HEADERS.concat(CHOICE_QUESTION_IDS.map(choiceHeader_), TEXT_QUESTION_IDS.map(textHeader_), [
    ATTEMPT_ID_HEADER,
  ]);
}

/**
 * 見出し行を用意し、現在の見出し (左から順) を返す。
 * 問題を追加した場合は、足りない列だけを右端に追加する (既存の列・データは動かさない)。
 */
function ensureHeaders_(sheet, wanted) {
  const lastColumn = sheet.getLastColumn();
  const current =
    sheet.getLastRow() >= 1 && lastColumn >= 1
      ? sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String)
      : [];
  const missing = wanted.filter(function (h) {
    return current.indexOf(h) === -1;
  });
  if (missing.length) {
    sheet
      .getRange(1, current.length + 1, 1, missing.length)
      .setValues([missing])
      .setFontWeight('bold')
      .setBackground('#eef1f5');
    if (current.length === 0) sheet.setFrozenRows(1);
    // 識別子の列を新しく作った場合は非表示にする
    const idIndex = missing.indexOf(ATTEMPT_ID_HEADER);
    if (idIndex !== -1) sheet.hideColumns(current.length + 1 + idIndex);
  }
  return current.concat(missing);
}

function formatDate_(date) {
  return Utilities.formatDate(date, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
}

function formatDuration_(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  return Math.floor(s / 60) + '分' + ('0' + (s % 60)).slice(-2) + '秒';
}

/** 数式として解釈されうる文字で始まる入力を、ただの文字列として保存する (数式インジェクション対策) */
function safeText_(value) {
  const s = String(value);
  return /^[=+\-@\t\r]/.test(s) ? "'" + s : s;
}

/** 1受験分を1行として追加する */
function appendAttempt_(sheet, d, score) {
  // 時間は端末から届いた開始・基準終了・提出日時からサーバー側で計算し直す
  const durationSeconds = Math.floor((d.submittedAt - d.startedAt) / 1000);
  const overtimeSeconds = Math.max(0, Math.floor((d.submittedAt - d.targetEndAt) / 1000));

  const row = {
    '氏名': safeText_(d.userName),
    '開始日時': formatDate_(d.startedAt),
    '基準終了日時': formatDate_(d.targetEndAt),
    '提出日時': formatDate_(d.submittedAt),
    '所要時間': formatDuration_(durationSeconds),
    '時間超過': overtimeSeconds > 0 ? 'あり' : 'なし',
    '超過時間': formatDuration_(overtimeSeconds),
  };
  row[ATTEMPT_ID_HEADER] = d.attemptId;
  // 見出し → 背景色 (選択式: 不正解は薄い赤、未回答は薄い灰色)
  const colors = {};
  colors['時間超過'] = overtimeSeconds > 0 ? '#fde9e7' : null;

  let choiceAnswered = 0;
  CHOICE_QUESTION_IDS.forEach(function (id) {
    const answer = d.answers[id] || '';
    const header = choiceHeader_(id);
    row[header] = safeText_(answer);
    if (answer) choiceAnswered++;
    if (!answer) colors[header] = '#eeeeee';
    else if (score && score.correct[id] === false) colors[header] = '#fde9e7';
  });
  let textAnswered = 0;
  TEXT_QUESTION_IDS.forEach(function (id, i) {
    const answer = d.answers[id] || '';
    const header = textHeader_(id, i);
    row[header] = safeText_(answer);
    if (answer) textAnswered++;
    else colors[header] = '#eeeeee';
  });
  row['選択式回答数'] = choiceAnswered + ' / ' + CHOICE_QUESTION_IDS.length;
  row['記述式回答数'] = textAnswered + ' / ' + TEXT_QUESTION_IDS.length;
  if (score) {
    row['正解数'] = score.correctCount;
    row['選択式得点'] = score.score;
    row['選択式満点'] = score.maxScore;
    row['採点メモ'] = score.missing ? '正解が未登録の問題が ' + score.missing + ' 問あります (採点対象外)' : '';
  } else {
    row['採点メモ'] = '未採点 (「' + ANSWER_SHEET_NAME + '」シートに正解が登録されていません)';
  }

  const headers = ensureHeaders_(sheet, buildHeaders_());
  const numeric = { '正解数': '0', '選択式得点': '0', '選択式満点': '0' };
  const values = headers.map(function (h) {
    return row.hasOwnProperty(h) ? row[h] : '';
  });
  const formats = headers.map(function (h) {
    return numeric[h] || '@'; // 数値以外は入力されたままの文字列として保存する
  });
  const backgrounds = headers.map(function (h) {
    return colors[h] || null;
  });

  const range = sheet.getRange(sheet.getLastRow() + 1, 1, 1, headers.length);
  range.setNumberFormats([formats]);
  range.setValues([values]);
  range.setBackgrounds([backgrounds]);
  range.setVerticalAlignment('top');
}
