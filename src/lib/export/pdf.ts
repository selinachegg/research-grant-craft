/**
 * pdf.ts — Export a proposal markdown draft as a print-ready PDF.
 *
 * Strategy: render markdown → HTML in an invisible iframe with print CSS,
 * then call contentWindow.print(). The browser shows its native "Save as PDF"
 * dialog — zero dependencies, works offline.
 */

// ---------------------------------------------------------------------------
// Inline HTML conversion (markdown → HTML)
// ---------------------------------------------------------------------------

function htmlEsc(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineHtml(text: string): string {
  let s = text;
  // Bold
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  // Inline code
  s = s.replace(/`([^`]+)`/g, (_, c) => `<code>${htmlEsc(c)}</code>`);
  // [FILL IN: ...] highlighted cells
  s = s.replace(/\[FILL IN: ([^\]]+)\]/g, '<mark>[FILL IN: $1]</mark>');
  // (AI draft — verify:) tag
  s = s.replace(/\(AI draft — verify:\)/g, '<span class="ai-tag">(AI draft — verify:)</span>');
  // Hyperlinks
  s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  return s;
}

function tableToHtml(lines: string[]): string {
  const isSep = (l: string) =>
    l.split('|').slice(1, -1).every((c) => /^[\s:-]+$/.test(c));
  const dataLines = lines.filter((l) => !isSep(l));
  if (dataLines.length === 0) return '';

  const parseRow = (line: string) =>
    line.split('|').slice(1, -1).map((c) => inlineHtml(c.trim()));

  const [headerCells, ...bodyRows] = dataLines.map(parseRow);
  const ths = headerCells.map((c) => `<th>${c}</th>`).join('');
  const trs = bodyRows
    .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join('')}</tr>`)
    .join('');

  return `<table><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table>`;
}

function mdToHtml(markdown: string): string {
  const lines = markdown.split('\n');
  const out: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(htmlEsc(lines[i]));
        i++;
      }
      out.push(`<pre><code>${codeLines.join('\n')}</code></pre>`);
      i++;
      continue;
    }

    // Headings
    const hm = line.match(/^(#{1,6})\s+(.+)/);
    if (hm) {
      const lvl = hm[1].length;
      out.push(`<h${lvl}>${inlineHtml(hm[2])}</h${lvl}>`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*]{3,}\s*$/.test(line)) {
      out.push('<hr>');
      i++;
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const tLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) tLines.push(lines[i++]);
      out.push(tableToHtml(tLines));
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(`<li>${inlineHtml(lines[i].replace(/^[-*+]\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ul>${items.join('')}</ul>`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${inlineHtml(lines[i].replace(/^\d+\.\s+/, ''))}</li>`);
        i++;
      }
      out.push(`<ol>${items.join('')}</ol>`);
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        qLines.push(inlineHtml(lines[i].slice(2)));
        i++;
      }
      out.push(`<blockquote>${qLines.join(' ')}</blockquote>`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      out.push('');
      i++;
      continue;
    }

    // Paragraph
    out.push(`<p>${inlineHtml(line)}</p>`);
    i++;
  }

  return out.join('\n');
}

// ---------------------------------------------------------------------------
// Shared print template
// ---------------------------------------------------------------------------

function buildPrintTemplate(bodyHtml: string, safeTitle: string): string {
  const today = new Date().toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>${safeTitle}</title>
<style>
  :root { font-size: 11pt; }
  body {
    font-family: Georgia, 'Times New Roman', serif;
    max-width: 800px; margin: 0 auto; padding: 2cm 2.5cm;
    color: #111; line-height: 1.7;
  }
  .doc-title {
    font-size: 20pt; font-weight: bold; color: #1e1b4b;
    border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 4px;
  }
  .doc-meta { color: #666; font-size: 9pt; margin-bottom: 36px; padding-bottom: 12px; border-bottom: 1px solid #ddd; }
  h1 { font-size: 15pt; color: #1e1b4b; border-bottom: 2px solid #4f46e5; padding-bottom: 6px; margin-top: 36px; }
  h2 { font-size: 13pt; border-bottom: 1px solid #bbb; margin-top: 28px; padding-bottom: 4px; }
  h3 { font-size: 12pt; margin-top: 20px; color: #333; }
  h4, h5, h6 { font-size: 11pt; margin-top: 14px; }
  p { margin: 6px 0 10px; }
  blockquote { border-left: 4px solid #6366f1; margin: 14px 0; padding: 8px 14px; color: #444; background: #f8f8ff; font-style: italic; }
  table { border-collapse: collapse; width: 100%; margin: 14px 0; font-size: 9.5pt; }
  th { background: #ede9fe; font-weight: bold; border: 1px solid #c4b5fd; padding: 6px 10px; text-align: left; }
  td { border: 1px solid #ddd; padding: 5px 10px; vertical-align: top; }
  mark { background: #fff3cd; padding: 1px 4px; border-radius: 3px; font-style: italic; color: #856404; font-size: 0.9em; }
  .ai-tag { color: #6366f1; font-style: italic; font-size: 0.9em; }
  code { background: #f4f4f4; padding: 1px 4px; border-radius: 3px; font-family: monospace; font-size: 9pt; }
  pre  { background: #f4f4f4; padding: 12px; border-radius: 6px; font-size: 9pt; white-space: pre-wrap; word-break: break-all; }
  hr   { border: none; border-top: 1px solid #ccc; margin: 22px 0; }
  ul, ol { margin: 6px 0 10px; padding-left: 22px; }
  li   { margin: 3px 0; }
  a    { color: #4f46e5; }
  @media print {
    body { margin: 0; padding: 0; max-width: none; }
    a    { color: inherit; text-decoration: none; }
    @page { margin: 2cm 2.5cm; size: A4; }
    h1, h2, h3  { page-break-after: avoid; }
    tr          { page-break-inside: avoid; }
    blockquote  { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="doc-title">${safeTitle}</div>
<div class="doc-meta">Horizon Europe Proposal &nbsp;·&nbsp; Exported ${today} via Research Grant Craft Lab</div>
${bodyHtml}
<script>
  window.addEventListener('load', function () {
    setTimeout(function () { window.print(); }, 300);
  });
</script>
</body>
</html>`;
}

function openPrintIframe(fullHtml: string): void {
  const iframe = document.createElement('iframe');
  Object.assign(iframe.style, {
    position: 'fixed', right: '0', bottom: '0',
    width: '0', height: '0', border: '0', visibility: 'hidden',
  });
  document.body.appendChild(iframe);
  const doc = iframe.contentDocument ?? iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }
  doc.open();
  doc.write(fullHtml);
  doc.close();
  setTimeout(() => { document.body.removeChild(iframe); }, 30_000);
}

// ---------------------------------------------------------------------------
// Public export functions
// ---------------------------------------------------------------------------

/**
 * AI-finalized export: receives pre-rendered clean HTML body from the LLM
 * (via /api/export-finalize) and injects it into the print template.
 */
export function exportAsPdfFromHtml(htmlBody: string, title: string): void {
  const safeTitle = htmlEsc(title);
  openPrintIframe(buildPrintTemplate(htmlBody, safeTitle));
}

/**
 * Fallback export: converts markdown client-side (no AI, no API key required).
 */
export function exportAsPdf(markdown: string, title: string): void {
  openPrintIframe(buildPrintTemplate(mdToHtml(markdown), htmlEsc(title)));
}
