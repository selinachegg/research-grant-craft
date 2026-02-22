/**
 * POST /api/generate
 *
 * Generate an initial proposal draft from wizard state.
 *
 * Request body:
 *   {
 *     wizardState: WizardState,
 *     config: LlmConfig        // endpoint + apiKey + model
 *   }
 *
 * Response:
 *   { draftMarkdown: string, isMock: boolean }
 *
 * Behaviour:
 *   - If config.endpoint or config.apiKey is empty → mock mode (no external call).
 *   - Otherwise → calls the configured OpenAI-compatible endpoint.
 *
 * Errors:
 *   400  Missing or invalid body
 *   502  Upstream LLM API error
 *   500  Internal error
 */

import { NextRequest, NextResponse } from 'next/server';
import { generateMockDraft } from '@/lib/llm/mock';
import type { WizardState } from '@/lib/wizard/types';
import type { LlmConfig } from '@/lib/llm/types';

function buildPrompt(state: WizardState): string {
  const objectives = state.objectives
    .filter((o) => o.text.trim())
    .map((o, i) => `O${i + 1}: ${o.text}`)
    .join('\n');

  const partners = state.partners
    .filter((p) => p.name.trim())
    .map((p) => `- ${p.name} (${p.country}, ${p.type}): ${p.role}`)
    .join('\n');

  return `You are an expert scientific grant writer. Generate a structured Horizon Europe RIA proposal draft in Markdown format based on the following intake information.

Project acronym: ${state.acronym}
Full title: ${state.fullTitle}
Abstract: ${state.abstract}

Objectives:
${objectives || '[None provided]'}

Current TRL: ${state.currentTrl || '[Not specified]'}
Target TRL: ${state.targetTrl || '[Not specified]'}

State-of-art gap:
${state.stateOfArtGap || '[Not specified]'}

Consortium:
${partners || '[Not specified]'}

Project duration: ${state.durationMonths} months
Total budget: €${state.totalBudgetEuros || '[TBC]'}

Key milestones:
${state.keyMilestones || '[Not specified]'}

Generate a complete draft with three sections: 1. Excellence, 2. Impact, 3. Implementation.
Each section should have the appropriate Horizon Europe sub-sections.
Use formal academic English. Include quantified targets, methodology, and risk register.
Mark any information that was not provided as [TO BE COMPLETED].`;
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

  const { wizardState, config } = body as { wizardState: unknown; config: unknown };

  if (!wizardState || typeof wizardState !== 'object') {
    return NextResponse.json({ error: '`wizardState` is required.' }, { status: 400 });
  }

  const llmConfig = (config as LlmConfig | undefined) ?? { endpoint: '', apiKey: '', model: 'gpt-4o' };
  const state = wizardState as WizardState;

  // Mock mode: no endpoint or no key configured
  const isMock = !llmConfig.endpoint || !llmConfig.apiKey;

  if (isMock) {
    const draftMarkdown = generateMockDraft(state);
    return NextResponse.json({ draftMarkdown, isMock: true }, { status: 200 });
  }

  // Live mode: call the configured OpenAI-compatible endpoint
  try {
    const prompt = buildPrompt(state);

    const upstream = await fetch(`${llmConfig.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${llmConfig.apiKey}`,
      },
      body: JSON.stringify({
        model: llmConfig.model || 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert scientific grant writer. Produce well-structured, accurate Markdown proposal drafts.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error('[/api/generate] Upstream error:', upstream.status, errText);
      return NextResponse.json(
        { error: `LLM API returned ${upstream.status}. Check your endpoint and API key.` },
        { status: 502 },
      );
    }

    const data = await upstream.json();
    const draftMarkdown: string =
      data?.choices?.[0]?.message?.content ?? generateMockDraft(state);

    return NextResponse.json({ draftMarkdown, isMock: false }, { status: 200 });
  } catch (err) {
    console.error('[/api/generate] Error calling LLM:', err);
    return NextResponse.json(
      { error: 'Internal error calling LLM. Check server logs.' },
      { status: 500 },
    );
  }
}
