import { useEffect } from "react";
import { Link } from "react-router-dom";
import { designs } from "../designs";
import { useTestStorage } from "../hooks/useTestStorage";
import "../styles/home.css";

/** 各デザインのレイアウトを表す小さな模式図 */
function Thumbnail({ id }: { id: number }) {
  return (
    <div className={`thumb thumb--${id}`} aria-hidden="true">
      <i className="thumb__pill thumb__pill--center" />
      <div className="thumb__card">
        <i className="thumb__line thumb__line--q" />
        <i className="thumb__opt" />
        <i className="thumb__opt thumb__opt--on" />
        <i className="thumb__opt" />
      </div>
      <div className="thumb__row">
        <i className="thumb__btn" />
        <i className="thumb__btn thumb__btn--on" />
      </div>
    </div>
  );
}

/** デザイン選択・確認用ホーム画面 */
export function DesignSelectionPage() {
  const { session } = useTestStorage();

  useEffect(() => {
    document.title = "オンラインテスト デザイン確認";
  }, []);

  return (
    <div className="home">
      <header className="home__header">
        <p className="home__eyebrow">オンラインテスト</p>
        <h1 className="home__title">デザイン確認</h1>
        <p className="home__lead">テスト画面のデザイン候補を選択してください。</p>
      </header>

      {session && (
        <p className="home__notice" role="status">
          受験中のデータがあります({session.userName} さん)。どのデザインを開いても、同じ回答・同じ残り時間の続きから確認できます。
        </p>
      )}

      <ul className="home__grid">
        {designs.map((d) => (
          <li key={d.id} className="home-card">
            <Thumbnail id={d.id} />
            <div className="home-card__body">
              <p className="home-card__label">DESIGN {String(d.id).padStart(2, "0")}</p>
              <h2 className="home-card__name">{d.name}</h2>
              <p className="home-card__desc">{d.description}</p>
              <Link to={`/design/${d.id}`} className="home-card__link">
                確認する
                <span className="visually-hidden">(DESIGN {String(d.id).padStart(2, "0")} {d.name})</span>
              </Link>
            </div>
          </li>
        ))}
      </ul>

      <footer className="home__footer">
        <p>
          問題・回答・タイマー・保存・提出の仕組みはデザインと分離されています。
        </p>
      </footer>
    </div>
  );
}
