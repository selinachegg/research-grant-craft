/**
 * index.ts — Public API for the GrantCraft reviewer module.
 *
 * Usage:
 *   import { generateReviewerReport, coverageToScore } from '@/lib/reviewer';
 *
 *   const report = generateReviewerReport(draftMarkdown);
 *   console.log(report.markdownReport);
 *   console.log(report.overallScore, report.overallPassed);
 */

export { generateReviewerReport, computeCriterionScore, coverageToScore, runStructureChecks } from './scorer';
export { formatMarkdownReport } from './report';
export { SIGNALS, signalsForCriterion, signalById, sat } from './signals';
export type {
  ReviewerReport,
  CriterionAssessment,
  SignalResult,
  RawCheckResult,
  Signal,
  MissingItem,
  ActionItem,
  StructureCheckResult,
  SchemeDescriptor,
  CriterionId,
} from './types';
