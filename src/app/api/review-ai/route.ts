/**
 * POST /api/review-ai
 *
 * Generate an AI-powered Horizon Europe reviewer critique for a given draft.
 *
 * Request body:
 *   {
 *     draftContent: string,   // The draft proposal markdown
 *     config: LlmConfig       // endpoint + apiKey + model (from client settings)
 *   }
 *
 * Response:
 *   { aiReview: string, model: string }
 *
 * Errors:
 *   400  Missing/invalid body, or no API key configured (code: 'NO_CONFIG')
 *   422  Draft too short
 *   502  Upstream LLM API error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LlmConfig } from '@/lib/llm/types';

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT =
  'You are a senior expert evaluator for Horizon Europe funding programmes. ' +
  'You have reviewed hundreds of RIA and IA proposals and know the official evaluation rubric in detail. ' +
  'Be thorough, fair, specific, and constructive. Always cite the proposal text when supporting your points.';

function buildReviewPrompt(draftContent: string): string {
  return `Review the following Horizon Europe RIA/IA proposal draft against the three official evaluation criteria.

---

## PROPOSAL DRAFT

${draftContent}

---

## EVALUATION INSTRUCTIONS

Score each criterion from 0 to 5 (0.5-point steps):
- 0 = absent / not addressed
- 1 = poor
- 2 = fair
- 3 = good (minimum pass threshold)
- 4 = very good
- 5 = excellent

Pass conditions (Horizon Europe standard): **≥ 3.0 per criterion** AND **≥ 10.0 total** (out of 15).

Format your response EXACTLY as follows (use these headings and bold labels):

---

## Criterion 1: Excellence
**Score: X / 5**

**Strengths:**
- ...

**Weaknesses & gaps:**
- ...

**Recommendations:**
- ...

---

## Criterion 2: Impact
**Score: X / 5**

**Strengths:**
- ...

**Weaknesses & gaps:**
- ...

**Recommendations:**
- ...

---

## Criterion 3: Implementation
**Score: X / 5**

**Strengths:**
- ...

**Weaknesses & gaps:**
- ...

**Recommendations:**
- ...

---

## Overall Assessment
**Total score: X / 15 — [PASS / BORDERLINE / BELOW THRESHOLD]**

[2–3 sentences summarising the proposal's overall readiness and the single most important message for the researcher.]

---

## Top 5 Priority Improvements

1. ...
2. ...
3. ...
4. ...
5. ...

---

*AI-assisted assessment — indicative only. Scores may differ from those awarded by a real evaluation panel.*`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Request body must be a JSON object.' }, { status: 400 });
  }

  const { draftContent, config } = body as Record<string, unknown>;

  // Validate draftContent
  if (typeof draftContent !== 'string') {
    return NextResponse.json({ error: '`draftContent` must be a string.' }, { status: 400 });
  }

  if (draftContent.trim().length < 50) {
    return NextResponse.json(
      { error: 'Draft is too short to review meaningfully (minimum 50 characters).' },
      { status: 422 },
    );
  }

  // Validate LLM config — must be provided by the client (loaded from their localStorage settings)
  const llmConfig = config as LlmConfig | undefined;

  if (!llmConfig?.endpoint || !llmConfig?.apiKey) {
    return NextResponse.json(
      {
        error:
          'No API key configured. Please add your LLM endpoint and API key in Settings to use the AI reviewer.',
        code: 'NO_CONFIG',
      },
      { status: 400 },
    );
  }

  // Call the configured OpenAI-compatible endpoint
  try {
    const model = llmConfig.model || 'gpt-4o-mini';
    const prompt = buildReviewPrompt(draftContent);

    const upstream = await fetch(`${llmConfig.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[/api/review-ai] Upstream error:', upstream.status, errText);
      return NextResponse.json(
        { error: `LLM API returned ${upstream.status}. Check your endpoint and API key in Settings.` },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    const aiReview: string = data?.choices?.[0]?.message?.content ?? '';

    if (!aiReview) {
      return NextResponse.json(
        { error: 'LLM returned an empty response. Try again or switch to a different model.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ aiReview, model }, { status: 200 });
  } catch (err) {
    console.error('[/api/review-ai] Error calling LLM:', err);
    return NextResponse.json(
      { error: 'Internal error calling LLM. Check server logs.' },
      { status: 500 },
    );
  }
}
