/**
 * latex.ts — Export a proposal markdown draft as a LaTeX (.tex) source file.
 *
 * Produces a compilable article-class document with:
 *  - geometry, booktabs, enumitem, xcolor, hyperref, titlesec
 *  - [FILL IN: ...] cells highlighted with \colorbox
 *  - Tables using booktabs rules + p{} columns
 *  - Blockquotes rendered as \begin{quote}\itshape ... \end{quote}
 */

// ---------------------------------------------------------------------------
// LaTeX special-character escaping
// ---------------------------------------------------------------------------

function escChar(ch: string): string {
  switch (ch) {
    case '\\': return '\\textbackslash{}';
    case '&':  return '\\&';
    case '%':  return '\\%';
    case '$':  return '\\$';
    case '#':  return '\\#';
    case '_':  return '\\_';
    case '^':  return '\\textasciicircum{}';
    case '~':  return '\\textasciitilde{}';
    case '{':  return '\\{';
    case '}':  return '\\}';
    default:   return ch;
  }
}

function escStr(text: string): string {
  let out = '';
  for (const ch of text) out += escChar(ch);
  return out;
}

// ---------------------------------------------------------------------------
// Inline markdown → LaTeX (token-by-token to avoid double-escaping)
// ---------------------------------------------------------------------------

function formatInline(text: string): string {
  let result = '';
  let i = 0;

  while (i < text.length) {
    // **bold**
    if (text[i] === '*' && text[i + 1] === '*') {
      const end = text.indexOf('**', i + 2);
      if (end !== -1) {
        result += `\\textbf{${escStr(text.slice(i + 2, end))}}`;
        i = end + 2;
        continue;
      }
    }

    // *italic* (not **)
    if (text[i] === '*' && text[i + 1] !== '*') {
      const end = text.indexOf('*', i + 1);
      if (end !== -1) {
        result += `\\textit{${escStr(text.slice(i + 1, end))}}`;
        i = end + 1;
        continue;
      }
    }

    // `inline code`
    if (text[i] === '`' && text[i + 1] !== '`') {
      const end = text.indexOf('`', i + 1);
      if (end !== -1) {
        result += `\\texttt{${escStr(text.slice(i + 1, end))}}`;
        i = end + 1;
        continue;
      }
    }

    // [FILL IN: ...] guidance cells
    if (text.slice(i, i + 9) === '[FILL IN:') {
      const end = text.indexOf(']', i);
      if (end !== -1) {
        const content = text.slice(i + 1, end);
        result += `\\colorbox{fillcolor}{\\textit{\\small [${escStr(content)}]}}`;
        i = end + 1;
        continue;
      }
    }

    // [text](url) links
    if (text[i] === '[') {
      const textEnd = text.indexOf(']', i);
      if (textEnd !== -1 && text[textEnd + 1] === '(') {
        const urlEnd = text.indexOf(')', textEnd + 2);
        if (urlEnd !== -1) {
          const linkText = escStr(text.slice(i + 1, textEnd));
          const url = text.slice(textEnd + 2, urlEnd);
          result += `\\href{${url}}{${linkText}}`;
          i = urlEnd + 1;
          continue;
        }
      }
    }

    // Regular character — escape
    result += escChar(text[i]);
    i++;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Table conversion
// ---------------------------------------------------------------------------

function tableToLatex(lines: string[]): string {
  const isSep = (l: string) =>
    l.split('|').slice(1, -1).every((c) => /^[\s:-]+$/.test(c));
  const dataLines = lines.filter((l) => !isSep(l));
  if (dataLines.length === 0) return '';

  const parseRow = (line: string): string[] =>
    line.split('|').slice(1, -1).map((c) => c.trim());

  const [header, ...body] = dataLines.map(parseRow);
  const colCount = header.length;

  // Proportional p{} columns — leave 10% for inter-column spacing
  const pct = (0.9 / colCount).toFixed(2);
  const colSpec = Array(colCount).fill(`p{${pct}\\linewidth}`).join(' ');

  const headerRow = header.map((c) => `\\textbf{${formatInline(c)}}`).join(' & ');
  const bodyRows = body.map((row) => {
    const padded = [...row];
    while (padded.length < colCount) padded.push('');
    return padded.map((c) => formatInline(c)).join(' & ');
  });

  return [
    '\\begin{center}',
    `\\begin{tabular}{${colSpec}}`,
    '\\toprule',
    `${headerRow} \\\\`,
    '\\midrule',
    ...bodyRows.map((r) => `${r} \\\\`),
    '\\bottomrule',
    '\\end{tabular}',
    '\\end{center}',
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Body conversion (line-by-line state machine)
// ---------------------------------------------------------------------------

function convertBody(markdown: string): string {
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
        codeLines.push(lines[i]);
        i++;
      }
      out.push(`\\begin{verbatim}\n${codeLines.join('\n')}\n\\end{verbatim}`);
      i++;
      continue;
    }

    // Headings
    const h = line.match(/^(#{1,6})\s+(.+)/);
    if (h) {
      const lvl = h[1].length;
      const content = formatInline(h[2]);
      const cmds = ['\\section', '\\subsection', '\\subsubsection', '\\paragraph', '\\subparagraph', '\\subparagraph*'];
      out.push(`${cmds[Math.min(lvl - 1, 5)]}{${content}}`);
      i++;
      continue;
    }

    // Horizontal rule
    if (/^[-*]{3,}\s*$/.test(line)) {
      out.push('\\bigskip\\hrule\\bigskip');
      i++;
      continue;
    }

    // Table
    if (line.startsWith('|')) {
      const tLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('|')) tLines.push(lines[i++]);
      out.push(tableToLatex(tLines));
      continue;
    }

    // Unordered list
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(`  \\item ${formatInline(lines[i].replace(/^[-*+]\s+/, ''))}`);
        i++;
      }
      out.push(`\\begin{itemize}\n${items.join('\n')}\n\\end{itemize}`);
      continue;
    }

    // Ordered list
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`  \\item ${formatInline(lines[i].replace(/^\d+\.\s+/, ''))}`);
        i++;
      }
      out.push(`\\begin{enumerate}\n${items.join('\n')}\n\\end{enumerate}`);
      continue;
    }

    // Blockquote (guidance notes)
    if (line.startsWith('> ')) {
      const qLines: string[] = [];
      while (i < lines.length && lines[i].startsWith('> ')) {
        qLines.push(formatInline(lines[i].slice(2)));
        i++;
      }
      out.push(`\\begin{quote}\n\\itshape ${qLines.join(' ')}\n\\end{quote}`);
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      out.push('');
      i++;
      continue;
    }

    // Regular text line
    out.push(formatInline(line));
    i++;
  }

  return out.join('\n');
}

// ---------------------------------------------------------------------------
// LaTeX document wrapper
// ---------------------------------------------------------------------------

function buildDocument(title: string, body: string): string {
  // Use a simple escaped title for pdfinfo metadata
  const metaTitle = title.replace(/[\\{}]/g, ' ');

  return `\\documentclass[a4paper,12pt]{article}

% ── Packages ──────────────────────────────────────────────────────────────────
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage[a4paper,top=2.5cm,bottom=2.5cm,left=3cm,right=2.5cm]{geometry}
\\usepackage{lmodern}
\\usepackage{microtype}
\\usepackage{parskip}
\\usepackage{booktabs}
\\usepackage{array}
\\usepackage{longtable}
\\usepackage{enumitem}
\\usepackage[table]{xcolor}
\\usepackage[hidelinks,colorlinks=true,linkcolor=brandindigo,urlcolor=brandindigo,
            pdftitle={${metaTitle}}]{hyperref}
\\usepackage{titlesec}

% ── Colours ───────────────────────────────────────────────────────────────────
\\definecolor{fillcolor}{RGB}{255,243,205}      % amber — [FILL IN] cells
\\definecolor{brandindigo}{RGB}{79,70,229}      % brand indigo

% ── Heading formatting ────────────────────────────────────────────────────────
\\titleformat{\\section}
  {\\Large\\bfseries\\color{brandindigo}}{\\thesection}{1em}{}
  [{\\color{brandindigo}\\titlerule}]
\\titleformat{\\subsection}{\\large\\bfseries}{\\thesubsection}{1em}{}
\\titleformat{\\subsubsection}{\\normalsize\\bfseries\\itshape}{\\thesubsubsection}{1em}{}
\\titlespacing{\\section}{0pt}{18pt plus 2pt}{6pt}
\\titlespacing{\\subsection}{0pt}{14pt plus 2pt}{4pt}

% ── Lists ─────────────────────────────────────────────────────────────────────
\\setlist[itemize]{topsep=4pt,itemsep=2pt,parsep=0pt}
\\setlist[enumerate]{topsep=4pt,itemsep=2pt,parsep=0pt}

% ──────────────────────────────────────────────────────────────────────────────
\\begin{document}

% ── Title block ───────────────────────────────────────────────────────────────
\\begin{center}
  {\\LARGE\\bfseries\\color{brandindigo} ${formatInline(title)}}\\\\[6pt]
  {\\large Horizon Europe Proposal}\\\\[4pt]
  {\\small\\color{gray} Exported \\today\\ via Research Grant Craft Lab}
\\end{center}
\\vspace{0.8em}
{\\color{brandindigo}\\hrule}
\\vspace{1.6em}

% ── Body ──────────────────────────────────────────────────────────────────────
${body}

\\end{document}
`;
}

// ---------------------------------------------------------------------------
// Public export functions
// ---------------------------------------------------------------------------

/** Trigger a .tex file download from a pre-rendered LaTeX string (AI output). */
export function downloadLatex(latexSource: string, title: string): void {
  const blob = new Blob([latexSource], { type: 'text/plain; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.tex`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Fallback export: converts markdown client-side (no AI, no API key required). */
export function exportAsLatex(markdown: string, title: string): void {
  const body = convertBody(markdown);
  const latex = buildDocument(title, body);

  const blob = new Blob([latex], { type: 'text/plain; charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, '_').toLowerCase()}.tex`;
  a.click();
  URL.revokeObjectURL(url);
}
