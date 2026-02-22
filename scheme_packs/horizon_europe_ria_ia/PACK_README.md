# Scheme Pack: `horizon_europe_ria_ia`

**Horizon Europe — Research and Innovation Action (RIA) / Innovation Action (IA)**
Pack version: `1.0.0` | Spec version: `1` | Last reviewed: 2024-09-01

---

## What this pack covers

This scheme pack encodes the standard proposal structure and evaluation logic for **Horizon Europe RIA and IA** calls, as defined in the Horizon Europe Programme Guide and applied by the EC's independent expert review panels.

It is intentionally **generic** — it covers the standard three-criteria structure (Excellence / Impact / Implementation) used across the majority of Horizon Europe work programme topics. Call-specific variations (different page limits, additional sub-sections, topic-specific expected outcomes) must be handled by the user per the guidance below.

## Files

| File | Purpose |
|------|---------|
| `pack.json` | Machine-readable scheme definition: sections, criteria, compliance checklist, scoring rules, keyword index |
| `rubric.json` | Criterion-specific scoring descriptors (0–5) used by the GrantCraft Reviewer Report engine |
| `guidance.md` | Practical writing tips per section, aimed at researchers preparing a submission |
| `examples/sample_input.json` | Example GrantCraft wizard input (AGRI-ADAPT project) |
| `examples/sample_output.md` | Example generated proposal draft corresponding to `sample_input.json` |
| `PACK_README.md` | This file |

## How scoring works

The GrantCraft Reviewer Report engine:

1. Parses the draft markdown to locate content under each section header.
2. For each criterion (Excellence, Impact, Implementation), checks:
   - Presence and completeness of each required subsection.
   - Coverage of `keywords_to_cover` listed in `pack.json` subsection definitions.
   - Word count vs. `word_count_guidance` targets.
   - Presence of structural elements (tables, numbered lists, milestone markers).
3. Maps the aggregate sub-scores to the 0–5 rubric descriptors in `rubric.json`.
4. Checks each item in `compliance_checklist` for textual evidence.

Scores are **heuristic estimates** to guide revision — not predictions of evaluation outcome.

## Call-specific customisation

Before submitting, always verify against your specific call topic:

- **Page limit**: Check Section 5 of the call topic text. The default of 45 pages often differs.
- **Expected Outcomes**: Replace `[Copy the exact expected outcomes from the call text here]` placeholders with the verbatim bullet points from your call topic.
- **Sub-section requirements**: Some calls add a mandatory `1.4 Open Science` section under Excellence, or combine Impact sub-sections differently.
- **Evaluation threshold**: Most calls use 3/5 per criterion and 10/15 overall — but verify in the evaluation form annex to your call.

## Accuracy and maintenance

This pack is derived from:
- Horizon Europe Programme Guide v3.0 (April 2023)
- HE Standard Application Form (RIA/IA), Part B template
- HE Model Grant Agreement

The content of Horizon Europe calls evolves with each annual Work Programme. If you notice an inaccuracy, please:
1. Open a GitHub issue tagged `scheme-pack` and `horizon_europe_ria_ia`.
2. Reference the specific document and version number that contradicts the pack.
3. Propose corrected text in a pull request following the [Scheme Pack Contributor Guide](../../docs/scheme-pack-guide.md).

## Licence

This scheme pack is released under the MIT licence as part of GrantCraft. The evaluation criteria and rubric language are derived from publicly available European Commission documents and are not independently copyrightable as factual/procedural information.
