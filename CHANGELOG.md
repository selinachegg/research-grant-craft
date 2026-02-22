# Changelog

All notable changes to Research Grant Craft are documented here.

---

## [Unreleased]

---

## [0.4.0] — 2026-02-22

### Added
- **AI-assisted reviewer** — optional mode toggle on the review page (Heuristic | AI Reviewer). Heuristic stays the default (free, instant); AI reviewer calls the configured LLM to evaluate the draft against Horizon Europe criteria (Excellence, Impact, Implementation) with scores, strengths, weaknesses, and recommendations.
- **PDF export** — print-ready PDF from both the editor toolbar and the review page. Client-side markdown → HTML converter with A4 print CSS; AI-finalized export via `/api/export-finalize` produces clean output with no markdown symbols and all `[FILL IN:]` placeholders replaced with realistic content.
- **LaTeX export** — downloads a compilable `.tex` file. Client-side markdown → LaTeX converter; AI-finalized export produces valid LaTeX ready for Overleaf.
- **AI Polish** — ✨ Polish button in the editor toolbar. Calls `/api/improve` to improve prose in place without erasing the researcher's content, structure, or ideas.
- **Completed lifecycle status** — proposals can be marked as completed. New green Completed tab on the home page, toggle buttons on draft cards, a status badge in the editor toolbar, and a "Happy with the results? Mark as Completed" CTA on the review page. Status persisted in localStorage.
- **Model dropdown in Settings** — pre-filled list of common OpenAI-compatible model IDs.

### Fixed
- Heading regex patterns in the heuristic reviewer were not matching numbered headings (`## 1. Excellence`) — missing `\s*` after the number group.
- `coverageToScore` function name now appears in the Transparency Note of the reviewer report.
- Determinism test in the reviewer suite now correctly strips both timestamp occurrences before comparing reports.

---

## [0.3.0] — 2026-02-22

### Changed
- **Full premium redesign** — Stripe/Notion-style UI with dark mode, refined typography, consistent spacing, and a polished color system throughout the app.

### Reverted
- EU member state flags row removed from the hero section after brief experiment.

---

## [0.2.0] — 2025

### Added
- **Multi-proposal queue** — manage multiple grant proposals from the home page, each with its own editor and review flow.
- **Delete buttons** on draft cards.
- **AI settings page** — configure LLM endpoint, API key, and model. Supports OpenAI, Ollama, and any OpenAI-compatible API. Falls back to mock mode when no key is provided.
- **Structured fill-in templates** — draft generation produces a structured Markdown document with `[FILL IN: ...]` markers for sections the researcher must complete, rather than a fully AI-written text.
- Screenshots added to README (wizard, editor, reviewer report, AI settings).

### Fixed
- Hydration warning on `<body>` caused by browser extensions suppressed.
- Next.js 16 webpack/turbopack conflict warning silenced via config.
- Syntax error in `outcomes_linked` signal description (unescaped apostrophe).

### Changed
- Upgraded to **Next.js 16 + React 19 + ESLint 9** — 0 known vulnerabilities.

---

## [0.1.0] — 2025

### Added
- Initial release of Research Grant Craft.
- Grant proposal wizard (multi-step form collecting project details, objectives, consortium, budget).
- AI-powered draft generation via OpenAI-compatible API.
- Heuristic reviewer with 22 signals across 3 Horizon Europe criteria (Excellence, Impact, Implementation) — fully deterministic, no API key required.
- Live Markdown editor with word count and auto-save to localStorage.
- Local-first architecture — all data stored in the browser, no server, no account required.
- MIT licence.
