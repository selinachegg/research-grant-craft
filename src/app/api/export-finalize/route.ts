/**
 * POST /api/export-finalize
 *
 * Uses the configured LLM to transform a raw proposal draft into a
 * finalized export document.  Two formats supported:
 *
 *   format: 'pdf-html'  → returns { htmlBody: string }
 *     Clean HTML body content (no wrapper tags, no markdown symbols).
 *     All [FILL IN:] placeholders replaced with realistic example content.
 *     Ready to inject into the print template.
 *
 *   format: 'latex'     → returns { latexSource: string }
 *     Complete compilable LaTeX document (article class).
 *     All [FILL IN:] replaced. Compiles in Overleaf without errors.
 *
 * Request body:
 *   { draftContent: string, title: string, format: 'pdf-html'|'latex', config: LlmConfig }
 *
 * Errors:
 *   400  Missing/invalid body or no API key (code: 'NO_CONFIG')
 *   422  Draft too short
 *   502  Upstream LLM error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LlmConfig } from '@/lib/llm/types';

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  'You are an expert scientific writer and LaTeX typesetter specialising in ' +
  'EU Horizon Europe research proposals. You produce polished, publication-ready documents.';

function buildPdfHtmlPrompt(draftContent: string, title: string): string {
  return `You are generating a FINAL EXPORT DOCUMENT from a Horizon Europe research proposal draft.

TITLE: ${title}

CRITICAL OUTPUT RULES:
- Output ONLY clean HTML body content — no <html>, <head>, or <body> wrapper tags
- Do NOT use any markdown syntax. No #, ##, **, *, |, >, backticks, or dashes for formatting
- Output real HTML only: <h1>–<h4>, <p>, <strong>, <em>, <ul><li>, <ol><li>, <table><thead><tr><th>/<tbody><tr><td>, <blockquote>, <hr>
- Replace ALL [FILL IN: ...] placeholders with complete, realistic example content appropriate for a Horizon Europe RIA/IA proposal. Make the content specific, professional, and plausible.
- Remove "(AI draft — verify:)" prefixes — keep only the substantive content after the prefix
- Never output code fences, never output markdown, never output placeholder brackets

DOCUMENT STYLE:
- Tone: formal, professional, EU research proposal style
- Tables must be real <table> elements with headers and at least 3 data rows
- Sections must be hierarchical with consistent heading levels
- All content must be complete — no missing information

DRAFT TO FINALIZE:
${draftContent}

Output ONLY the HTML body content. Start directly with the first heading tag. No preamble, no code fences, no markdown.`;
}

function buildLatexPrompt(draftContent: string, title: string): string {
  return `You are generating a FINAL COMPILABLE LaTeX DOCUMENT from a Horizon Europe research proposal draft.

TITLE: ${title}

CRITICAL OUTPUT RULES:
- Output ONLY valid LaTeX code that compiles without errors in Overleaf
- Start directly with \\documentclass[a4paper,12pt]{article}
- Do NOT wrap in code fences (no \`\`\`latex or \`\`\`)
- Do NOT include any markdown syntax
- Replace ALL [FILL IN: ...] placeholders with complete, realistic example content for a Horizon Europe RIA/IA proposal
- Remove "(AI draft — verify:)" prefixes — keep only the substantive content
- All tables must be valid LaTeX tabular/longtable environments

REQUIRED PACKAGES (include all of these):
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
\\usepackage[hidelinks,colorlinks=true,linkcolor=indigo,urlcolor=indigo]{hyperref}
\\usepackage{titlesec}

STRUCTURE RULES:
- \\section{} for top-level proposal sections (Excellence, Impact, Implementation)
- \\subsection{} and \\subsubsection{} for sub-sections
- Tables: \\begin{longtable}{...} with \\toprule, \\midrule, \\bottomrule from booktabs
- Lists: \\begin{itemize} or \\begin{enumerate} with \\item
- Bold: \\textbf{}, italic: \\textit{}
- Define \\definecolor{indigo}{RGB}{79,70,229} in preamble
- Include a title block with \\begin{center} ... \\end{center} before \\tableofcontents

DOCUMENT STYLE:
- Formal EU research proposal tone in professional academic English
- Clean consistent section hierarchy
- All tables complete — no missing columns or rows
- Tables for: Work Packages, Milestones, Deliverables, Risk Register, Budget (if present in draft)

DRAFT TO FINALIZE:
${draftContent}

Output ONLY the LaTeX code. Start with \\documentclass. No code fences. No markdown. No explanations.`;
}

// ---------------------------------------------------------------------------
// Strip accidental code fences that some LLMs add despite instructions
// ---------------------------------------------------------------------------

function stripCodeFences(text: string): string {
  // Remove leading ```latex, ```html, ``` etc.
  let s = text.trim();
  s = s.replace(/^```[a-z]*\r?\n/i, '');
  s = s.replace(/\r?\n```\s*$/, '');
  return s.trim();
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { draftContent, title, format, config } = body as Record<string, unknown>;

  // Validate inputs
  if (typeof draftContent !== 'string') {
    return NextResponse.json({ error: '`draftContent` must be a string.' }, { status: 400 });
  }
  if (draftContent.trim().length < 50) {
    return NextResponse.json(
      { error: 'Draft is too short to finalize (minimum 50 characters).' },
      { status: 422 },
    );
  }
  if (format !== 'pdf-html' && format !== 'latex') {
    return NextResponse.json(
      { error: '`format` must be "pdf-html" or "latex".' },
      { status: 400 },
    );
  }

  const llmConfig = config as LlmConfig | undefined;
  if (!llmConfig?.endpoint || !llmConfig?.apiKey) {
    return NextResponse.json(
      {
        error: 'No API key configured. Add your LLM endpoint and key in Settings to use AI-finalized export.',
        code: 'NO_CONFIG',
      },
      { status: 400 },
    );
  }

  const safeTitle = typeof title === 'string' ? title : 'Horizon Europe Proposal';
  const model = llmConfig.model || 'gpt-4o';
  const prompt =
    format === 'pdf-html'
      ? buildPdfHtmlPrompt(draftContent, safeTitle)
      : buildLatexPrompt(draftContent, safeTitle);

  try {
    const upstream = await fetch(`${llmConfig.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.15, // Very low — deterministic, precise output
        max_tokens: 8192,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[/api/export-finalize] Upstream error:', upstream.status, errText);
      return NextResponse.json(
        { error: `LLM API returned ${upstream.status}. Check your endpoint and API key in Settings.` },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    const rawOutput: string = data?.choices?.[0]?.message?.content ?? '';

    if (!rawOutput) {
      return NextResponse.json(
        { error: 'LLM returned an empty response. Try again.' },
        { status: 502 },
      );
    }

    const cleaned = stripCodeFences(rawOutput);

    if (format === 'pdf-html') {
      return NextResponse.json({ htmlBody: cleaned, model }, { status: 200 });
    } else {
      return NextResponse.json({ latexSource: cleaned, model }, { status: 200 });
    }
  } catch (err) {
    console.error('[/api/export-finalize] Error:', err);
    return NextResponse.json(
      { error: 'Internal error calling LLM. Check server logs.' },
      { status: 500 },
    );
  }
}
