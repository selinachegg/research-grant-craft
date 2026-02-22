/**
 * store.ts — Draft persistence helpers (localStorage).
 *
 * Each draft is stored under its own key: `rgc_draft_<draftId>`.
 * A draft index is maintained under `rgc_draft_index`.
 */

export type DraftStatus = 'in-progress' | 'completed';

export interface DraftMeta {
  draftId: string;
  title: string;
  schemeId: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
  /** The wizard session that generated this draft (used for Regenerate). */
  wizardId?: string;
  /** Lifecycle status — undefined / 'in-progress' means still being worked on. */
  status?: DraftStatus;
}

export interface Draft extends DraftMeta {
  content: string;
}

const INDEX_KEY = 'rgc_draft_index';

function draftKey(draftId: string): string {
  return `rgc_draft_${draftId}`;
}

export function loadDraft(draftId: string): Draft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(draftKey(draftId));
    if (!raw) return null;
    return JSON.parse(raw) as Draft;
  } catch {
    return null;
  }
}

export function saveDraft(draft: Draft): void {
  if (typeof window === 'undefined') return;
  const updated = { ...draft, updatedAt: new Date().toISOString() };
  try {
    window.localStorage.setItem(draftKey(draft.draftId), JSON.stringify(updated));
    // Update index
    const index = loadDraftIndex();
    const existing = index.findIndex((m) => m.draftId === draft.draftId);
    const meta: DraftMeta = {
      draftId: draft.draftId,
      title: draft.title,
      schemeId: draft.schemeId,
      wordCount: draft.content.trim().split(/\s+/).filter(Boolean).length,
      createdAt: draft.createdAt,
      updatedAt: updated.updatedAt,
      wizardId: draft.wizardId,
      status: draft.status,
    };
    if (existing >= 0) index[existing] = meta;
    else index.unshift(meta);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // quota exceeded
  }
}

export function loadDraftIndex(): DraftMeta[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as DraftMeta[];
  } catch {
    return [];
  }
}

/**
 * Update only the status of a draft without needing the full content.
 * Touches both the full draft record and the index entry.
 */
export function setDraftStatus(draftId: string, status: DraftStatus): void {
  if (typeof window === 'undefined') return;
  try {
    // Update full record
    const raw = window.localStorage.getItem(draftKey(draftId));
    if (raw) {
      const draft = JSON.parse(raw) as Draft;
      window.localStorage.setItem(
        draftKey(draftId),
        JSON.stringify({ ...draft, status, updatedAt: new Date().toISOString() }),
      );
    }
    // Update index
    const index = loadDraftIndex();
    const entry = index.find((m) => m.draftId === draftId);
    if (entry) {
      entry.status = status;
      window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
    }
  } catch {
    // ignore
  }
}

export function deleteDraft(draftId: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(draftKey(draftId));
    const index = loadDraftIndex().filter((m) => m.draftId !== draftId);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // ignore
  }
}
