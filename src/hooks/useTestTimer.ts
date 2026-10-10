import { useEffect, useState } from "react";
import type { TestSession, TimerState } from "../types/test";
import { computeTimer } from "../utils/time";

/**
 * 残り時間・超過時間を返す。
 *
 * setInterval は「画面を再描画するきっかけ」としてだけ使い、
 * 値そのものは毎回 targetEndAt - 現在時刻 から計算する。
 * そのためリロード・タブの休止・ブラウザを閉じた後の再アクセスでもずれない。
 *
 * 提出後 (submittedAt がある場合) は提出時点の時刻で固定する。
 */
export function useTestTimer(
  session: Pick<TestSession, "startedAt" | "targetEndAt" | "submittedAt">,
): TimerState {
  const { startedAt, targetEndAt, submittedAt } = session;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (submittedAt) return;
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 250);
    // タブが再表示されたときに即座に追従させる
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [submittedAt, startedAt, targetEndAt]);

  return computeTimer(startedAt, targetEndAt, submittedAt ? Date.parse(submittedAt) : now);
}
