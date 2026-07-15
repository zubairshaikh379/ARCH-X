import React from "react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Full-featured markdown renderer with all missing features added
export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const rendered = parseMarkdown(content);
  return (
    <div
      className={`md-content ${className}`}
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}

function escape(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function parseInline(text: string): string {
  return text
    // Bold + Italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    // Bold
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    // Italic
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(?!_)(.+?)_/g, "<em>$1</em>")
    // Strikethrough
    .replace(/~~(.+?)~~/g, "<del>$1</del>")
    // Inline code
    .replace(/`([^`]+)`/g, (_, code) => `<code>${escape(code)}</code>`)
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label, href) =>
      `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
    )
    // Auto-links
    .replace(/(https?:\/\/[^\s<>"]+)/g, (url) =>
      `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`
    );
}

function parseMarkdown(md: string): string {
  const lines = md.split("\n");
  let html = "";
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // ── Fenced code block ────────────────────────────────────────
    if (/^```/.test(line)) {
      const lang = line.slice(3).trim();
      let code = "";
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) {
        code += escape(lines[i]) + "\n";
        i++;
      }
      html += `<pre><code class="language-${lang}">${code.trimEnd()}</code></pre>`;
      i++;
      continue;
    }

    // ── Horizontal rule ──────────────────────────────────────────
    if (/^---+$/.test(line.trim()) || /^\*\*\*+$/.test(line.trim())) {
      html += "<hr />";
      i++;
      continue;
    }

    // ── Headings ─────────────────────────────────────────────────
    const headingMatch = line.match(/^(#{1,6})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      html += `<h${level}>${parseInline(headingMatch[2])}</h${level}>`;
      i++;
      continue;
    }

    // ── Blockquote ───────────────────────────────────────────────
    if (line.startsWith("> ")) {
      let bqContent = line.slice(2);
      i++;
      while (i < lines.length && lines[i].startsWith("> ")) {
        bqContent += "\n" + lines[i].slice(2);
        i++;
      }
      html += `<blockquote>${parseInline(bqContent)}</blockquote>`;
      continue;
    }

    // ── Ordered list ─────────────────────────────────────────────
    if (/^\d+\.\s/.test(line)) {
      html += "<ol>";
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^\d+\.\s+/, "");
        html += `<li>${parseInline(itemText)}</li>`;
        i++;
      }
      html += "</ol>";
      continue;
    }

    // ── Unordered list ───────────────────────────────────────────
    if (/^[-*+]\s/.test(line)) {
      html += "<ul>";
      while (i < lines.length && /^[-*+]\s/.test(lines[i])) {
        const itemText = lines[i].replace(/^[-*+]\s+/, "");
        html += `<li>${parseInline(itemText)}</li>`;
        i++;
      }
      html += "</ul>";
      continue;
    }

    // ── Table ────────────────────────────────────────────────────
    if (line.includes("|") && i + 1 < lines.length && /^[-| ]+$/.test(lines[i + 1])) {
      const headers = line.split("|").filter(Boolean).map(h => h.trim());
      i += 2; // skip header row + separator
      html += "<table><thead><tr>";
      headers.forEach(h => { html += `<th>${parseInline(h)}</th>`; });
      html += "</tr></thead><tbody>";
      while (i < lines.length && lines[i].includes("|")) {
        const cells = lines[i].split("|").filter(Boolean).map(c => c.trim());
        html += "<tr>";
        cells.forEach(c => { html += `<td>${parseInline(c)}</td>`; });
        html += "</tr>";
        i++;
      }
      html += "</tbody></table>";
      continue;
    }

    // ── Empty line ───────────────────────────────────────────────
    if (line.trim() === "") {
      i++;
      continue;
    }

    // ── Paragraph ────────────────────────────────────────────────
    let paraText = line;
    i++;
    while (
      i < lines.length &&
      lines[i].trim() !== "" &&
      !/^#{1,6}\s/.test(lines[i]) &&
      !/^```/.test(lines[i]) &&
      !/^[-*+]\s/.test(lines[i]) &&
      !/^\d+\.\s/.test(lines[i]) &&
      !/^> /.test(lines[i]) &&
      !lines[i].includes("|")
    ) {
      paraText += " " + lines[i];
      i++;
    }
    html += `<p>${parseInline(paraText)}</p>`;
  }

  return html;
}
