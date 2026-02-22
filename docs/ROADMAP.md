# Roadmap — Research Grant Craft

This roadmap describes the intended direction of the project. It is
**aspirational**, not a commitment. Priorities may shift based on contributor
availability and community feedback.

To propose a feature or comment on an item, open a
[feature request issue](https://github.com/selinachegg/research-grant-craft/issues/new?template=feature_request.yml).

---

## v0.1 — Foundation (current)

- [x] Wizard intake flow (project title, acronym, objectives, consortium)
- [x] Draft editor with live Markdown preview
- [x] Deterministic heuristic reviewer report (22 signals, 3 criteria)
- [x] Horizon Europe RIA/IA scheme pack
- [x] Scheme pack JSON schema + validation script
- [x] Mock mode (no API keys required)
- [x] Local-first storage (browser `localStorage`)
- [x] MIT licence, community files, GitHub issue templates

---

## v1.0 — Stable release

- [ ] Export draft as formatted Markdown file (download)
- [ ] Export reviewer report as Markdown file
- [ ] DOCX export via `pandoc` or equivalent
- [ ] Additional scheme packs: ANR (France), SNF (Switzerland), FNR (Luxembourg)
- [ ] Full accessibility audit (WCAG 2.1 AA)
- [ ] Improved signal library (ethics, gender, RRI signals)
- [ ] Configurable LLM endpoint with provider selector (OpenAI, Anthropic, Ollama)
- [ ] Comprehensive end-to-end tests

---

## v2.0 — Collaboration features

- [ ] Optional server-side persistence (self-hosted, opt-in)
- [ ] Draft versioning and diff view
- [ ] Collaborative editing (share a draft link within an institution)
- [ ] LaTeX export for submission-ready formatting
- [ ] Section-level comments and review annotations

---

## v3.0 — Extended scheme coverage

- [ ] ERC Starting Grant / Consolidator Grant / Advanced Grant
- [ ] Wellcome Trust schemes
- [ ] NIH R01 (US)
- [ ] Plugin / extension API for third-party scheme pack distribution
- [ ] Multilingual support (French, German, Spanish)

---

## Out of scope (permanently)

The following are explicitly out of scope to preserve the tool's focus and
privacy guarantees:

- Submission portal integration (direct upload to EC Funding & Tenders Portal)
- User accounts or cloud storage managed by this project
- Automated bibliometric or citation checking
- Legal or compliance advice
