import type { AnswerStats } from "../types/test";

interface Props {
  stats: AnswerStats;
  /** 未回答の問題を押したときの処理。省略時は押せない表示になる */
  onJump?: (index: number) => void;
}

/** 回答済み数・未回答数と、未回答問題の一覧 */
export function AnswerSummary({ stats, onJump }: Props) {
  return (
    <div className="summary">
      <dl className="summary__counts">
        <div className="summary__count">
          <dt>回答済み</dt>
          <dd>
            <strong>{stats.answered}</strong> / {stats.total}
          </dd>
        </div>
        <div className={`summary__count${stats.unanswered > 0 ? " summary__count--alert" : ""}`}>
          <dt>未回答</dt>
          <dd>
            <strong>{stats.unanswered}</strong> / {stats.total}
          </dd>
        </div>
      </dl>

      {stats.unanswered > 0 ? (
        <div className="summary__unanswered">
          <h3 className="summary__subtitle">未回答問題</h3>
          <ul className="summary__list">
            {stats.unansweredNumbers.map((n) => (
              <li key={n}>
                {onJump ? (
                  <button type="button" className="summary__jump" onClick={() => onJump(n - 1)}>
                    問{n}
                    <span className="visually-hidden">へ移動して回答する</span>
                  </button>
                ) : (
                  <span className="summary__jump summary__jump--static">問{n}</span>
                )}
              </li>
            ))}
          </ul>
          {onJump && <p className="summary__hint">問題番号を押すと、その問題に戻って回答できます。</p>}
        </div>
      ) : (
        <p className="summary__complete">すべての問題に回答済みです。</p>
      )}
    </div>
  );
}
