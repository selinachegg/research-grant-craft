/**
 * POST /api/improve
 *
 * Improves an existing proposal draft in place — the AI polishes
 * what the researcher wrote without erasing it or starting over.
 *
 * Difference from /api/generate:
 *   - Input is the researcher's edited draft (not wizard state)
 *   - Output is the same draft with better prose, same structure
 *   - All researcher content, facts, and ideas are preserved
 *   - No [FILL IN:] placeholders are added or removed
 *
 * Request body:
 *   { draftContent: string, config: LlmConfig }
 *
 * Response:
 *   { improvedContent: string, model: string }
 *
 * Errors:
 *   400  Missing/invalid body or no API key (code: 'NO_CONFIG')
 *   422  Draft too short
 *   502  Upstream LLM error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import type { LlmConfig } from '@/lib/llm/types';

const SYSTEM_PROMPT =
  'You are a senior Horizon Europe proposal consultant and scientific editor. ' +
  'You help researchers strengthen their proposals by improving the writing quality ' +
  'while fully preserving their content, ideas, and structure.';

function buildImprovePrompt(draftContent: string): string {
  return `You are improving a Horizon Europe research proposal draft that the researcher has written and edited.

YOUR TASK:
Improve the prose, clarity, and persuasiveness of this draft in place. Do NOT rewrite it from scratch.

STRICT RULES — follow these exactly:
1. Keep ALL the researcher's content, facts, figures, and ideas — do not remove anything
2. Keep the SAME structure: same sections, same headings, same order
3. Do NOT add [FILL IN: ...] placeholders of any kind
4. Do NOT change technical claims the researcher has made without clear reason
5. Do NOT add entire new sections that did not exist

WHAT TO IMPROVE:
- Academic writing quality: formal register, precise vocabulary, active voice where appropriate
- Clarity: remove redundancy, simplify convoluted sentences, sharpen claims
- Coherence: improve transitions between paragraphs and sections
- Persuasiveness: strengthen the narrative arc, make the innovation and impact clearer
- HE alignment: frame language around Excellence (novelty, state of the art), Impact (societal/economic/scientific), and Implementation (methodology, consortium, risk management)
- [FILL IN: ...] markers that already exist: leave them exactly as they are

OUTPUT FORMAT:
Return the improved Markdown draft only. Same format as input (headings, lists, tables, blockquotes). No preamble, no comments, no explanation — just the improved draft.

DRAFT TO IMPROVE:
${draftContent}`;
}

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

  if (typeof draftContent !== 'string') {
    return NextResponse.json({ error: '`draftContent` must be a string.' }, { status: 400 });
  }

  if (draftContent.trim().length < 100) {
    return NextResponse.json(
      { error: 'Draft is too short to improve meaningfully (minimum 100 characters). Write more content first.' },
      { status: 422 },
    );
  }

  const llmConfig = config as LlmConfig | undefined;

  if (!llmConfig?.endpoint || !llmConfig?.apiKey) {
    return NextResponse.json(
      {
        error: 'No API key configured. Add your LLM endpoint and key in Settings to use AI Polish.',
        code: 'NO_CONFIG',
      },
      { status: 400 },
    );
  }

  try {
    const model = llmConfig.model || 'gpt-4o';
    const prompt = buildImprovePrompt(draftContent);

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
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[/api/improve] Upstream error:', upstream.status, errText);
      return NextResponse.json(
        { error: `LLM API returned ${upstream.status}. Check your endpoint and API key in Settings.` },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    const improvedContent: string = data?.choices?.[0]?.message?.content ?? '';

    if (!improvedContent) {
      return NextResponse.json(
        { error: 'LLM returned an empty response. Try again.' },
        { status: 502 },
      );
    }

    return NextResponse.json({ improvedContent, model }, { status: 200 });
  } catch (err) {
    console.error('[/api/improve] Error:', err);
    return NextResponse.json(
      { error: 'Internal error calling LLM. Check server logs.' },
      { status: 500 },
    );
  }
}
