'use client';

/**
 * /wizard — Redirect to a fresh wizard session with a new UUID.
 *
 * This means every click on "New proposal" (navbar or home page) always
 * opens a blank form, while the existing session stays saved in the queue.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function WizardRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/wizard/${crypto.randomUUID()}`);
  }, [router]);

  return (
    <div className="max-w-2xl mx-auto py-16 text-center text-slate-400 text-sm">
      Starting new proposal…
    </div>
  );
}
