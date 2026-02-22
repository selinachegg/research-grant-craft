/**
 * store.ts — Draft persistence helpers (localStorage).
 *
 * Each draft is stored under its own key: `rgc_draft_<draftId>`.
 * A draft index is maintained under `rgc_draft_index`.
 */

export interface DraftMeta {
  draftId: string;
  title: string;
  schemeId: string;
  wordCount: number;
  createdAt: string;
  updatedAt: string;
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
