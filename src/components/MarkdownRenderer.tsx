import React from "react";

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  if (!content) return null;

  // Split content by code blocks to isolate code from text
  const parts = content.split(/(```[\s\S]*?```)/g);

  return (
    <div className="space-y-4 text-zinc-300 leading-relaxed font-sans text-sm">
      {parts.map((part, index) => {
        // Handle code blocks
        if (part.startsWith("```")) {
          const match = part.match(/```(\w*)\n([\s\S]*?)```/);
          const lang = match ? match[1] : "";
          const code = match ? match[2] : part.slice(3, -3);

          return (
            <div key={index} className="my-4 bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden shadow-md">
              {lang && (
                <div className="bg-zinc-900 px-4 py-1.5 border-b border-zinc-800 flex justify-between items-center">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500">{lang}</span>
                  <span className="text-[9px] font-mono text-zinc-600">read-only-shell</span>
                </div>
              )}
              <pre className="p-4 overflow-x-auto font-mono text-xs text-zinc-300 bg-zinc-950/80 leading-relaxed">
                <code>{code.trim()}</code>
              </pre>
            </div>
          );
        }

        // Handle regular text block line-by-line
        const lines = part.split("\n");
        let listItems: string[] = [];
        let inList = false;

        const renderedLines: React.ReactNode[] = [];

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];

          // 1. Unordered lists
          if (line.trim().startsWith("* ") || line.trim().startsWith("- ")) {
            inList = true;
            listItems.push(line.replace(/^(\s*[*|-]\s)/, ""));
            continue;
          }

          // If list was active but current line is not a list item, flush the list items
          if (inList && listItems.length > 0) {
            renderedLines.push(
              <ul key={`list-${i}`} className="list-disc pl-5 my-2 space-y-1.5 text-zinc-300">
                {listItems.map((item, idx) => (
                  <li key={idx} className="marker:text-zinc-600">
                    {parseInlineStyles(item)}
                  </li>
                ))}
              </ul>
            );
            listItems = [];
            inList = false;
          }

          // 2. Headers
          if (line.startsWith("### ")) {
            const headingText = line.slice(4).trim();
            const id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            renderedLines.push(
              <h3 key={i} id={id} className="text-sm font-bold text-white uppercase tracking-wider mt-5 mb-2 first:mt-0 font-sans border-l-2 border-zinc-700 pl-2">
                {parseInlineStyles(line.slice(4))}
              </h3>
            );
          } else if (line.startsWith("## ")) {
            const headingText = line.slice(3).trim();
            const id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            renderedLines.push(
              <h2 key={i} id={id} className="text-base font-bold text-white mt-6 mb-3 first:mt-0 font-sans flex items-center gap-2">
                {parseInlineStyles(line.slice(3))}
              </h2>
            );
          } else if (line.startsWith("# ")) {
            const headingText = line.slice(2).trim();
            const id = headingText.toLowerCase().replace(/[^a-z0-9]+/g, "-");
            renderedLines.push(
              <h1 key={i} id={id} className="text-xl font-bold text-white mt-4 mb-4 first:mt-0 tracking-tight font-sans">
                {parseInlineStyles(line.slice(2))}
              </h1>
            );
          }
          // 3. Horizontal Rule
          else if (line.trim() === "---") {
            renderedLines.push(<hr key={i} className="border-zinc-800 my-4" />);
          }
          // 4. Empty line
          else if (line.trim() === "") {
            renderedLines.push(<div key={i} className="h-2" />);
          }
          // 5. Normal paragraphs
          else {
            renderedLines.push(
              <p key={i} className="text-zinc-300 mb-2 leading-relaxed">
                {parseInlineStyles(line)}
              </p>
            );
          }
        }

        // Flush any remaining list items at the end of parts
        if (inList && listItems.length > 0) {
          renderedLines.push(
            <ul key={`list-end`} className="list-disc pl-5 my-2 space-y-1.5 text-zinc-300">
              {listItems.map((item, idx) => (
                <li key={idx} className="marker:text-zinc-600">
                  {parseInlineStyles(item)}
                </li>
              ))}
            </ul>
          );
        }

        return <React.Fragment key={index}>{renderedLines}</React.Fragment>;
      })}
    </div>
  );
};

// Simple inline styling function to parse bold **text** and inline `code`
function parseInlineStyles(text: string): React.ReactNode {
  // Regex for inline code: `code`
  // Regex for bold: **text**
  const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={idx} className="font-extrabold text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={idx} className="px-1.5 py-0.5 bg-zinc-950 border border-zinc-800 text-zinc-300 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}
