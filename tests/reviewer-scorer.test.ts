/**
 * reviewer-scorer.test.ts
 *
 * Unit tests for:
 *   - coverageToScore() — the core coverage→score mapping function
 *   - runStructureChecks() — heading and word-count checks
 *   - computeCriterionScore() — full criterion scoring with signals
 *   - generateReviewerReport() — end-to-end report generation
 */

import {
  coverageToScore,
  computeCriterionScore,
  generateReviewerReport,
  runStructureChecks,
} from '@/lib/reviewer/scorer';
import type { SchemeDescriptor } from '@/lib/reviewer/types';

// ---------------------------------------------------------------------------
// Minimal scheme fixture — avoids loading scheme pack JSON from filesystem
// ---------------------------------------------------------------------------

const TEST_SCHEME: SchemeDescriptor = {
  id: 'test_scheme',
  name: 'Test Scheme',
  criteria: [
    { id: 'excellence',     title: 'Excellence',     threshold: 3.0, maxScore: 5 },
    { id: 'impact',         title: 'Impact',         threshold: 3.0, maxScore: 5 },
    { id: 'implementation', title: 'Implementation', threshold: 3.0, maxScore: 5 },
  ],
};

// ---------------------------------------------------------------------------
// Shared draft fixtures
// ---------------------------------------------------------------------------

const EMPTY_DRAFT = '';

const THIN_DRAFT = 'This project will develop something useful for European farmers.';

/** Draft with good Excellence content but almost nothing for Impact/Implementation. */
const EXCELLENCE_ONLY_DRAFT = `
## 1. Excellence

### 1.1 Objectives and Ambition
O1: To develop a physics-informed AI model achieving ≥90% accuracy on benchmark Y.
O2: To validate the model at TRL 3 → TRL 6 across 4 agroclimatic zones.
O3: To release the full model as open-source software under MIT licence.
O4: To train ≥200 farmers in AI-assisted decision support.
O5: To contribute to EU Farm to Fork goals with ≥15% water reduction.

Current TRL: 3. Target TRL: 6 by Month 42.
This project advances beyond the current state of the art by [gap description].

### 1.2 Methodology
We employ a hybrid physics-informed neural network approach. We will use Copernicus
Sentinel-2 data combined with in-field IoT sensors. Alternative approaches considered:
(a) pure deep learning — rejected due to data volume requirements;
(b) rule-based expert systems — rejected because they cannot adapt to non-stationary climate.
Validation criteria: RMSE ≤ X; accuracy ≥ 85% on held-out test sets.

### 1.3 Beyond the State of the Art
Current approaches fail to model non-stationary climate. The gap in SME-accessible tooling
is critical. Existing solutions lack real-time adaptation. We advance beyond these limitations.
`;

/** Draft with all three sections well-populated — should score ≥3 on each. */
const FULL_DRAFT = `
## 1. Excellence

O1: To develop an AI engine achieving ≥85% accuracy by Month 24 (TRL 3 → TRL 6).
O2: To validate at ≥6 pilot sites across 4 EU agroclimatic zones.
O3: To demonstrate ≥15% water reduction and ≥10% fertiliser reduction.
O4: To release all code and data as open source / open data.
O5: To establish uptake by ≥3 national advisory services.

Current TRL: 3. Target TRL: 6. This project advances beyond the state of the art.
We considered alternatives: (a) deep learning — rejected; (b) rule-based — rejected.
Validation criteria: ≥85% accuracy. Success criteria defined per objective.
Current limitations in precision agriculture: gap in climate-adaptive tools for SME farms.

## 2. Impact

Expected outcomes — addressing call expected outcomes:
- Expected Outcome 1: AI tools → delivered via our AI engine.
- Expected Outcome 2: Advisory service adoption → 3 AKIS services committed.

| Indicator | Baseline | Target | Timeline |
|-----------|----------|--------|---------|
| Water use | 500 m³/ha | ≤425 | Month 44 |
| Fertiliser | 120 kg N | ≤108 | Month 44 |
| Publications | 0 | ≥15 OA | Month 48 |

Beneficiaries: small and medium farmers (end-users), AKIS advisory services, EU policymakers.
Exploitation: SFT will commercialise the platform. IP strategy: MIT licence for core engine;
trade secret for SFT IoT module. Market entry via subscription model.
Open access: all publications immediately open access (CC BY 4.0) in Zenodo.
FAIR data principles applied. Data Management Plan (DMP / D1.1) by Month 6.
Target journals: Nature Food, Computers in Agriculture. Conferences: ECPA, EFITA.

## 3. Implementation

| WP | Title | Lead | Start | End | PM |
|----|-------|------|-------|-----|----|
| WP1 | Management | WUR | M1 | M48 | 24 |
| WP2 | Data and AI | WUR | M1 | M30 | 84 |
| WP3 | Co-Design | EFFA | M1 | M24 | 36 |
| WP4 | Pilots | CNR | M18 | M46 | 96 |
| WP5 | Dissemination | SFT | M1 | M48 | 24 |

Milestones: MS1 (M3) CA signed; MS2 (M6) D1.1 DMP; MS3 (M24) AI go/no-go; MS4 (M44) KPIs.
Deliverables: D1.1: DMP (Month 6); D2.1: AI report (Month 24); D4.1: Pilot report (Month 46).
Timeline: WP1 M1─M48; WP2 M1─M30; Critical path: T2.4 → MS3 → T4.2.
Gantt chart available. M1-M24 development; M18-M46 pilots.

Management: Project Coordinator (WUR); Steering Committee (quarterly); WP Leaders.
Decision-making by SC majority vote. Conflict resolution within 30 days.
Risk register: | R1 | Technical | M | H | Alternative model | WUR | likelihood mitigation.

| Partner | Country | Type | Key expertise |
|---------|---------|------|---------------|
| WUR | NL | University | AI, agronomy |
| SFT | DE | SME | IoT, commercialisation |

Complementarity: each partner non-duplicated. Consortium assembled from prior H2020.
Budget: person-months justified per WP. €3.8M total. Budget breakdown below.
| Budget | Personnel | Equipment | Total |
| WUR | 720,000 | 30,000 | 1,006,250 |
`;

// ---------------------------------------------------------------------------
// coverageToScore() tests
// ---------------------------------------------------------------------------

describe('coverageToScore()', () => {
  it('maps 0.0 → 0.0', () => {
    expect(coverageToScore(0.0)).toBe(0.0);
  });

  it('maps 1.0 → 5.0', () => {
    expect(coverageToScore(1.0)).toBe(5.0);
  });

  it('maps 0.80 → 4.0', () => {
    expect(coverageToScore(0.80)).toBe(4.0);
  });

  it('maps 0.60 → 3.0 (passes threshold)', () => {
    expect(coverageToScore(0.60)).toBe(3.0);
  });

  it('maps 0.55 → 3.0 (rounds up to threshold)', () => {
    expect(coverageToScore(0.55)).toBe(3.0);
  });

  it('maps 0.49 → 2.5 (below threshold)', () => {
    expect(coverageToScore(0.49)).toBe(2.5);
  });

  it('maps 0.40 → 2.0', () => {
    expect(coverageToScore(0.40)).toBe(2.0);
  });

  it('maps 0.20 → 1.0', () => {
    expect(coverageToScore(0.20)).toBe(1.0);
  });

  it('maps 0.10 → 0.5', () => {
    expect(coverageToScore(0.10)).toBe(0.5);
  });

  it('always returns a value in steps of 0.5', () => {
    for (let i = 0; i <= 100; i++) {
      const coverage = i / 100;
      const score = coverageToScore(coverage);
      expect(score % 0.5).toBeCloseTo(0, 10);
    }
  });

  it('always returns a value in [0, 5]', () => {
    for (let i = 0; i <= 100; i++) {
      const score = coverageToScore(i / 100);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(5);
    }
  });

  it('is monotonically non-decreasing', () => {
    let prev = 0;
    for (let i = 1; i <= 100; i++) {
      const score = coverageToScore(i / 100);
      expect(score).toBeGreaterThanOrEqual(prev);
      prev = score;
    }
  });

  it('is deterministic: same input → same output', () => {
    expect(coverageToScore(0.72)).toBe(coverageToScore(0.72));
    expect(coverageToScore(0.33)).toBe(coverageToScore(0.33));
  });

  it('clamps values below 0 to 0', () => {
    expect(coverageToScore(-0.5)).toBe(0);
  });

  it('clamps values above 1 to 5', () => {
    expect(coverageToScore(1.5)).toBe(5);
  });
});

// ---------------------------------------------------------------------------
// runStructureChecks() tests
// ---------------------------------------------------------------------------

describe('runStructureChecks()', () => {
  it('detects all three section headings in a well-structured draft', () => {
    const { checks } = runStructureChecks(FULL_DRAFT);
    const excellenceCheck = checks.find((c) => c.id === 'has_excellence_heading');
    const impactCheck     = checks.find((c) => c.id === 'has_impact_heading');
    const implCheck       = checks.find((c) => c.id === 'has_implementation_heading');
    expect(excellenceCheck?.present).toBe(true);
    expect(impactCheck?.present).toBe(true);
    expect(implCheck?.present).toBe(true);
  });

  it('reports missing headings for THIN_DRAFT', () => {
    const { checks } = runStructureChecks(THIN_DRAFT);
    const excellenceCheck = checks.find((c) => c.id === 'has_excellence_heading');
    expect(excellenceCheck?.present).toBe(false);
  });

  it('reports correct section order for FULL_DRAFT', () => {
    const { checks } = runStructureChecks(FULL_DRAFT);
    const orderCheck = checks.find((c) => c.id === 'section_order_correct');
    expect(orderCheck?.present).toBe(true);
  });

  it('reports word count failure for THIN_DRAFT', () => {
    const { checks } = runStructureChecks(THIN_DRAFT);
    const wcCheck = checks.find((c) => c.id === 'minimum_word_count');
    expect(wcCheck?.present).toBe(false);
  });

  it('applies penalties for missing headings', () => {
    const { penaltiesBycriterion } = runStructureChecks(THIN_DRAFT);
    // Thin draft has no headings → penalties should be negative
    expect(penaltiesBycriterion.excellence).toBeLessThan(0);
    expect(penaltiesBycriterion.impact).toBeLessThan(0);
    expect(penaltiesBycriterion.implementation).toBeLessThan(0);
  });

  it('applies no penalties when all headings and word count are met', () => {
    const { penaltiesBycriterion } = runStructureChecks(FULL_DRAFT);
    // FULL_DRAFT has all headings and ample words — penalties should be 0 or minimal
    expect(penaltiesBycriterion.excellence).toBeGreaterThanOrEqual(-0.03);
    expect(penaltiesBycriterion.impact).toBeGreaterThanOrEqual(-0.03);
    expect(penaltiesBycriterion.implementation).toBeGreaterThanOrEqual(-0.03);
  });
});

// ---------------------------------------------------------------------------
// computeCriterionScore() tests
// ---------------------------------------------------------------------------

describe('computeCriterionScore()', () => {
  it('returns score 0 for an empty draft', () => {
    const result = computeCriterionScore('excellence', EMPTY_DRAFT, TEST_SCHEME);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('returns score 0 for a thin draft with no criterion content', () => {
    const result = computeCriterionScore('excellence', THIN_DRAFT, TEST_SCHEME);
    expect(result.score).toBe(0);
    expect(result.passed).toBe(false);
  });

  it('returns score ≥ 3.0 for a well-populated excellence draft', () => {
    const result = computeCriterionScore('excellence', EXCELLENCE_ONLY_DRAFT, TEST_SCHEME);
    expect(result.score).toBeGreaterThanOrEqual(3.0);
    expect(result.passed).toBe(true);
  });

  it('returns score ≥ 3.0 for excellence on FULL_DRAFT', () => {
    const result = computeCriterionScore('excellence', FULL_DRAFT, TEST_SCHEME);
    expect(result.score).toBeGreaterThanOrEqual(3.0);
  });

  it('returns score ≥ 3.0 for impact on FULL_DRAFT', () => {
    const result = computeCriterionScore('impact', FULL_DRAFT, TEST_SCHEME);
    expect(result.score).toBeGreaterThanOrEqual(3.0);
  });

  it('returns score ≥ 3.0 for implementation on FULL_DRAFT', () => {
    const result = computeCriterionScore('implementation', FULL_DRAFT, TEST_SCHEME);
    expect(result.score).toBeGreaterThanOrEqual(3.0);
  });

  it('populates derivation string with formula and numbers', () => {
    const result = computeCriterionScore('excellence', EXCELLENCE_ONLY_DRAFT, TEST_SCHEME);
    expect(result.derivation).toContain('rawCoverage');
    expect(result.derivation).toContain('adjustedCoverage');
    expect(result.derivation).toContain('score =');
  });

  it('signals array has the correct length (7 for excellence)', () => {
    const result = computeCriterionScore('excellence', EMPTY_DRAFT, TEST_SCHEME);
    expect(result.signals.length).toBe(7);
  });

  it('signals array has the correct length (7 for impact)', () => {
    const result = computeCriterionScore('impact', EMPTY_DRAFT, TEST_SCHEME);
    expect(result.signals.length).toBe(7);
  });

  it('signals array has the correct length (8 for implementation)', () => {
    const result = computeCriterionScore('implementation', EMPTY_DRAFT, TEST_SCHEME);
    expect(result.signals.length).toBe(8);
  });

  it('rawCoverage ∈ [0, 1]', () => {
    for (const criterionId of ['excellence', 'impact', 'implementation'] as const) {
      const result = computeCriterionScore(criterionId, FULL_DRAFT, TEST_SCHEME);
      expect(result.rawCoverage).toBeGreaterThanOrEqual(0);
      expect(result.rawCoverage).toBeLessThanOrEqual(1);
    }
  });

  it('adjustedCoverage ∈ [0, 1]', () => {
    for (const criterionId of ['excellence', 'impact', 'implementation'] as const) {
      const result = computeCriterionScore(criterionId, FULL_DRAFT, TEST_SCHEME);
      expect(result.adjustedCoverage).toBeGreaterThanOrEqual(0);
      expect(result.adjustedCoverage).toBeLessThanOrEqual(1);
    }
  });

  it('is fully deterministic: same draft → same score', () => {
    const r1 = computeCriterionScore('excellence', EXCELLENCE_ONLY_DRAFT, TEST_SCHEME);
    const r2 = computeCriterionScore('excellence', EXCELLENCE_ONLY_DRAFT, TEST_SCHEME);
    expect(r1.score).toBe(r2.score);
    expect(r1.rawCoverage).toBe(r2.rawCoverage);
    expect(r1.derivation).toBe(r2.derivation);
  });

  it('throws for unknown criterion ID', () => {
    expect(() =>
      computeCriterionScore('nonexistent' as any, FULL_DRAFT, TEST_SCHEME),
    ).toThrow();
  });

  it('score is in [0, 5] with 0.5 steps', () => {
    for (const criterionId of ['excellence', 'impact', 'implementation'] as const) {
      for (const draft of [EMPTY_DRAFT, THIN_DRAFT, EXCELLENCE_ONLY_DRAFT, FULL_DRAFT]) {
        const result = computeCriterionScore(criterionId, draft, TEST_SCHEME);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(5);
        expect(result.score % 0.5).toBeCloseTo(0, 10);
      }
    }
  });

  it('EXCELLENCE_ONLY_DRAFT scores lower on impact than on excellence', () => {
    const excellenceScore = computeCriterionScore('excellence', EXCELLENCE_ONLY_DRAFT, TEST_SCHEME).score;
    const impactScore     = computeCriterionScore('impact',     EXCELLENCE_ONLY_DRAFT, TEST_SCHEME).score;
    expect(excellenceScore).toBeGreaterThan(impactScore);
  });
});

// ---------------------------------------------------------------------------
// generateReviewerReport() tests
// ---------------------------------------------------------------------------

describe('generateReviewerReport()', () => {
  it('returns a report with all expected top-level fields', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(report.generatedAt).toBeTruthy();
    expect(report.schemeId).toBe('test_scheme');
    expect(report.draftWordCount).toBeGreaterThan(0);
    expect(Array.isArray(report.criteria)).toBe(true);
    expect(Array.isArray(report.structureChecks)).toBe(true);
    expect(Array.isArray(report.missingItems)).toBe(true);
    expect(Array.isArray(report.actionItems)).toBe(true);
    expect(typeof report.markdownReport).toBe('string');
  });

  it('produces 3 criterion assessments', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(report.criteria.length).toBe(3);
    expect(report.criteria.map((c) => c.criterionId)).toEqual([
      'excellence', 'impact', 'implementation',
    ]);
  });

  it('overallScore equals sum of criterion scores', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    const expectedTotal = parseFloat(
      report.criteria.reduce((s, c) => s + c.score, 0).toFixed(1),
    );
    expect(report.overallScore).toBe(expectedTotal);
  });

  it('overallPassed is false for empty draft', () => {
    const report = generateReviewerReport(EMPTY_DRAFT, TEST_SCHEME);
    expect(report.overallPassed).toBe(false);
    expect(report.overallScore).toBe(0);
  });

  it('overallPassed is true for FULL_DRAFT (all criteria ≥ 3, total ≥ 10)', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(report.overallPassed).toBe(true);
    expect(report.overallScore).toBeGreaterThanOrEqual(10);
  });

  it('markdownReport contains required section headings', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    const md = report.markdownReport;
    expect(md).toContain('## Score Summary');
    expect(md).toContain('## Criterion Assessments');
    expect(md).toContain('## Missing Items Checklist');
    expect(md).toContain('## Next 30 Minutes');
    expect(md).toContain('## Transparency Note');
    expect(md).toContain('## Structure Checks');
  });

  it('markdownReport contains the score summary table', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(report.markdownReport).toContain('Excellence');
    expect(report.markdownReport).toContain('Impact');
    expect(report.markdownReport).toContain('Implementation');
  });

  it('markdownReport contains the derivation formula in Transparency Note', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(report.markdownReport).toContain('rawCoverage');
    expect(report.markdownReport).toContain('adjustedCoverage');
    expect(report.markdownReport).toContain('coverageToScore');
  });

  it('actionItems are sorted by priority (1 = most urgent)', () => {
    const report = generateReviewerReport(THIN_DRAFT, TEST_SCHEME);
    const priorities = report.actionItems.map((a) => a.priority);
    for (let i = 0; i < priorities.length - 1; i++) {
      expect(priorities[i]).toBeLessThan(priorities[i + 1]);
    }
  });

  it('missingItems are sorted: required before recommended', () => {
    const report = generateReviewerReport(THIN_DRAFT, TEST_SCHEME);
    let seenRecommended = false;
    for (const item of report.missingItems) {
      if (item.severity === 'recommended') seenRecommended = true;
      if (seenRecommended) {
        expect(item.severity).toBe('recommended');
      }
    }
  });

  it('draftWordCount is accurate', () => {
    const words = FULL_DRAFT.trim().split(/\s+/).filter((w) => w.length > 0).length;
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(report.draftWordCount).toBe(words);
  });

  it('is fully deterministic: same draft → same report', () => {
    const r1 = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    const r2 = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(r1.overallScore).toBe(r2.overallScore);
    expect(r1.overallPassed).toBe(r2.overallPassed);
    // Strip all timestamp occurrences before comparing — they tick between calls
    const stripTimestamp = (s: string) => s.replace(/\*\*Generated:\*\*[^\n]*/g, '**Generated:**');
    expect(stripTimestamp(r1.markdownReport)).toBe(stripTimestamp(r2.markdownReport));
    expect(r1.missingItems.map((m) => m.id)).toEqual(r2.missingItems.map((m) => m.id));
  });

  it('report for thin draft has more missing items than report for full draft', () => {
    const thinReport = generateReviewerReport(THIN_DRAFT, TEST_SCHEME);
    const fullReport = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    expect(thinReport.missingItems.length).toBeGreaterThan(fullReport.missingItems.length);
  });

  it('all criteria have a non-empty rationale', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    for (const c of report.criteria) {
      expect(c.rationale.length).toBeGreaterThan(5);
    }
  });

  it('all signals have evidence populated on FULL_DRAFT where fired', () => {
    const report = generateReviewerReport(FULL_DRAFT, TEST_SCHEME);
    for (const criterion of report.criteria) {
      for (const signal of criterion.signals) {
        if (signal.found) {
          expect(signal.evidence.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
