/**
 * types.ts — All TypeScript interfaces for the GrantCraft Reviewer Report engine.
 *
 * Design principle: every struct is self-describing so that a rendered report
 * can be reproduced from the data alone — no hidden state.
 */

export type CriterionId = 'excellence' | 'impact' | 'implementation';
export type Severity     = 'required' | 'recommended';
export type Urgency      = 'high' | 'medium' | 'low';

// ---------------------------------------------------------------------------
// Signals — the atomic unit of coverage analysis
// ---------------------------------------------------------------------------

/**
 * A Signal is a named, weighted predicate applied to the draft markdown.
 * Every signal is deterministic: same text → same result.
 */
export interface Signal {
  /** Unique snake_case identifier, used as a stable key in tests. */
  id: string;
  /** Short human-readable name shown in the report table. */
  label: string;
  /** One-sentence description of what is being checked. */
  description: string;
  /** Which evaluation criterion this signal contributes to. */
  criterion: CriterionId;
  /**
   * Contribution weight within the criterion (all weights for a criterion
   * must sum to 1.0).  Higher weight = larger impact on the criterion score.
   */
  weight: number;
  /** True iff a failing signal (confidence = 0) alone would drop score below threshold. */
  requiredForThreshold: boolean;
  /** Which proposal section this signal maps to, e.g. "§1.1". */
  sectionHint: string;
  /** One-line instruction for how to satisfy this signal. Used in Missing Items. */
  howToFix: string;
  /** Rough editing time in minutes to add the missing content. */
  timeEstimateMinutes: number;
  /** Pure check function — no side-effects, no randomness. */
  check: (draft: string) => RawCheckResult;
}

/** Raw output from a Signal.check() call. */
export interface RawCheckResult {
  /** True iff confidence > 0 (at least one match). */
  found: boolean;
  /**
   * Coverage confidence in [0.0, 1.0].
   * 0.0 = completely absent, 1.0 = fully and convincingly present.
   * Computed deterministically from pattern match counts.
   */
  confidence: number;
  /** Up to 3 verbatim text snippets (≤120 chars each) that triggered this signal. */
  evidence: string[];
  /** Human-readable explanation: what was found and/or what is missing. */
  detail: string;
}

/** Signal definition merged with its check() result — used in reports. */
export interface SignalResult extends RawCheckResult {
  signalId: string;
  label: string;
  description: string;
  criterion: CriterionId;
  weight: number;
  requiredForThreshold: boolean;
  sectionHint: string;
  howToFix: string;
  timeEstimateMinutes: number;
}

// ---------------------------------------------------------------------------
// Structure checks — heading presence and section ordering
// ---------------------------------------------------------------------------

export interface StructureCheckResult {
  id: string;
  label: string;
  present: boolean;
  detail: string;
}

// ---------------------------------------------------------------------------
// Criterion assessment
// ---------------------------------------------------------------------------

export interface CriterionAssessment {
  criterionId: CriterionId;
  criterionTitle: string;
  /** 0–5 in steps of 0.5, per HE scoring convention. */
  score: number;
  threshold: number;
  maxScore: number;
  passed: boolean;
  /**
   * Weighted average of all signal confidences before any adjustment.
   * rawCoverage = Σ(signal.weight × signal.confidence) / Σ(signal.weight)
   */
  rawCoverage: number;
  /**
   * rawCoverage after applying structure adjustments (heading penalties, etc.).
   * adjustedCoverage → score via coverageToScore().
   */
  adjustedCoverage: number;
  /** Signed value added to rawCoverage. Negative = penalty, positive = bonus. */
  structureAdjustment: number;
  /**
   * Transparent derivation string — shows the exact formula and values used
   * so the user (and reviewers of this tool) can reproduce the score manually.
   */
  derivation: string;
  /** Rubric-aligned rationale for the assigned score. */
  rationale: string;
  signals: SignalResult[];
  strengths: string[];
  weaknesses: string[];
}

// ---------------------------------------------------------------------------
// Missing items and action plan
// ---------------------------------------------------------------------------

export interface MissingItem {
  id: string;
  label: string;
  criterion: CriterionId;
  severity: Severity;
  /** Weight of the corresponding signal — used to rank missing items by score impact. */
  signalWeight: number;
  howToFix: string;
  timeEstimateMinutes: number;
  /**
   * String representation of the estimated score delta if this item is added,
   * e.g. "+0.5 to +1.0".  Computed from signal weight and coverage gap.
   */
  estimatedScoreImpact: string;
}

export interface ActionItem {
  /** 1 = most urgent. */
  priority: number;
  criterion: CriterionId;
  sectionHint: string;
  action: string;
  timeEstimateMinutes: number;
  /** Human-readable score impact, e.g. "Impact: +0.5 to +1.0". */
  scoreImpact: string;
  urgency: Urgency;
}

// ---------------------------------------------------------------------------
// Full report
// ---------------------------------------------------------------------------

export interface ReviewerReport {
  generatedAt: string;
  /** Scheme pack ID this report was generated against. */
  schemeId: string;
  draftWordCount: number;
  draftSectionCount: number;
  structureChecks: StructureCheckResult[];
  criteria: CriterionAssessment[];
  overallScore: number;
  maxPossibleScore: number;
  overallPassed: boolean;
  /** All strength bullets aggregated across criteria. */
  allStrengths: string[];
  /** All weakness bullets aggregated across criteria. */
  allWeaknesses: string[];
  missingItems: MissingItem[];
  actionItems: ActionItem[];
  /** The full rendered Markdown string — ready to display or export. */
  markdownReport: string;
}

// ---------------------------------------------------------------------------
// Minimal scheme descriptor — only the fields the scorer needs
// ---------------------------------------------------------------------------

export interface SchemeDescriptor {
  id: string;
  name: string;
  criteria: {
    id: CriterionId;
    title: string;
    threshold: number;
    maxScore: number;
  }[];
}
