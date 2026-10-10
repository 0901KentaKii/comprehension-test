import { testConfig } from "../config/testConfig";
import type { SubmitPayload, SubmitResponse } from "../types/test";

const endpoint = (import.meta.env.VITE_GAS_ENDPOINT ?? "").trim();
const TIMEOUT_MS = 30_000;

/** 送信先が未設定で、デモ送信 (Spreadsheet に保存しない) になる状態か */
export const isDemoSubmit = endpoint === "" && testConfig.designPreviewMode;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 回答を Google Apps Script へ送信する。失敗時は例外を投げる。
 *
 * Content-Type を text/plain にしているのは、ブラウザの「単純リクエスト」扱いにして
 * CORS のプリフライト (OPTIONS) を発生させないため。
 * Apps Script の Webアプリは OPTIONS に応答できないので application/json では失敗する。
 * 本文は JSON 文字列で、Apps Script 側で JSON.parse する。
 *
 * 同じ attemptId を再送しても Apps Script 側で二重登録されないため、再送信は安全。
 */
export async function submitTest(payload: SubmitPayload): Promise<SubmitResponse> {
  if (endpoint === "") {
    if (!testConfig.designPreviewMode) {
      throw new Error("送信先 (VITE_GAS_ENDPOINT) が設定されていません");
    }
    await wait(800);
    return { ok: true, demo: true };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = (await res.json()) as SubmitResponse;
    if (!data.ok) throw new Error(data.error || "サーバーでエラーが発生しました");
    return data;
  } finally {
    clearTimeout(timer);
  }
}
