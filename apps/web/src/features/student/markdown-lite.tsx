import type { ReactNode } from "react";

/**
 * Renders the small, fixed subset of Markdown used in intervention-templates.json
 * (bold, pipe tables, fenced code blocks, blockquotes, bullet lists, paragraphs).
 * Content is static curated curriculum copy, not user input — this exists so it
 * displays as intended instead of as raw `**`/`|`/`>` syntax.
 */
export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  return (
    <div className="student-md">
      {blocks.map((block, index) => renderBlock(block, index))}
    </div>
  );
}

function renderBlock(rawBlock: string, key: number): ReactNode {
  const block = rawBlock.trim();
  if (!block) {
    return null;
  }
  const allLines = block.split("\n");
  const nonEmptyLines = allLines.filter((line) => line.trim().length > 0);
  if (nonEmptyLines.length === 0) {
    return null;
  }

  if (block.startsWith("```")) {
    const withoutOpenFence = allLines.slice(1);
    const closeIndex = withoutOpenFence.findIndex(
      (line) => line.trim() === "```",
    );
    const codeLines =
      closeIndex === -1
        ? withoutOpenFence
        : withoutOpenFence.slice(0, closeIndex);
    return (
      <pre className="student-md-code" key={key}>
        <code>{codeLines.join("\n")}</code>
      </pre>
    );
  }

  if (nonEmptyLines.every((line) => line.trimStart().startsWith("|"))) {
    return renderTable(nonEmptyLines, key);
  }

  if (nonEmptyLines.every((line) => line.trimStart().startsWith(">"))) {
    return (
      <blockquote className="student-md-quote" key={key}>
        {renderLines(
          nonEmptyLines.map((line) => line.trimStart().replace(/^>\s?/, "")),
        )}
      </blockquote>
    );
  }

  if (nonEmptyLines.every((line) => /^[-*]\s/.test(line.trimStart()))) {
    return (
      <ul className="student-md-list" key={key}>
        {nonEmptyLines.map((line, index) => (
          <li key={index}>
            {renderInline(line.trimStart().replace(/^[-*]\s/, ""))}
          </li>
        ))}
      </ul>
    );
  }

  return <p key={key}>{renderLines(nonEmptyLines)}</p>;
}

function renderLines(lines: string[]): ReactNode {
  return lines.map((line, index) => (
    <span key={index}>
      {renderInline(line)}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
}

function renderInline(text: string): ReactNode[] {
  const segments = text
    .split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
    .filter((s) => s.length > 0);
  return segments.map((segment, index) => {
    if (segment.startsWith("**") && segment.endsWith("**")) {
      return <strong key={index}>{segment.slice(2, -2)}</strong>;
    }
    if (segment.startsWith("*") && segment.endsWith("*")) {
      return <em key={index}>{segment.slice(1, -1)}</em>;
    }
    return segment;
  });
}

function renderTable(lines: string[], key: number): ReactNode {
  const rows = lines
    .map((line) =>
      line
        .trim()
        .replace(/^\||\|$/g, "")
        .split("|")
        .map((cell) => cell.trim()),
    )
    .filter((cells) => !cells.every((cell) => /^:?-+:?$/.test(cell)));
  const [header, ...body] = rows;
  if (!header) {
    return null;
  }
  return (
    <div className="student-md-table-wrap" key={key}>
      <table className="student-md-table">
        <thead>
          <tr>
            {header.map((cell, index) => (
              <th key={index}>{renderInline(cell)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex}>{renderInline(cell)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
