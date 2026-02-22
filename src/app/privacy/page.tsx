import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy — Research Grant Craft',
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto prose-report">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
        ← Home
      </Link>
      <h1 className="mt-4">Privacy Statement</h1>
      <p>
        <strong>Short version:</strong> Your proposal text never leaves your device unless you
        deliberately configure an external LLM API. There are no accounts, no tracking, and no
        server-side storage by this project.
      </p>
      <h2>What is stored — and where</h2>
      <table>
        <thead>
          <tr>
            <th>Data</th><th>Storage</th><th>Transmitted?</th>
          </tr>
        </thead>
        <tbody>
          <tr><td>Wizard intake answers</td><td>Browser localStorage</td><td>Never</td></tr>
          <tr><td>Draft proposal text</td><td>Browser localStorage</td><td>Only if LLM mode is enabled</td></tr>
          <tr><td>Reviewer report output</td><td>Browser localStorage</td><td>Never</td></tr>
          <tr><td>LLM API key (if entered)</td><td>Browser localStorage</td><td>Never (sent to your configured endpoint only)</td></tr>
        </tbody>
      </table>
      <p>
        Clearing your browser's site data permanently removes all stored content.
        There is no account recovery.
      </p>
      <h2>LLM calls (opt-in only)</h2>
      <p>
        By default the app runs in <strong>mock mode</strong>: no outbound requests are made.
        If you enable a real LLM endpoint, your draft text is sent to that endpoint.
        Research Grant Craft does not own or operate any LLM API — review the privacy
        policy of whichever provider you configure.
      </p>
      <h2>No analytics or telemetry</h2>
      <p>
        This application contains no analytics scripts, error-reporting services,
        feature-flag SDKs, or any form of telemetry.
      </p>
      <h2>Full privacy statement</h2>
      <p>
        The complete privacy statement is in{' '}
        <a
          href="https://github.com/selinachegg/research-grant-craft/blob/main/PRIVACY.md"
          target="_blank"
          rel="noopener noreferrer"
        >
          PRIVACY.md
        </a>{' '}
        in the repository.
      </p>
    </div>
  );
}
