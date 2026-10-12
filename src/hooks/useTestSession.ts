import { useCallback, useEffect, useMemo, useState } from "react";
import { testConfig } from "../config/testConfig";
import { questions } from "../data/questions";
import { submitTest } from "../services/submitTest";
import type { SubmitPayload, TestSession } from "../types/test";
import { computeStats } from "../utils/answers";
import { formatTableAnswer } from "../utils/tableAnswer";
import { computeSubmitTiming } from "../utils/time";
import { resultStore, sessionStore, useTestStorage } from "./useTestStorage";

/** 送信処理が進行中か。ボタン連打・二重POSTを防ぐ */
let submitInFlight = false;

function newAttemptId(): string {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  // randomUUID が無い環境向けの代替
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function buildPayload(session: TestSession, submittedAt: string): SubmitPayload {
  return {
    attemptId: session.attemptId,
    userName: session.userName,
    startedAt: session.startedAt,
    targetEndAt: session.targetEndAt,
    submittedAt,
    ...computeSubmitTiming(session.startedAt, session.targetEndAt, submittedAt),
    answers: questions.map((q) => ({
      questionId: q.id,
      type: q.type,
      answer:
        q.type === "text" && q.answerTable
          ? formatTableAnswer(session.answers[q.id] ?? "", q.answerTable)
          : (session.answers[q.id] ?? "").trim(),
    })),
  };
}

/** 受験中データを更新する。回答中 (in_progress) 以外では何もしない */
function updateInProgress(fn: (s: TestSession) => TestSession) {
  const current = sessionStore.get();
  if (!current || current.status !== "in_progress") return;
  sessionStore.set(fn(current));
}

const clampIndex = (i: number) => Math.min(Math.max(i, 0), questions.length - 1);

/**
 * テストの進行 (開始・回答・移動・提出) をまとめたフック。
 * デザインに依存しないため、どのデザインからも同じものを使う。
 */
export function useTestSession() {
  const { session, result } = useTestStorage();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 送信中にリロードされた場合は結果が分からないため、再送信できる状態に戻す
  // (再送信しても attemptId により二重登録されない)
  useEffect(() => {
    if (session?.status === "submitting" && !submitInFlight) {
      sessionStore.set({ ...session, status: "submit_failed" });
    }
  }, [session]);

  const start = useCallback((userName: string) => {
    const startMs = Date.now();
    resultStore.set(null);
    sessionStore.set({
      attemptId: newAttemptId(),
      userName,
      startedAt: new Date(startMs).toISOString(),
      targetEndAt: new Date(startMs + testConfig.durationMinutes * 60_000).toISOString(),
      currentIndex: 0,
      answers: {},
      view: "test",
      status: "in_progress",
    });
  }, []);

  const answer = useCallback((questionId: number, value: string) => {
    updateInProgress((s) => ({ ...s, answers: { ...s.answers, [questionId]: value } }));
  }, []);

  const goTo = useCallback((index: number) => {
    updateInProgress((s) => ({ ...s, currentIndex: clampIndex(index), view: "test" }));
  }, []);

  const next = useCallback(() => {
    updateInProgress((s) => ({ ...s, currentIndex: clampIndex(s.currentIndex + 1) }));
  }, []);

  const prev = useCallback(() => {
    updateInProgress((s) => ({ ...s, currentIndex: clampIndex(s.currentIndex - 1) }));
  }, []);

  const openConfirm = useCallback(() => {
    updateInProgress((s) => ({ ...s, view: "confirm" }));
  }, []);

  const backToTest = useCallback(() => {
    updateInProgress((s) => ({ ...s, view: "test" }));
  }, []);

  /** 提出 (再送信も同じ処理)。提出日時は最初に押した時点で固定する */
  const submit = useCallback(async () => {
    const current = sessionStore.get();
    if (!current || submitInFlight) return;
    submitInFlight = true;
    setSubmitError(null);

    const submittedAt = current.submittedAt ?? new Date().toISOString();
    const locked: TestSession = { ...current, view: "confirm", status: "submitting", submittedAt };
    sessionStore.set(locked);

    try {
      const payload = buildPayload(locked, submittedAt);
      const response = await submitTest(payload);
      resultStore.set({
        attemptId: payload.attemptId,
        userName: payload.userName,
        submittedAt,
        durationMinutes: testConfig.durationMinutes,
        durationSeconds: payload.durationSeconds,
        timeExceeded: payload.timeExceeded,
        overtimeSeconds: payload.overtimeSeconds,
        demo: response.demo === true,
      });
      // 送信に成功した場合のみ、受験中データを削除する (= 自動ログアウト)。
      // 氏名・回答は端末に残らないので、同じ端末で次の人がそのまま受験できる。
      sessionStore.set(null);
    } catch (e) {
      sessionStore.set({ ...locked, status: "submit_failed" });
      setSubmitError(e instanceof Error ? e.message : String(e));
    } finally {
      submitInFlight = false;
    }
  }, []);

  /** 受験データと完了記録を消して最初の画面 (氏名入力) に戻す */
  const reset = useCallback(() => {
    if (submitInFlight) return;
    sessionStore.set(null);
    resultStore.set(null);
    setSubmitError(null);
  }, []);

  const stats = useMemo(() => computeStats(questions, session?.answers ?? {}), [session?.answers]);

  return {
    questions,
    session,
    result,
    stats,
    submitError,
    start,
    answer,
    goTo,
    next,
    prev,
    openConfirm,
    backToTest,
    submit,
    reset,
  };
}

export type TestController = ReturnType<typeof useTestSession>;
