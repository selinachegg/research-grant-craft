'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadWizardIndex, deleteWizardState } from '@/lib/wizard/store';
import type { WizardMeta } from '@/lib/wizard/store';
import { loadDraftIndex, deleteDraft, setDraftStatus } from '@/lib/drafts/store';
import type { DraftMeta } from '@/lib/drafts/store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function exportCSV(drafts: DraftMeta[]) {
  const rows = [
    ['Title', 'Words', 'Scheme', 'Created', 'Updated'],
    ...drafts.map((d) => [
      `"${d.title.replace(/"/g, '""')}"`,
      d.wordCount,
      d.schemeId,
      d.createdAt,
      d.updatedAt,
    ]),
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
  Object.assign(document.createElement('a'), { href: url, download: 'proposals.csv' }).click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Proposal card — in-progress wizard
// ---------------------------------------------------------------------------

function IntakeCard({ w, onDelete }: { w: WizardMeta; onDelete: () => void }) {
  const label = w.acronym && w.fullTitle
    ? `${w.acronym} — ${w.fullTitle}`
    : w.acronym || w.fullTitle || 'Untitled proposal';

  const pct = Math.round((w.currentStep / 5) * 100);

  return (
    <div className="card card-hover p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{label}</p>
          <p className="text-xs text-slate-400 mt-0.5">{timeAgo(w.updatedAt)}</p>
        </div>
        <span className="badge badge-amber shrink-0">In progress</span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Step {w.currentStep} of 5</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-500 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <Link href={`/wizard/${w.wizardId}`} className="btn-primary text-xs py-1.5">
          Continue →
        </Link>
        <button type="button" onClick={onDelete} className="btn-danger">
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proposal card — draft (in-progress or completed)
// ---------------------------------------------------------------------------

function DraftCard({
  d,
  onDelete,
  onToggleComplete,
}: {
  d: DraftMeta;
  onDelete: () => void;
  onToggleComplete: () => void;
}) {
  const done = d.status === 'completed';

  return (
    <div className={`card p-5 flex flex-col gap-3 transition-all ${done ? 'opacity-80' : 'card-hover'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-medium text-sm truncate ${done ? 'text-slate-500 dark:text-slate-400 line-through decoration-1' : 'text-slate-900 dark:text-slate-100'}`}>
            {d.title}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {d.wordCount.toLocaleString()} words · {timeAgo(d.updatedAt)}
          </p>
        </div>
        {done
          ? <span className="badge badge-green shrink-0">✓ Completed</span>
          : <span className="badge badge-brand shrink-0">Draft</span>
        }
      </div>

      <div className="flex items-center gap-2 pt-1 flex-wrap">
        {!done && (
          <>
            <Link href={`/editor/${d.draftId}`} className="btn-secondary text-xs py-1.5">
              Edit
            </Link>
            <Link href={`/review/${d.draftId}`} className="btn-primary text-xs py-1.5">
              Review →
            </Link>
          </>
        )}
        {done && (
          <Link href={`/editor/${d.draftId}`} className="btn-secondary text-xs py-1.5">
            View / Edit
          </Link>
        )}

        <button
          type="button"
          onClick={onToggleComplete}
          className={`text-xs py-1.5 px-3 rounded-xl border font-medium transition-colors ${
            done
              ? 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:border-amber-300 dark:hover:border-amber-700 hover:text-amber-600 dark:hover:text-amber-400'
              : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
          }`}
        >
          {done ? '↺ Reopen' : '✓ Mark done'}
        </button>

        <button type="button" onClick={onDelete} className="btn-danger ml-auto">
          Delete
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proposals queue
// ---------------------------------------------------------------------------

type Filter = 'all' | 'progress' | 'drafts' | 'completed';

function ProposalsQueue() {
  const [wizards, setWizards] = useState<WizardMeta[]>([]);
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    setWizards(loadWizardIndex());
    setDrafts(loadDraftIndex());
  }, []);

  const inProgress = wizards.filter((w) => !w.linkedDraftId);
  const sorted = [...drafts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
  const activeDrafts    = sorted.filter((d) => d.status !== 'completed');
  const completedDrafts = sorted.filter((d) => d.status === 'completed');

  function deleteWizard(id: string) {
    if (!confirm('Delete this intake? This cannot be undone.')) return;
    deleteWizardState(id);
    setWizards((p) => p.filter((w) => w.wizardId !== id));
  }

  function deleteDraftItem(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteDraft(id);
    setDrafts((p) => p.filter((d) => d.draftId !== id));
  }

  function toggleComplete(id: string) {
    const current = drafts.find((d) => d.draftId === id);
    if (!current) return;
    const next = current.status === 'completed' ? 'in-progress' : 'completed';
    setDraftStatus(id, next);
    setDrafts((p) => p.map((d) => d.draftId === id ? { ...d, status: next } : d));
  }

  const total = inProgress.length + sorted.length;
  if (total === 0) return null;

  const tabs: { key: Filter; label: string; count: number; color?: string }[] = [
    { key: 'all',       label: 'All',         count: total },
    { key: 'progress',  label: 'In progress', count: inProgress.length },
    { key: 'drafts',    label: 'Drafts',      count: activeDrafts.length },
    { key: 'completed', label: '✓ Completed', count: completedDrafts.length },
  ];

  const showIntakes   = filter === 'all' || filter === 'progress';
  const showActive    = filter === 'all' || filter === 'drafts';
  const showCompleted = filter === 'all' || filter === 'completed';

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">My proposals</h2>
        {sorted.length > 0 && (
          <button
            type="button"
            onClick={() => exportCSV(sorted)}
            className="btn-secondary text-xs py-1.5"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            Export CSV
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-fit mb-5 flex-wrap">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-150 ${
              filter === t.key
                ? t.key === 'completed'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs ${
                filter === t.key && t.key === 'completed'
                  ? 'bg-emerald-500 text-white'
                  : filter === t.key
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
              }`}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {showIntakes && inProgress.map((w) => (
          <IntakeCard key={w.wizardId} w={w} onDelete={() => deleteWizard(w.wizardId)} />
        ))}
        {showActive && activeDrafts.map((d) => (
          <DraftCard
            key={d.draftId}
            d={d}
            onDelete={() => deleteDraftItem(d.draftId, d.title)}
            onToggleComplete={() => toggleComplete(d.draftId)}
          />
        ))}
        {showCompleted && completedDrafts.map((d) => (
          <DraftCard
            key={d.draftId}
            d={d}
            onDelete={() => deleteDraftItem(d.draftId, d.title)}
            onToggleComplete={() => toggleComplete(d.draftId)}
          />
        ))}
      </div>

      {/* Empty state for completed filter */}
      {filter === 'completed' && completedDrafts.length === 0 && (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500">
          <div className="text-4xl mb-3">✓</div>
          <p className="text-sm font-medium mb-1">No completed proposals yet</p>
          <p className="text-xs">When you finish a draft, click <strong>Mark done</strong> on its card.</p>
        </div>
      )}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

export default function HomePage() {
  const router = useRouter();

  function newProposal() {
    router.push(`/wizard/${crypto.randomUUID()}`);
  }

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="text-center pt-12 pb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium
                        bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300
                        border border-brand-200 dark:border-brand-800 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          Horizon Europe RIA / IA · v0.1
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 leading-tight tracking-tight mb-4">
          Turn your research idea into a{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-violet-600">
            Horizon&nbsp;Europe proposal.
          </span>
        </h1>

        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
          A structured intake wizard generates an AI-assisted draft, then a deterministic
          heuristic reviewer scores it against the official rubric — all in your browser,
          no account needed.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button type="button" onClick={newProposal} className="btn-primary text-base px-6 py-3">
            <PlusIcon className="w-4 h-4" />
            Start new proposal
          </button>
          <a
            href="https://github.com/selinachegg/research-grant-craft"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-base px-6 py-3"
          >
            View on GitHub →
          </a>
        </div>

        {/* Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-400 dark:text-slate-500">
          {[
            '🔒 Local-first — no server storage',
            '🚀 No account required',
            '⚡ Works without an API key',
            '🔓 Open source · MIT',
          ].map((b) => (
            <span key={b} className="flex items-center gap-1">{b}</span>
          ))}
        </div>
      </section>

      {/* ── Proposals queue ─────────────────────────────────────────── */}
      <ProposalsQueue />

      {/* ── How it works ────────────────────────────────────────────── */}
      <section className="mb-16">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-6 text-center">
          How it works
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Describe your project',
              body: 'Walk through a 5-step intake wizard: objectives, consortium, timeline, budget, and scheme selection. Auto-saved as you go.',
              icon: <WizardIcon />,
            },
            {
              step: '02',
              title: 'Generate a structured draft',
              body: 'AI fills in every section from your answers with clear [FILL IN:] markers for the parts only you can write. Works offline in template mode.',
              icon: <DraftIcon />,
            },
            {
              step: '03',
              title: 'Get your reviewer report',
              body: 'A deterministic engine scores your draft across 22 signals aligned to the Horizon Europe rubric and gives you a prioritised action plan.',
              icon: <ReviewIcon />,
            },
          ].map((item) => (
            <div key={item.step} className="card p-6">
              <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-950 flex items-center justify-center mb-4">
                {item.icon}
              </div>
              <div className="text-xs font-semibold text-brand-500 mb-1 uppercase tracking-wide">
                Step {item.step}
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-2">{item.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── What it does / doesn't ──────────────────────────────────── */}
      <section className="grid md:grid-cols-2 gap-4 mb-16">
        <div className="card p-6">
          <h2 className="font-semibold text-emerald-700 dark:text-emerald-400 mb-4 text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-xs">✓</span>
            What it does
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li><span className="font-medium text-slate-800 dark:text-slate-200">Structured wizard</span> — guides every required section with scheme-specific scaffolding.</li>
            <li><span className="font-medium text-slate-800 dark:text-slate-200">AI-assisted draft</span> — generates content from your answers; works offline in template mode.</li>
            <li><span className="font-medium text-slate-800 dark:text-slate-200">Reviewer report</span> — scores 22 signals aligned to the funding body's rubric with a ranked action plan.</li>
          </ul>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-amber-700 dark:text-amber-400 mb-4 text-sm flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-xs">⚠</span>
            What it does NOT do
          </h2>
          <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-400">
            <li><span className="font-medium text-slate-800 dark:text-slate-200">Predict outcomes</span> — checks structural completeness, not scientific quality or panel judgement.</li>
            <li><span className="font-medium text-slate-800 dark:text-slate-200">Submit proposals</span> — no integration with the EC Funding & Tenders Portal.</li>
            <li><span className="font-medium text-slate-800 dark:text-slate-200">Store your data</span> — everything stays in your browser's localStorage only.</li>
          </ul>
        </div>
      </section>

      {/* ── Scheme packs ────────────────────────────────────────────── */}
      <section className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-slate-900 dark:text-slate-100 text-sm">Scheme packs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Each pack provides criteria, rubrics, and section guidance for one funding programme.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-between py-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <div>
              <span className="font-medium text-slate-800 dark:text-slate-200 text-sm">Horizon Europe RIA / IA</span>
              <span className="ml-2 text-xs text-slate-400">EU · v1.0.0</span>
            </div>
          </div>
          <span className="badge badge-green">Stable</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
          Want to add a scheme pack?{' '}
          <a href="https://github.com/selinachegg/research-grant-craft/issues/new?template=new_scheme_pack.yml" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 dark:hover:text-slate-300">Open an issue</a>
          {' '}or read the{' '}
          <a href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/SCHEME_PACK_SPEC.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 dark:hover:text-slate-300">scheme pack spec</a>.
        </p>
      </section>

      {/* ── Footer note ─────────────────────────────────────────────── */}
      <p className="text-center text-xs text-slate-400 dark:text-slate-500 pb-8">
        All proposal content is stored in your browser only.{' '}
        <Link href="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">Privacy statement</Link>
        {' · '}
        <a href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/LIMITATIONS.md" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 dark:hover:text-slate-300">Limitations</a>
      </p>
    </div>
  );
}

// ── Inline SVG icons ──────────────────────────────────────────────────────

function PlusIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" /></svg>;
}
function DownloadIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M10.75 2.75a.75.75 0 0 0-1.5 0v8.614L6.295 8.235a.75.75 0 1 0-1.09 1.03l4.25 4.5a.75.75 0 0 0 1.09 0l4.25-4.5a.75.75 0 0 0-1.09-1.03l-2.955 3.129V2.75Z"/><path d="M3.5 12.75a.75.75 0 0 0-1.5 0v2.5A2.75 2.75 0 0 0 4.75 18h10.5A2.75 2.75 0 0 0 18 15.25v-2.5a.75.75 0 0 0-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5Z"/></svg>;
}
function WizardIcon() {
  return <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path d="M2.5 3A1.5 1.5 0 0 0 1 4.5v4A1.5 1.5 0 0 0 2.5 10h4A1.5 1.5 0 0 0 8 8.5v-4A1.5 1.5 0 0 0 6.5 3h-4ZM12 3a1.5 1.5 0 0 0-1.5 1.5v4A1.5 1.5 0 0 0 12 10h4a1.5 1.5 0 0 0 1.5-1.5v-4A1.5 1.5 0 0 0 16 3h-4ZM1 15.5A1.5 1.5 0 0 1 2.5 14h4A1.5 1.5 0 0 1 8 15.5v.5a1.5 1.5 0 0 1-1.5 1.5h-4A1.5 1.5 0 0 1 1 16v-.5Zm11-1.5a1.5 1.5 0 0 0-1.5 1.5v.5A1.5 1.5 0 0 0 12 17.5h4A1.5 1.5 0 0 0 17.5 16v-.5A1.5 1.5 0 0 0 16 14h-4Z"/></svg>;
}
function DraftIcon() {
  return <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4Zm2 6a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1Zm1 3a1 1 0 1 0 0 2h3a1 1 0 1 0 0-2H7Z" clipRule="evenodd"/></svg>;
}
function ReviewIcon() {
  return <svg className="w-5 h-5 text-brand-600 dark:text-brand-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1Zm3 8V5.5a3 3 0 1 0-6 0V9h6Z" clipRule="evenodd"/></svg>;
}
