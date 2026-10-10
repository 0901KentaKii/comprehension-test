/**
 * オンラインテスト 回答受付 (Google Apps Script)
 *
 * ブラウザから送信された回答を受け取り、選択式を採点して Spreadsheet に1受験1行で保存します。
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

/** 日時を記録するときのタイムゾーン */
const TIME_ZONE = 'Asia/Tokyo';

/**
 * 選択式問題の正解。{ 問題ID: 正解の記号 }
 * 問題ID は フロント側 src/data/questions.ts の id と一致させます。
 * 正解はこのファイルにだけ置き、フロント側には書かないでください。
 */
const ANSWER_KEY = {
  1: 'B',
  2: 'C',
  3: 'A',
  4: 'D',
  5: 'B',
};

/** 記述式問題の問題ID (採点せず、回答全文を保存) */
const TEXT_QUESTION_IDS = [6, 7, 8, 9, 10];

/**
 * 採点結果 (正解数) を受験者のブラウザへ返すか。
 * true にする場合は フロント側 testConfig.showScoreToExaminee も true にします。
 */
const RETURN_SCORE = false;

// ============================== 入口 ==============================

/** 回答の受付 */
function doPost(e) {
  // Apps Script がリクエストを受け取った時刻 (端末の時計に依存しない)
  const serverReceivedAt = new Date();
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
      const score = grade_(data.answers);
      appendAttempt_(sheet, data, score, serverReceivedAt);
      SpreadsheetApp.flush();
      const response = { ok: true, duplicate: false };
      if (RETURN_SCORE) response.score = score;
      return json_(response);
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
  console.log('準備ができました: ' + sheet.getParent().getUrl());
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

function getSheet_() {
  const ss = SPREADSHEET_ID ? SpreadsheetApp.openById(SPREADSHEET_ID) : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Spreadsheet が見つかりません。SPREADSHEET_ID を設定してください');
  return ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
}

/** 同じ attemptId が登録済みか (A列を完全一致で検索) */
function attemptExists_(sheet, attemptId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return false;
  const found = sheet
    .getRange(2, 1, lastRow - 1, 1)
    .createTextFinder(attemptId)
    .matchEntireCell(true)
    .matchCase(true)
    .findNext();
  return found !== null;
}

function choiceIds_() {
  return Object.keys(ANSWER_KEY)
    .map(Number)
    .sort(function (a, b) {
      return a - b;
    });
}

/** 選択式を採点する */
function grade_(answers) {
  const ids = choiceIds_();
  let correctCount = 0;
  ids.forEach(function (id) {
    if (answers[id] && answers[id] === ANSWER_KEY[id]) correctCount++;
  });
  return {
    choiceCount: ids.length,
    correctCount: correctCount,
    correctRate: ids.length ? correctCount / ids.length : 0,
  };
}

const BASE_HEADERS = [
  'attemptId',
  '氏名',
  '開始日時',
  '基準終了日時',
  '提出日時(端末)',
  '受信日時(サーバー)',
  '所要時間',
  '所要時間(秒)',
  '時間超過',
  '超過時間',
  '超過時間(秒)',
  '選択式問題数',
  '正解数',
  '正答率',
];

const choiceHeader_ = function (id) {
  return 'Q' + id;
};
const textHeader_ = function (id, i) {
  return '記述' + (i + 1) + '(Q' + id + ')';
};

function buildHeaders_() {
  return BASE_HEADERS.concat(choiceIds_().map(choiceHeader_), TEXT_QUESTION_IDS.map(textHeader_));
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
function appendAttempt_(sheet, d, score, serverReceivedAt) {
  // 時間は端末から届いた開始・基準終了・提出日時からサーバー側で計算し直す
  const durationSeconds = Math.floor((d.submittedAt - d.startedAt) / 1000);
  const overtimeSeconds = Math.max(0, Math.floor((d.submittedAt - d.targetEndAt) / 1000));

  const row = {
    'attemptId': d.attemptId,
    '氏名': safeText_(d.userName),
    '開始日時': formatDate_(d.startedAt),
    '基準終了日時': formatDate_(d.targetEndAt),
    '提出日時(端末)': formatDate_(d.submittedAt),
    '受信日時(サーバー)': formatDate_(serverReceivedAt),
    '所要時間': formatDuration_(durationSeconds),
    '所要時間(秒)': durationSeconds,
    '時間超過': overtimeSeconds > 0 ? 'あり' : 'なし',
    '超過時間': formatDuration_(overtimeSeconds),
    '超過時間(秒)': overtimeSeconds,
    '選択式問題数': score.choiceCount,
    '正解数': score.correctCount,
    '正答率': score.correctRate,
  };
  // 見出し → 背景色 (選択式: 不正解は薄い赤、未回答は薄い灰色)
  const colors = {};
  colors['時間超過'] = overtimeSeconds > 0 ? '#fde9e7' : null;

  choiceIds_().forEach(function (id) {
    const answer = d.answers[id] || '';
    const header = choiceHeader_(id);
    row[header] = safeText_(answer);
    colors[header] = !answer ? '#eeeeee' : answer === ANSWER_KEY[id] ? null : '#fde9e7';
  });
  TEXT_QUESTION_IDS.forEach(function (id, i) {
    row[textHeader_(id, i)] = safeText_(d.answers[id] || '');
  });

  const headers = ensureHeaders_(sheet, buildHeaders_());
  const numeric = { '所要時間(秒)': '0', '超過時間(秒)': '0', '選択式問題数': '0', '正解数': '0', '正答率': '0%' };
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
