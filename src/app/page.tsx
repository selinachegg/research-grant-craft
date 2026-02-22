'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loadWizardIndex, deleteWizardState } from '@/lib/wizard/store';
import type { WizardMeta } from '@/lib/wizard/store';
import { loadDraftIndex, deleteDraft } from '@/lib/drafts/store';
import type { DraftMeta } from '@/lib/drafts/store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function ProposalLabel({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full bg-blue-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400 shrink-0">Step {step}/{total}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Proposals queue
// ---------------------------------------------------------------------------

function ProposalsQueue() {
  const [wizards, setWizards] = useState<WizardMeta[]>([]);
  const [drafts, setDrafts] = useState<DraftMeta[]>([]);

  useEffect(() => {
    setWizards(loadWizardIndex());
    setDrafts(loadDraftIndex());
  }, []);

  function handleDeleteWizard(wizardId: string, label: string) {
    if (!confirm(`Delete "${label}"? This cannot be undone.`)) return;
    deleteWizardState(wizardId);
    setWizards((prev) => prev.filter((w) => w.wizardId !== wizardId));
  }

  function handleDeleteDraft(draftId: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    deleteDraft(draftId);
    setDrafts((prev) => prev.filter((d) => d.draftId !== draftId));
  }

  // In-progress intakes: no draft linked yet
  const inProgress = wizards.filter((w) => !w.linkedDraftId);
  // Completed drafts, most recent first
  const sorted = [...drafts].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );

  if (inProgress.length === 0 && sorted.length === 0) return null;

  return (
    <section className="mb-12">
      <h2 className="text-base font-semibold text-slate-900 mb-4">Your proposals</h2>

      {/* In-progress wizard sessions */}
      {inProgress.length > 0 && (
        <div className="mb-4 space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            In progress
          </p>
          {inProgress.map((w) => {
            const label = w.acronym && w.fullTitle
              ? `${w.acronym} — ${w.fullTitle}`
              : w.acronym || w.fullTitle || 'Untitled proposal';
            return (
              <div
                key={w.wizardId}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{timeAgo(w.updatedAt)}</p>
                  <div className="mt-2 max-w-xs">
                    <ProposalLabel step={w.currentStep} total={5} />
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Link
                    href={`/wizard/${w.wizardId}`}
                    className="px-4 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Continue →
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDeleteWizard(w.wizardId, label)}
                    className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Completed drafts */}
      {sorted.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
            Drafts
          </p>
          {sorted.map((d) => (
            <div
              key={d.draftId}
              className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{d.title}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {d.wordCount.toLocaleString()} words · {timeAgo(d.updatedAt)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/editor/${d.draftId}`}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Edit
                </Link>
                <Link
                  href={`/review/${d.draftId}`}
                  className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Review →
                </Link>
                <button
                  type="button"
                  onClick={() => handleDeleteDraft(d.draftId, d.title)}
                  className="px-3 py-1.5 text-xs font-medium border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
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

  function handleNewProposal() {
    router.push(`/wizard/${crypto.randomUUID()}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Hero */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold text-slate-900 mb-4">
          Research Grant Craft
        </h1>
        <p className="text-xl text-slate-600 mb-2">
          Open-source grant proposal wizard + reviewer report for researchers.
        </p>
        <p className="text-sm text-slate-400 mb-10">
          Local-first · No account required · Works without an API key
        </p>
        <button
          type="button"
          onClick={handleNewProposal}
          className="inline-block bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          + New proposal
        </button>
      </section>

      {/* Proposals queue — only visible after at least one session exists */}
      <ProposalsQueue />

      {/* What it does / does not */}
      <section className="grid md:grid-cols-2 gap-6 mb-16">
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 text-base">
            ✅ What it does
          </h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-medium">Structured wizard</span> — guides
              you through objectives, consortium, and timeline using
              scheme-specific scaffolding.
            </li>
            <li>
              <span className="font-medium">AI-assisted draft</span> — generates
              a Markdown draft from your answers. Works without any API key in
              template mode.
            </li>
            <li>
              <span className="font-medium">Heuristic reviewer report</span> —
              scores your draft across 22 signals aligned to the funding body's
              rubric and produces a ranked action plan.
            </li>
          </ul>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="font-semibold text-slate-900 mb-4 text-base">
            ⚠️ What it does NOT do
          </h2>
          <ul className="space-y-2 text-sm text-slate-700">
            <li>
              <span className="font-medium">Predict funding outcomes</span> —
              the reviewer report checks structural completeness, not scientific
              quality or panel judgement.
            </li>
            <li>
              <span className="font-medium">Submit proposals</span> — there is
              no integration with any submission portal.
            </li>
            <li>
              <span className="font-medium">Store your data</span> — everything
              stays in your browser. Nothing is sent to any server owned by this
              project.
            </li>
          </ul>
        </div>
      </section>

      {/* Scheme packs */}
      <section className="bg-white border border-slate-200 rounded-xl p-6 mb-8">
        <h2 className="font-semibold text-slate-900 mb-1">Scheme packs</h2>
        <p className="text-sm text-slate-500 mb-4">
          Each scheme pack provides criteria, rubrics, and guidance for one
          funding programme.
        </p>
        <div className="flex items-center justify-between text-sm py-3 border-t border-slate-100">
          <div>
            <span className="font-medium text-slate-800">
              Horizon Europe RIA / IA
            </span>
            <span className="ml-2 text-xs text-slate-400">EU · v1.0.0</span>
          </div>
          <span className="text-emerald-600 font-medium text-xs">
            ✅ Stable
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Want to add a scheme pack?{' '}
          <a
            href="https://github.com/selinachegg/research-grant-craft/issues/new?template=new_scheme_pack.yml"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            Open an issue
          </a>{' '}
          or read the{' '}
          <a
            href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/SCHEME_PACK_SPEC.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            scheme pack spec
          </a>
          .
        </p>
      </section>

      {/* Privacy note */}
      <section className="text-center text-xs text-slate-400 pb-8">
        <p>
          All proposal content is stored in your browser only.{' '}
          <Link href="/privacy" className="underline hover:text-slate-600">
            Privacy statement
          </Link>{' '}
          ·{' '}
          <a
            href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/LIMITATIONS.md"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-slate-600"
          >
            Limitations
          </a>
        </p>
      </section>
    </div>
  );
}
