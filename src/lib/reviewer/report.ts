/**
 * report.ts — Markdown report formatter.
 *
 * Takes a fully-scored ReviewerReport (from scorer.ts) and renders it as
 * a clean Markdown document suitable for display in the browser or export.
 *
 * This module is pure: no side effects, no I/O. Same input → same output.
 */

import type { ReviewerReport, CriterionAssessment, ActionItem, MissingItem } from './types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function scoreEmoji(score: number, threshold: number): string {
  if (score >= threshold + 1.5) return '🟢';
  if (score >= threshold)       return '🟡';
  return '🔴';
}

function passLabel(passed: boolean): string {
  return passed ? '✅ PASS' : '❌ BELOW THRESHOLD';
}

function urgencyEmoji(urgency: string): string {
  return urgency === 'high' ? '🔴' : urgency === 'medium' ? '🟡' : '🟢';
}

function pct(coverage: number): string {
  return `${Math.round(coverage * 100)}%`;
}

function bar(coverage: number, width = 20): string {
  const filled = Math.round(coverage * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

// ---------------------------------------------------------------------------
// Section renderers
// ---------------------------------------------------------------------------

function renderSummaryTable(report: ReviewerReport): string {
  const rows = report.criteria.map((c) => {
    const emoji = scoreEmoji(c.score, c.threshold);
    return `| ${emoji} **${c.criterionTitle}** | **${c.score}** / ${c.maxScore} | ≥ ${c.threshold} | ${passLabel(c.passed)} | \`${bar(c.adjustedCoverage, 15)}\` ${pct(c.adjustedCoverage)} |`;
  });

  const overallEmoji = report.overallPassed ? '✅' : '❌';
  const overallRow = `| ${overallEmoji} **Total** | **${report.overallScore}** / ${report.maxPossibleScore} | ≥ 10.0 | ${passLabel(report.overallPassed)} | |`;

  return [
    '| Criterion | Score | Threshold | Status | Coverage |',
    '|-----------|:-----:|:---------:|--------|----------|',
    ...rows,
    `| | | | | |`,
    overallRow,
  ].join('\n');
}

function renderSignalTable(criterion: CriterionAssessment): string {
  const rows = criterion.signals.map((s) => {
    const icon = s.confidence >= 0.65 ? '✅' : s.confidence >= 0.35 ? '⚠️' : '❌';
    const confStr = `${Math.round(s.confidence * 100)}%`;
    const wStr    = `${Math.round(s.weight * 100)}%`;
    return `| ${icon} | ${s.label} | ${confStr} | ${wStr} | ${s.detail} |`;
  });

  return [
    '| | Signal | Confidence | Weight | Detail |',
    '|---|--------|:----------:|:------:|--------|',
    ...rows,
  ].join('\n');
}

function renderCriterionSection(c: CriterionAssessment): string {
  const statusLine = c.passed
    ? `> ✅ **PASS** — ${c.rationale}`
    : `> ❌ **BELOW THRESHOLD** — ${c.rationale}`;

  const coverageLine = `**Coverage:** \`${bar(c.adjustedCoverage)}\` ${pct(c.adjustedCoverage)}  |  **Score:** ${c.score} / ${c.maxScore}  |  **Threshold:** ≥ ${c.threshold}`;

  const strengthsBlock =
    c.strengths.length > 0
      ? c.strengths.map((s) => `- ✅ ${s}`).join('\n')
      : '_No signals at ≥65% confidence for this criterion._';

  const weaknessesBlock =
    c.weaknesses.length > 0
      ? c.weaknesses.map((w) => `- ⚠️ ${w}`).join('\n')
      : '_No major weaknesses detected._';

  const evidenceBlock = c.signals
    .filter((s) => s.found && s.evidence.length > 0)
    .map((s) => `  - **${s.label}**: \`${s.evidence[0]}\``)
    .join('\n');

  return [
    `### ${c.criterionTitle} — ${c.score} / ${c.maxScore}`,
    '',
    statusLine,
    '',
    coverageLine,
    '',
    '#### Strengths',
    strengthsBlock,
    '',
    '#### Weaknesses',
    weaknessesBlock,
    '',
    '<details>',
    '<summary>Signal breakdown (click to expand)</summary>',
    '',
    renderSignalTable(c),
    '',
    evidenceBlock.length > 0 ? '**Evidence snippets:**\n' + evidenceBlock : '',
    '',
    '</details>',
  ].join('\n');
}

function renderMissingItems(items: MissingItem[]): string {
  if (items.length === 0) return '_No missing items — all signals have adequate coverage._\n';

  const required    = items.filter((i) => i.severity === 'required');
  const recommended = items.filter((i) => i.severity === 'recommended');

  const sections: string[] = [];

  if (required.length > 0) {
    sections.push('#### 🔴 Required — fix before submission');
    sections.push('');
    for (const item of required) {
      sections.push(`- [ ] **[${item.criterion.charAt(0).toUpperCase() + item.criterion.slice(1)}] ${item.label}**`);
      sections.push(`  > ${item.howToFix}`);
      sections.push(`  > _Estimated time: ${item.timeEstimateMinutes} min · Score impact: ${item.estimatedScoreImpact}_`);
      sections.push('');
    }
  }

  if (recommended.length > 0) {
    sections.push('#### 🟡 Recommended — will improve score');
    sections.push('');
    for (const item of recommended) {
      sections.push(`- [ ] **[${item.criterion.charAt(0).toUpperCase() + item.criterion.slice(1)}] ${item.label}**`);
      sections.push(`  > ${item.howToFix}`);
      sections.push(`  > _Estimated time: ${item.timeEstimateMinutes} min · Score impact: ${item.estimatedScoreImpact}_`);
      sections.push('');
    }
  }

  return sections.join('\n');
}

function renderActionPlan(actions: ActionItem[]): string {
  if (actions.length === 0) return '_No actions needed — all signals are well-covered._\n';

  const timeTotal = actions.reduce((s, a) => s + a.timeEstimateMinutes, 0);
  const rows = actions.map((a) => {
    const emoji = urgencyEmoji(a.urgency);
    const section = a.sectionHint ? `\`${a.sectionHint}\`` : '—';
    const time = `${a.timeEstimateMinutes} min`;
    return `| ${emoji} **${a.priority}** | ${time} | ${section} | ${a.action} | ${a.scoreImpact} |`;
  });

  return [
    `> Total estimated time: **~${timeTotal} minutes**`,
    '',
    '| # | Time | Section | Action | Score impact |',
    '|:---:|:----:|:-------:|--------|-------------|',
    ...rows,
  ].join('\n');
}

function renderStructureChecks(checks: ReviewerReport['structureChecks']): string {
  return checks
    .map((c) => {
      const icon = c.present ? '✅' : '❌';
      return `- ${icon} **${c.label}** — ${c.detail}`;
    })
    .join('\n');
}

function renderTransparencyNote(report: ReviewerReport): string {
  const formula = [
    '```',
    'For each criterion:',
    '  rawCoverage        = Σ(signal.weight × signal.confidence) / Σ(signal.weight)',
    '  adjustedCoverage   = rawCoverage + structureAdjustment',
    '  score              = coverageToScore(adjustedCoverage)   →  round(adjustedCoverage × 5 × 2) / 2   (0.5 steps)',
    '',
    'Score → threshold mapping:',
    '  score ≥ 3.0 per criterion  AND  total ≥ 10.0  →  PASS',
    '',
    'Coverage → score breakpoints:',
    '  0.00 → 0.0   0.10 → 0.5   0.20 → 1.0   0.30 → 1.5   0.40 → 2.0',
    '  0.50 → 2.5   0.55 → 3.0 ← threshold     0.70 → 3.5   0.80 → 4.0',
    '  0.90 → 4.5   1.00 → 5.0',
    '```',
  ].join('\n');

  const derivations = report.criteria
    .map((c) => [
      `<details>`,
      `<summary><strong>${c.criterionTitle}</strong> derivation (click to expand)</summary>`,
      '',
      '```',
      c.derivation,
      '```',
      '',
      '</details>',
    ].join('\n'))
    .join('\n\n');

  return [
    'This report is generated **deterministically** from the draft text.',
    'The same draft always produces the same report.',
    '',
    '### Scoring formula',
    formula,
    '',
    '### Per-criterion derivations',
    derivations,
    '',
    `**Draft statistics:** ${report.draftWordCount} words · ${report.draftSectionCount} headings`,
    `**Generated:** ${report.generatedAt}`,
    `**Scheme:** \`${report.schemeId}\``,
  ].join('\n');
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Render a ReviewerReport as a Markdown string.
 * Pure function: no side effects.
 */
export function formatMarkdownReport(report: ReviewerReport): string {
  const overallBanner = report.overallPassed
    ? `> ✅ **OVERALL: PASS** — Score ${report.overallScore}/${report.maxPossibleScore} · All criterion thresholds met`
    : `> ❌ **OVERALL: BELOW THRESHOLD** — Score ${report.overallScore}/${report.maxPossibleScore} · See missing items below`;

  return [
    `# Reviewer Report`,
    ``,
    `> **Scheme:** ${report.schemeId.replace(/_/g, ' ')} · **Generated:** ${report.generatedAt.slice(0, 10)}`,
    `> **⚠ Heuristic assessment only** — not a prediction of evaluation outcome. Same draft → same report (deterministic).`,
    ``,
    overallBanner,
    ``,
    `---`,
    ``,
    `## Score Summary`,
    ``,
    renderSummaryTable(report),
    ``,
    `---`,
    ``,
    `## Structure Checks`,
    ``,
    renderStructureChecks(report.structureChecks),
    ``,
    `---`,
    ``,
    `## Criterion Assessments`,
    ``,
    report.criteria.map(renderCriterionSection).join('\n\n---\n\n'),
    ``,
    `---`,
    ``,
    `## All Strengths`,
    ``,
    report.allStrengths.length > 0
      ? report.allStrengths.map((s) => `- ✅ ${s}`).join('\n')
      : '_No signals at strength level across all criteria._',
    ``,
    `## All Weaknesses`,
    ``,
    report.allWeaknesses.length > 0
      ? report.allWeaknesses.map((w) => `- ⚠️ ${w}`).join('\n')
      : '_No major weaknesses detected._',
    ``,
    `---`,
    ``,
    `## Missing Items Checklist`,
    ``,
    renderMissingItems(report.missingItems),
    ``,
    `---`,
    ``,
    `## Next 30 Minutes — Action Plan`,
    ``,
    renderActionPlan(report.actionItems),
    ``,
    `---`,
    ``,
    `## Transparency Note`,
    ``,
    renderTransparencyNote(report),
    ``,
  ].join('\n');
}
