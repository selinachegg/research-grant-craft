/**
 * signals.ts — All coverage signal definitions for the GrantCraft reviewer.
 *
 * Each signal is a named, weighted predicate that inspects the draft markdown
 * and returns a confidence score in [0, 1].
 *
 * Rules enforced across all signals:
 *   1. Pure functions: same input → same output. No randomness, no I/O.
 *   2. Each check() creates fresh RegExp instances to avoid lastIndex state bugs.
 *   3. Confidence is computed via sat(matchCount, saturation):
 *        sat(n, S) = min(1.0, n / S)
 *      where S is the match count at which the signal fully saturates.
 *   4. Evidence snippets are the verbatim lines containing matches, ≤120 chars.
 *
 * Adding a new signal: append an object to SIGNALS following the same shape.
 * The criterion's signal weights must sum to 1.0 after your addition.
 */

import type { Signal, RawCheckResult, CriterionId } from './types';

// ---------------------------------------------------------------------------
// Internal helpers (not exported — private to this module)
// ---------------------------------------------------------------------------

/** Re-creates a RegExp with the 'g' flag added (preserving 'i' and 'm'). */
function gRe(pat: RegExp): RegExp {
  const flags = new Set(['g']);
  if (pat.flags.includes('i')) flags.add('i');
  if (pat.flags.includes('m')) flags.add('m');
  return new RegExp(pat.source, [...flags].join(''));
}

/**
 * Count total regex matches across one or more patterns.
 * Each pattern is applied independently; matches may overlap between patterns.
 */
function countMatches(text: string, ...patterns: RegExp[]): number {
  let n = 0;
  for (const pat of patterns) {
    const m = text.match(gRe(pat));
    n += m ? m.length : 0;
  }
  return n;
}

/**
 * Collect up to `max` unique line-snippets from regex matches.
 * Each snippet is the trimmed line containing the match, capped at 120 chars.
 */
function collectEvidence(text: string, patterns: RegExp[], max = 3): string[] {
  const evidence: string[] = [];
  const seen = new Set<string>();

  for (const pat of patterns) {
    const re = gRe(pat);
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const snippet = getLine(text, m.index);
      if (snippet && !seen.has(snippet)) {
        seen.add(snippet);
        evidence.push(snippet);
        if (evidence.length >= max) return evidence;
      }
    }
  }
  return evidence;
}

/** Extract and clean the line of text at position `pos`. */
function getLine(text: string, pos: number, maxLen = 120): string {
  const start = text.lastIndexOf('\n', pos - 1) + 1;
  let end = text.indexOf('\n', pos);
  if (end === -1) end = text.length;
  // Strip leading markdown markers so snippets are readable
  const line = text.slice(start, end).trim().replace(/^[#|>*-]+\s*/, '');
  if (line.length <= maxLen) return line;
  return line.slice(0, maxLen - 1) + '…';
}

/**
 * Saturation-based confidence: linearly maps match count → [0, 1],
 * saturating (capping at 1.0) once `saturation` matches are found.
 *
 * sat(0, S) = 0    sat(S, S) = 1    sat(2S, S) = 1
 */
export function sat(matchCount: number, saturation: number): number {
  if (matchCount <= 0) return 0;
  return Math.min(1.0, matchCount / saturation);
}

// ---------------------------------------------------------------------------
// Signal definitions
// ---------------------------------------------------------------------------

export const SIGNALS: Signal[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // EXCELLENCE (7 signals, weights sum = 1.00)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'objectives_listed',
    label: 'Numbered objectives',
    description: 'Draft contains a structured list of numbered project objectives (O1/O2... or 1. To...)',
    criterion: 'excellence',
    weight: 0.22,
    requiredForThreshold: true,
    sectionHint: '§1.1',
    howToFix: 'Add a numbered list "O1: To develop… O2: To validate…" with 3–6 SMART objectives in Section 1.1.',
    timeEstimateMinutes: 10,
    check(draft: string): RawCheckResult {
      // O1: / O1. / O1 — style; numbered "1. To ..." style; Objective N; table | O1 |
      const p1 = /\bO[1-9]\d*\s*[.:)—–\-]/i;
      const p2 = /^\s*[1-9]\d*\.\s+[Tt]o\s+/m;
      const p3 = /\bObjective\s+(?:O\s*)?[1-9]/i;
      const p4 = /\|\s*O[1-9]\d*\s*\|/i;
      const n = countMatches(draft, p1, p2, p3, p4);
      const confidence = sat(n, 5);
      const evidence = collectEvidence(draft, [p1, p2, p3, p4]);
      const detail =
        n === 0
          ? 'No numbered objectives found. Add "O1: To… O2: To…" in Section 1.1.'
          : n < 3
          ? `${n} objective reference(s) — aim for 3–6 SMART objectives.`
          : `${n} objective references found — good structured coverage.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'trl_mentioned',
    label: 'TRL progression stated',
    description: 'Draft states the current Technology Readiness Level and the target TRL at project end',
    criterion: 'excellence',
    weight: 0.12,
    requiredForThreshold: true,
    sectionHint: '§1.1',
    howToFix: 'Add one sentence: "The current TRL is X. ACRONYM targets TRL Y by Month N." in Section 1.1.',
    timeEstimateMinutes: 3,
    check(draft: string): RawCheckResult {
      const p1 = /\bTRL\s*[1-9]/i;
      const p2 = /Technology\s+Readiness\s+Level/i;
      // Progression pattern (extra weight): TRL X → TRL Y or TRL X to TRL Y
      const p3 = /\bTRL\s*[1-9]\s*(?:→|-->?|to)\s*TRL\s*[1-9]/i;

      const basicMatches = countMatches(draft, p1, p2);
      const hasProgression = countMatches(draft, p3) > 0;

      // A single progression statement saturates this signal
      const confidence = hasProgression
        ? Math.min(1.0, sat(basicMatches, 3) + 0.4)
        : sat(basicMatches, 3);

      const evidence = collectEvidence(draft, [p3, p1, p2]);
      const detail =
        basicMatches === 0
          ? 'TRL not mentioned. State both the current TRL and the target TRL.'
          : hasProgression
          ? 'TRL progression (start → end) found — excellent.'
          : `TRL mentioned ${basicMatches} time(s) but no progression (start→end) found.`;
      return { found: basicMatches > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'methodology_described',
    label: 'Methodology described',
    description: 'Draft contains a substantive methodology section with specific methods or approaches',
    criterion: 'excellence',
    weight: 0.22,
    requiredForThreshold: true,
    sectionHint: '§1.2',
    howToFix: 'Expand Section 1.2 with: (a) overall approach narrative, (b) specific methods/tools, (c) validation strategy.',
    timeEstimateMinutes: 20,
    check(draft: string): RawCheckResult {
      const p1 = /^#+\s*[\d.]*\s*Methodology/im;
      const p2 = /\b(?:approach|methodology|methods?)\b/i;
      const p3 = /\bwe\s+(?:will\s+)?(?:use|employ|apply|adopt|implement)\b/i;
      const p4 = /\b(?:algorithm|model|framework|pipeline|protocol|workflow)\b/i;
      const p5 = /\bvalidat(?:e|ion|ing)\b/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5);
      const confidence = sat(n, 8);
      const evidence = collectEvidence(draft, [p1, p3, p4, p2]);
      const detail =
        n === 0
          ? 'No methodology content found. Add Section 1.2 with approach, methods, and validation strategy.'
          : n < 4
          ? `Limited methodology content (${n} signals). Expand with specific methods, tools, and success criteria.`
          : `Methodology well-described (${n} signals across approach, methods, and validation).`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'sota_gap_identified',
    label: 'State-of-art gap identified',
    description: 'Draft identifies specific limitations in existing approaches that the project addresses',
    criterion: 'excellence',
    weight: 0.16,
    requiredForThreshold: true,
    sectionHint: '§1.3',
    howToFix: 'In Section 1.3 name 2–4 concrete limitations of current approaches and explain how your project addresses each.',
    timeEstimateMinutes: 12,
    check(draft: string): RawCheckResult {
      const p1 = /\bgap\b/i;
      const p2 = /\blimitation[s]?\b/i;
      const p3 = /(?:current|existing)\s+(?:approaches?|solutions?|methods?|tools?|systems?)\s+(?:fail|lack|cannot|do\s+not|are\s+(?:unable|insufficient))/i;
      const p4 = /state\s+of\s+(?:the\s+)?art/i;
      const p5 = /\bshortcoming[s]?\b/i;
      const p6 = /\b(?:address(?:es|ing)?|overcome[s]?|bridge[s]?)\s+(?:this|these|the)\s+(?:gap|limitation|challenge)/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6);
      const confidence = sat(n, 6);
      const evidence = collectEvidence(draft, [p3, p6, p1, p2]);
      const detail =
        n === 0
          ? 'No gap or limitation analysis found. Add a critical SotA review in Section 1.3.'
          : n < 3
          ? `SotA limitations mentioned (${n} signals) but analysis is thin — add specific, quantified gaps.`
          : `Good SotA gap analysis (${n} signals). Ensure gaps map explicitly to project objectives.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'novelty_claim',
    label: 'Novelty claim made',
    description: 'Draft explicitly claims the project advances beyond the current state of the art',
    criterion: 'excellence',
    weight: 0.12,
    requiredForThreshold: false,
    sectionHint: '§1.1 or §1.3',
    howToFix: 'Add one strong novelty statement: "ACRONYM goes beyond the state of the art by [specific advance]."',
    timeEstimateMinutes: 5,
    check(draft: string): RawCheckResult {
      const p1 = /beyond\s+the\s+(?:current\s+)?state\s+of\s+(?:the\s+)?art/i;
      const p2 = /\b(?:novel|first\s+to|first-of-its-kind|pioneering|breakthrough|unprecedented)\b/i;
      const p3 = /\badvances?\s+beyond\b/i;
      const p4 = /\binnovati(?:ve|on)\b/i;
      const p5 = /\bdiffers?\s+from\s+(?:existing|current|prior)/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5);
      const confidence = sat(n, 4);
      const evidence = collectEvidence(draft, [p1, p3, p5, p2]);
      const detail =
        n === 0
          ? 'No novelty claim found. State explicitly what makes this project beyond state of the art.'
          : `Novelty claim present (${n} signals). Ensure claims are backed by evidence, not assertion.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'success_criteria',
    label: 'Quantified success criteria',
    description: 'Draft defines measurable success criteria with specific targets (%, numbers, benchmarks)',
    criterion: 'excellence',
    weight: 0.10,
    requiredForThreshold: false,
    sectionHint: '§1.2',
    howToFix: 'Add measurable targets for each objective: "≥90% accuracy on benchmark X", "≥15% reduction in Y by Month Z".',
    timeEstimateMinutes: 8,
    check(draft: string): RawCheckResult {
      const p1 = /success\s+criteri/i;
      const p2 = /[≥≤<>]\s*\d+\s*%/;
      const p3 = /\btarget\s+(?:of\s+)?[≥≤]?\s*\d+/i;
      const p4 = /\baccuracy\s+of\s+\d+/i;
      const p5 = /validation\s+criteri/i;
      const p6 = /\bachiev(?:e|ing)\s+[≥≤]?\s*\d+/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6);
      const confidence = sat(n, 5);
      const evidence = collectEvidence(draft, [p2, p3, p4, p6]);
      const detail =
        n === 0
          ? 'No quantified success criteria found. Add measurable targets (e.g. "≥85% precision on benchmark Y").'
          : n < 3
          ? `${n} success metric(s) found — add targets for each objective.`
          : `Good quantified criteria (${n} signals). Ensure each objective has a measurable target.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'alternative_approaches',
    label: 'Alternative approaches discussed',
    description: 'Draft acknowledges alternative methodological choices and justifies the chosen approach',
    criterion: 'excellence',
    weight: 0.06,
    requiredForThreshold: false,
    sectionHint: '§1.2',
    howToFix: 'Add 2 sentences: "We considered alternatives X and Y. We chose Z because [specific reasons]."',
    timeEstimateMinutes: 5,
    check(draft: string): RawCheckResult {
      const p1 = /\balternative\s+(?:approach|method|option|strategy)/i;
      const p2 = /\bwe\s+considered\b/i;
      const p3 = /\b(?:rather|instead)\s+than\b/i;
      const p4 = /\b(?:rejected|discarded|not\s+chosen)\s+(?:because|as|since|due)/i;
      const p5 = /\bcompared\s+(?:to|with)\s+(?:alternative|existing|other)/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5);
      const confidence = sat(n, 3);
      const evidence = collectEvidence(draft, [p1, p2, p3, p4]);
      const detail =
        n === 0
          ? 'No alternative approaches discussed. Reviewers routinely ask why you chose this approach over alternatives.'
          : `Alternative approaches mentioned (${n} signals). Good — ensures reviewers see the choice was deliberate.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // IMPACT (7 signals, weights sum = 1.00)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'outcomes_linked',
    label: 'Outcomes linked to call',
    description: 'Draft explicitly links project outcomes to the call topic's expected outcomes',
    criterion: 'impact',
    weight: 0.20,
    requiredForThreshold: true,
    sectionHint: '§2.1',
    howToFix: 'In Section 2.1, copy each expected outcome from the call topic and explain how your project delivers it.',
    timeEstimateMinutes: 10,
    check(draft: string): RawCheckResult {
      const p1 = /expected\s+outcome/i;
      const p2 = /call\s+(?:expected|topic)\s+outcome/i;
      const p3 = /contributes?\s+to\s+(?:the\s+)?(?:call|programme|work\s+programme)/i;
      const p4 = /\boutcome\s+[O\d]+/i;
      const p5 = /\bdelivers?\s+(?:the\s+)?(?:following\s+)?outcome/i;
      // Also look for a structured outcomes section
      const p6 = /^#+\s*[\d.]*\s*(?:Expected\s+)?Outcome/im;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6);
      const confidence = sat(n, 5);
      const evidence = collectEvidence(draft, [p2, p3, p6, p1]);
      const detail =
        n === 0
          ? 'No reference to call expected outcomes. Section 2.1 must explicitly address each call outcome bullet.'
          : n < 3
          ? `Outcomes referenced (${n} signals) but linkage to call is weak — quote the call outcomes directly.`
          : `Expected outcomes well-linked to call (${n} signals).`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'kpi_table',
    label: 'KPI table with targets',
    description: 'Draft contains quantified key performance indicators with baseline and target values',
    criterion: 'impact',
    weight: 0.20,
    requiredForThreshold: true,
    sectionHint: '§2.1',
    howToFix: 'Add a table: Indicator | Baseline | Target | Timeline. Include 4–6 rows with specific numbers.',
    timeEstimateMinutes: 8,
    check(draft: string): RawCheckResult {
      // Markdown table containing KPI-related headers
      const p1 = /\|\s*(?:Indicator|KPI|Measure|Metric)\s*\|/i;
      const p2 = /\|\s*Baseline\s*\|/i;
      const p3 = /\|\s*Target\s*\|/i;
      const p4 = /\bKPI\b/;
      const p5 = /key\s+performance\s+indicator/i;
      const p6 = /[≥≤]\s*\d+\s*%/;      // percentage targets
      const p7 = /\|\s*\d+[,.]?\d*\s*\|/; // numeric cell in a table

      const n = countMatches(draft, p1, p2, p3, p4, p5, p6, p7);
      // Bonus: if both Baseline and Target columns are present, confidence is high
      const hasTable  = countMatches(draft, p1) > 0;
      const hasBase   = countMatches(draft, p2) > 0;
      const hasTarget = countMatches(draft, p3) > 0;
      const tableBonus = (hasBase && hasTarget) ? 0.3 : hasTable ? 0.15 : 0;

      const confidence = Math.min(1.0, sat(n, 6) + tableBonus);
      const evidence = collectEvidence(draft, [p1, p2, p3, p6]);
      const detail =
        n === 0
          ? 'No KPI table or quantified targets found. Add Indicator/Baseline/Target table in Section 2.1.'
          : hasBase && hasTarget
          ? `KPI table with Baseline and Target columns found (${n} signals) — excellent.`
          : `Some KPI content found (${n} signals) but no Baseline/Target table. Add structured table.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'exploitation_plan',
    label: 'Exploitation / IP plan',
    description: 'Draft describes how results will be exploited commercially or deployed, with an IP strategy',
    criterion: 'impact',
    weight: 0.16,
    requiredForThreshold: true,
    sectionHint: '§2.2',
    howToFix: 'Add a paragraph in Section 2.2 naming who exploits which result, IP ownership, and the commercialisation/deployment route.',
    timeEstimateMinutes: 10,
    check(draft: string): RawCheckResult {
      const p1 = /\bexploit(?:ation|ing|ed)?\b/i;
      const p2 = /\bcommerciali(?:s|z)(?:e|ation|ing)\b/i;
      const p3 = /\bIP\s+(?:strategy|plan|ownership|rights|protection)\b/i;
      const p4 = /\bpatent\b/i;
      const p5 = /\blicens(?:e|ing|ing\s+strategy)\b/i;
      const p6 = /\bmarket\s+(?:entry|potential|opportunity|size|uptake)\b/i;
      const p7 = /exploitation\s+(?:plan|strategy|route|roadmap)/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6, p7);
      const confidence = sat(n, 5);
      const evidence = collectEvidence(draft, [p7, p3, p2, p6]);
      const detail =
        n === 0
          ? 'No exploitation or IP content. Add: who exploits what result, IP protection plan, market route.'
          : n < 3
          ? `Some exploitation content (${n} signals) — add IP ownership table and specific market entry strategy.`
          : `Exploitation plan present (${n} signals). Ensure IP ownership is clear for each key result.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'dissemination_plan',
    label: 'Dissemination plan',
    description: 'Draft describes planned publications, conferences, and communication activities',
    criterion: 'impact',
    weight: 0.16,
    requiredForThreshold: true,
    sectionHint: '§2.3',
    howToFix: 'In Section 2.3 add: (a) target journal list, (b) conferences, (c) non-academic communication activities table.',
    timeEstimateMinutes: 8,
    check(draft: string): RawCheckResult {
      const p1 = /\bdisseminat(?:e|ion|ing)\b/i;
      const p2 = /\bpublication[s]?\b/i;
      const p3 = /\bconference[s]?\b/i;
      const p4 = /open\s+access/i;
      const p5 = /target\s+(?:journal|venue|conference)/i;
      const p6 = /\|\s*(?:Activity|Dissemination|Communication)\s*\|/i;  // activity table
      const p7 = /peer[-\s]reviewed/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6, p7);
      const confidence = sat(n, 7);
      const evidence = collectEvidence(draft, [p5, p6, p4, p1]);
      const detail =
        n === 0
          ? 'No dissemination content. Add: target journals, conferences, and communication activities.'
          : n < 4
          ? `Basic dissemination content (${n} signals). Name specific journals/conferences and add an activity table.`
          : `Good dissemination plan (${n} signals). Ensure non-academic communication is included.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'stakeholders_named',
    label: 'Stakeholders named',
    description: 'Draft identifies specific stakeholder groups who will benefit from or contribute to project outcomes',
    criterion: 'impact',
    weight: 0.14,
    requiredForThreshold: false,
    sectionHint: '§2.1',
    howToFix: 'List 4–6 specific stakeholder groups in Section 2.1 and explain how each will benefit.',
    timeEstimateMinutes: 5,
    check(draft: string): RawCheckResult {
      const p1 = /\bstakeholder[s]?\b/i;
      const p2 = /\bend[-\s]user[s]?\b/i;
      const p3 = /\bbeneficiar(?:y|ies)\b/i;
      const p4 = /\btarget\s+(?:group|audience|user|community)[s]?\b/i;
      const p5 = /\bpolicymaker[s]?\b|\bpolicy\s+maker[s]?\b/i;
      const p6 = /\bfarmer[s]?\b|\bclinician[s]?\b|\bpatient[s]?\b|\bSME[s]?\b/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6);
      const confidence = sat(n, 5);
      const evidence = collectEvidence(draft, [p1, p2, p3, p4]);
      const detail =
        n === 0
          ? 'No stakeholder groups identified. Name specific groups and describe how they benefit.'
          : `Stakeholders mentioned (${n} signals). Ensure each group has a clear benefit statement.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'open_access_commitment',
    label: 'Open access commitment',
    description: 'Draft commits to open access publications and/or FAIR data practices (mandatory in Horizon Europe)',
    criterion: 'impact',
    weight: 0.10,
    requiredForThreshold: true,
    sectionHint: '§2.3 or §2.4',
    howToFix: 'Add: "All publications will be made immediately open access. Data will be deposited in [Zenodo] under FAIR principles."',
    timeEstimateMinutes: 3,
    check(draft: string): RawCheckResult {
      const p1 = /open\s+access/i;
      const p2 = /\bCC\s+BY\b/;
      const p3 = /\bFAIR\s+(?:principles?|data)\b/i;
      const p4 = /\bZenodo\b/i;
      const p5 = /\bEOSC\b/;
      const p6 = /\bopen\s+(?:source|data|science)\b/i;
      const p7 = /immediately\s+open\s+access/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6, p7);
      // Bonus if both OA and FAIR are present — shows comprehensive open science plan
      const hasOA   = countMatches(draft, p1) > 0;
      const hasFAIR = countMatches(draft, p3) > 0;
      const bonus = (hasOA && hasFAIR) ? 0.2 : 0;
      const confidence = Math.min(1.0, sat(n, 4) + bonus);
      const evidence = collectEvidence(draft, [p7, p3, p2, p1]);
      const detail =
        n === 0
          ? 'No open access commitment. This is mandatory in HE (Art. 17 MGA). Add one sentence.'
          : hasOA && hasFAIR
          ? 'Open access and FAIR data both referenced — good open science plan.'
          : `Open science content present (${n} signals). Add both open access and FAIR data commitments.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'dmp_referenced',
    label: 'Data Management Plan referenced',
    description: 'Draft references the mandatory Data Management Plan deliverable (D1.1, Month 6)',
    criterion: 'impact',
    weight: 0.04,
    requiredForThreshold: false,
    sectionHint: '§2.4',
    howToFix: 'Add: "A Data Management Plan (D1.1) will be submitted by Month 6 following the EC template."',
    timeEstimateMinutes: 3,
    check(draft: string): RawCheckResult {
      const p1 = /\bDMP\b/;
      const p2 = /[Dd]ata\s+[Mm]anagement\s+[Pp]lan/;
      const p3 = /\bD1\.1\b/;
      const p4 = /Month\s+6.*(?:DMP|data\s+management)/i;
      const n = countMatches(draft, p1, p2, p3, p4);
      // Bonus for the D1.1 Month 6 reference — shows full awareness
      const bonus = countMatches(draft, p3) > 0 ? 0.3 : 0;
      const confidence = Math.min(1.0, sat(n, 3) + bonus);
      const evidence = collectEvidence(draft, [p4, p3, p2, p1]);
      const detail =
        n === 0
          ? 'No DMP reference found. The DMP (D1.1, Month 6) is a mandatory HE deliverable — reference it in §2.4.'
          : `DMP referenced (${n} signals). Good — shows familiarity with HE requirements.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // IMPLEMENTATION (8 signals, weights sum = 1.00)
  // ──────────────────────────────────────────────────────────────────────────

  {
    id: 'work_packages_defined',
    label: 'Work packages defined',
    description: 'Draft contains a structured work package breakdown (WP1, WP2… with titles and responsibilities)',
    criterion: 'implementation',
    weight: 0.22,
    requiredForThreshold: true,
    sectionHint: '§3.1',
    howToFix: 'Add a WP summary table (WP# | Title | Lead | Start | End | PM) followed by individual WP descriptions.',
    timeEstimateMinutes: 20,
    check(draft: string): RawCheckResult {
      const p1 = /\bWP\d+\b/;
      const p2 = /[Ww]ork\s+[Pp]ackage\s+\d+/;
      const p3 = /\|\s*WP\s*[|#\d]/i;       // WP table header
      const p4 = /\|\s*WP\d+\s*\|/i;        // WP row in table
      const n = countMatches(draft, p1, p2, p3, p4);
      // Count distinct WP numbers — more distinct WPs = more confidence
      const distinctWPs = new Set((draft.match(/\bWP(\d+)\b/g) || []).map(s => s.replace(/\D/g, ''))).size;
      const confidence = Math.min(1.0, sat(n, 10) + sat(distinctWPs, 4) * 0.2);
      const evidence = collectEvidence(draft, [p3, p4, p2, p1]);
      const detail =
        n === 0
          ? 'No work packages defined. Add WP structure with summary table and individual WP descriptions.'
          : distinctWPs < 3
          ? `${distinctWPs} distinct WP(s) found (${n} references) — most proposals need 4–6 WPs.`
          : `${distinctWPs} distinct work packages found (${n} total references) — good WP structure.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'milestones_present',
    label: 'Milestones defined',
    description: 'Draft defines verifiable milestones (MS1, MS2…) with month numbers',
    criterion: 'implementation',
    weight: 0.14,
    requiredForThreshold: true,
    sectionHint: '§3.1',
    howToFix: 'Add milestones as verifiable achievements: "MS1 (M12): Prototype demonstrating TRL 4 on benchmark X — verified by D2.1."',
    timeEstimateMinutes: 10,
    check(draft: string): RawCheckResult {
      const p1 = /\bMS\d+\b/;
      const p2 = /[Mm]ilestone\s+\d+/;
      const p3 = /\bMS\d+\s*\(\s*M\d+\s*\)/;  // MS1 (M12) — very specific
      const p4 = /\|\s*MS\d+\s*\|/i;           // milestone in table
      const n = countMatches(draft, p1, p2, p3, p4);
      const hasSpecificMS = countMatches(draft, p3) > 0;
      const bonus = hasSpecificMS ? 0.2 : 0;
      const confidence = Math.min(1.0, sat(n, 5) + bonus);
      const evidence = collectEvidence(draft, [p3, p4, p1, p2]);
      const detail =
        n === 0
          ? 'No milestones found. Add MS1, MS2… with month numbers and verifiable completion criteria.'
          : hasSpecificMS
          ? `Milestones with month references found (${n} signals) — good practice.`
          : `Milestones mentioned (${n} signals) but month references unclear — add "(MXX)" to each milestone.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'deliverables_present',
    label: 'Deliverables defined',
    description: 'Draft defines numbered deliverables (D1.1, D2.3…) with titles and due months',
    criterion: 'implementation',
    weight: 0.14,
    requiredForThreshold: true,
    sectionHint: '§3.1',
    howToFix: 'List deliverables as "D1.1: Data Management Plan (Month 6)" under each WP. Include D1.1 as mandatory.',
    timeEstimateMinutes: 8,
    check(draft: string): RawCheckResult {
      const p1 = /\bD\d+\.\d+\b/;           // D1.1, D2.3
      const p2 = /[Dd]eliverable\s+D?\d/;
      const p3 = /\|\s*D\d+\.\d+\s*\|/i;    // deliverable in table
      // D1.1 DMP is mandatory — special bonus
      const p4 = /\bD1\.1\b.*(?:DMP|[Dd]ata\s+[Mm]anagement\s+[Pp]lan)/;
      const n = countMatches(draft, p1, p2, p3, p4);
      const hasDMP = countMatches(draft, p4) > 0;
      const bonus = hasDMP ? 0.15 : 0;
      const confidence = Math.min(1.0, sat(n, 6) + bonus);
      const evidence = collectEvidence(draft, [p4, p3, p1, p2]);
      const detail =
        n === 0
          ? 'No deliverables defined. Use "D1.1: [Title] (Month X)" format. D1.1 DMP (Month 6) is mandatory.'
          : hasDMP
          ? `Deliverables defined including the mandatory D1.1 DMP (${n} total signals) — excellent.`
          : `${n} deliverable reference(s) found but D1.1 DMP (Month 6) not identified — add it to WP1.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'gantt_or_timeline',
    label: 'Gantt chart / timeline',
    description: 'Draft includes a visual Gantt chart or structured timeline showing WP scheduling',
    criterion: 'implementation',
    weight: 0.10,
    requiredForThreshold: false,
    sectionHint: '§3.1',
    howToFix: 'Add a Gantt chart (ASCII table or description: WP | M1–M12 | M13–M24 …) showing critical path.',
    timeEstimateMinutes: 12,
    check(draft: string): RawCheckResult {
      const p1 = /\bGantt\b/i;
      const p2 = /M\d+\s*[–—\-]\s*M\d+/;          // M1–M24
      const p3 = /Month\s+\d+\s*[–—\-]\s*Month\s+\d+/i;
      const p4 = /critical\s+path/i;
      const p5 = /[|█▓▒░]{3,}/;                    // ASCII Gantt bars
      const p6 = /\|\s*M\d+\s*\|/i;                // month columns in table
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6);
      const confidence = sat(n, 4);
      const evidence = collectEvidence(draft, [p1, p2, p4, p6]);
      const detail =
        n === 0
          ? 'No Gantt chart or timeline found. Reviewers expect a visual project timeline in Section 3.1.'
          : `Timeline / Gantt content found (${n} signals). Ensure it shows the critical path.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'risk_register',
    label: 'Risk register',
    description: 'Draft includes a risk register with likelihood, impact, and mitigation columns',
    criterion: 'implementation',
    weight: 0.14,
    requiredForThreshold: true,
    sectionHint: '§3.2',
    howToFix: 'Add a risk table: Risk | Category | Likelihood (H/M/L) | Impact (H/M/L) | Mitigation | Owner',
    timeEstimateMinutes: 10,
    check(draft: string): RawCheckResult {
      const p1 = /\bR\d+\b.*\brisk\b/i;
      const p2 = /risk\s+register/i;
      const p3 = /\blikelihood\b/i;
      const p4 = /\bmitigation\b/i;
      const p5 = /\|\s*(?:Risk|Likelihood|Mitigation)\s*\|/i;  // risk table header
      const p6 = /\b(?:H|M|L)\s*\|\s*(?:H|M|L)\b/;            // H/M/L cells
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6);
      // Bonus for full table structure (headers + likelihood + mitigation together)
      const hasFullTable = countMatches(draft, p3) > 0 && countMatches(draft, p4) > 0;
      const bonus = hasFullTable ? 0.25 : 0;
      const confidence = Math.min(1.0, sat(n, 6) + bonus);
      const evidence = collectEvidence(draft, [p2, p5, p3, p4]);
      const detail =
        n === 0
          ? 'No risk register found. This is consistently flagged by reviewers — add risk table in §3.2.'
          : hasFullTable
          ? `Risk register with Likelihood and Mitigation found (${n} signals) — good risk management.`
          : `Risk content present (${n} signals) but full table (Likelihood | Impact | Mitigation) missing.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'consortium_described',
    label: 'Consortium described',
    description: 'Draft describes the consortium composition with partner roles and complementarity',
    criterion: 'implementation',
    weight: 0.12,
    requiredForThreshold: true,
    sectionHint: '§3.3',
    howToFix: 'Add a partner table (Name | Country | Type | Key expertise) and a complementarity narrative in §3.3.',
    timeEstimateMinutes: 8,
    check(draft: string): RawCheckResult {
      const p1 = /\bconsortium\b/i;
      const p2 = /\bpartner[s]?\b/i;
      const p3 = /\|\s*(?:Partner|Organisation|Organization|Country)\s*\|/i;  // partner table
      const p4 = /\bcomplementar(?:y|ity)\b/i;
      const p5 = /\|.+\|\s*(?:HEI|SME|NGO|University|Research|Industry)\s*\|/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5);
      const hasPartnerTable = countMatches(draft, p3) > 0 || countMatches(draft, p5) > 0;
      const bonus = hasPartnerTable ? 0.2 : 0;
      const confidence = Math.min(1.0, sat(n, 6) + bonus);
      const evidence = collectEvidence(draft, [p3, p5, p4, p1]);
      const detail =
        n === 0
          ? 'No consortium description found. Add partner table and complementarity narrative in §3.3.'
          : hasPartnerTable
          ? `Consortium with partner table found (${n} signals). Ensure each partner\'s unique role is stated.`
          : `Consortium mentioned (${n} signals) but no partner table — add structured table.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'budget_justified',
    label: 'Budget justified',
    description: 'Draft justifies the requested budget with person-months linked to tasks and cost breakdowns',
    criterion: 'implementation',
    weight: 0.08,
    requiredForThreshold: false,
    sectionHint: '§3.4',
    howToFix: 'Add §3.4 with budget table (Partner | Personnel | Equipment | Travel | Total) and person-month justification.',
    timeEstimateMinutes: 12,
    check(draft: string): RawCheckResult {
      const p1 = /\bperson[-\s]month[s]?\b/i;
      const p2 = /\|\s*(?:Budget|Cost|Personnel|Equipment)\s*\|/i;
      const p3 = /€\s*\d[\d,.]*/;
      const p4 = /budget\s+(?:breakdown|justification|allocation|summary)/i;
      const p5 = /\bvalue[-\s]for[-\s]money\b/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5);
      const confidence = sat(n, 5);
      const evidence = collectEvidence(draft, [p4, p2, p1, p3]);
      const detail =
        n === 0
          ? 'No budget justification found. Add §3.4 with cost table and person-month narrative.'
          : `Budget content found (${n} signals). Ensure person-months are linked to specific WP tasks.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },

  {
    id: 'management_structure',
    label: 'Management structure',
    description: 'Draft describes the project governance structure (coordinator, steering committee, decision-making)',
    criterion: 'implementation',
    weight: 0.06,
    requiredForThreshold: false,
    sectionHint: '§3.2',
    howToFix: 'Add governance diagram/text: Project Coordinator → Steering Committee → WP Leaders; decision-making procedures.',
    timeEstimateMinutes: 8,
    check(draft: string): RawCheckResult {
      const p1 = /steering\s+committee/i;
      const p2 = /project\s+coordinator/i;
      const p3 = /\bgovernance\b/i;
      const p4 = /\b(?:decision[-\s]making|decision\s+procedure)\b/i;
      const p5 = /management\s+structure/i;
      const p6 = /\bWP\s+[Ll]eader[s]?\b/i;
      const n = countMatches(draft, p1, p2, p3, p4, p5, p6);
      const confidence = sat(n, 4);
      const evidence = collectEvidence(draft, [p1, p2, p5, p4]);
      const detail =
        n === 0
          ? 'No management structure described. Add governance section with roles in §3.2.'
          : `Management structure content (${n} signals). Good — mention conflict resolution and reporting schedule too.`;
      return { found: n > 0, confidence, evidence, detail };
    },
  },
];

// ---------------------------------------------------------------------------
// Lookup helpers
// ---------------------------------------------------------------------------

/** All signals for a given criterion, in declaration order. */
export function signalsForCriterion(criterion: CriterionId): Signal[] {
  return SIGNALS.filter((s) => s.criterion === criterion);
}

/** Find a signal by ID. Throws if not found (programming error). */
export function signalById(id: string): Signal {
  const s = SIGNALS.find((s) => s.id === id);
  if (!s) throw new Error(`Signal not found: "${id}"`);
  return s;
}

// Validate at module load time: weights per criterion must sum to 1.00 ± 0.01
const CRITERIA: CriterionId[] = ['excellence', 'impact', 'implementation'];
for (const c of CRITERIA) {
  const total = signalsForCriterion(c).reduce((sum, s) => sum + s.weight, 0);
  if (Math.abs(total - 1.0) > 0.01) {
    // Surface as a console warning during development; doesn't throw in production
    console.warn(`[GrantCraft] Signal weights for criterion "${c}" sum to ${total.toFixed(4)} (expected 1.00)`);
  }
}
