import type { TimerLevel, TimerState } from "../types/test";

const pad = (n: number) => String(n).padStart(2, "0");

/** 秒数を "MM:SS" 形式にする (例: 1472 → "24:32") */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
}

/** 秒数を "32分14秒" 形式にする */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(s / 60)}分${pad(s % 60)}秒`;
}

function levelOf(remainingSeconds: number, isOvertime: boolean): TimerLevel {
  if (isOvertime) return "overtime";
  if (remainingSeconds <= 60) return "critical";
  if (remainingSeconds <= 5 * 60) return "warning";
  if (remainingSeconds <= 10 * 60) return "notice";
  return "normal";
}

/**
 * 開始日時・基準終了日時・現在時刻から、残り時間と超過時間を計算する。
 * カウンタを増減させるのではなく毎回時刻の差分から求めるため、
 * リロードやブラウザを閉じた後でも正しい値になる。
 */
export function computeTimer(startedAt: string, targetEndAt: string, nowMs: number): TimerState {
  const startMs = Date.parse(startedAt);
  const endMs = Date.parse(targetEndAt);
  const diffMs = endMs - nowMs;
  // どちらも秒未満を切り捨てる → 00:01 → 00:00 → 超過 00:01 と進む。
  // 超過が1秒に達するまでは「残り 00:00」とし、提出時に記録する超過秒数と表示を一致させる。
  const remainingSeconds = Math.max(0, Math.floor(diffMs / 1000));
  const overtimeSeconds = Math.max(0, Math.floor(-diffMs / 1000));
  const isOvertime = overtimeSeconds > 0;
  return {
    totalSeconds: Math.round((endMs - startMs) / 1000),
    elapsedSeconds: Math.max(0, Math.floor((nowMs - startMs) / 1000)),
    remainingSeconds,
    overtimeSeconds,
    isOvertime,
    level: levelOf(remainingSeconds, isOvertime),
  };
}

/** 提出時の時間情報を計算する */
export function computeSubmitTiming(startedAt: string, targetEndAt: string, submittedAt: string) {
  const submittedMs = Date.parse(submittedAt);
  const durationSeconds = Math.max(0, Math.floor((submittedMs - Date.parse(startedAt)) / 1000));
  const overtimeSeconds = Math.max(0, Math.floor((submittedMs - Date.parse(targetEndAt)) / 1000));
  return { durationSeconds, timeExceeded: overtimeSeconds > 0, overtimeSeconds };
}
