'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { WizardState, Objective, Partner } from '@/lib/wizard/types';
import { WIZARD_STEPS, emptyWizardState } from '@/lib/wizard/types';
import { loadWizardState, saveWizardState } from '@/lib/wizard/store';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {WIZARD_STEPS.map((step) => (
        <div key={step.id} className="flex items-center gap-2">
          <div
            className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center transition-colors ${
              step.id < current
                ? 'bg-blue-600 text-white'
                : step.id === current
                ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            {step.id < current ? '✓' : step.id}
          </div>
          <span
            className={`text-xs hidden sm:inline ${
              step.id === current ? 'text-slate-800 font-medium' : 'text-slate-400'
            }`}
          >
            {step.label}
          </span>
          {step.id < total && (
            <div className="w-6 h-px bg-slate-200 mx-1 hidden sm:block" />
          )}
        </div>
      ))}
    </div>
  );
}

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
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${props.className ?? ''}`}
    />
  );
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y ${props.className ?? ''}`}
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }) {
  return (
    <select
      {...props}
      className={`w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition bg-white ${props.className ?? ''}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Step 1: Project basics
// ---------------------------------------------------------------------------

function Step1({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">Project basics</h2>
      <div>
        <Label>Project acronym *</Label>
        <Input
          value={state.acronym}
          onChange={(e) => update({ acronym: e.target.value })}
          placeholder="e.g. AGRI-ADAPT"
          maxLength={20}
        />
        <Hint>Short, memorable identifier (max 20 chars).</Hint>
      </div>
      <div>
        <Label>Full project title *</Label>
        <Input
          value={state.fullTitle}
          onChange={(e) => update({ fullTitle: e.target.value })}
          placeholder="e.g. Adaptive AI for Climate-Resilient Precision Agriculture"
        />
      </div>
      <div>
        <Label>Abstract / project summary *</Label>
        <Textarea
          rows={5}
          value={state.abstract}
          onChange={(e) => update({ abstract: e.target.value })}
          placeholder="Describe the problem, your approach, and the expected impact in 3–5 sentences."
        />
        <Hint>{state.abstract.trim().split(/\s+/).filter(Boolean).length} words</Hint>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Objectives
// ---------------------------------------------------------------------------

function Step2({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  function updateObjective(id: string, text: string) {
    update({
      objectives: state.objectives.map((o) => (o.id === id ? { ...o, text } : o)),
    });
  }

  function addObjective() {
    update({ objectives: [...state.objectives, { id: uuidv4(), text: '' }] });
  }

  function removeObjective(id: string) {
    if (state.objectives.length <= 1) return;
    update({ objectives: state.objectives.filter((o) => o.id !== id) });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">Objectives</h2>
      <div>
        <Label>Project objectives (3–6 recommended) *</Label>
        <Hint>
          Use the format "To [verb] [measurable outcome] by [timeframe]". Aim for 3–6 SMART objectives.
        </Hint>
        <div className="mt-2 space-y-2">
          {state.objectives.map((obj, idx) => (
            <div key={obj.id} className="flex gap-2 items-start">
              <span className="mt-2 text-xs font-medium text-slate-400 w-6 text-right shrink-0">
                O{idx + 1}
              </span>
              <Input
                value={obj.text}
                onChange={(e) => updateObjective(obj.id, e.target.value)}
                placeholder={`To develop … achieving ≥85% accuracy by Month 24`}
              />
              <button
                type="button"
                onClick={() => removeObjective(obj.id)}
                disabled={state.objectives.length <= 1}
                className="mt-1.5 text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors text-lg leading-none"
                aria-label="Remove objective"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={addObjective}
          disabled={state.objectives.length >= 8}
          className="mt-2 text-sm text-blue-600 hover:underline disabled:opacity-40"
        >
          + Add objective
        </button>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Current TRL *</Label>
          <Select value={state.currentTrl} onChange={(e) => update({ currentTrl: e.target.value })}>
            <option value="">Select…</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={String(n)}>TRL {n}</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Target TRL at project end *</Label>
          <Select value={state.targetTrl} onChange={(e) => update({ targetTrl: e.target.value })}>
            <option value="">Select…</option>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
              <option key={n} value={String(n)}>TRL {n}</option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <Label>Gap in the state of the art *</Label>
        <Textarea
          rows={3}
          value={state.stateOfArtGap}
          onChange={(e) => update({ stateOfArtGap: e.target.value })}
          placeholder="What specific limitations in existing approaches does this project address? (2–4 sentences)"
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Consortium
// ---------------------------------------------------------------------------

const PARTNER_TYPES: Partner['type'][] = [
  'University', 'Research Institute', 'SME', 'NGO', 'Industry', 'Public Body', 'Other',
];

function Step3({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  function updatePartner(id: string, patch: Partial<Partner>) {
    update({ partners: state.partners.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  }

  function addPartner() {
    update({
      partners: [
        ...state.partners,
        { id: uuidv4(), name: '', country: '', type: 'Research Institute', role: '', expertise: '' },
      ],
    });
  }

  function removePartner(id: string) {
    if (state.partners.length <= 1) return;
    update({ partners: state.partners.filter((p) => p.id !== id) });
  }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">Consortium</h2>
      <p className="text-sm text-slate-500">
        Add all partner organisations. The first partner is assumed to be the coordinator.
      </p>
      <div className="space-y-4">
        {state.partners.map((partner, idx) => (
          <div key={partner.id} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Partner {idx + 1}{idx === 0 ? ' · Coordinator' : ''}
              </span>
              <button
                type="button"
                onClick={() => removePartner(partner.id)}
                disabled={state.partners.length <= 1}
                className="text-slate-400 hover:text-red-500 disabled:opacity-30 transition-colors text-sm"
              >
                Remove
              </button>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <Label>Organisation name *</Label>
                <Input
                  value={partner.name}
                  onChange={(e) => updatePartner(partner.id, { name: e.target.value })}
                  placeholder="e.g. Wageningen University & Research"
                />
              </div>
              <div>
                <Label>Country *</Label>
                <Input
                  value={partner.country}
                  onChange={(e) => updatePartner(partner.id, { country: e.target.value })}
                  placeholder="e.g. NL"
                  maxLength={3}
                />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <Label>Organisation type</Label>
                <Select
                  value={partner.type}
                  onChange={(e) => updatePartner(partner.id, { type: e.target.value as Partner['type'] })}
                >
                  {PARTNER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div>
                <Label>Role in project *</Label>
                <Input
                  value={partner.role}
                  onChange={(e) => updatePartner(partner.id, { role: e.target.value })}
                  placeholder="e.g. AI development, WP2 lead"
                />
              </div>
            </div>
            <div>
              <Label>Key expertise</Label>
              <Input
                value={partner.expertise}
                onChange={(e) => updatePartner(partner.id, { expertise: e.target.value })}
                placeholder="e.g. Agricultural AI, crop modelling, remote sensing"
              />
            </div>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addPartner}
        disabled={state.partners.length >= 10}
        className="text-sm text-blue-600 hover:underline disabled:opacity-40"
      >
        + Add partner
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Timeline & budget
// ---------------------------------------------------------------------------

function Step4({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">Timeline & budget</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <Label>Project duration (months) *</Label>
          <Select
            value={String(state.durationMonths)}
            onChange={(e) => update({ durationMonths: Number(e.target.value) })}
          >
            {[24, 36, 42, 48, 60].map((m) => (
              <option key={m} value={String(m)}>{m} months</option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Total budget (€) *</Label>
          <Input
            value={state.totalBudgetEuros}
            onChange={(e) => update({ totalBudgetEuros: e.target.value })}
            placeholder="e.g. 3,800,000"
          />
        </div>
      </div>
      <div>
        <Label>Key milestones</Label>
        <Textarea
          rows={4}
          value={state.keyMilestones}
          onChange={(e) => update({ keyMilestones: e.target.value })}
          placeholder={`MS1 (M6): Data Management Plan submitted\nMS2 (M24): AI engine validated (go/no-go)\nMS3 (M44): Pilot season KPIs confirmed`}
        />
        <Hint>One milestone per line. Format: MS1 (M6): description</Hint>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 5: Scheme selection
// ---------------------------------------------------------------------------

const SCHEMES = [
  {
    id: 'horizon_europe_ria_ia' as const,
    name: 'Horizon Europe RIA / IA',
    description: 'Research and Innovation Action or Innovation Action under Horizon Europe.',
    region: 'EU',
  },
];

function Step5({ state, update }: { state: WizardState; update: (patch: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-slate-900">Select funding scheme</h2>
      <p className="text-sm text-slate-500">
        The scheme pack determines the evaluation criteria, rubric, and section
        guidance used to scaffold and score your proposal.
      </p>
      <div className="space-y-3">
        {SCHEMES.map((scheme) => (
          <label
            key={scheme.id}
            className={`flex gap-4 p-4 border rounded-xl cursor-pointer transition-colors ${
              state.schemeId === scheme.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <input
              type="radio"
              name="schemeId"
              value={scheme.id}
              checked={state.schemeId === scheme.id}
              onChange={() => update({ schemeId: scheme.id })}
              className="mt-1 accent-blue-600"
            />
            <div>
              <p className="font-medium text-slate-900 text-sm">{scheme.name}</p>
              <p className="text-xs text-slate-500 mt-0.5">{scheme.description}</p>
              <span className="inline-block mt-1 text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                {scheme.region}
              </span>
            </div>
          </label>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
        More scheme packs coming in v1.0. Want to contribute one?{' '}
        <a
          href="https://github.com/selinachegg/research-grant-craft/issues/new?template=new_scheme_pack.yml"
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium"
        >
          Open an issue
        </a>
        .
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateStep(state: WizardState, step: number): string[] {
  const errors: string[] = [];
  if (step === 1) {
    if (!state.acronym.trim()) errors.push('Project acronym is required.');
    if (!state.fullTitle.trim()) errors.push('Full project title is required.');
    if (state.abstract.trim().split(/\s+/).filter(Boolean).length < 30)
      errors.push('Abstract should be at least 30 words.');
  }
  if (step === 2) {
    if (state.objectives.filter((o) => o.text.trim()).length < 1)
      errors.push('At least one objective is required.');
    if (!state.currentTrl) errors.push('Current TRL is required.');
    if (!state.targetTrl) errors.push('Target TRL is required.');
    if (!state.stateOfArtGap.trim()) errors.push('State-of-art gap description is required.');
  }
  if (step === 3) {
    if (state.partners.some((p) => !p.name.trim() || !p.country.trim()))
      errors.push('All partners must have a name and country.');
  }
  if (step === 4) {
    if (!state.totalBudgetEuros.trim()) errors.push('Total budget is required.');
  }
  return errors;
}

// ---------------------------------------------------------------------------
// Main wizard page
// ---------------------------------------------------------------------------

export default function WizardPage() {
  const router = useRouter();
  const [state, setState] = useState<WizardState>(emptyWizardState);
  const [errors, setErrors] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setState(loadWizardState());
  }, []);

  const update = useCallback((patch: Partial<WizardState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      saveWizardState(next);
      return next;
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }, []);

  function goNext() {
    const errs = validateStep(state, state.currentStep);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    if (state.currentStep < WIZARD_STEPS.length) {
      update({ currentStep: state.currentStep + 1 });
    } else {
      // Wizard complete — navigate to editor with a new draft ID
      const draftId = uuidv4();
      router.push(`/editor/${draftId}?fromWizard=1`);
    }
  }

  function goBack() {
    setErrors([]);
    if (state.currentStep > 1) update({ currentStep: state.currentStep - 1 });
  }

  const step = state.currentStep;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-900">New proposal</h1>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>

      <StepIndicator current={step} total={WIZARD_STEPS.length} />

      <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        {step === 1 && <Step1 state={state} update={update} />}
        {step === 2 && <Step2 state={state} update={update} />}
        {step === 3 && <Step3 state={state} update={update} />}
        {step === 4 && <Step4 state={state} update={update} />}
        {step === 5 && <Step5 state={state} update={update} />}

        {errors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ul className="text-sm text-red-700 space-y-1">
              {errors.map((e) => <li key={e}>• {e}</li>)}
            </ul>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1}
            className="px-5 py-2 text-sm border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
          >
            Back
          </button>
          <button
            type="button"
            onClick={goNext}
            className="px-6 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            {step < WIZARD_STEPS.length ? 'Continue' : 'Generate draft →'}
          </button>
        </div>
      </div>

      <p className="text-xs text-slate-400 text-center mt-4">
        Your answers are saved automatically in this browser. Nothing is sent to any server.
      </p>
    </div>
  );
}
