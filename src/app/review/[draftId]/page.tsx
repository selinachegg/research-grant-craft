'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDraft, setDraftStatus } from '@/lib/drafts/store';
import { loadLlmConfig } from '@/lib/llm/types';
import type { LlmConfig } from '@/lib/llm/types';
import type { ReviewerReport } from '@/lib/reviewer/types';
import { exportAsPdf, exportAsPdfFromHtml } from '@/lib/export/pdf';
import { exportAsLatex, downloadLatex } from '@/lib/export/latex';

// ---------------------------------------------------------------------------
// Mark-complete CTA (shown after heuristic review)
// ---------------------------------------------------------------------------

function MarkCompleteCard({
  completed,
  onToggle,
  onBackToEditor,
}: {
  completed: boolean;
  onToggle: () => void;
  onBackToEditor: () => void;
}) {
  if (completed) {
    return (
      <div className="mt-8 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-6 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shrink-0 text-2xl">
          ✓
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-semibold text-emerald-800 dark:text-emerald-200 mb-1">Proposal marked as completed</p>
          <p className="text-sm text-emerald-700 dark:text-emerald-400">
            You can still edit or reopen it at any time from the home page.
          </p>
        </div>
        <button type="button" onClick={onToggle} className="btn-secondary text-xs shrink-0">
          ↺ Reopen
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 card p-6 flex flex-col sm:flex-row items-center gap-4 animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-950 flex items-center justify-center shrink-0">
        <CheckCircleOutlineIcon className="w-6 h-6 text-brand-500" />
      </div>
      <div className="flex-1 text-center sm:text-left">
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-1">Happy with the results?</p>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Mark this proposal as completed to move it to your Completed tab. You can always reopen and edit it later.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 shrink-0">
        <button type="button" onClick={onBackToEditor} className="btn-secondary text-xs">
          Back to editor
        </button>
        <button type="button" onClick={onToggle} className="btn-primary text-xs">
          ✓ Mark as completed
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Export proposal section (PDF + LaTeX)
// ---------------------------------------------------------------------------

function ExportSection({
  draftContent,
  draftTitle,
  llmConfig,
}: {
  draftContent: string;
  draftTitle: string;
  llmConfig: LlmConfig | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'latex' | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  async function handleExportPdf() {
    setOpen(false);
    let aiUsed = false;
    if (llmConfig?.endpoint && llmConfig?.apiKey) {
      setExportingFormat('pdf');
      try {
        const res = await fetch('/api/export-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftContent, title: draftTitle, format: 'pdf-html', config: llmConfig }),
        });
        if (res.ok) {
          const data = await res.json();
          exportAsPdfFromHtml(data.htmlBody as string, draftTitle);
          aiUsed = true;
        }
      } catch { /* fall through */ } finally {
        setExportingFormat(null);
      }
    }
    if (!aiUsed) exportAsPdf(draftContent, draftTitle);
  }

  async function handleExportLatex() {
    setOpen(false);
    let aiUsed = false;
    if (llmConfig?.endpoint && llmConfig?.apiKey) {
      setExportingFormat('latex');
      try {
        const res = await fetch('/api/export-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftContent, title: draftTitle, format: 'latex', config: llmConfig }),
        });
        if (res.ok) {
          const data = await res.json();
          downloadLatex(data.latexSource as string, draftTitle);
          aiUsed = true;
        }
      } catch { /* fall through */ } finally {
        setExportingFormat(null);
      }
    }
    if (!aiUsed) exportAsLatex(draftContent, draftTitle);
  }

  const item =
    'w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

  const hasAi = !!(llmConfig?.endpoint && llmConfig?.apiKey);

  return (
    <>
      <div ref={ref} className="relative shrink-0">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          disabled={!!exportingFormat}
          className="btn-primary py-1.5 px-4 text-xs flex items-center gap-1.5 disabled:opacity-60"
        >
          {exportingFormat ? (
            <><SpinnerSmIcon className="w-3.5 h-3.5 animate-spin" /> Finalizing…</>
          ) : (
            <><ShareIcon className="w-3.5 h-3.5" /> Export proposal <ChevronDownSmIcon className="w-3 h-3 ml-0.5" /></>
          )}
        </button>

        {open && (
          <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 w-56 animate-fade-in">
            <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
              Export your proposal {hasAi && <span className="text-brand-500">· AI-finalized</span>}
            </p>
            {hasAi && (
              <p className="px-3 pb-1.5 text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
                AI will fill all placeholders and produce a clean final document.
              </p>
            )}
            <button className={item} onClick={handleExportPdf}>
              <PdfIcon className="w-3.5 h-3.5 text-red-400 shrink-0" /> Print / Save as PDF
            </button>
            <button className={item} onClick={handleExportLatex}>
              <TexIcon className="w-3.5 h-3.5 text-brand-500 shrink-0" /> Download LaTeX (.tex)
            </button>
          </div>
        )}
      </div>

      {/* Loading toast */}
      {exportingFormat && (
        <div className="fixed bottom-6 right-6 z-50 card px-5 py-3 text-sm flex items-center gap-3 shadow-lg animate-fade-in">
          <SpinnerSmIcon className="w-4 h-4 animate-spin text-brand-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            AI is finalizing your {exportingFormat === 'pdf' ? 'PDF' : 'LaTeX'} — completing all sections…
          </span>
        </div>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Mode toggle
// ---------------------------------------------------------------------------

type ReviewMode = 'heuristic' | 'ai';

function ModeToggle({
  mode,
  onChange,
}: {
  mode: ReviewMode;
  onChange: (m: ReviewMode) => void;
}) {
  return (
    <div className="flex rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden w-fit mb-6">
      <button
        type="button"
        onClick={() => onChange('heuristic')}
        className={`px-4 py-2 text-sm font-medium transition-colors ${
          mode === 'heuristic'
            ? 'bg-brand-600 text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        🔬 Heuristic
      </button>
      <button
        type="button"
        onClick={() => onChange('ai')}
        className={`px-4 py-2 text-sm font-medium transition-colors border-l border-slate-200 dark:border-slate-700 ${
          mode === 'ai'
            ? 'bg-brand-600 text-white'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
        }`}
      >
        ✨ AI Reviewer
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Reviewer explanation panel
// ---------------------------------------------------------------------------

function ReviewerExplainer({ mode }: { mode: ReviewMode }) {
  const [open, setOpen] = useState(false);

  const heuristicContent = (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-sm text-slate-600 dark:text-slate-400 animate-fade-in">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What it is</p>
          <p className="text-xs leading-relaxed">
            A <strong className="text-slate-800 dark:text-slate-200">deterministic heuristic engine</strong> — not an AI model. It applies 22 weighted signal checks to your draft and maps the results to the official Horizon Europe scoring rubric.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Is it AI?</p>
          <p className="text-xs leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">No.</strong> No language model is used. Every check is a deterministic pattern match — same draft always produces the same score. No API key needed.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What it checks</p>
          <p className="text-xs leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">22 signals</strong> across three HE criteria: <em>Excellence</em>, <em>Impact</em>, and <em>Implementation</em>. Each signal checks whether a specific required element is present and well-supported.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Scoring</p>
          <p className="text-xs leading-relaxed">
            Each criterion is scored 0–5 in 0.5-point steps. Pass threshold: <strong className="text-slate-800 dark:text-slate-200">≥ 10.0 total</strong> and <strong className="text-slate-800 dark:text-slate-200">≥ 3.0 per criterion</strong>, matching the HE evaluation convention.
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        ⚠ <strong>Limitation:</strong> this tool checks structural completeness, not scientific quality or novelty. It cannot predict whether a real evaluation panel will fund your proposal.
      </div>
    </div>
  );

  const aiContent = (
    <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4 text-sm text-slate-600 dark:text-slate-400 animate-fade-in">
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What it is</p>
          <p className="text-xs leading-relaxed">
            An <strong className="text-slate-800 dark:text-slate-200">AI-powered critique</strong> using your configured LLM (OpenAI, OpenRouter, or any compatible endpoint). The model acts as a simulated HE evaluation panel expert.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What it needs</p>
          <p className="text-xs leading-relaxed">
            <strong className="text-slate-800 dark:text-slate-200">An API key.</strong> Set your LLM endpoint and key in <a href="/settings" className="underline font-medium text-brand-600 dark:text-brand-400">Settings</a>. The AI review uses your configured model and credits.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">What it produces</p>
          <p className="text-xs leading-relaxed">
            Criterion-by-criterion scores, <strong className="text-slate-800 dark:text-slate-200">strengths and weaknesses</strong>, specific recommendations, an overall pass/fail verdict, and a top-5 improvement list.
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3 space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Reliability</p>
          <p className="text-xs leading-relaxed">
            AI scores <strong className="text-slate-800 dark:text-slate-200">may vary</strong> between runs. They reflect the model&apos;s interpretation, not an official HE panel verdict. Use as expert feedback, not a funding predictor.
          </p>
        </div>
      </div>
      <div className="rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
        ⚠ <strong>Important:</strong> AI outputs can be incorrect or biased. Cross-check with the heuristic reviewer and official HE guidance. This is a drafting aid, not an official assessment.
      </div>
    </div>
  );

  return (
    <div className="card p-4 mb-6">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2">
          <InfoCircleIcon className="w-4 h-4 text-brand-500 shrink-0" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            How does the {mode === 'ai' ? 'AI reviewer' : 'heuristic reviewer'} work?
          </span>
        </div>
        <ChevronIcon className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (mode === 'ai' ? aiContent : heuristicContent)}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loader
// ---------------------------------------------------------------------------

function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return <div className={`skeleton rounded-xl ${className ?? ''}`} style={style} />;
}

function ScoringLoader({ label }: { label?: string }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="card p-6">
        <div className="flex items-start justify-between mb-5">
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="card p-8 space-y-3">
        {[80, 55, 90, 45, 70, 35, 80, 60].map((w, i) => (
          <Skeleton key={i} style={{ width: `${w}%` }} className="h-4" />
        ))}
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
        {label ?? 'Analysing your proposal against Horizon Europe criteria…'}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Score badge (heuristic)
// ---------------------------------------------------------------------------

function ScoreBadge({ score, threshold, max }: { score: number; threshold: number; max: number }) {
  const passed = score >= threshold;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      passed
        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
        : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
    }`}>
      {passed ? '✅' : '❌'} {score} / {max}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary card (heuristic)
// ---------------------------------------------------------------------------

function SummaryCard({ report }: { report: ReviewerReport }) {
  const passed = report.overallPassed;
  return (
    <div className={`rounded-2xl border-2 p-6 mb-6 ${
      passed
        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800'
        : 'bg-red-50 dark:bg-red-950/40 border-red-300 dark:border-red-800'
    }`}>
      <div className="flex items-start justify-between flex-wrap gap-4 mb-5">
        <div>
          <p className={`text-xl font-bold ${passed ? 'text-emerald-800 dark:text-emerald-200' : 'text-red-800 dark:text-red-200'}`}>
            {passed ? '✅ Overall: PASS' : '❌ Overall: BELOW THRESHOLD'}
          </p>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Total score:{' '}
            <strong className="text-slate-900 dark:text-slate-100">{report.overallScore}</strong>{' '}
            / {report.maxPossibleScore} · Pass threshold: ≥ 10.0 total, ≥ 3.0 per criterion
          </p>
        </div>
        <div className="text-right space-y-1">
          <p className="text-xs text-slate-400 dark:text-slate-500">{report.draftWordCount.toLocaleString()} words</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">{report.draftSectionCount} headings detected</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {report.criteria.map((c) => (
          <div key={c.criterionId} className="flex items-center gap-2.5 bg-white/60 dark:bg-slate-900/40 rounded-xl px-3 py-2">
            <span className="text-sm text-slate-700 dark:text-slate-300 font-medium">{c.criterionTitle}</span>
            <ScoreBadge score={c.score} threshold={c.threshold} max={c.maxScore} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// AI review panel
// ---------------------------------------------------------------------------

type AiStatus = 'idle' | 'running' | 'done' | 'error';

function AiReviewPanel({
  draftId,
  hasConfig,
  llmConfig,
}: {
  draftId: string;
  hasConfig: boolean;
  llmConfig: LlmConfig | null;
}) {
  const [aiStatus, setAiStatus] = useState<AiStatus>('idle');
  const [aiReview, setAiReview] = useState('');
  const [aiModel, setAiModel] = useState('');
  const [aiError, setAiError] = useState('');

  async function handleRunAiReview() {
    if (!llmConfig) return;
    const draft = loadDraft(draftId);
    if (!draft) return;

    setAiStatus('running');
    setAiError('');

    try {
      const res = await fetch('/api/review-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftContent: draft.content, config: llmConfig }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setAiReview(data.aiReview as string);
      setAiModel(data.model as string);
      setAiStatus('done');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unknown error.');
      setAiStatus('error');
    }
  }

  // No API key configured
  if (!hasConfig) {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center mx-auto mb-4">
          <SparklesIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">API key required</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 max-w-sm mx-auto">
          The AI reviewer uses your configured LLM to critique your proposal. Add your API key and endpoint in Settings to get started.
        </p>
        <a href="/settings" className="btn-primary inline-flex">
          Go to Settings
        </a>
      </div>
    );
  }

  // Idle — ready to run
  if (aiStatus === 'idle') {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-brand-100 dark:bg-brand-950 flex items-center justify-center mx-auto mb-4">
          <SparklesIcon className="w-6 h-6 text-brand-600 dark:text-brand-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">AI Reviewer ready</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1 max-w-sm mx-auto">
          Your proposal will be reviewed by <strong className="text-slate-700 dark:text-slate-300">{llmConfig?.model || 'your configured model'}</strong> acting as a Horizon Europe evaluator.
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
          This uses your API credits. One call per review.
        </p>
        <button type="button" onClick={handleRunAiReview} className="btn-primary inline-flex">
          <SparklesIcon className="w-4 h-4" />
          Run AI Review
        </button>
      </div>
    );
  }

  // Loading
  if (aiStatus === 'running') {
    return <ScoringLoader label="Calling AI reviewer — this may take 15–30 seconds…" />;
  }

  // Error
  if (aiStatus === 'error') {
    return (
      <div className="card p-8 text-center animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
          <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">AI review failed</p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{aiError}</p>
        <button type="button" onClick={handleRunAiReview} className="btn-primary">
          Try again
        </button>
      </div>
    );
  }

  // Done — show AI review
  return (
    <div className="animate-fade-in">
      <div className="rounded-xl px-4 py-3 text-xs mb-6 bg-brand-50 dark:bg-brand-950/40 border border-brand-200 dark:border-brand-800 text-brand-800 dark:text-brand-300 flex items-start gap-2">
        <SparklesIcon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          <strong>AI-assisted assessment</strong> via <strong>{aiModel}</strong>. Scores are indicative and may differ from a real evaluation panel. Cross-check with the Heuristic reviewer for structural coverage.
        </span>
      </div>

      <div className="card p-6 sm:p-8 prose-report">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{aiReview}</ReactMarkdown>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={handleRunAiReview}
          className="btn-ghost text-xs"
        >
          ↺ Re-run AI review
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type HeuristicStatus = 'loading' | 'scoring' | 'done' | 'error';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.draftId as string;

  // Heuristic reviewer state
  const [hStatus, setHStatus] = useState<HeuristicStatus>('loading');
  const [report, setReport] = useState<ReviewerReport | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [draftCompleted, setDraftCompleted] = useState(false);

  // Mode toggle
  const [reviewMode, setReviewMode] = useState<ReviewMode>('heuristic');

  // LLM config (for AI mode)
  const [hasLlmConfig, setHasLlmConfig] = useState(false);
  const [llmConfig, setLlmConfig] = useState<LlmConfig | null>(null);

  // Load LLM config and current draft status on mount
  useEffect(() => {
    const cfg = loadLlmConfig();
    if (cfg.endpoint && cfg.apiKey) {
      setHasLlmConfig(true);
      setLlmConfig(cfg);
    }
    const draft = loadDraft(draftId);
    if (draft?.status === 'completed') setDraftCompleted(true);
  }, [draftId]);

  function handleMarkComplete() {
    const next = draftCompleted ? 'in-progress' : 'completed';
    setDraftStatus(draftId, next);
    setDraftCompleted(!draftCompleted);
  }

  // Heuristic review — runs automatically on mount
  useEffect(() => {
    async function run() {
      const draft = loadDraft(draftId);
      if (!draft) {
        setErrorMsg('Draft not found. It may have been cleared from browser storage.');
        setHStatus('error');
        return;
      }
      setDraftTitle(draft.title);
      setDraftContent(draft.content);
      if (draft.content.trim().length < 50) {
        setErrorMsg('Draft is too short to score (minimum 50 characters). Add more content and try again.');
        setHStatus('error');
        return;
      }
      setHStatus('scoring');
      try {
        const res = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftContent: draft.content, schemeId: draft.schemeId, draftId: draft.draftId }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json();
        setReport(data.report as ReviewerReport);
        setHStatus('done');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error generating report.');
        setHStatus('error');
      }
    }
    run();
  }, [draftId]);

  function handleDownload() {
    if (!report) return;
    const blob = new Blob([report.markdownReport], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reviewer_report_${draftId.slice(0, 8)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Heuristic error (draft not found / too short) — shown regardless of mode
  const heuristicFatalError = hStatus === 'error';

  return (
    <div className="max-w-4xl mx-auto">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <Link
            href={`/editor/${draftId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-2 transition-colors"
          >
            <ChevronLeftIcon className="w-4 h-4" />
            Back to editor
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Reviewer Report</h1>
          {draftTitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{draftTitle}</p>}
        </div>

        <div className="flex items-center gap-2">
          {hStatus === 'done' && report && reviewMode === 'heuristic' && (
            <button type="button" onClick={handleDownload} className="btn-secondary shrink-0 text-xs py-1.5 px-3">
              <DownloadIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download report</span>
            </button>
          )}
          {draftContent && (
            <ExportSection draftContent={draftContent} draftTitle={draftTitle} llmConfig={llmConfig} />
          )}
        </div>
      </div>

      {/* Fatal error (no draft / too short) */}
      {heuristicFatalError && (
        <div className="card p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mx-auto mb-4">
            <XCircleIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Could not generate report</p>
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">{errorMsg}</p>
          <button type="button" onClick={() => router.push(`/editor/${draftId}`)} className="btn-primary">
            Back to editor
          </button>
        </div>
      )}

      {/* Content (only shown when draft is valid) */}
      {!heuristicFatalError && (
        <>
          {/* Mode toggle */}
          <ModeToggle mode={reviewMode} onChange={setReviewMode} />

          {/* Reviewer explainer */}
          <ReviewerExplainer mode={reviewMode} />

          {/* ── Heuristic mode ── */}
          {reviewMode === 'heuristic' && (
            <>
              {(hStatus === 'loading' || hStatus === 'scoring') && <ScoringLoader />}

              {hStatus === 'done' && report && (
                <div className="animate-fade-in">
                  <SummaryCard report={report} />

                  <div className="rounded-xl px-4 py-3 text-xs mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
                    ⚠ <strong>Heuristic assessment only.</strong> This report checks for structural content signals — it does not evaluate scientific quality and cannot predict funding panel outcomes. See{' '}
                    <a href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/LIMITATIONS.md" target="_blank" rel="noopener noreferrer" className="underline font-medium">Limitations</a>.
                  </div>

                  <div className="card p-6 sm:p-8 prose-report">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{report.markdownReport}</ReactMarkdown>
                  </div>

                  {/* Mark complete CTA */}
                  <MarkCompleteCard
                    completed={draftCompleted}
                    onToggle={handleMarkComplete}
                    onBackToEditor={() => router.push(`/editor/${draftId}`)}
                  />
                </div>
              )}
            </>
          )}

          {/* ── AI mode ── */}
          {reviewMode === 'ai' && (
            <AiReviewPanel
              draftId={draftId}
              hasConfig={hasLlmConfig}
              llmConfig={llmConfig}
            />
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function CheckCircleOutlineIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>;
}
function SpinnerSmIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" /></svg>;
}
function ChevronDownSmIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
}
function ShareIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M13 4.5a2.5 2.5 0 1 1 .702 1.737L6.97 9.604a2.518 2.518 0 0 1 0 .792l6.733 3.367a2.5 2.5 0 1 1-.671 1.341l-6.733-3.367a2.5 2.5 0 1 1 0-3.474l6.733-3.366A2.52 2.52 0 0 1 13 4.5Z" /></svg>;
}
function PdfIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm4 9a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H8Zm-1-4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z" clipRule="evenodd" /></svg>;
}
function TexIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h11A2.5 2.5 0 0 1 18 4.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 2 15.5v-11ZM6 7a1 1 0 0 0 0 2h2v4a1 1 0 1 0 2 0V9h2a1 1 0 1 0 0-2H6Z" /></svg>;
}
function ChevronLeftIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>;
}
function ChevronIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
}
function DownloadIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>;
}
function XCircleIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clipRule="evenodd" /></svg>;
}
function InfoCircleIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0Zm-7-4a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9H9Z" clipRule="evenodd" /></svg>;
}
function SparklesIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.683-2.051a1 1 0 0 1 .633-.633l2.051-.683a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.633-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.183a1 1 0 0 1 .633.633l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.633l.551-.183a1 1 0 0 0 0-1.898l-.551-.184a1 1 0 0 1-.633-.632l-.183-.551Z" /></svg>;
}
