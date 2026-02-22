/**
 * types.ts — Wizard state types.
 *
 * WizardState is the single source of truth for all data collected during
 * the intake flow. It is persisted to localStorage and passed to the LLM
 * adapter to generate the initial draft.
 */

export type SchemeId = 'horizon_europe_ria_ia';

export interface Partner {
  id: string;
  name: string;
  country: string;
  type: 'University' | 'Research Institute' | 'SME' | 'NGO' | 'Industry' | 'Public Body' | 'Other';
  role: string;
  expertise: string;
}

export interface Objective {
  id: string;
  text: string;
}

export interface WizardState {
  /** Step 1: Project basics */
  acronym: string;
  fullTitle: string;
  abstract: string;

  /** Step 2: Objectives */
  objectives: Objective[];
  currentTrl: string;
  targetTrl: string;
  stateOfArtGap: string;

  /** Step 3: Consortium */
  partners: Partner[];

  /** Step 4: Timeline & budget */
  durationMonths: number;
  totalBudgetEuros: string;
  keyMilestones: string;

  /** Step 5: Scheme selection */
  schemeId: SchemeId;

  /** Metadata */
  createdAt: string;
  updatedAt: string;
  currentStep: number;
}

export const WIZARD_STEPS = [
  { id: 1, label: 'Project basics' },
  { id: 2, label: 'Objectives' },
  { id: 3, label: 'Consortium' },
  { id: 4, label: 'Timeline & budget' },
  { id: 5, label: 'Scheme' },
] as const;

export function emptyWizardState(): WizardState {
  const now = new Date().toISOString();
  return {
    acronym: '',
    fullTitle: '',
    abstract: '',
    objectives: [{ id: crypto.randomUUID(), text: '' }],
    currentTrl: '',
    targetTrl: '',
    stateOfArtGap: '',
    partners: [
      {
        id: crypto.randomUUID(),
        name: '',
        country: '',
        type: 'University',
        role: 'Coordinator',
        expertise: '',
      },
    ],
    durationMonths: 48,
    totalBudgetEuros: '',
    keyMilestones: '',
    schemeId: 'horizon_europe_ria_ia',
    createdAt: now,
    updatedAt: now,
    currentStep: 1,
  };
}
