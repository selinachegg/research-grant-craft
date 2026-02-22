/**
 * index.ts — LLM adapter public API.
 *
 * Selects mock or live mode based on whether an API endpoint and key are configured.
 * All calls go through the server-side /api/generate route to keep keys out of
 * the browser bundle.
 */

export { generateMockDraft } from './mock';
export type { LlmConfig, GenerateRequest, GenerateResult } from './types';
export { DEFAULT_LLM_CONFIG, loadLlmConfig, saveLlmConfig } from './types';

/**
 * Generate a draft by calling the /api/generate route.
 * Falls back to the mock adapter if no API key is configured.
 */
export async function generateDraft(
  wizardState: import('@/lib/wizard/types').WizardState,
  config: import('./types').LlmConfig,
): Promise<import('./types').GenerateResult> {
  const response = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ wizardState, config }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(err.error ?? `HTTP ${response.status}`);
  }

  return response.json();
}
