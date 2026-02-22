'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLlmConfig, saveLlmConfig } from '@/lib/llm/types';
import type { LlmConfig } from '@/lib/llm/types';

// ---------------------------------------------------------------------------
// Provider + model data
// ---------------------------------------------------------------------------

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-...',
    keyHint: 'Get your key at platform.openai.com/api-keys',
    docs: 'https://platform.openai.com/api-keys',
    models: [
      { id: 'gpt-4o-mini', label: 'GPT-4o mini',   recommended: true,  note: 'Fast · cheap · very reliable for grant drafts' },
      { id: 'gpt-4o',      label: 'GPT-4o',         recommended: false, note: 'Most capable · slower · higher cost' },
      { id: 'gpt-4-turbo', label: 'GPT-4 Turbo',    recommended: false, note: 'High quality · higher cost than 4o-mini' },
      { id: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', recommended: false, note: 'Cheapest · weaker reasoning quality' },
    ],
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    endpoint: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-...',
    keyHint: 'Get a key at openrouter.ai — access 100+ models from one API',
    docs: 'https://openrouter.ai/keys',
    models: [
      { id: 'openai/gpt-4o-mini',              label: 'GPT-4o mini (OpenAI)',           recommended: true,  note: 'Best balance: fast, cheap, reliable for structured writing' },
      { id: 'openai/gpt-4o',                   label: 'GPT-4o (OpenAI)',                recommended: false, note: 'Highest quality · higher cost' },
      { id: 'anthropic/claude-3.5-sonnet',     label: 'Claude 3.5 Sonnet (Anthropic)',  recommended: false, note: 'Excellent long-form writing · slightly higher cost' },
      { id: 'meta-llama/llama-3-70b-instruct', label: 'Llama 3 70B (Meta)',             recommended: false, note: 'Open weights · good reasoning · low cost on OpenRouter' },
      { id: 'google/gemini-flash-1.5',         label: 'Gemini Flash 1.5 (Google)',      recommended: false, note: 'Very fast · low cost · good for template filling' },
    ],
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    endpoint: 'http://localhost:11434/v1',
    keyPlaceholder: 'ollama',
    keyHint: 'Install Ollama and run: ollama pull llama3',
    docs: 'https://ollama.com',
    models: [
      { id: 'llama3',   label: 'Llama 3 8B',  recommended: true,  note: 'Good balance · runs locally · completely free' },
      { id: 'mistral',  label: 'Mistral 7B',  recommended: false, note: 'Efficient · good instruction following' },
      { id: 'gemma',    label: 'Gemma 7B',    recommended: false, note: 'Google model · good reasoning' },
      { id: 'phi3',     label: 'Phi-3 Mini',  recommended: false, note: 'Very fast · smallest · lower output quality' },
    ],
  },
  {
    id: 'custom',
    name: 'Custom',
    endpoint: '',
    keyPlaceholder: 'your-api-key',
    keyHint: 'Any OpenAI-compatible endpoint',
    docs: null,
    models: [] as { id: string; label: string; recommended: boolean; note: string }[],
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]['id'];

const MODEL_TRADEOFFS = `Speed vs. quality vs. cost:

• Mini/Flash models (gpt-4o-mini, gemini-flash): 2–5 s response, lowest cost, excellent for structured grant templates.

• Full models (gpt-4o, Claude Sonnet): 10–30 s, highest reasoning quality, higher cost.

• Local models (Ollama): free and private, speed depends on your hardware.

For grant drafting, a "mini" model is the recommended sweet spot — it produces well-structured output at a fraction of the cost.`;

// ---------------------------------------------------------------------------
// Tooltip
// ---------------------------------------------------------------------------

function InfoTooltip({ content }: { content: string }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-flex ml-1.5 align-middle">
      <button
        type="button"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onFocus={() => setShow(true)}
        onBlur={() => setShow(false)}
        aria-label="More information"
        className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-[10px] font-bold flex items-center justify-center hover:bg-brand-100 dark:hover:bg-brand-900 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
      >
        ?
      </button>
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 p-3 bg-slate-900 dark:bg-slate-800 text-slate-100 text-xs rounded-xl shadow-dropdown leading-relaxed whitespace-pre-line animate-fade-in pointer-events-none">
          {content}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
        </div>
      )}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Model selector — dropdown with popular options + "Other" escape hatch
// ---------------------------------------------------------------------------

function ModelSelector({
  provider,
  value,
  onChange,
}: {
  provider: (typeof PROVIDERS)[number];
  value: string;
  onChange: (model: string) => void;
}) {
  const knownIds = provider.models.map((m) => m.id);
  const [useCustom, setUseCustom] = useState(
    provider.models.length > 0 && value !== '' && !knownIds.includes(value as never),
  );

  // Sync when provider changes
  useEffect(() => {
    setUseCustom(
      provider.models.length > 0 && value !== '' && !knownIds.includes(value as never),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provider.id]);

  if (provider.models.length === 0) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="e.g. gpt-4o"
        className="field-input"
      />
    );
  }

  const selectedModel = provider.models.find((m) => m.id === value);
  const recommended   = provider.models.find((m) => m.recommended);

  return (
    <div className="space-y-2">
      <select
        value={useCustom ? '__other__' : (value || provider.models[0].id)}
        onChange={(e) => {
          if (e.target.value === '__other__') {
            setUseCustom(true);
            onChange('');
          } else {
            setUseCustom(false);
            onChange(e.target.value);
          }
        }}
        className="field-input"
      >
        {provider.models.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}{m.recommended ? '  ★ Recommended' : ''}
          </option>
        ))}
        <option value="__other__">Other — enter model ID manually</option>
      </select>

      {/* Manual entry field */}
      {useCustom && (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter the exact model ID (e.g. openai/gpt-4o)"
          className="field-input"
          autoFocus
        />
      )}

      {/* Contextual model note */}
      {!useCustom && selectedModel && (
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {selectedModel.recommended && (
            <span className="badge badge-brand">★ Recommended for grant writing</span>
          )}
          <span className="text-xs text-slate-500 dark:text-slate-400">{selectedModel.note}</span>
        </div>
      )}

      {/* "Why not GPT-4?" nudge when a non-recommended model is selected */}
      {!useCustom && recommended && value && value !== recommended.id && (
        <p className="field-hint">
          Tip: <strong>{recommended.label}</strong> is recommended for grant writing — {recommended.note.toLowerCase()}.
        </p>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [mode, setMode] = useState<'mock' | 'live'>('mock');
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [config, setConfig] = useState<LlmConfig>({ endpoint: '', apiKey: '', model: 'gpt-4o-mini' });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  useEffect(() => {
    const c = loadLlmConfig();
    if (c.endpoint && c.apiKey) {
      setMode('live');
      setConfig(c);
      const match = PROVIDERS.find((p) => p.endpoint === c.endpoint);
      setProviderId(match ? match.id : 'custom');
    }
  }, []);

  function selectProvider(id: ProviderId) {
    setProviderId(id);
    const preset = PROVIDERS.find((p) => p.id === id)!;
    const recommended = preset.models.find((m) => m.recommended);
    setConfig((prev) => ({
      ...prev,
      endpoint: preset.endpoint || prev.endpoint,
      model: recommended ? recommended.id : (preset.models[0]?.id ?? prev.model),
    }));
    setTestResult(null);
  }

  function handleSave() {
    saveLlmConfig(mode === 'mock' ? { endpoint: '', apiKey: '', model: 'gpt-4o-mini' } : config);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTestResult(null);
  }

  function handleClear() {
    setMode('mock');
    setConfig({ endpoint: '', apiKey: '', model: 'gpt-4o-mini' });
    saveLlmConfig({ endpoint: '', apiKey: '', model: 'gpt-4o-mini' });
    setProviderId('openai');
    setTestResult(null);
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wizardState: {
            acronym: 'TEST', fullTitle: 'Connection test', abstract: 'Testing API connection to verify credentials.',
            objectives: [{ id: '1', text: 'Test connection' }],
            currentTrl: '3', targetTrl: '6', stateOfArtGap: 'Testing.',
            partners: [{ id: '1', name: 'Test Org', country: 'DE', type: 'University', role: 'Lead', expertise: 'Testing' }],
            durationMonths: 48, totalBudgetEuros: '1000000', keyMilestones: '',
            schemeId: 'horizon_europe_ria_ia',
            createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), currentStep: 5,
          },
          config,
        }),
      });
      const data = await res.json();
      if (!res.ok) setTestResult({ ok: false, message: data.error ?? `HTTP ${res.status}` });
      else if (data.isMock) setTestResult({ ok: false, message: 'Response came from template mode — check your endpoint and API key.' });
      else setTestResult({ ok: true, message: 'Connection successful! The API is responding correctly.' });
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  }

  const selectedProvider = PROVIDERS.find((p) => p.id === providerId)!;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 mb-6 transition-colors">
        <ChevronLeftIcon className="w-4 h-4" />
        Home
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">AI generation settings</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
        Choose how proposal drafts are generated. Settings are saved in your browser only — nothing is sent to our servers.
      </p>

      {/* Mode cards */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        {[
          {
            key: 'mock' as const,
            icon: '🧪',
            title: 'Template mode',
            desc: 'No API key needed. Generates a structured scaffold from your answers with clear [FILL IN: …] markers. Works offline.',
          },
          {
            key: 'live' as const,
            icon: '✨',
            title: 'Live AI',
            desc: 'Connect your own API key to get AI-written prose in every section. Supports OpenAI, OpenRouter, Ollama, and any OpenAI-compatible endpoint.',
          },
        ].map((m) => (
          <button
            key={m.key}
            type="button"
            onClick={() => { setMode(m.key); setTestResult(null); }}
            className={`text-left p-5 rounded-2xl border-2 transition-all duration-150 ${
              mode === m.key
                ? 'border-brand-500 bg-brand-50 dark:bg-brand-950'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            <div className="text-2xl mb-2">{m.icon}</div>
            <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">{m.title}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{m.desc}</p>
            {mode === m.key && <span className="badge badge-brand mt-3">Active</span>}
          </button>
        ))}
      </div>

      {/* Live configuration panel */}
      {mode === 'live' && (
        <div className="card p-6 space-y-6 mb-6">
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">Provider configuration</h2>

          {/* Provider */}
          <div>
            <label className="field-label">Provider</label>
            <div className="flex flex-wrap gap-2 mt-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProvider(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-xl border transition-all duration-150 ${
                    providerId === p.id
                      ? 'bg-brand-600 text-white border-brand-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <p className="field-hint">
              {selectedProvider.docs
                ? <a href={selectedProvider.docs} target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600 dark:hover:text-slate-300">{selectedProvider.keyHint}</a>
                : selectedProvider.keyHint}
            </p>
          </div>

          {/* Endpoint */}
          <div>
            <label className="field-label">API endpoint</label>
            <input
              value={config.endpoint}
              onChange={(e) => setConfig((c) => ({ ...c, endpoint: e.target.value }))}
              placeholder="https://api.openai.com/v1"
              className="field-input"
            />
            <p className="field-hint">Must expose a <code className="font-mono text-xs">/chat/completions</code> route (OpenAI-compatible).</p>
          </div>

          {/* API Key */}
          <div>
            <label className="field-label">API key</label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
              placeholder={selectedProvider.keyPlaceholder}
              autoComplete="off"
              className="field-input"
            />
            <p className="field-hint">Stored in your browser's localStorage only. Never sent to this app's servers.</p>
          </div>

          {/* Model */}
          <div>
            <div className="flex items-center mb-1.5">
              <span className="field-label mb-0">Model</span>
              <InfoTooltip content={MODEL_TRADEOFFS} />
            </div>
            <ModelSelector
              provider={selectedProvider}
              value={config.model}
              onChange={(model) => setConfig((c) => ({ ...c, model }))}
            />
            <p className="field-hint mt-2">The model ID is passed directly to the API. Ensure it matches what your provider supports.</p>
          </div>

          {/* Test */}
          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !config.endpoint || !config.apiKey}
              className="btn-secondary"
            >
              {testing ? <><SpinnerIcon className="w-3.5 h-3.5 animate-spin" />Testing…</> : 'Test connection'}
            </button>
            <p className="field-hint mt-1.5">Sends a minimal test request to confirm your endpoint and key are working.</p>
            {testResult && (
              <p className={`mt-3 text-sm flex items-center gap-1.5 ${testResult.ok ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {testResult.ok ? '✅' : '❌'} {testResult.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Privacy notice */}
      {mode === 'live' && (
        <div className="rounded-xl px-4 py-3 text-xs mb-6 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300">
          ⚠ In Live AI mode, your draft text and wizard answers are sent to the configured API endpoint. Review your chosen provider's privacy policy before entering sensitive research content.{' '}
          <Link href="/privacy" className="underline font-medium">Privacy statement</Link>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={mode === 'live' && (!config.endpoint || !config.apiKey)}
          className="btn-primary"
        >
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
        <button type="button" onClick={handleClear} className="btn-secondary">
          Reset to template mode
        </button>
      </div>
      <p className="text-xs text-slate-400 dark:text-slate-500 mt-4">
        Settings apply immediately to new draft generation requests.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

function ChevronLeftIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden><path fillRule="evenodd" d="M11.78 5.22a.75.75 0 0 1 0 1.06L8.06 10l3.72 3.72a.75.75 0 1 1-1.06 1.06l-4.25-4.25a.75.75 0 0 1 0-1.06l4.25-4.25a.75.75 0 0 1 1.06 0Z" clipRule="evenodd" /></svg>;
}
function SpinnerIcon({ className }: { className: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4Z" /></svg>;
}
