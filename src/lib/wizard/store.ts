/**
 * store.ts — Per-proposal wizard state persistence (localStorage).
 *
 * Each in-progress wizard session is stored under its own key:
 *   `rgc_wizard_<wizardId>`
 * A lightweight index `rgc_wizard_index` lists all sessions so the
 * home page can render the proposals queue.
 */

import type { WizardState } from './types';
import { emptyWizardState } from './types';

const WIZARD_INDEX_KEY = 'rgc_wizard_index';

export interface WizardMeta {
  wizardId: string;
  acronym: string;
  fullTitle: string;
  currentStep: number;
  schemeId: string;
  /** Set when the wizard is complete and a draft has been created. */
  linkedDraftId?: string;
  createdAt: string;
  updatedAt: string;
}

function wizardKey(wizardId: string): string {
  return `rgc_wizard_${wizardId}`;
}

export function loadWizardState(wizardId: string): WizardState {
  if (typeof window === 'undefined') return emptyWizardState();
  try {
    const raw = window.localStorage.getItem(wizardKey(wizardId));
    if (!raw) return emptyWizardState();
    const parsed = JSON.parse(raw) as Partial<WizardState>;
    return { ...emptyWizardState(), ...parsed };
  } catch {
    return emptyWizardState();
  }
}

export function saveWizardState(wizardId: string, state: WizardState): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = { ...state, updatedAt: new Date().toISOString() };
    window.localStorage.setItem(wizardKey(wizardId), JSON.stringify(updated));

    // Update index (preserve linkedDraftId if already set)
    const index = loadWizardIndex();
    const existingIdx = index.findIndex((m) => m.wizardId === wizardId);
    const meta: WizardMeta = {
      wizardId,
      acronym: state.acronym,
      fullTitle: state.fullTitle,
      currentStep: state.currentStep,
      schemeId: state.schemeId,
      linkedDraftId: existingIdx >= 0 ? index[existingIdx].linkedDraftId : undefined,
      createdAt: state.createdAt,
      updatedAt: updated.updatedAt,
    };
    if (existingIdx >= 0) index[existingIdx] = meta;
    else index.unshift(meta);
    window.localStorage.setItem(WIZARD_INDEX_KEY, JSON.stringify(index));
  } catch {
    // localStorage quota exceeded — fail silently
  }
}

/** Called when wizard completes and a draft is created. */
export function linkWizardToDraft(wizardId: string, draftId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const index = loadWizardIndex();
    const i = index.findIndex((m) => m.wizardId === wizardId);
    if (i >= 0) {
      index[i].linkedDraftId = draftId;
      window.localStorage.setItem(WIZARD_INDEX_KEY, JSON.stringify(index));
    }
  } catch {
    // ignore
  }
}

export function loadWizardIndex(): WizardMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(WIZARD_INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WizardMeta[];
  } catch {
    return [];
  }
}

export function deleteWizardState(wizardId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(wizardKey(wizardId));
    const index = loadWizardIndex().filter((m) => m.wizardId !== wizardId);
    window.localStorage.setItem(WIZARD_INDEX_KEY, JSON.stringify(index));
  } catch {
    // ignore
  }
}
