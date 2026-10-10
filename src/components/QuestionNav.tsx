import { useEffect, useRef } from "react";
import type { AnswerMap, Question } from "../types/test";
import { isAnswered } from "../utils/answers";
import { CheckIcon } from "./common/Icons";

interface Props {
  questions: Question[];
  answers: AnswerMap;
  currentIndex: number;
  onJump: (index: number) => void;
}

/**
 * 問題一覧。回答済み・未回答・現在位置を表示し、押すとその問題へ移動する。
 * 状態は色だけでなく、チェックマークと文字 (回答済み / 未回答)、現在位置の枠でも示す。
 * どこまで表示するか (種別・文字の有無) は各デザインの CSS で決める。
 */
export function QuestionNav({ questions, answers, currentIndex, onJump }: Props) {
  const navRef = useRef<HTMLElement>(null);
  const currentRef = useRef<HTMLButtonElement>(null);

  // 一覧がスクロールする場合、現在の問題が表示範囲内に入るようにする
  // (ページ全体は動かさず、一覧の中だけをスクロールする)
  useEffect(() => {
    const nav = navRef.current;
    const item = currentRef.current;
    if (!nav || !item) return;
    const itemBox = item.getBoundingClientRect();

    // 縦にスクロールする一覧
    if (nav.scrollHeight > nav.clientHeight) {
      const navBox = nav.getBoundingClientRect();
      if (itemBox.top < navBox.top) nav.scrollTop -= navBox.top - itemBox.top + 8;
      else if (itemBox.bottom > navBox.bottom) nav.scrollTop += itemBox.bottom - navBox.bottom + 8;
    }

    // 横にスクロールする一覧 (狭い画面の1段表示): 現在の問題を中央付近に寄せる
    const list = nav.querySelector("ol");
    if (list && list.scrollWidth > list.clientWidth) {
      const listBox = list.getBoundingClientRect();
      list.scrollLeft += itemBox.left + itemBox.width / 2 - (listBox.left + listBox.width / 2);
    }
  }, [currentIndex]);

  return (
    <nav className="qnav" ref={navRef} aria-label="問題一覧">
      <ol className="qnav__list">
        {questions.map((q, i) => {
          const answered = isAnswered(q, answers);
          const current = i === currentIndex;
          const state = answered ? "回答済み" : "未回答";
          return (
            <li key={q.id}>
              <button
                type="button"
                ref={current ? currentRef : undefined}
                className={`qnav__item${answered ? " is-answered" : ""}${current ? " is-current" : ""}`}
                aria-current={current ? "step" : undefined}
                aria-label={`問題${i + 1} ${q.type === "text" ? "記述式 " : ""}${state}${current ? " 表示中" : ""}`}
                onClick={() => onJump(i)}
              >
                <span className="qnav__num">{i + 1}</span>
                <span className="qnav__type">{q.type === "text" ? "記述式" : "選択式"}</span>
                <span className="qnav__status" aria-hidden="true">
                  {answered && <CheckIcon size={14} />}
                  <span className="qnav__label">{state}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
