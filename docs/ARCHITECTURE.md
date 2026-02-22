# Architecture — Research Grant Craft

This document describes the high-level component architecture of
**Research Grant Craft**. It is intended for contributors who want to understand
how the pieces fit together before making changes.

---

## Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                             │
│                                                             │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────┐  │
│  │    Wizard    │──▶│  Draft Editor  │──▶│   Reviewer   │  │
│  │  (intake UI) │   │  (Markdown +   │   │   Report UI  │  │
│  │              │   │   live preview)│   │              │  │
│  └──────────────┘   └───────┬────────┘   └──────┬───────┘  │
│                             │                   │           │
│                    localStorage           API call          │
│                             │            POST /api/review   │
└─────────────────────────────┼─────────────────┼────────────┘
                              │                 │
                   ┌──────────▼─────────────────▼──────────┐
                   │           Next.js App Router           │
                   │                                        │
                   │  ┌─────────────┐  ┌────────────────┐  │
                   │  │  LLM Adapter│  │  Reviewer      │  │
                   │  │  (optional) │  │  Engine        │  │
                   │  └──────┬──────┘  └───────┬────────┘  │
                   │         │                 │           │
                   └─────────┼─────────────────┼───────────┘
                             │                 │
                    ┌────────▼───────┐ ┌───────▼────────┐
                    │  External LLM  │ │  Scheme Packs  │
                    │  (opt-in only) │ │  (local JSON)  │
                    └────────────────┘ └────────────────┘
```

---

## Components

### 1. Wizard (intake UI)

**Location:** `src/app/wizard/`

A multi-step form that collects structured intake data from the researcher:

- Project acronym, title, and abstract
- Research objectives (SMART format)
- Consortium partners and roles
- Target call / scheme selection
- Timeline and budget envelope

The wizard state is persisted to `localStorage` on every change. No server
round-trip is required to complete the wizard.

---

### 2. Draft Editor

**Location:** `src/app/editor/` (planned)

A split-pane Markdown editor with live preview. The draft is stored in
`localStorage` under a per-draft UUID key.

Features:
- Section scaffolding generated from the active scheme pack's section list
- Inline hints pulled from scheme pack `guidance.md`
- Word and character count per section
- Manual save + export (Markdown download)

---

### 3. LLM Adapter

**Location:** `src/lib/llm/`

An abstraction layer over language model APIs. It accepts a structured prompt
(wizard intake + section instruction) and returns a Markdown string.

**Mock mode (default):** Returns static placeholder text. No outbound network
request is made. Used for development and for users without API keys.

**Live mode (opt-in):** Sends the prompt to the configured
OpenAI-compatible endpoint. The adapter is stateless — it does not cache or
store any model output.

Supported backends (planned):
- OpenAI (`gpt-4o`, `gpt-4o-mini`)
- Anthropic (`claude-*`)
- Ollama (local, self-hosted)

---

### 4. Reviewer Engine

**Location:** `src/lib/reviewer/`

A **pure, deterministic** heuristic analysis engine. Given a draft Markdown
string and a scheme descriptor, it produces a `ReviewerReport` with no
randomness and no external calls.

Sub-modules:

| File | Responsibility |
|------|---------------|
| `signals.ts` | 22 weighted signal predicates (regex-based pattern matching) |
| `scorer.ts` | Weighted coverage → score mapping; structure checks; missing items; action plan |
| `report.ts` | Renders `ReviewerReport` as a Markdown string |
| `types.ts` | Shared TypeScript interfaces |
| `index.ts` | Public API surface |

**Scoring formula (transparent):**

```
rawCoverage      = Σ(signal.weight × signal.confidence) / Σ(signal.weight)
adjustedCoverage = rawCoverage + structuralPenalties
score            = round(adjustedCoverage × 5 × 2) / 2   (0.5 steps, clamped [0, 5])
```

Pass condition: score ≥ threshold (3.0) per criterion AND total ≥ 10.0.

---

### 5. Scheme Packs

**Location:** `scheme_packs/<scheme_id>/`

A scheme pack is a self-contained directory that defines the evaluation
criteria, scoring rubric, and authoring guidance for one funding programme.

```
scheme_packs/<id>/
  pack.json       ← machine-readable: criteria, weights, section list
  rubric.json     ← score descriptors (0–5 in 0.5 steps) per criterion
  guidance.md     ← human-readable authoring tips per section
  PACK_README.md  ← sources, scope, known limitations, last updated
  examples/
    sample_input.json
    sample_output.md
```

See [`docs/SCHEME_PACK_SPEC.md`](SCHEME_PACK_SPEC.md) for the full
specification and instructions for adding a new pack.

---

## Data flow summary

```
User fills Wizard
    │
    ▼  (localStorage)
Wizard state ──▶ LLM Adapter (optional) ──▶ Draft Markdown
                                                   │
                                         (localStorage)
                                                   │
                                                   ▼
                                         POST /api/review
                                                   │
                                                   ▼
                                         Reviewer Engine
                                         (pure function)
                                                   │
                                                   ▼
                                         ReviewerReport (JSON)
                                                   │
                                                   ▼
                                         Reviewer Report UI
                                         (Markdown rendered)
```

---

## Key design principles

1. **Local-first.** No proposal data is sent to any server owned by this
   project. The reviewer engine runs as a Next.js API route on the local server
   (dev) or the user's own deployment.

2. **Deterministic reviewer.** The same draft always produces the same report.
   No LLM is involved in the reviewer report — it is a pure function.

3. **Extensible scheme packs.** Adding a new funding programme requires only a
   new directory under `scheme_packs/` with no code changes.

4. **Mock-first development.** The app is fully functional without any API keys
   or external services.
