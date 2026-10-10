import { useState, type FormEvent, type ReactNode } from "react";
import { testConfig } from "../config/testConfig";
import type { DesignKit } from "../designs/types";
import type { TestController } from "../hooks/useTestSession";

interface Props {
  design: DesignKit;
  controller: TestController;
  back: ReactNode;
}

/** 氏名の入力画面。「テストを開始する」を押した瞬間が開始日時になる */
export function UserInfoPage({ design, controller, back }: Props) {
  const { questions, start } = controller;
  const [userName, setUserName] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const nameError = userName.trim() === "" ? "氏名を入力してください。" : "";
  const textCount = questions.filter((q) => q.type === "text").length;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (nameError) {
      setShowErrors(true);
      document.getElementById("user-name")?.focus();
      return;
    }
    start(userName.trim());
  };

  return (
    <design.Frame title={testConfig.title} back={back}>
      <div className="panel">
        <h2 className="panel__title">氏名の入力</h2>

        <dl className="facts">
          <div>
            <dt>問題数</dt>
            <dd>
              {questions.length}問
              <small>
                (選択式 {questions.length - textCount}・記述式 {textCount})
              </small>
            </dd>
          </div>
          <div>
            <dt>設定時間</dt>
            <dd>{testConfig.durationMinutes}分</dd>
          </div>
        </dl>

        <ul className="notes">
          <li>「テストを開始する」を押すと、時間の計測が始まります。</li>
          <li>設定時間を過ぎても回答を続けられます。超過した時間は記録されます。</li>
          <li>回答は自動で保存されます。ブラウザを閉じても、同じ端末・同じブラウザで再開できます(時間の計測は止まりません)。</li>
        </ul>

        <form className="form" onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="user-name">氏名</label>
            <input
              id="user-name"
              type="text"
              autoComplete="off"
              maxLength={50}
              placeholder="例)山田 太郎"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              aria-invalid={showErrors && nameError !== ""}
              aria-describedby={showErrors && nameError ? "user-name-error" : undefined}
            />
            {showErrors && nameError && (
              <p id="user-name-error" className="field__error">
                {nameError}
              </p>
            )}
          </div>

          <div className="actions actions--single">
            <button type="submit" className="btn btn--primary btn--lg">
              テストを開始する
            </button>
          </div>
        </form>
      </div>
    </design.Frame>
  );
}
