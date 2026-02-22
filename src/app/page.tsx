import Link from 'next/link';

export default function HomePage() {
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
        <Link
          href="/wizard"
          className="inline-block bg-blue-600 text-white font-medium px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          Start a new proposal
        </Link>
      </section>

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
              mock mode.
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
