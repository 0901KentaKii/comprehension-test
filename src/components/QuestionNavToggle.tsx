import { useId, useState, type ComponentProps } from "react";
import { QuestionNav } from "./QuestionNav";

/**
 * 開閉できる問題一覧。ボタンを押すたびに一覧を開く / 閉じる。問題を選ぶと自動で閉じる。
 * 問題数が多いので普段は閉じておき、移動したいときだけ開く。
 */
export function QuestionNavToggle(props: ComponentProps<typeof QuestionNav>) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <div className={`qtoggle${open ? " is-open" : ""}`}>
      <button
        type="button"
        className="qtoggle__button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        <span>{open ? "問題一覧を閉じる" : "問題一覧を開く"}</span>
        {!open && <span className="qtoggle__hint">(問題を選んで移動)</span>}
        <svg className="qtoggle__chevron" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path d="M5 9l7 7 7-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div id={panelId} className="qtoggle__panel" hidden={!open}>
        <QuestionNav
          {...props}
          onJump={(index) => {
            // 問題を選んだら一覧を閉じて、選んだ問題をすぐ読めるようにする
            setOpen(false);
            props.onJump(index);
          }}
        />
      </div>
    </div>
  );
}
