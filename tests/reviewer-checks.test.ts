/**
 * reviewer-checks.test.ts
 *
 * Unit tests for the 22 coverage signals defined in signals.ts.
 *
 * Testing philosophy:
 *   - Each test exercises one signal with a MINIMAL input that either clearly
 *     satisfies or clearly doesn't satisfy the signal's pattern.
 *   - Tests verify confidence thresholds, not exact values, because the saturation
 *     function (sat) is continuous — specific values may change as patterns evolve.
 *   - Tests verify that evidence arrays are non-empty when signals fire.
 *   - Tests verify determinism: calling check() twice gives identical results.
 */

import { SIGNALS, signalById, sat } from '@/lib/reviewer/signals';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function check(signalId: string, text: string) {
  return signalById(signalId).check(text);
}

// A reasonably full draft for integration-style tests
const FULL_DRAFT = `
# AGRI-ADAPT: Adaptive AI Precision Agriculture

## 1. Excellence

### 1.1 Objectives and Ambition

AGRI-ADAPT has the following objectives:

O1: To develop and validate a physics-informed AI engine achieving ≥85% accuracy on benchmark X.
O2: To integrate Copernicus Earth Observation data with IoT sensor streams at TRL 3 → TRL 6.
O3: To demonstrate ≥15% water use reduction at six EU pilot sites.
O4: To release a fully open-source platform under MIT licence.
O5: To establish uptake pathways with ≥3 national advisory services.

The current TRL is 3. AGRI-ADAPT targets TRL 6 by Month 42. This project goes beyond the
state of the art by addressing the gap in climate-adaptive decision support for SME farms.

### 1.2 Methodology

Our approach employs a hybrid methodology combining physics-informed neural networks (PINNs)
with Gaussian process regression for uncertainty quantification. We will use Copernicus
Sentinel-2 data and in-field IoT sensors. The approach was selected over two alternatives:
(a) pure deep learning — rejected due to poor transferability; (b) rule-based expert systems
— rejected as unable to adapt to non-stationary climate conditions.

Validation criteria: prediction RMSE ≤ X and accuracy ≥ 85% on held-out test sets.
Success criteria are defined for each objective above.

### 1.3 Beyond the State of the Art

Current approaches have critical limitations: (1) they fail to model non-stationary climate
conditions; (2) they are inaccessible to SME farms. The gap in climate-adaptive AI tooling
is well-documented. AGRI-ADAPT advances beyond these limitations through novel integration.

Preliminary results from our proof-of-concept (WUR internal report, 2023) demonstrate
feasibility at TRL 3 with 78% accuracy on a held-out validation set.

## 2. Impact

### 2.1 Expected Outcomes and Impacts

AGRI-ADAPT directly addresses the call's expected outcomes:
- Expected Outcome 1: AI tools for climate-resilient agriculture → delivered via our AI engine
- Expected Outcome 2: Adoption by advisory services → via WP5 exploitation and stakeholder plan

**Impact KPIs:**

| Indicator | Baseline | Target | Timeline |
|-----------|----------|--------|---------|
| Water use (m³/ha) | 500 | ≤425 | Month 44 |
| Fertiliser input (kg N eq.) | 120 | ≤108 | Month 44 |
| Publications | 0 | ≥15 OA | Month 48 |
| Farmers trained | 0 | ≥200 | Month 44 |
| Advisory services adopting | 0 | ≥3 | Month 48 |

Beneficiaries: small and medium-sized farmers (primary end-users), national agricultural
advisory services (AKIS), EU policymakers (DG AGRI), agri-tech SMEs.

### 2.2 Pathway to Impact

Short-term: open-source software releases (v0.1 Month 18; v1.0 Month 36).
Medium-term: SFT (SME partner) commercialises the platform; ≥3 AKIS adoption.
IP strategy: core AI engine under MIT licence; SFT proprietary IoT integration as trade secret.
Market entry: SFT targets subscription model for 500 farms in Year 5 post-project.

### 2.3 Communication, Dissemination and Exploitation

Target journals: Computers and Electronics in Agriculture, Nature Food, Remote Sensing of Environment.
Conferences: ECPA, EFITA, IEEE IGARSS.
Open access: all peer-reviewed publications will be immediately open access (Gold OA or Green OA via Zenodo).
All data will be deposited in Zenodo under CC BY 4.0 licence following FAIR principles.
A project website will be launched at Month 3.

### 2.4 Open Science Practices

FAIR data: all datasets will be deposited in Zenodo with DOI and CC BY 4.0 licence.
Open access: mandatory for all publications per HE Article 17.
Open source: core platform released under MIT licence on GitHub.
Data Management Plan (DMP / D1.1) will be delivered by Month 6 following the EC template.

## 3. Implementation

### 3.1 Work Plan and Work Packages

| WP | Title | Lead | Start | End | PM |
|----|-------|------|-------|-----|----|
| WP1 | Management | WUR | M1 | M48 | 24 |
| WP2 | Data and AI | WUR | M1 | M30 | 84 |
| WP3 | Co-Design | EFFA | M1 | M24 | 36 |
| WP4 | Pilots | CNR | M18 | M46 | 96 |
| WP5 | Dissemination | SFT | M1 | M48 | 24 |

**Milestones:**
- MS1 (M3): Consortium Agreement signed
- MS2 (M6): D1.1 DMP submitted (mandatory HE deliverable)
- MS3 (M18): EO and IoT pipelines operational
- MS4 (M24): AI engine v0.1 meets accuracy target → go/no-go
- MS5 (M44): Season 2 KPI targets confirmed

**Deliverables:**
- D1.1: Data Management Plan (Month 6)
- D2.1: AI engine technical report (Month 24)
- D4.1: Pilot site validation report (Month 46)

Timeline (Gantt overview):
WP1  M1 ────────────────────────────── M48
WP2  M1 ──────────────────── M30
WP3  M1 ──────── M24
WP4                    M18 ──────────── M46
Critical path: T2.4 → MS4 → T4.2

### 3.2 Management Structure and Procedures

The project will be coordinated by WUR. The governance structure:

- Project Coordinator (PC): WUR — overall coordination
- Steering Committee (SC): one representative per partner, quarterly meetings
- WP Leaders (WPLs): technical management of each work package

Decision-making: SC decides by simple majority; deadlock → PC casting vote.
Conflict resolution: minor disputes resolved at SC level within 30 days.

**Risk register:**

| Risk | Category | Likelihood | Impact | Mitigation | Owner |
|------|----------|-----------|--------|-----------|-------|
| R1 AI accuracy below target | Technical | M | H | Alternative ensemble model | WUR |
| R2 Partner withdrawal | Consortium | L | H | Knowledge documentation from M6 | PC |
| R3 Regulatory delay | External | L | M | Early ethics review; contingency months | WUR |
| R4 Data access issues | Technical | M | M | Mirror EO data locally | CNR |
| R5 Adoption below target | Sociotechnical | M | M | Co-design in WP3; farmer champions | EFFA |

### 3.3 Consortium as a Whole

| Partner | Country | Type | Key expertise |
|---------|---------|------|---------------|
| WUR | NL | University | Agricultural AI, crop modelling |
| CNR-IBE | IT | Research | Earth observation |
| IFAPA | ES | Public | Irrigation, Mediterranean climate |
| LUKE | FI | Research | Boreal agronomy, phenology |
| SFT | DE | SME | IoT platform, commercialisation |
| EFFA | BE | NGO | Farmer networks, co-design |

Complementarity: each partner brings non-duplicated expertise. The consortium
was assembled based on prior H2020 collaboration.

### 3.4 Resources and Costs

| Partner | Personnel | Equipment | Travel | Total |
|---------|-----------|-----------|--------|-------|
| WUR | 720,000 | 30,000 | 40,000 | 1,006,250 |
| CNR-IBE | 360,000 | 50,000 | 30,000 | 562,500 |

Person-months justification: 264 total person-months linked to WP tasks above.
WP2 requires 84 PM: 12 PM for AI engine, 48 PM for integration, 24 PM for validation.
Budget breakdown total: €3.8M. Value for money: TRL 3→6 across 4 agroclimatic zones.
`;

const EMPTY_DRAFT = '';
const MINIMAL_DRAFT = 'This project will develop something useful for European research.';

// ---------------------------------------------------------------------------
// sat() helper tests
// ---------------------------------------------------------------------------

describe('sat() helper', () => {
  it('returns 0 for 0 matches', () => {
    expect(sat(0, 5)).toBe(0);
  });

  it('returns 1.0 when matches equal saturation', () => {
    expect(sat(5, 5)).toBe(1.0);
  });

  it('returns 1.0 when matches exceed saturation', () => {
    expect(sat(10, 5)).toBe(1.0);
  });

  it('returns 0.5 when matches are half of saturation', () => {
    expect(sat(2, 4)).toBe(0.5);
  });

  it('is monotonically increasing', () => {
    for (let n = 0; n < 10; n++) {
      expect(sat(n + 1, 10)).toBeGreaterThan(sat(n, 10));
    }
  });
});

// ---------------------------------------------------------------------------
// Signal: objectives_listed
// ---------------------------------------------------------------------------

describe('Signal: objectives_listed', () => {
  it('returns high confidence (≥0.75) for 5 numbered objectives', () => {
    const draft = `
      Project objectives:
      O1: To develop a new AI framework for precision agriculture.
      O2: To validate the framework on benchmark datasets.
      O3: To demonstrate results at pilot sites across Europe.
      O4: To establish open-source release with full documentation.
      O5: To engage ≥3 advisory services for post-project uptake.
    `;
    const result = check('objectives_listed', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    expect(result.found).toBe(true);
  });

  it('returns 0 confidence for draft with no numbered objectives', () => {
    const result = check('objectives_listed', MINIMAL_DRAFT);
    expect(result.confidence).toBe(0);
    expect(result.found).toBe(false);
  });

  it('returns low confidence (< 0.5) for a single objective', () => {
    const result = check('objectives_listed', 'O1: To develop a new approach.');
    expect(result.found).toBe(true);
    expect(result.confidence).toBeLessThan(0.5);
  });

  it('returns 0 for empty draft', () => {
    expect(check('objectives_listed', EMPTY_DRAFT).confidence).toBe(0);
  });

  it('populates evidence snippets when signal fires', () => {
    const draft = 'O1: To advance climate science.\nO2: To validate results.';
    const result = check('objectives_listed', draft);
    expect(result.evidence.length).toBeGreaterThan(0);
    expect(result.evidence[0].length).toBeGreaterThan(0);
  });

  it('is deterministic: same input returns identical result', () => {
    const draft = 'O1: To build. O2: To test. O3: To deploy.';
    const r1 = check('objectives_listed', draft);
    const r2 = check('objectives_listed', draft);
    expect(r1.confidence).toBe(r2.confidence);
    expect(r1.found).toBe(r2.found);
    expect(r1.detail).toBe(r2.detail);
  });
});

// ---------------------------------------------------------------------------
// Signal: trl_mentioned
// ---------------------------------------------------------------------------

describe('Signal: trl_mentioned', () => {
  it('returns high confidence (≥0.8) for TRL progression', () => {
    const result = check('trl_mentioned', 'The current TRL is 3. AGRI-ADAPT targets TRL 3 → TRL 6 by project end.');
    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
    expect(result.found).toBe(true);
  });

  it('returns moderate confidence for a single TRL mention', () => {
    const result = check('trl_mentioned', 'The technology is currently at TRL 4.');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(0.80);
  });

  it('returns 0 when TRL is not mentioned', () => {
    const result = check('trl_mentioned', 'This project addresses challenges in agricultural research.');
    expect(result.confidence).toBe(0);
    expect(result.found).toBe(false);
  });

  it('handles alternative TRL progression formats', () => {
    const r1 = check('trl_mentioned', 'From TRL 2 to TRL 5 over the project lifetime.');
    const r2 = check('trl_mentioned', 'TRL 4 --> TRL 7');
    expect(r1.confidence).toBeGreaterThan(0.5);
    expect(r2.confidence).toBeGreaterThan(0.5);
  });

  it('is deterministic', () => {
    const draft = 'TRL 3 to TRL 6 across 48 months.';
    expect(check('trl_mentioned', draft).confidence).toBe(check('trl_mentioned', draft).confidence);
  });
});

// ---------------------------------------------------------------------------
// Signal: kpi_table
// ---------------------------------------------------------------------------

describe('Signal: kpi_table', () => {
  it('returns high confidence (≥0.80) for a full KPI table with Baseline and Target', () => {
    const draft = `
      | Indicator | Baseline | Target | Timeline |
      |-----------|----------|--------|---------|
      | Water use (m³/ha) | 500 | ≤425 | Month 44 |
      | Fertiliser (kg N) | 120 | ≤108 | Month 44 |
    `;
    const result = check('kpi_table', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.80);
    expect(result.found).toBe(true);
  });

  it('returns moderate confidence for percentage targets without a full table', () => {
    const result = check('kpi_table', 'We target ≥15% reduction in water use and ≥10% reduction in fertiliser.');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(0.80);
  });

  it('returns 0 for draft with no KPI content', () => {
    const result = check('kpi_table', 'The project will have positive impacts on farming communities in Europe.');
    expect(result.confidence).toBe(0);
    expect(result.found).toBe(false);
  });

  it('returns 0 for empty draft', () => {
    expect(check('kpi_table', EMPTY_DRAFT).confidence).toBe(0);
  });

  it('evidence contains the table row when present', () => {
    const draft = '| Indicator | Baseline | Target |\n| Water | 500 | 425 |';
    const result = check('kpi_table', draft);
    expect(result.evidence.some((e) => e.includes('Indicator') || e.includes('Baseline'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Signal: risk_register
// ---------------------------------------------------------------------------

describe('Signal: risk_register', () => {
  it('returns high confidence for a risk table with Likelihood and Mitigation', () => {
    const draft = `
      Risk register:
      | Risk | Likelihood | Impact | Mitigation |
      |------|-----------|--------|-----------|
      | R1 Technical | H | H | Alternative model |
      | R2 Consortium | L | H | Documentation |
    `;
    const result = check('risk_register', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    expect(result.found).toBe(true);
  });

  it('returns moderate confidence when risks are mentioned in prose (no table)', () => {
    const result = check('risk_register', 'Risks include technical failure (likelihood: medium, mitigation: alternative approach).');
    expect(result.confidence).toBeGreaterThan(0);
    expect(result.confidence).toBeLessThan(0.75);
  });

  it('returns 0 for draft with no risk content', () => {
    const result = check('risk_register', 'The management structure ensures effective coordination among partners.');
    expect(result.confidence).toBe(0);
    expect(result.found).toBe(false);
  });

  it('detects risk register keyword', () => {
    const result = check('risk_register', 'A risk register will be maintained throughout the project lifecycle.');
    expect(result.found).toBe(true);
  });

  it('is deterministic', () => {
    const draft = '| Risk | Likelihood | Impact | Mitigation | Owner |\n| R1 | H | M | Plan B | WUR |';
    const r1 = check('risk_register', draft);
    const r2 = check('risk_register', draft);
    expect(r1.confidence).toBe(r2.confidence);
  });
});

// ---------------------------------------------------------------------------
// Signal: work_packages_defined
// ---------------------------------------------------------------------------

describe('Signal: work_packages_defined', () => {
  it('returns high confidence (≥0.75) for a draft with 5 distinct WPs', () => {
    const draft = `
      WP1: Management (M1–M48)
      WP2: Data Infrastructure (M1–M30)
      WP3: Co-Design (M1–M24)
      WP4: Pilot Deployment (M18–M46)
      WP5: Dissemination (M1–M48)
      WP1 leads project coordination. WP2 and WP3 work in parallel.
    `;
    const result = check('work_packages_defined', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    expect(result.found).toBe(true);
  });

  it('returns low confidence for a single WP reference', () => {
    const result = check('work_packages_defined', 'Work Package 1 covers project management activities.');
    expect(result.found).toBe(true);
    expect(result.confidence).toBeLessThan(0.50);
  });

  it('returns 0 for draft with no WP structure', () => {
    const result = check('work_packages_defined', 'The work plan is organized around three main research activities.');
    expect(result.confidence).toBe(0);
    expect(result.found).toBe(false);
  });

  it('detects WP summary table', () => {
    const draft = '| WP | Title | Lead |\n| WP1 | Management | WUR |\n| WP2 | Research | CNR |';
    const result = check('work_packages_defined', draft);
    expect(result.found).toBe(true);
    expect(result.confidence).toBeGreaterThan(0.3);
  });

  it('is deterministic', () => {
    const draft = 'WP1, WP2, WP3, WP4, WP5 are all defined in the work plan.';
    expect(check('work_packages_defined', draft).confidence)
      .toBe(check('work_packages_defined', draft).confidence);
  });
});

// ---------------------------------------------------------------------------
// Signal: milestones_present
// ---------------------------------------------------------------------------

describe('Signal: milestones_present', () => {
  it('returns high confidence for milestones with month references', () => {
    const draft = 'MS1 (M6): DMP submitted.\nMS2 (M24): AI engine validated.\nMS3 (M36): Pilot Season 1 complete.';
    const result = check('milestones_present', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.65);
    expect(result.found).toBe(true);
  });

  it('returns 0 when no milestones are defined', () => {
    const result = check('milestones_present', 'Progress will be tracked through regular meetings.');
    expect(result.confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Signal: deliverables_present
// ---------------------------------------------------------------------------

describe('Signal: deliverables_present', () => {
  it('returns high confidence including bonus for D1.1 DMP', () => {
    const draft = 'D1.1: Data Management Plan (Month 6)\nD2.1: AI engine report (Month 24)\nD4.1: Pilot report (Month 46)';
    const result = check('deliverables_present', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.60);
    expect(result.found).toBe(true);
  });

  it('returns 0 for draft with no deliverables', () => {
    expect(check('deliverables_present', 'The project will produce excellent outputs.').confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Signal: open_access_commitment
// ---------------------------------------------------------------------------

describe('Signal: open_access_commitment', () => {
  it('returns high confidence when both open access and FAIR are mentioned', () => {
    const draft = 'All publications will be immediately open access. Data deposited in Zenodo following FAIR principles.';
    const result = check('open_access_commitment', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.75);
    expect(result.found).toBe(true);
  });

  it('returns 0 for draft with no open science content', () => {
    const result = check('open_access_commitment', 'Results will be shared with the consortium.');
    expect(result.confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Signal: dmp_referenced
// ---------------------------------------------------------------------------

describe('Signal: dmp_referenced', () => {
  it('returns high confidence for full D1.1 DMP Month 6 reference', () => {
    const draft = 'A Data Management Plan (D1.1) will be submitted by Month 6.';
    const result = check('dmp_referenced', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.65);
    expect(result.found).toBe(true);
  });

  it('returns 0 when DMP is not mentioned', () => {
    const result = check('dmp_referenced', 'Data will be collected from field sensors.');
    expect(result.confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Signal: alternative_approaches
// ---------------------------------------------------------------------------

describe('Signal: alternative_approaches', () => {
  it('detects explicit alternative approach comparison', () => {
    const draft = 'We considered alternatives: (a) rule-based systems — rejected because too rigid; (b) deep learning — rejected due to data requirements.';
    const result = check('alternative_approaches', draft);
    expect(result.confidence).toBeGreaterThan(0.3);
    expect(result.found).toBe(true);
  });

  it('returns 0 for draft with no alternatives discussion', () => {
    const result = check('alternative_approaches', 'The methodology employs machine learning for crop prediction.');
    expect(result.confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Signal: sota_gap_identified
// ---------------------------------------------------------------------------

describe('Signal: sota_gap_identified', () => {
  it('returns high confidence for multiple gap mentions with existing approach criticism', () => {
    const draft = `
      Current approaches fail to model non-stationary climate conditions.
      The gap in adaptive decision support for SME farms is well-documented.
      Existing solutions lack the integration of real-time IoT and EO data.
      Our project addresses these limitations and advances beyond prior work.
    `;
    const result = check('sota_gap_identified', draft);
    expect(result.confidence).toBeGreaterThanOrEqual(0.60);
    expect(result.found).toBe(true);
  });

  it('returns 0 for draft with no gap analysis', () => {
    const result = check('sota_gap_identified', 'Precision agriculture has many applications in modern farming.');
    expect(result.confidence).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// All signals: weight invariants
// ---------------------------------------------------------------------------

describe('Signal weight invariants', () => {
  const CRITERION_IDS = ['excellence', 'impact', 'implementation'] as const;

  it.each(CRITERION_IDS)('weights for criterion "%s" sum to 1.00 ± 0.01', (criterion) => {
    const total = SIGNALS.filter((s) => s.criterion === criterion).reduce((sum, s) => sum + s.weight, 0);
    expect(Math.abs(total - 1.0)).toBeLessThanOrEqual(0.01);
  });

  it('every signal has a non-empty howToFix string', () => {
    for (const s of SIGNALS) {
      expect(s.howToFix.length).toBeGreaterThan(10);
    }
  });

  it('every signal has timeEstimateMinutes > 0', () => {
    for (const s of SIGNALS) {
      expect(s.timeEstimateMinutes).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Full draft integration smoke test
// ---------------------------------------------------------------------------

describe('Full draft: all signals fire at expected levels', () => {
  it('objectives_listed fires strongly on FULL_DRAFT', () => {
    const r = check('objectives_listed', FULL_DRAFT);
    expect(r.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('trl_mentioned fires on FULL_DRAFT', () => {
    const r = check('trl_mentioned', FULL_DRAFT);
    expect(r.confidence).toBeGreaterThanOrEqual(0.65);
  });

  it('kpi_table fires on FULL_DRAFT', () => {
    const r = check('kpi_table', FULL_DRAFT);
    expect(r.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('risk_register fires on FULL_DRAFT', () => {
    const r = check('risk_register', FULL_DRAFT);
    expect(r.confidence).toBeGreaterThanOrEqual(0.65);
  });

  it('work_packages_defined fires on FULL_DRAFT', () => {
    const r = check('work_packages_defined', FULL_DRAFT);
    expect(r.confidence).toBeGreaterThanOrEqual(0.75);
  });

  it('no signal fires on EMPTY_DRAFT', () => {
    for (const signal of SIGNALS) {
      const r = signal.check(EMPTY_DRAFT);
      expect(r.confidence).toBe(0);
      expect(r.found).toBe(false);
    }
  });
});
