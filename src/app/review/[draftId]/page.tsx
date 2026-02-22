'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { loadDraft } from '@/lib/drafts/store';
import type { ReviewerReport } from '@/lib/reviewer/types';

// ---------------------------------------------------------------------------
// Score badge
// ---------------------------------------------------------------------------

function ScoreBadge({ score, threshold, max }: { score: number; threshold: number; max: number }) {
  const passed = score >= threshold;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
        passed ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
      }`}
    >
      {passed ? '✅' : '❌'} {score} / {max}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Summary card
// ---------------------------------------------------------------------------

function SummaryCard({ report }: { report: ReviewerReport }) {
  return (
    <div
      className={`rounded-xl border p-5 mb-6 ${
        report.overallPassed
          ? 'bg-emerald-50 border-emerald-200'
          : 'bg-red-50 border-red-200'
      }`}
    >
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <p className="text-lg font-semibold text-slate-900">
            {report.overallPassed ? '✅ Overall: PASS' : '❌ Overall: BELOW THRESHOLD'}
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Total score: <strong>{report.overallScore}</strong> / {report.maxPossibleScore} ·
            Threshold: ≥ 10.0 total, ≥ 3.0 per criterion
          </p>
        </div>
        <div className="flex flex-col gap-1 text-right">
          <span className="text-xs text-slate-400">{report.draftWordCount} words</span>
          <span className="text-xs text-slate-400">{report.draftSectionCount} headings</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 mt-4">
        {report.criteria.map((c) => (
          <div key={c.criterionId} className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">{c.criterionTitle}</span>
            <ScoreBadge score={c.score} threshold={c.threshold} max={c.maxScore} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

type Status = 'loading' | 'scoring' | 'done' | 'error';

export default function ReviewPage() {
  const params = useParams();
  const router = useRouter();
  const draftId = params.draftId as string;

  const [status, setStatus] = useState<Status>('loading');
  const [report, setReport] = useState<ReviewerReport | null>(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function run() {
      // Load draft from localStorage
      const draft = loadDraft(draftId);
      if (!draft) {
        setErrorMsg('Draft not found. It may have been cleared from browser storage.');
        setStatus('error');
        return;
      }

      setDraftTitle(draft.title);

      if (draft.content.trim().length < 50) {
        setErrorMsg('Draft is too short to score (minimum 50 characters). Add more content and try again.');
        setStatus('error');
        return;
      }

      setStatus('scoring');

      try {
        const res = await fetch('/api/review', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            draftContent: draft.content,
            schemeId: draft.schemeId,
            draftId: draft.draftId,
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }

        const data = await res.json();
        setReport(data.report as ReviewerReport);
        setStatus('done');
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : 'Unknown error generating report.');
        setStatus('error');
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back + title */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.push(`/editor/${draftId}`)}
            className="text-sm text-slate-500 hover:text-slate-800 transition-colors mb-1"
          >
            ← Back to editor
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Reviewer Report</h1>
          {draftTitle && (
            <p className="text-sm text-slate-500 mt-0.5">{draftTitle}</p>
          )}
        </div>
        {status === 'done' && report && (
          <button
            type="button"
            onClick={handleDownload}
            className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ↓ Download report
          </button>
        )}
      </div>

      {/* Loading */}
      {(status === 'loading' || status === 'scoring') && (
        <div className="text-center py-24 text-slate-500">
          <div className="inline-block w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4" />
          <p className="text-sm">
            {status === 'loading' ? 'Loading draft…' : 'Scoring draft…'}
          </p>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
          <p className="text-red-700 font-medium mb-2">Could not generate report</p>
          <p className="text-sm text-red-600">{errorMsg}</p>
          <button
            type="button"
            onClick={() => router.push(`/editor/${draftId}`)}
            className="mt-4 px-4 py-2 text-sm bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors"
          >
            Back to editor
          </button>
        </div>
      )}

      {/* Report */}
      {status === 'done' && report && (
        <>
          <SummaryCard report={report} />

          {/* Disclaimer */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 mb-6">
            ⚠ <strong>Heuristic assessment only.</strong> This report checks for the presence of
            structural content signals. It does not evaluate scientific quality and does not
            predict the outcome of any evaluation panel. See{' '}
            <a
              href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/LIMITATIONS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Limitations
            </a>
            .
          </div>

          {/* Full markdown report */}
          <div className="bg-white border border-slate-200 rounded-2xl p-8 prose-report">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {report.markdownReport}
            </ReactMarkdown>
          </div>
        </>
      )}
    </div>
  );
}
