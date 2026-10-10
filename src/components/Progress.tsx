interface Props {
  value: number;
  max: number;
  label: string;
}

/** 進捗バー */
export function Progress({ value, max, label }: Props) {
  const percent = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div
      className="progress"
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={Math.min(value, max)}
    >
      <div className="progress__bar" style={{ width: `${percent}%` }} />
    </div>
  );
}
