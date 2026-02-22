import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Research Grant Craft',
  description:
    'Open-source grant proposal wizard + reviewer report for researchers.',
  metadataBase: new URL('https://github.com/selinachegg/research-grant-craft'),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <header className="border-b border-slate-200 bg-white sticky top-0 z-40">
          <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
            <a
              href="/"
              className="font-semibold text-slate-900 hover:text-blue-600 transition-colors"
            >
              Research Grant Craft
            </a>
            <nav className="flex items-center gap-6 text-sm text-slate-600">
              <a href="/wizard" className="hover:text-slate-900 transition-colors">
                New proposal
              </a>
              <a href="/settings" className="hover:text-slate-900 transition-colors">
                AI settings
              </a>
              <a
                href="https://github.com/selinachegg/research-grant-craft"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-slate-900 transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </header>
        <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
        <footer className="border-t border-slate-200 mt-16 py-6 text-center text-sm text-slate-400">
          <p>
            Research Grant Craft — open-source, local-first.{' '}
            <a
              href="https://github.com/selinachegg/research-grant-craft"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-slate-600"
            >
              View on GitHub
            </a>{' '}
            ·{' '}
            <a href="/privacy" className="underline hover:text-slate-600">
              Privacy
            </a>
            {' · '}
            <span>MIT Licence</span>
          </p>
          <p className="mt-1 text-xs text-slate-300">
            This tool does not predict funding outcomes. See{' '}
            <a
              href="https://github.com/selinachegg/research-grant-craft/blob/main/docs/LIMITATIONS.md"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Limitations
            </a>
            .
          </p>
        </footer>
      </body>
    </html>
  );
}
