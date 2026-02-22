/**
 * types.ts — LLM adapter type definitions.
 */

import type { WizardState } from '@/lib/wizard/types';

export interface LlmConfig {
  /** API endpoint (OpenAI-compatible). Empty string → mock mode. */
  endpoint: string;
  /** API key. Empty string → mock mode. */
  apiKey: string;
  /** Model name. */
  model: string;
}

export interface GenerateRequest {
  wizardState: WizardState;
  config: LlmConfig;
}

export interface GenerateResult {
  draftMarkdown: string;
  /** true if the mock adapter was used */
  isMock: boolean;
}

export const DEFAULT_LLM_CONFIG: LlmConfig = {
  endpoint: '',
  apiKey: '',
  model: 'gpt-4o',
};

const CONFIG_KEY = 'rgc_llm_config';

export function loadLlmConfig(): LlmConfig {
  if (typeof window === 'undefined') return DEFAULT_LLM_CONFIG;
  try {
    const raw = window.localStorage.getItem(CONFIG_KEY);
    if (!raw) return DEFAULT_LLM_CONFIG;
    return { ...DEFAULT_LLM_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_LLM_CONFIG;
  }
}

export function saveLlmConfig(config: LlmConfig): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}
