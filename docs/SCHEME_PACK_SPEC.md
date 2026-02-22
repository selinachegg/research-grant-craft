# Scheme Pack Specification — Research Grant Craft

A **scheme pack** is a self-contained directory that teaches Research Grant
Craft how to scaffold, guide, and evaluate a grant proposal for one specific
funding programme or call type.

This document defines the file layout, JSON schemas, validation rules, and
contribution guidelines for scheme packs.

---

## Directory layout

```
scheme_packs/
  <scheme_id>/
    pack.json             ← required: machine-readable metadata
    rubric.json           ← required: score descriptors
    guidance.md           ← required: authoring guidance per section
    PACK_README.md        ← required: sources, scope, limitations
    examples/
      sample_input.json   ← recommended: example wizard intake
      sample_output.md    ← recommended: example reviewer report excerpt
```

`<scheme_id>` must be a lowercase, underscore-separated identifier that is
unique across all packs (e.g., `horizon_europe_ria_ia`, `anr_prc`, `snf_project`).

---

## `pack.json` schema

```jsonc
{
  "id": "horizon_europe_ria_ia",          // string, matches directory name
  "name": "Horizon Europe RIA/IA",        // human-readable display name
  "version": "1.0.0",                     // semver
  "lastUpdated": "2024-01-01",            // ISO date of last content review
  "programme": "Horizon Europe",          // funding programme name
  "region": "EU",                         // geographic scope
  "grantTypes": ["RIA", "IA"],            // array of grant types covered
  "sourceUrl": "https://...",             // URL to official call document / template
  "licence": "CC-BY",                     // licence of the template text
  "criteria": [
    {
      "id": "excellence",                 // criterion ID (used in scorer)
      "title": "Excellence",              // display name
      "threshold": 3.0,                  // minimum passing score
      "maxScore": 5,                      // maximum score
      "pageLimit": null                   // optional page limit for this section
    }
    // ... additional criteria
  ],
  "sections": [
    {
      "id": "excellence_objectives",
      "title": "1.1 Objectives and Ambition",
      "criterion": "excellence",
      "required": true,
      "wordGuidance": "400–600"
    }
    // ... additional sections
  ]
}
```

Run `npm run validate-pack` to check your `pack.json` against the JSON Schema
at `scheme_packs/_schema/pack.schema.json`.

---

## `rubric.json` schema

Maps each possible score (0, 0.5, 1.0, … 5.0) to a descriptor string for
each criterion. Used in the reviewer report to label score levels.

```jsonc
{
  "excellence": {
    "0":   "Not evaluable — key content is missing or completely absent.",
    "0.5": "Not evaluable — extremely thin content.",
    "1":   "Poor — major weaknesses in all aspects.",
    // ...
    "5":   "Excellent — fully convincing in all aspects."
  },
  "impact": { /* ... */ },
  "implementation": { /* ... */ }
}
```

Each criterion must have descriptors for all 11 values:
`0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5`.

---

## `guidance.md` format

A Markdown file with one `##` heading per section ID, containing:

- A brief description of what evaluators look for
- 3–6 bullet points of authoring tips
- Common mistakes to avoid

Example:

```markdown
## excellence_objectives

Evaluators assess whether objectives are **specific, measurable, and ambitious**.
At least three clearly numbered objectives are expected.

**Tips:**
- Use "O1: To develop…", "O2: To validate…" format
- Each objective should have a measurable success criterion
- State the starting TRL and the target TRL

**Common mistakes:**
- Listing activities instead of objectives ("We will run experiments" ≠ an objective)
- Objectives that cannot be verified at project end
```

---

## `PACK_README.md` required fields

```markdown
# Pack: <display name>

## Source documents
- [Official call template](<URL>)
- Work Programme reference: <version/year>

## Scope
What call types and grant sizes this pack covers.

## Known limitations
- Any criteria the pack does not yet model
- Regions or call types excluded
- Known inaccuracies

## Intellectual property note
Confirm that no verbatim text from restricted official documents is reproduced.

## Last reviewed
<ISO date> by <GitHub handle>
```

---

## Signal weights

Each scheme pack does **not** define its own signals — signals are defined in
`src/lib/reviewer/signals.ts`. However, a pack's `criteria` array specifies
the threshold and maximum score, which affect the pass/fail determination.

If a new scheme requires additional signals (e.g., a criterion not present in
the default Horizon Europe set), open a
[feature request issue](https://github.com/selinachegg/research-grant-craft/issues/new?template=feature_request.yml)
to discuss extending the signal library before submitting a PR.

---

## Validation

```bash
# Validate all packs
npm run validate-pack

# Validate a single pack
npm run validate-pack -- scheme_packs/my_new_pack/pack.json
```

The validator checks:

1. JSON schema compliance for `pack.json` and `rubric.json`
2. All required files present
3. Rubric has all 11 score descriptors per criterion
4. `id` matches the directory name

A PR that fails validation will not be merged.

---

## Intellectual property guidance

Many funding agencies publish official proposal templates and evaluation
criteria. Before reproducing any text:

1. Check the licence of the source document.
2. If the document is © European Commission or another body, **do not copy
   verbatim text**. Paraphrase, summarise, or link to the official source.
3. Add a note in `PACK_README.md` confirming your compliance.

When in doubt, describe the criterion in your own words and provide a link to
the official document for the exact wording.
