/**
 * store.ts — localStorage persistence helpers for the wizard state.
 *
 * All functions are safe to call during SSR (they check for window).
 */

import type { WizardState } from './types';
import { emptyWizardState } from './types';

const STORAGE_KEY = 'rgc_wizard_state';

export function loadWizardState(): WizardState {
  if (typeof window === 'undefined') return emptyWizardState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyWizardState();
    const parsed = JSON.parse(raw) as Partial<WizardState>;
    // Merge with defaults to handle schema additions gracefully
    return { ...emptyWizardState(), ...parsed };
  } catch {
    return emptyWizardState();
  }
}

export function saveWizardState(state: WizardState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...state, updatedAt: new Date().toISOString() }),
    );
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

export function clearWizardState(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
}
