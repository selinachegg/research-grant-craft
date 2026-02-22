'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { loadLlmConfig, saveLlmConfig } from '@/lib/llm/types';
import type { LlmConfig } from '@/lib/llm/types';

// ---------------------------------------------------------------------------
// Provider presets
// ---------------------------------------------------------------------------

const PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    keyPlaceholder: 'sk-...',
    keyHint: 'Get your key at platform.openai.com/api-keys',
    docs: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'openai-mini',
    name: 'OpenAI (mini)',
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    keyPlaceholder: 'sk-...',
    keyHint: 'Same key as OpenAI — cheaper, faster model',
    docs: 'https://platform.openai.com/api-keys',
  },
  {
    id: 'ollama',
    name: 'Ollama (local)',
    endpoint: 'http://localhost:11434/v1',
    model: 'llama3',
    keyPlaceholder: 'ollama',
    keyHint: 'Install Ollama and run: ollama pull llama3',
    docs: 'https://ollama.com',
  },
  {
    id: 'custom',
    name: 'Custom',
    endpoint: '',
    model: '',
    keyPlaceholder: 'your-api-key',
    keyHint: 'Any OpenAI-compatible endpoint',
    docs: null,
  },
] as const;

type ProviderId = (typeof PROVIDERS)[number]['id'];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium text-slate-700 mb-1">{children}</label>;
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="text-xs text-slate-400 mt-1">{children}</p>;
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
    />
  );
}

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const [mode, setMode] = useState<'mock' | 'live'>('mock');
  const [providerId, setProviderId] = useState<ProviderId>('openai');
  const [config, setConfig] = useState<LlmConfig>({ endpoint: '', apiKey: '', model: 'gpt-4o' });
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Load saved config on mount
  useEffect(() => {
    const saved = loadLlmConfig();
    if (saved.endpoint && saved.apiKey) {
      setMode('live');
      setConfig(saved);
      // Try to match provider
      const match = PROVIDERS.find((p) => p.endpoint === saved.endpoint && p.model === saved.model);
      if (match) setProviderId(match.id);
      else setProviderId('custom');
    }
  }, []);

  function selectProvider(id: ProviderId) {
    setProviderId(id);
    const preset = PROVIDERS.find((p) => p.id === id)!;
    setConfig((prev) => ({
      ...prev,
      endpoint: preset.endpoint || prev.endpoint,
      model: preset.model || prev.model,
    }));
    setTestResult(null);
  }

  function handleSave() {
    if (mode === 'mock') {
      saveLlmConfig({ endpoint: '', apiKey: '', model: 'gpt-4o' });
    } else {
      saveLlmConfig(config);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setTestResult(null);
  }

  function handleClear() {
    setMode('mock');
    setConfig({ endpoint: '', apiKey: '', model: 'gpt-4o' });
    saveLlmConfig({ endpoint: '', apiKey: '', model: 'gpt-4o' });
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
            acronym: 'TEST',
            fullTitle: 'Connection test',
            abstract: 'Testing API connection.',
            objectives: [{ id: '1', text: 'Test connection' }],
            currentTrl: '3',
            targetTrl: '6',
            stateOfArtGap: 'Testing.',
            partners: [{ id: '1', name: 'Test', country: 'EU', type: 'University', role: 'Lead', expertise: 'Test' }],
            durationMonths: 48,
            totalBudgetEuros: '1000000',
            keyMilestones: '',
            schemeId: 'horizon_europe_ria_ia',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            currentStep: 5,
          },
          config,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTestResult({ ok: false, message: data.error ?? `HTTP ${res.status}` });
      } else if (data.isMock) {
        setTestResult({ ok: false, message: 'Connection reached mock mode — check your endpoint and API key.' });
      } else {
        setTestResult({ ok: true, message: 'Connection successful! API is responding correctly.' });
      }
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : 'Unknown error' });
    } finally {
      setTesting(false);
    }
  }

  const selectedProvider = PROVIDERS.find((p) => p.id === providerId)!;

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/" className="text-sm text-slate-500 hover:text-slate-800 transition-colors">
        ← Home
      </Link>

      <h1 className="text-2xl font-bold text-slate-900 mt-4 mb-1">AI generation settings</h1>
      <p className="text-sm text-slate-500 mb-8">
        Choose how drafts are generated. Settings are saved in your browser only — never sent to
        this project's servers.
      </p>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        {/* Mock mode card */}
        <button
          type="button"
          onClick={() => { setMode('mock'); setTestResult(null); }}
          className={`text-left p-5 rounded-xl border-2 transition-colors ${
            mode === 'mock'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="font-semibold text-slate-900 mb-1">🧪 Mock mode</p>
          <p className="text-xs text-slate-500">
            No API key needed. Generates a structured scaffold from your wizard answers.
            Works offline. Recommended for first-time users.
          </p>
          {mode === 'mock' && (
            <span className="inline-block mt-3 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>

        {/* Live AI card */}
        <button
          type="button"
          onClick={() => { setMode('live'); setTestResult(null); }}
          className={`text-left p-5 rounded-xl border-2 transition-colors ${
            mode === 'live'
              ? 'border-blue-500 bg-blue-50'
              : 'border-slate-200 bg-white hover:border-slate-300'
          }`}
        >
          <p className="font-semibold text-slate-900 mb-1">✨ Live AI</p>
          <p className="text-xs text-slate-500">
            Connect your own API key (OpenAI, local Ollama, or any OpenAI-compatible
            endpoint). Your draft text is sent to the configured provider.
          </p>
          {mode === 'live' && (
            <span className="inline-block mt-3 text-xs font-medium text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
              Active
            </span>
          )}
        </button>
      </div>

      {/* Live mode configuration */}
      {mode === 'live' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 mb-6">
          <h2 className="font-semibold text-slate-900">Provider configuration</h2>

          {/* Provider presets */}
          <div>
            <Label>Provider</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectProvider(p.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                    providerId === p.id
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
            {selectedProvider.docs && (
              <Hint>
                <a
                  href={selectedProvider.docs}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-slate-600"
                >
                  {selectedProvider.keyHint}
                </a>
              </Hint>
            )}
            {!selectedProvider.docs && <Hint>{selectedProvider.keyHint}</Hint>}
          </div>

          {/* Endpoint */}
          <div>
            <Label>API endpoint</Label>
            <Input
              value={config.endpoint}
              onChange={(e) => setConfig((c) => ({ ...c, endpoint: e.target.value }))}
              placeholder="https://api.openai.com/v1"
            />
            <Hint>Must be an OpenAI-compatible endpoint (supports /chat/completions).</Hint>
          </div>

          {/* API Key */}
          <div>
            <Label>API key</Label>
            <Input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig((c) => ({ ...c, apiKey: e.target.value }))}
              placeholder={selectedProvider.keyPlaceholder}
              autoComplete="off"
            />
            <Hint>
              Stored in browser localStorage only. Never sent to this project's servers.
            </Hint>
          </div>

          {/* Model */}
          <div>
            <Label>Model</Label>
            <Input
              value={config.model}
              onChange={(e) => setConfig((c) => ({ ...c, model: e.target.value }))}
              placeholder="gpt-4o"
            />
            <Hint>
              OpenAI: gpt-4o, gpt-4o-mini &nbsp;·&nbsp; Ollama: llama3, mistral, phi3
            </Hint>
          </div>

          {/* Test connection */}
          <div>
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !config.endpoint || !config.apiKey}
              className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            >
              {testing ? 'Testing…' : 'Test connection'}
            </button>
            {testResult && (
              <p className={`mt-2 text-sm ${testResult.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                {testResult.ok ? '✅' : '❌'} {testResult.message}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Privacy note for live mode */}
      {mode === 'live' && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 mb-6">
          ⚠ When Live AI is active, your draft text and wizard answers are sent to the configured
          API endpoint. Review the privacy policy of your chosen provider before entering sensitive
          proposal content.{' '}
          <Link href="/privacy" className="underline font-medium">
            Privacy statement
          </Link>
        </div>
      )}

      {/* Save / clear */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={mode === 'live' && (!config.endpoint || !config.apiKey)}
          className="px-6 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm"
        >
          {saved ? '✓ Saved' : 'Save settings'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
        >
          Reset to mock mode
        </button>
      </div>

      <p className="text-xs text-slate-400 mt-4">
        Settings are saved in your browser's localStorage and apply immediately to new draft
        generation requests.
      </p>
    </div>
  );
}
