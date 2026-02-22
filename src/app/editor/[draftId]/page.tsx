'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDraft, saveDraft, setDraftStatus } from '@/lib/drafts/store';
import type { DraftStatus } from '@/lib/drafts/store';
import { loadWizardState } from '@/lib/wizard/store';
import { loadLlmConfig, generateDraft } from '@/lib/llm';
import { exportAsPdf, exportAsPdfFromHtml } from '@/lib/export/pdf';
import { exportAsLatex, downloadLatex } from '@/lib/export/latex';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Tooltip — shows on hover/focus, positions above trigger
// ---------------------------------------------------------------------------

function Tooltip({ content, children }: { content: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onFocus={() => setShow(true)}
      onBlur={() => setShow(false)}
    >
      {children}
      {show && (
        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-slate-100 text-xs rounded-xl shadow-dropdown leading-relaxed whitespace-normal text-center animate-fade-in pointer-events-none">
          {content}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
        </span>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Export dropdown
// ---------------------------------------------------------------------------

function ExportDropdown({
  onDownloadMd,
  onExportPdf,
  onExportLatex,
}: {
  onDownloadMd: () => void;
  onExportPdf: () => void;
  onExportLatex: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const item =
    'w-full text-left flex items-center gap-2 px-3 py-2 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

  return (
    <div ref={ref} className="relative shrink-0">
      <Tooltip content="Download draft as Markdown, print-ready PDF, or LaTeX source.">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="btn-secondary py-1 px-3 text-xs flex items-center gap-1"
        >
          <DownloadIcon className="w-3 h-3" />
          <span className="hidden sm:inline">Export</span>
          <ChevronDownIcon className="w-2.5 h-2.5 ml-0.5" />
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg py-1 w-48 animate-fade-in">
          <button
            className={item}
            onClick={() => { onDownloadMd(); setOpen(false); }}
          >
            <DocIcon className="w-3.5 h-3.5 text-slate-400" /> Download .md
          </button>
          <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
          <button
            className={item}
            onClick={() => { onExportPdf(); setOpen(false); }}
          >
            <PdfIcon className="w-3.5 h-3.5 text-red-400" /> Export as PDF
          </button>
          <button
            className={item}
            onClick={() => { onExportLatex(); setOpen(false); }}
          >
            <TexIcon className="w-3.5 h-3.5 text-brand-500" /> Download LaTeX (.tex)
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main editor page
// ---------------------------------------------------------------------------

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const draftId = params.draftId as string;
  const urlWizardId = searchParams.get('wizardId');

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled proposal');
  const [schemeId, setSchemeId] = useState('horizon_europe_ria_ia');
  const [createdAt] = useState(new Date().toISOString());
  const [wizardId, setWizardId] = useState<string | null>(urlWizardId);

  const [view, setView] = useState<'split' | 'editor' | 'preview'>('split');
  const [generating, setGenerating] = useState(false);
  const [improving, setImproving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [mockBanner, setMockBanner] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<'pdf' | 'latex' | null>(null);
  const [draftStatus, setDraftStatusState] = useState<DraftStatus | undefined>(undefined);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft on mount
  useEffect(() => {
    const existing = loadDraft(draftId);
    if (existing) {
      setContent(existing.content);
      setTitle(existing.title);
      setSchemeId(existing.schemeId);
      setDraftStatusState(existing.status);
      if (existing.wizardId && !urlWizardId) setWizardId(existing.wizardId);
      return;
    }
    const wid = urlWizardId;
    if (wid) {
      const wizard = loadWizardState(wid);
      setTitle(
        wizard.fullTitle
          ? `${wizard.acronym ? wizard.acronym + ' — ' : ''}${wizard.fullTitle}`
          : 'New proposal',
      );
      setSchemeId(wizard.schemeId);
      handleGenerate(wizard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  const scheduleSave = useCallback(
    (text: string, titleVal: string) => {
      setSaveStatus('unsaved');
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        saveDraft({
          draftId,
          title: titleVal,
          schemeId,
          content: text,
          wordCount: wordCount(text),
          createdAt,
          updatedAt: new Date().toISOString(),
          wizardId: wizardId ?? undefined,
        });
        setSaveStatus('saved');
      }, 800);
    },
    [draftId, schemeId, createdAt, wizardId],
  );

  function handleContentChange(text: string) {
    setContent(text);
    scheduleSave(text, title);
  }

  async function handleGenerate(wizardOverride?: ReturnType<typeof loadWizardState>) {
    // If content already exists, ask for confirmation before overwriting
    if (!wizardOverride && content.trim().length > 100) {
      const confirmed = window.confirm(
        'Regenerate will overwrite your current draft with a new AI-generated version.\n\nAny edits you made will be lost.\n\nContinue?',
      );
      if (!confirmed) return;
    }

    setGenerating(true);
    try {
      const wizard = wizardOverride ?? (wizardId ? loadWizardState(wizardId) : null);
      if (!wizard) {
        alert('No wizard session linked to this draft. Please start a new proposal from the home page.');
        setGenerating(false);
        return;
      }
      const config = loadLlmConfig();
      const result = await generateDraft(wizard, config);
      setContent(result.draftMarkdown);
      scheduleSave(result.draftMarkdown, title);
      if (result.isMock) setMockBanner(true);
    } catch (err) {
      console.error('Generation failed:', err);
      alert(`Draft generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setGenerating(false);
    }
  }

  function handleDownload() {
    const blob = new Blob([content], { type: 'text/markdown; charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExportPdf() {
    const cfg = loadLlmConfig();
    let aiUsed = false;
    if (cfg.endpoint && cfg.apiKey) {
      setExportingFormat('pdf');
      try {
        const res = await fetch('/api/export-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftContent: content, title, format: 'pdf-html', config: cfg }),
        });
        if (res.ok) {
          const data = await res.json();
          exportAsPdfFromHtml(data.htmlBody as string, title);
          aiUsed = true;
        }
      } catch { /* fall through to client-side */ } finally {
        setExportingFormat(null);
      }
    }
    if (!aiUsed) exportAsPdf(content, title);
  }

  async function handleExportLatex() {
    const cfg = loadLlmConfig();
    let aiUsed = false;
    if (cfg.endpoint && cfg.apiKey) {
      setExportingFormat('latex');
      try {
        const res = await fetch('/api/export-finalize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ draftContent: content, title, format: 'latex', config: cfg }),
        });
        if (res.ok) {
          const data = await res.json();
          downloadLatex(data.latexSource as string, title);
          aiUsed = true;
        }
      } catch { /* fall through to client-side */ } finally {
        setExportingFormat(null);
      }
    }
    if (!aiUsed) exportAsLatex(content, title);
  }

  async function handleImprove() {
    const cfg = loadLlmConfig();
    if (!cfg.endpoint || !cfg.apiKey) {
      alert('Please configure your AI model in Settings to use AI Polish.');
      return;
    }
    if (content.trim().length < 100) {
      alert('Write more content first — AI Polish needs at least 100 characters to work with.');
      return;
    }
    const confirmed = window.confirm(
      'AI Polish will improve your prose while keeping all your content and ideas.\n\nYour draft will be enhanced in place — nothing will be erased.\n\nContinue?',
    );
    if (!confirmed) return;

    setImproving(true);
    try {
      const res = await fetch('/api/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draftContent: content, config: cfg }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(err.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      const improved = data.improvedContent as string;
      setContent(improved);
      scheduleSave(improved, title);
    } catch (err) {
      alert(`Polish failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setImproving(false);
    }
  }

  function handleToggleComplete() {
    const next: DraftStatus = draftStatus === 'completed' ? 'in-progress' : 'completed';
    setDraftStatus(draftId, next);
    setDraftStatusState(next);
  }

  async function handleReview() {
    saveDraft({
      draftId,
      title,
      schemeId,
      content,
      wordCount: wordCount(content),
      createdAt,
      updatedAt: new Date().toISOString(),
      wizardId: wizardId ?? undefined,
    });
    router.push(`/review/${draftId}`);
  }

  const wc = wordCount(content);

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] -mt-8 -mx-4 sm:-mx-6">

      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex-wrap shrink-0">

        <Link
          href="/"
          className="text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors shrink-0"
          title="Back to all proposals"
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </Link>

        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave(content, e.target.value);
          }}
          className="flex-1 min-w-0 text-sm font-medium text-slate-900 dark:text-slate-100 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 dark:focus:border-slate-600 py-0.5 transition-colors"
          placeholder="Proposal title"
        />

        {/* Word count + save status */}
        <span className="text-xs text-slate-400 dark:text-slate-500 shrink-0 hidden sm:inline">
          {wc.toLocaleString()} words ·{' '}
          {saveStatus === 'saved'
            ? <span className="text-emerald-600 dark:text-emerald-400">Saved</span>
            : <span className="text-amber-500 dark:text-amber-400">Saving…</span>
          }
        </span>

        {/* View toggle */}
        <div className="flex border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shrink-0">
          {(['split', 'editor', 'preview'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              title={v === 'split' ? 'Show editor and preview side by side' : v === 'editor' ? 'Show markdown editor only' : 'Show formatted preview only'}
              className={`px-2.5 py-1 text-xs capitalize transition-colors ${
                view === v
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900'
                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* Regenerate */}
        <Tooltip content="Re-runs AI generation from your wizard answers. Will overwrite the current draft — you'll be asked to confirm.">
          <button
            type="button"
            onClick={() => handleGenerate()}
            disabled={generating}
            className="btn-secondary py-1 px-3 text-xs shrink-0"
          >
            {generating
              ? <><SpinnerIcon className="w-3 h-3 animate-spin" /> Generating…</>
              : <><SparklesIcon className="w-3 h-3" /> Regenerate</>
            }
          </button>
        </Tooltip>

        {/* AI Polish */}
        <Tooltip content="Improve your prose using AI — keeps all your content and ideas, enhances writing quality and HE alignment. Requires API key.">
          <button
            type="button"
            onClick={handleImprove}
            disabled={improving || generating}
            className="btn-secondary py-1 px-3 text-xs shrink-0 disabled:opacity-40"
          >
            {improving
              ? <><SpinnerIcon className="w-3 h-3 animate-spin" /> Polishing…</>
              : <><WandIcon className="w-3 h-3" /> <span className="hidden sm:inline">Polish</span></>
            }
          </button>
        </Tooltip>

        {/* Mark complete */}
        <Tooltip content={draftStatus === 'completed' ? 'Reopen this proposal for editing' : 'Mark this proposal as finished and move it to Completed'}>
          <button
            type="button"
            onClick={handleToggleComplete}
            className={`py-1 px-3 text-xs rounded-xl border font-medium transition-colors shrink-0 ${
              draftStatus === 'completed'
                ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
                : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-emerald-300 hover:text-emerald-600'
            }`}
          >
            {draftStatus === 'completed' ? '✓ Done' : '✓'}
          </button>
        </Tooltip>

        {/* Export dropdown */}
        <ExportDropdown
          onDownloadMd={handleDownload}
          onExportPdf={handleExportPdf}
          onExportLatex={handleExportLatex}
        />

        {/* Review */}
        <Tooltip content="Run the automated reviewer — scores your draft across 22 structural signals aligned to the Horizon Europe rubric and gives you a ranked action plan.">
          <button
            type="button"
            onClick={handleReview}
            disabled={wc < 50}
            className="btn-primary py-1 px-3 text-xs shrink-0 disabled:opacity-40"
          >
            Review <ArrowRightIcon className="w-3 h-3" />
          </button>
        </Tooltip>
      </div>

      {/* ── Template mode banner ── */}
      {mockBanner && (
        <div className="bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800 px-4 py-2.5 text-xs text-amber-800 dark:text-amber-300 flex items-start justify-between gap-3 shrink-0">
          <span className="leading-relaxed">
            <strong>Template mode active</strong> — your structured grant scaffold is ready.
            Search for <code className="bg-amber-100 dark:bg-amber-900 px-1 rounded font-mono">[FILL IN:</code> to find every cell that needs your input.
            Amber-highlighted boxes in the preview are guidance notes — read them, then replace with your content.{' '}
            <Link href="/settings" className="underline font-medium">Connect an AI model</Link> to get fully written prose instead.
          </span>
          <button
            type="button"
            onClick={() => setMockBanner(false)}
            aria-label="Dismiss"
            className="ml-2 shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 transition-colors text-base leading-none"
          >
            ×
          </button>
        </div>
      )}

      {/* ── Editor + Preview ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Editor pane */}
        {(view === 'editor' || view === 'split') && (
          <div className={`flex flex-col ${view === 'split' ? 'w-1/2 border-r border-slate-200 dark:border-slate-800' : 'w-full'}`}>
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0">
              Markdown source
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 p-4 text-sm font-mono text-slate-800 dark:text-slate-200 resize-none focus:outline-none bg-white dark:bg-slate-950 leading-relaxed"
              placeholder="Your proposal draft will appear here after generation. Click ✨ Regenerate to create from your wizard answers."
              spellCheck
            />
          </div>
        )}

        {/* Preview pane */}
        {(view === 'preview' || view === 'split') && (
          <div className={`flex flex-col overflow-hidden ${view === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 shrink-0 flex items-center gap-4">
              <span>Formatted preview</span>
              <span className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400 dark:bg-amber-600 shrink-0" />
                Amber boxes = guidance to act on
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose-draft">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <div className="text-center py-16 text-slate-400 dark:text-slate-500">
                  <SparklesIcon className="w-8 h-8 mx-auto mb-3 opacity-40" />
                  <p className="text-sm font-medium mb-1">No draft yet</p>
                  <p className="text-xs">Click <strong>Regenerate</strong> in the toolbar to generate from your wizard answers.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export loading toast */}
      {exportingFormat && (
        <div className="fixed bottom-6 right-6 z-50 card px-5 py-3 text-sm flex items-center gap-3 shadow-lg animate-fade-in">
          <SpinnerIcon className="w-4 h-4 animate-spin text-brand-500 shrink-0" />
          <span className="text-slate-700 dark:text-slate-300">
            AI is finalizing your {exportingFormat === 'pdf' ? 'PDF' : 'LaTeX'} — filling in all sections…
          </span>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronLeftIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>;
}
function WandIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M13.024 3.453a.75.75 0 0 1 .953 0l1.57 1.326a.75.75 0 0 1 0 1.149L14.6 7.23a.75.75 0 0 1-.953 0l-1.57-1.327a.75.75 0 0 1 0-1.148l1.948-1.302ZM5.5 2.75a.75.75 0 1 0-1.5 0v.5h-.5a.75.75 0 0 0 0 1.5h.5v.5a.75.75 0 0 0 1.5 0v-.5h.5a.75.75 0 0 0 0-1.5h-.5v-.5ZM9.75 9.75a.75.75 0 0 0-1.06 0l-5.5 5.5a.75.75 0 1 0 1.06 1.06l5.5-5.5a.75.75 0 0 0 0-1.06ZM12.5 7.25a.75.75 0 1 0-1.5 0v.5h-.5a.75.75 0 0 0 0 1.5h.5v.5a.75.75 0 0 0 1.5 0v-.5h.5a.75.75 0 0 0 0-1.5h-.5v-.5Z" /></svg>;
}
function ChevronDownIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" /></svg>;
}
function DocIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm2 6a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H7Z" clipRule="evenodd" /></svg>;
}
function PdfIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm4 9a1 1 0 1 0 0 2h4a1 1 0 1 0 0-2H8Zm-1-4a1 1 0 0 1 1-1h2a1 1 0 1 1 0 2H8a1 1 0 0 1-1-1Z" clipRule="evenodd" /></svg>;
}
function TexIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M2 4.5A2.5 2.5 0 0 1 4.5 2h11A2.5 2.5 0 0 1 18 4.5v11a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 2 15.5v-11ZM6 7a1 1 0 0 0 0 2h2v4a1 1 0 1 0 2 0V9h2a1 1 0 1 0 0-2H6Z" /></svg>;
}
function SpinnerIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" /></svg>;
}
function SparklesIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M15.98 1.804a1 1 0 0 0-1.96 0l-.24 1.192a1 1 0 0 1-.784.785l-1.192.238a1 1 0 0 0 0 1.962l1.192.238a1 1 0 0 1 .785.785l.238 1.192a1 1 0 0 0 1.962 0l.238-1.192a1 1 0 0 1 .785-.785l1.192-.238a1 1 0 0 0 0-1.962l-1.192-.238a1 1 0 0 1-.785-.785l-.238-1.192ZM6.949 5.684a1 1 0 0 0-1.898 0l-.683 2.051a1 1 0 0 1-.633.633l-2.051.683a1 1 0 0 0 0 1.898l2.051.684a1 1 0 0 1 .633.632l.683 2.051a1 1 0 0 0 1.898 0l.684-2.051a1 1 0 0 1 .632-.632l2.051-.684a1 1 0 0 0 0-1.898l-2.051-.683a1 1 0 0 1-.632-.633L6.95 5.684ZM13.949 13.684a1 1 0 0 0-1.898 0l-.184.551a1 1 0 0 1-.632.633l-.551.183a1 1 0 0 0 0 1.898l.551.184a1 1 0 0 1 .633.632l.183.551a1 1 0 0 0 1.898 0l.184-.551a1 1 0 0 1 .632-.632l.551-.184a1 1 0 0 0 0-1.898l-.551-.183a1 1 0 0 1-.632-.633l-.184-.551Z" /></svg>;
}
function DownloadIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z" /><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z" /></svg>;
}
function ArrowRightIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" /></svg>;
}
