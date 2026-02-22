'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDraft, saveDraft } from '@/lib/drafts/store';
import { loadWizardState } from '@/lib/wizard/store';
import { loadLlmConfig, generateDraft } from '@/lib/llm';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// ---------------------------------------------------------------------------
// Toolbar button
// ---------------------------------------------------------------------------

function ToolbarButton({
  onClick,
  disabled,
  children,
  variant = 'default',
  title,
}: {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'success';
  title?: string;
}) {
  const base = 'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-40';
  const variants = {
    default: 'border border-slate-300 text-slate-700 hover:bg-slate-100',
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${variants[variant]}`}
    >
      {children}
    </button>
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
  // wizardId from URL (first load) or from the saved draft (subsequent loads)
  const urlWizardId = searchParams.get('wizardId');

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('Untitled proposal');
  const [schemeId, setSchemeId] = useState('horizon_europe_ria_ia');
  const [createdAt] = useState(new Date().toISOString());
  // Keep wizardId in state so Regenerate works after navigation
  const [wizardId, setWizardId] = useState<string | null>(urlWizardId);

  const [view, setView] = useState<'split' | 'editor' | 'preview'>('split');
  const [generating, setGenerating] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [mockBanner, setMockBanner] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load draft from localStorage on mount
  useEffect(() => {
    const existing = loadDraft(draftId);
    if (existing) {
      setContent(existing.content);
      setTitle(existing.title);
      setSchemeId(existing.schemeId);
      // Restore wizardId from saved draft if not already in URL
      if (existing.wizardId && !urlWizardId) setWizardId(existing.wizardId);
      return;
    }

    // New draft from wizard — wizardId tells us which session to load
    const wid = urlWizardId;
    if (wid) {
      const wizard = loadWizardState(wid);
      setTitle(
        wizard.fullTitle
          ? `${wizard.acronym ? wizard.acronym + ' — ' : ''}${wizard.fullTitle}`
          : 'New proposal',
      );
      setSchemeId(wizard.schemeId);
      // Auto-generate on mount
      handleGenerate(wizard);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftId]);

  // Auto-save with debounce
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
    setGenerating(true);
    try {
      // Use provided override, or load from the linked wizard session, or empty state
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
      alert(
        `Draft generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
      );
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

  async function handleReview() {
    // Save first, then navigate to reviewer report
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
    <div className="flex flex-col h-[calc(100vh-3.5rem)] -mt-8 -mx-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-slate-200 bg-white flex-wrap">
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            scheduleSave(content, e.target.value);
          }}
          className="flex-1 min-w-0 text-sm font-medium text-slate-900 bg-transparent focus:outline-none border-b border-transparent focus:border-slate-300 py-0.5"
          placeholder="Proposal title"
        />
        <span className="text-xs text-slate-400 shrink-0">
          {wc.toLocaleString()} words ·{' '}
          {saveStatus === 'saved' ? (
            <span className="text-emerald-600">Saved</span>
          ) : (
            <span className="text-amber-500">Saving…</span>
          )}
        </span>

        {/* View toggle */}
        <div className="flex border border-slate-200 rounded-lg overflow-hidden shrink-0">
          {(['split', 'editor', 'preview'] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={`px-2.5 py-1 text-xs capitalize transition-colors ${
                view === v
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {v}
            </button>
          ))}
        </div>

        <ToolbarButton onClick={() => handleGenerate()} disabled={generating}>
          {generating ? 'Generating…' : '✨ Regenerate'}
        </ToolbarButton>
        <ToolbarButton onClick={handleDownload} variant="default">
          ↓ Download
        </ToolbarButton>
        <ToolbarButton onClick={handleReview} variant="primary" disabled={wc < 50}>
          Review →
        </ToolbarButton>
      </div>

      {/* Mock / template mode banner */}
      {mockBanner && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
          <span>
            <strong>Template mode</strong> — your structured grant application is ready.
            Search for <code className="bg-amber-100 px-1 rounded">[FILL IN:</code> to find every cell that needs your input.
            Amber boxes in the preview are section guidance notes.{' '}
            <a href="/settings" className="underline font-medium">Add an API key</a> for AI-drafted text.
          </span>
          <button
            type="button"
            onClick={() => setMockBanner(false)}
            className="ml-4 text-amber-600 hover:text-amber-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Editor / preview panes */}
      <div className="flex flex-1 overflow-hidden">
        {/* Editor pane */}
        {(view === 'editor' || view === 'split') && (
          <div className={`flex flex-col ${view === 'split' ? 'w-1/2 border-r border-slate-200' : 'w-full'}`}>
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border-b border-slate-100">
              Markdown
            </div>
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              className="flex-1 p-4 text-sm font-mono text-slate-800 resize-none focus:outline-none bg-white leading-relaxed"
              placeholder="Your proposal draft will appear here. Click ✨ Regenerate to generate from wizard answers."
              spellCheck
            />
          </div>
        )}

        {/* Preview pane */}
        {(view === 'preview' || view === 'split') && (
          <div className={`flex flex-col overflow-hidden ${view === 'split' ? 'w-1/2' : 'w-full'}`}>
            <div className="px-3 py-1.5 text-xs font-medium text-slate-400 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
              <span>Preview</span>
              <span className="flex items-center gap-1.5 text-amber-700">
                <span className="inline-block w-2.5 h-2.5 rounded-sm bg-amber-400" />
                Amber boxes = sections to complete
              </span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 prose-draft">
              {content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              ) : (
                <p className="text-slate-400 italic text-sm">Nothing to preview yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
