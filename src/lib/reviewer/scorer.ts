/**
 * scorer.ts — Deterministic criterion scoring and structure analysis.
 *
 * Core scoring formula (fully transparent):
 *
 *   1. Run each signal's check() against the draft.
 *   2. Compute rawCoverage = Σ(signal.weight × signal.confidence) / Σ(signal.weight)
 *      (weighted average; guaranteed ∈ [0, 1] when weights sum to 1)
 *   3. Apply structure adjustment (±0.05 per issue) → adjustedCoverage ∈ [0, 1]
 *   4. Map to score:  score = round(adjustedCoverage × 5 × 2) / 2  (0.5 steps)
 *   5. Clamp to [0, 5].
 *
 * This function is pure: identical inputs always produce identical outputs.
 */

import { SIGNALS, signalsForCriterion } from './signals';
import type {
  CriterionId,
  CriterionAssessment,
  SignalResult,
  StructureCheckResult,
  SchemeDescriptor,
  MissingItem,
  ActionItem,
  ReviewerReport,
} from './types';
import { formatMarkdownReport } from './report';

// ---------------------------------------------------------------------------
// Default scheme descriptor (Horizon Europe RIA/IA values)
// ---------------------------------------------------------------------------

const DEFAULT_SCHEME: SchemeDescriptor = {
  id: 'horizon_europe_ria_ia',
  name: 'Horizon Europe RIA/IA',
  criteria: [
    { id: 'excellence',      title: 'Excellence',      threshold: 3.0, maxScore: 5 },
    { id: 'impact',          title: 'Impact',          threshold: 3.0, maxScore: 5 },
    { id: 'implementation',  title: 'Implementation',  threshold: 3.0, maxScore: 5 },
  ],
};

// ---------------------------------------------------------------------------
// coverageToScore — exported for unit testing
// ---------------------------------------------------------------------------

/**
 * Maps a coverage score in [0, 1] to a criterion score in [0, 5] with 0.5 steps.
 *
 * Formula: score = clamp(round(coverage × 5 × 2) / 2, 0, 5)
 *
 * Breakpoints (approximate):
 *   0.00 → 0.0   0.10 → 0.5   0.20 → 1.0   0.30 → 1.5   0.40 → 2.0
 *   0.50 → 2.5   0.55 → 3.0 ← threshold   0.70 → 3.5   0.80 → 4.0
 *   0.90 → 4.5   1.00 → 5.0
 */
export function coverageToScore(coverage: number): number {
  const raw = coverage * 5;
  const stepped = Math.round(raw * 2) / 2;  // round to nearest 0.5
  return Math.min(5, Math.max(0, stepped));
}

// ---------------------------------------------------------------------------
// Rubric rationale strings (mirrors rubric.json, embedded to avoid I/O)
// ---------------------------------------------------------------------------

const RUBRIC: Record<CriterionId, Record<string, string>> = {
  excellence: {
    '0':   'Not evaluable — key content is missing or completely absent.',
    '0.5': 'Not evaluable — extremely thin content; cannot assess this criterion.',
    '1':   'Poor — major weaknesses in all aspects: vague/absent objectives, superficial methodology, no SotA analysis.',
    '1.5': 'Poor to Fair — most aspects inadequately addressed; significant revision required across the board.',
    '2':   'Fair — broadly addressed but with serious weaknesses: partially-defined objectives, methodology lacks rigour, SotA superficial.',
    '2.5': 'Fair to Good — some aspects adequately addressed but 1–2 subsections still have serious gaps.',
    '3':   'Good — clearly addresses the criterion with only minor shortcomings; passes the threshold.',
    '3.5': 'Good to Very Good — well-addressed with only isolated gaps that would be easy to fix.',
    '4':   'Very Good — well-conceived, rigorous methodology, specific objectives, thorough SotA; minor shortcomings only.',
    '4.5': 'Very Good to Excellent — near-exemplary; any shortcomings are trivial.',
    '5':   'Excellent — fully convincing in all aspects; outstanding objectives, methodology, and SotA positioning.',
  },
  impact: {
    '0':   'Not evaluable — impact section is absent or completely generic.',
    '0.5': 'Not evaluable — extremely thin content; cannot assess this criterion.',
    '1':   'Poor — no credible impact pathway; generic outcomes; no dissemination plan; no open science commitments.',
    '1.5': 'Poor to Fair — one or two aspects addressed but most are seriously inadequate.',
    '2':   'Fair — some outcomes stated but loosely linked to call; weak dissemination; no KPI table.',
    '2.5': 'Fair to Good — impact case is building but requires more specificity and an open science plan.',
    '3':   'Good — outcomes linked to call, adequate dissemination and exploitation plan; passes the threshold.',
    '3.5': 'Good to Very Good — strong impact case with minor gaps (e.g., missing KPI baselines or full IP plan).',
    '4':   'Very Good — compelling outcomes with quantified KPIs, clear exploitation, detailed open science.',
    '4.5': 'Very Good to Excellent — near-exemplary impact section.',
    '5':   'Excellent — outstanding impact case; tight EU alignment; innovative exploitation; exemplary open science.',
  },
  implementation: {
    '0':   'Not evaluable — work plan and management are absent.',
    '0.5': 'Not evaluable — extremely thin content; cannot assess this criterion.',
    '1':   'Poor — incoherent work plan; management unclear; consortium lacks required capabilities.',
    '1.5': 'Poor to Fair — some structure visible but major gaps across all three sub-criteria.',
    '2':   'Fair — work plan present but unrealistic; no risk register; consortium roles unclear.',
    '2.5': 'Fair to Good — improving but still missing key elements (risk table, milestone detail, or budget justification).',
    '3':   'Good — coherent WP structure, milestones/deliverables present, adequate management; passes the threshold.',
    '3.5': 'Good to Very Good — well-structured proposal with only isolated gaps.',
    '4':   'Very Good — detailed WPs, verifiable milestones, solid management, complementary consortium, justified budget.',
    '4.5': 'Very Good to Excellent — near-exemplary implementation section.',
    '5':   'Excellent — optimal work plan, exemplary management, ideal consortium, fully justified lean budget.',
  },
};

// ---------------------------------------------------------------------------
// Structure checks
// ---------------------------------------------------------------------------

const STRUCTURE_CHECK_DEFS = [
  {
    id: 'has_excellence_heading',
    label: 'Section 1 (Excellence) heading present',
    pattern: /^#+\s*(?:1[.\s]\s*|Section\s+1\s*[.:]?\s*)?Excellence\b/im,
    criterion: 'excellence' as CriterionId,
    penalty: -0.05,
  },
  {
    id: 'has_impact_heading',
    label: 'Section 2 (Impact) heading present',
    pattern: /^#+\s*(?:2[.\s]\s*|Section\s+2\s*[.:]?\s*)?Impact\b/im,
    criterion: 'impact' as CriterionId,
    penalty: -0.05,
  },
  {
    id: 'has_implementation_heading',
    label: 'Section 3 (Implementation) heading present',
    pattern: /^#+\s*(?:3[.\s]\s*|Section\s+3\s*[.:]?\s*)?Implementation\b/im,
    criterion: 'implementation' as CriterionId,
    penalty: -0.05,
  },
  {
    id: 'section_order_correct',
    label: 'Sections in correct order (Excellence → Impact → Implementation)',
    pattern: null, // computed separately
    criterion: null,
    penalty: -0.03,
  },
  {
    id: 'minimum_word_count',
    label: 'Draft meets minimum word count (≥500 words)',
    pattern: null,
    criterion: null,
    penalty: -0.10,
  },
];

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter((w) => w.length > 0).length;
}

function countSections(text: string): number {
  return (text.match(/^#+\s+.+/gm) || []).length;
}

export function runStructureChecks(draft: string): {
  checks: StructureCheckResult[];
  penaltiesBycriterion: Record<CriterionId, number>;
} {
  const penaltiesBycriterion: Record<CriterionId, number> = {
    excellence: 0,
    impact: 0,
    implementation: 0,
  };

  const checks: StructureCheckResult[] = [];

  // Individual heading checks
  for (const def of STRUCTURE_CHECK_DEFS) {
    if (def.pattern === null) continue; // handled below
    const present = def.pattern.test(draft);
    checks.push({
      id: def.id,
      label: def.label,
      present,
      detail: present
        ? `Heading found.`
        : `Heading not found — section may be missing or mis-titled.`,
    });
    if (!present && def.criterion) {
      penaltiesBycriterion[def.criterion] += def.penalty;
    }
  }

  // Section order check
  const excellencePos     = draft.search(/^#+\s*(?:1[.\s]\s*)?Excellence\b/im);
  const impactPos         = draft.search(/^#+\s*(?:2[.\s]\s*)?Impact\b/im);
  const implementationPos = draft.search(/^#+\s*(?:3[.\s]\s*)?Implementation\b/im);
  const orderCorrect =
    excellencePos !== -1 &&
    impactPos !== -1 &&
    implementationPos !== -1 &&
    excellencePos < impactPos &&
    impactPos < implementationPos;
  checks.push({
    id: 'section_order_correct',
    label: 'Sections in correct order (Excellence → Impact → Implementation)',
    present: orderCorrect,
    detail: orderCorrect
      ? 'Sections appear in the expected order.'
      : 'Sections are missing or appear out of order — reviewers may be disoriented.',
  });
  if (!orderCorrect) {
    // Penalty spread across all three criteria
    penaltiesBycriterion.excellence    += -0.02;
    penaltiesBycriterion.impact        += -0.02;
    penaltiesBycriterion.implementation += -0.02;
  }

  // Word count check
  const wc = countWords(draft);
  const meetsWordCount = wc >= 500;
  checks.push({
    id: 'minimum_word_count',
    label: `Draft meets minimum word count (${wc} words, minimum 500)`,
    present: meetsWordCount,
    detail: meetsWordCount
      ? `Draft has ${wc} words — adequate length for analysis.`
      : `Draft has only ${wc} words — too thin for meaningful scoring. Most sections appear empty.`,
  });
  if (!meetsWordCount) {
    penaltiesBycriterion.excellence    += -0.10;
    penaltiesBycriterion.impact        += -0.10;
    penaltiesBycriterion.implementation += -0.10;
  }

  return { checks, penaltiesBycriterion };
}

// ---------------------------------------------------------------------------
// Core criterion scoring
// ---------------------------------------------------------------------------

/**
 * Run all signals for `criterionId` against `draft` and compute the criterion score.
 * Returns a fully populated CriterionAssessment with transparent derivation.
 */
export function computeCriterionScore(
  criterionId: CriterionId,
  draft: string,
  scheme: SchemeDescriptor = DEFAULT_SCHEME,
  structurePenalty = 0,
): CriterionAssessment {
  const schemeCriterion = scheme.criteria.find((c) => c.id === criterionId);
  if (!schemeCriterion) {
    throw new Error(`Criterion "${criterionId}" not found in scheme "${scheme.id}"`);
  }

  // 1. Run all signals
  const signals = signalsForCriterion(criterionId);
  const results: SignalResult[] = signals.map((sig) => {
    const raw = sig.check(draft);
    return {
      ...raw,
      signalId: sig.id,
      label: sig.label,
      description: sig.description,
      criterion: sig.criterion,
      weight: sig.weight,
      requiredForThreshold: sig.requiredForThreshold,
      sectionHint: sig.sectionHint,
      howToFix: sig.howToFix,
      timeEstimateMinutes: sig.timeEstimateMinutes,
    };
  });

  // 2. Compute weighted coverage (rawCoverage)
  const totalWeight  = signals.reduce((sum, s) => sum + s.weight, 0);
  const weightedSum  = signals.reduce((sum, s, i) => sum + s.weight * results[i].confidence, 0);
  const rawCoverage  = totalWeight > 0 ? weightedSum / totalWeight : 0;

  // 3. Apply structure adjustment
  const structureAdjustment  = structurePenalty;
  const adjustedCoverage     = Math.min(1, Math.max(0, rawCoverage + structureAdjustment));

  // 4. Map to score
  const score = coverageToScore(adjustedCoverage);
  const passed = score >= schemeCriterion.threshold;

  // 5. Build transparent derivation string
  const signalLines = results.map(
    (r) => `  ${r.label.padEnd(36)} w=${r.weight.toFixed(2)}  conf=${r.confidence.toFixed(3)}  → ${(r.weight * r.confidence).toFixed(4)}`
  );
  const derivation = [
    `rawCoverage = Σ(weight × confidence) / Σ(weight)`,
    ...signalLines,
    `  ${'─'.repeat(70)}`,
    `  Σ(weight × confidence) = ${weightedSum.toFixed(4)}   Σ(weight) = ${totalWeight.toFixed(2)}`,
    `  rawCoverage             = ${rawCoverage.toFixed(4)}`,
    `  structureAdjustment     = ${structureAdjustment >= 0 ? '+' : ''}${structureAdjustment.toFixed(4)}`,
    `  adjustedCoverage        = ${adjustedCoverage.toFixed(4)}`,
    `  score = round(${adjustedCoverage.toFixed(4)} × 5 × 2) / 2 = round(${(adjustedCoverage * 10).toFixed(3)}) / 2 = ${score}`,
  ].join('\n');

  // 6. Build strengths and weaknesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  for (const r of results) {
    if (r.confidence >= 0.65) {
      strengths.push(`**${r.label}** — ${r.detail}`);
    } else if (r.requiredForThreshold || r.confidence < 0.4) {
      weaknesses.push(`**${r.label}** — ${r.detail}`);
    }
  }

  const scoreKey = String(score);
  const rationale = RUBRIC[criterionId][scoreKey] ?? `Score ${score}/5 on ${schemeCriterion.title}.`;

  return {
    criterionId,
    criterionTitle: schemeCriterion.title,
    score,
    threshold: schemeCriterion.threshold,
    maxScore: schemeCriterion.maxScore,
    passed,
    rawCoverage,
    adjustedCoverage,
    structureAdjustment,
    derivation,
    rationale,
    signals: results,
    strengths,
    weaknesses,
  };
}

// ---------------------------------------------------------------------------
// Missing items + action plan builders
// ---------------------------------------------------------------------------

function buildMissingItems(criteria: CriterionAssessment[]): MissingItem[] {
  const items: MissingItem[] = [];

  for (const criterion of criteria) {
    for (const signal of criterion.signals) {
      if (signal.confidence < 0.40) {
        // Estimate score impact: Δcoverage if this signal reaches 0.75 confidence
        const coverageDelta = signal.weight * (0.75 - signal.confidence);
        const scoreDelta = coverageToScore(criterion.adjustedCoverage + coverageDelta) - criterion.score;
        const impactStr =
          scoreDelta > 0.4
            ? `+${scoreDelta.toFixed(1)} to +${(scoreDelta + 0.5).toFixed(1)} on ${criterion.criterionTitle}`
            : `+0.5 on ${criterion.criterionTitle}`;

        items.push({
          id: signal.signalId,
          label: signal.label,
          criterion: criterion.criterionId,
          severity: signal.requiredForThreshold ? 'required' : 'recommended',
          signalWeight: signal.weight,
          howToFix: signal.howToFix,
          timeEstimateMinutes: signal.timeEstimateMinutes,
          estimatedScoreImpact: impactStr,
        });
      }
    }
  }

  // Sort: required first, then by signal weight desc (= most impact on score)
  return items.sort((a, b) => {
    if (a.severity !== b.severity) return a.severity === 'required' ? -1 : 1;
    return b.signalWeight - a.signalWeight;
  });
}

function buildActionItems(
  criteria: CriterionAssessment[],
  missingItems: MissingItem[],
): ActionItem[] {
  // Build from missing items, prioritised by score-impact-per-minute
  const scored = missingItems.map((item) => {
    const criterion = criteria.find((c) => c.criterionId === item.criterion)!;
    const coverageDelta = item.signalWeight * (0.75 - (criterion.signals.find((s) => s.signalId === item.id)?.confidence ?? 0));
    const scoreDelta = Math.max(
      0,
      coverageToScore(criterion.adjustedCoverage + coverageDelta) - criterion.score,
    );
    const roi = item.timeEstimateMinutes > 0 ? scoreDelta / item.timeEstimateMinutes : 0;
    const urgency: 'high' | 'medium' | 'low' =
      item.severity === 'required' && !criterion.passed
        ? 'high'
        : item.severity === 'required'
        ? 'medium'
        : 'low';
    return { item, scoreDelta, roi, urgency };
  });

  scored.sort((a, b) => {
    // High urgency first, then ROI
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
      return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
    }
    return b.roi - a.roi;
  });

  return scored.slice(0, 8).map(({ item, scoreDelta, urgency }, idx) => ({
    priority: idx + 1,
    criterion: item.criterion,
    sectionHint: SIGNALS.find((s) => s.id === item.id)?.sectionHint ?? '',
    action: item.howToFix,
    timeEstimateMinutes: item.timeEstimateMinutes,
    scoreImpact:
      scoreDelta > 0
        ? `${item.criterion.charAt(0).toUpperCase() + item.criterion.slice(1)}: +${scoreDelta.toFixed(1)}`
        : `Improves ${item.criterion} coverage`,
    urgency,
  }));
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

/**
 * Generate a complete, fully transparent ReviewerReport from a draft markdown string.
 *
 * @param draft    - The draft proposal text (markdown)
 * @param scheme   - Optional scheme descriptor (defaults to HE RIA/IA values)
 * @returns        - ReviewerReport with all scores, signals, missing items, and rendered markdown
 */
export function generateReviewerReport(
  draft: string,
  scheme: SchemeDescriptor = DEFAULT_SCHEME,
): ReviewerReport {
  const generatedAt = new Date().toISOString();

  // Structure checks + per-criterion penalties
  const { checks: structureChecks, penaltiesBycriterion } = runStructureChecks(draft);

  // Score each criterion
  const criteria: CriterionAssessment[] = (
    ['excellence', 'impact', 'implementation'] as CriterionId[]
  ).map((id) =>
    computeCriterionScore(id, draft, scheme, penaltiesBycriterion[id]),
  );

  const overallScore     = parseFloat(criteria.reduce((s, c) => s + c.score, 0).toFixed(1));
  const maxPossibleScore = criteria.reduce((s, c) => s + c.maxScore, 0);
  const overallPassed    = criteria.every((c) => c.passed) && overallScore >= 10.0;

  const allStrengths  = criteria.flatMap((c) => c.strengths.map((s) => `[${c.criterionTitle}] ${s}`));
  const allWeaknesses = criteria.flatMap((c) => c.weaknesses.map((w) => `[${c.criterionTitle}] ${w}`));

  const missingItems = buildMissingItems(criteria);
  const actionItems  = buildActionItems(criteria, missingItems);

  const report: Omit<ReviewerReport, 'markdownReport'> = {
    generatedAt,
    schemeId: scheme.id,
    draftWordCount: countWords(draft),
    draftSectionCount: countSections(draft),
    structureChecks,
    criteria,
    overallScore,
    maxPossibleScore,
    overallPassed,
    allStrengths,
    allWeaknesses,
    missingItems,
    actionItems,
  };

  const markdownReport = formatMarkdownReport(report as ReviewerReport);

  return { ...report, markdownReport };
}
