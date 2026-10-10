import type { ContentBlock, QuestionBody } from "../../types/test";

function Block({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case "p":
      return <p className="qc__p">{block.text}</p>;
    case "ask":
      return <p className="qc__ask">{block.text}</p>;
    case "heading":
      return <h3 className="qc__heading">{block.text}</h3>;
    case "quote":
      return (
        <blockquote className="qc__quote">
          {block.lines.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </blockquote>
      );
    case "list": {
      const List = block.ordered ? "ol" : "ul";
      return (
        <List
          className={`qc__list${block.ordered ? " qc__list--ordered" : ""}${block.plain ? " qc__list--plain" : ""}`}
        >
          {block.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </List>
      );
    }
    case "table":
      return (
        // 幅の狭い画面では表だけを横スクロールできるようにする
        <div className="qc__table-wrap" tabIndex={0} role="group" aria-label="表">
          <table className="qc__table">
            <thead>
              <tr>
                {block.headers.map((h, i) => (
                  <th key={i} scope="col">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/** 問題文の表示。文字列ならそのまま、部品の配列なら原文の順序どおりに並べる */
export function QuestionContent({ body }: { body: QuestionBody }) {
  if (typeof body === "string") {
    return (
      <div className="qc">
        <p className="qc__ask">{body}</p>
      </div>
    );
  }
  return (
    <div className="qc">
      {body.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </div>
  );
}
