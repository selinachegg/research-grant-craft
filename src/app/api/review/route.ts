/**
 * POST /api/review
 *
 * Generate a deterministic Reviewer Report for a given draft markdown string.
 *
 * Request body:
 *   {
 *     draftContent: string,   // The draft proposal markdown
 *     schemeId?: string,      // defaults to "horizon_europe_ria_ia"
 *     draftId?: string        // optional, for correlation with draft records
 *   }
 *
 * Response:
 *   { report: ReviewerReport }
 *
 * Errors:
 *   400  Missing or invalid request body
 *   422  Draft too short to score meaningfully
 *   500  Internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateReviewerReport } from '@/lib/reviewer';
import type { SchemeDescriptor } from '@/lib/reviewer';

// ---------------------------------------------------------------------------
// Scheme registry (expand as new packs are added)
// ---------------------------------------------------------------------------

const SCHEME_DEFAULTS: Record<string, SchemeDescriptor> = {
  horizon_europe_ria_ia: {
    id: 'horizon_europe_ria_ia',
    name: 'Horizon Europe RIA/IA',
    criteria: [
      { id: 'excellence',     title: 'Excellence',     threshold: 3.0, maxScore: 5 },
      { id: 'impact',         title: 'Impact',         threshold: 3.0, maxScore: 5 },
      { id: 'implementation', title: 'Implementation', threshold: 3.0, maxScore: 5 },
    ],
  },
};

const DEFAULT_SCHEME_ID = 'horizon_europe_ria_ia';

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body.' },
      { status: 400 },
    );
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { draftContent, schemeId, draftId } = body as Record<string, unknown>;

  // Validate draftContent
  if (typeof draftContent !== 'string') {
    return NextResponse.json(
      { error: '`draftContent` must be a string.' },
      { status: 400 },
    );
  }

  if (draftContent.trim().length < 50) {
    return NextResponse.json(
      {
        error: 'Draft is too short to score meaningfully (minimum 50 characters).',
        wordCount: draftContent.trim().split(/\s+/).length,
      },
      { status: 422 },
    );
  }

  // Resolve scheme
  const resolvedSchemeId = typeof schemeId === 'string' ? schemeId : DEFAULT_SCHEME_ID;
  const scheme = SCHEME_DEFAULTS[resolvedSchemeId];

  if (!scheme) {
    return NextResponse.json(
      {
        error: `Unknown scheme ID: "${resolvedSchemeId}". Available: ${Object.keys(SCHEME_DEFAULTS).join(', ')}.`,
      },
      { status: 400 },
    );
  }

  try {
    const report = generateReviewerReport(draftContent, scheme);

    return NextResponse.json(
      {
        report,
        meta: {
          draftId: typeof draftId === 'string' ? draftId : null,
          schemeId: resolvedSchemeId,
          generatedAt: report.generatedAt,
          draftWordCount: report.draftWordCount,
        },
      },
      { status: 200 },
    );
  } catch (err) {
    console.error('[/api/review] Error generating report:', err);
    return NextResponse.json(
      { error: 'Internal error generating report. Check server logs.' },
      { status: 500 },
    );
  }
}
