import type { TimerLevel, TimerState } from "../types/test";
import { formatClock, formatDuration } from "../utils/time";
import { ClockIcon, OvertimeIcon } from "./common/Icons";

/** 段階が変わったときだけ読み上げるメッセージ (毎秒は読み上げない) */
const ANNOUNCEMENTS: Record<TimerLevel, string> = {
  normal: "",
  notice: "残り時間が10分以下になりました。",
  warning: "残り時間が5分以下になりました。",
  critical: "残り時間が1分以下になりました。",
  overtime: "設定時間を超過しました。回答はそのまま続けられます。",
};

/**
 * 残り時間 / 超過時間の表示。
 * 残り時間に応じて timer--notice / --warning / --critical / --overtime のクラスが付き、
 * 超過後は「設定時間を超過しています」と超過時間の表示に切り替わる。
 * 見た目は各デザインの CSS で調整する。
 */
export function Timer({ timer }: { timer: TimerState }) {
  const { isOvertime, level } = timer;
  const seconds = isOvertime ? timer.overtimeSeconds : timer.remainingSeconds;
  const label = isOvertime ? "超過時間" : "残り時間";

  return (
    <div className={`timer timer--${level}`} role="timer" aria-label={`${label} ${formatDuration(seconds)}`}>
      <span className="timer__icon">{isOvertime ? <OvertimeIcon /> : <ClockIcon />}</span>
      <span className="timer__body">
        {isOvertime && <span className="timer__note">設定時間を超過しています</span>}
        <span className="timer__main">
          <span className="timer__label">{label}</span>
          <span className="timer__value">
            {isOvertime && <span className="timer__plus">+</span>}
            {formatClock(seconds)}
          </span>
        </span>
      </span>
      <span className="visually-hidden" aria-live="polite">
        {ANNOUNCEMENTS[level]}
      </span>
    </div>
  );
}
