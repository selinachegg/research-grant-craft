# Contributing to Research Grant Craft

Thank you for taking the time to contribute. This document explains how to get
involved, what maintainers expect from pull requests, and how the project is
governed.

## Table of Contents

1. [Ways to contribute](#ways-to-contribute)
2. [Setting up a development environment](#setting-up-a-development-environment)
3. [Submitting a pull request](#submitting-a-pull-request)
4. [Adding a new scheme pack](#adding-a-new-scheme-pack)
5. [Reporting bugs and requesting features](#reporting-bugs-and-requesting-features)
6. [Code style and quality bar](#code-style-and-quality-bar)
7. [Maintainer expectations](#maintainer-expectations)
8. [Code of Conduct](#code-of-conduct)

---

## Ways to contribute

| Type | How |
|------|-----|
| Bug report | Open a [bug report issue](https://github.com/selinachegg/research-grant-craft/issues/new?template=bug_report.yml) |
| Feature request | Open a [feature request issue](https://github.com/selinachegg/research-grant-craft/issues/new?template=feature_request.yml) |
| New scheme pack | Open a [new scheme pack issue](https://github.com/selinachegg/research-grant-craft/issues/new?template=new_scheme_pack.yml) or submit a PR |
| Documentation | Edit files under `docs/` or inline JSDoc |
| Code | Fix a bug or implement a triaged feature — see PR guide below |

---

## Setting up a development environment

**Prerequisites:** Node.js ≥ 18, npm ≥ 9.

```bash
git clone https://github.com/selinachegg/research-grant-craft.git
cd research-grant-craft
npm install
npm run dev        # starts Next.js dev server at http://localhost:3000
npm test           # run Jest unit tests
npm run lint       # ESLint check
npm run validate-pack  # validate all scheme pack JSON files
```

The app works without any API keys in **mock mode** — LLM calls return
placeholder text so you can develop and test the full UI flow offline.

---

## Submitting a pull request

1. **Fork** the repository and create a branch from `main`:
   ```bash
   git checkout -b fix/my-descriptive-branch-name
   ```

2. **Make your changes.** Keep commits atomic and well-described.

3. **Run the test suite** and ensure it passes:
   ```bash
   npm test && npm run lint
   ```

4. **Open a PR** against `main` using the provided PR template. Fill in all
   sections — incomplete PRs may be closed without review.

5. A maintainer will review within **7 days** for small PRs. Larger changes may
   take longer.

### PR checklist (also in the PR template)

- [ ] Tests added or updated for new behaviour
- [ ] `npm test` passes locally
- [ ] `npm run lint` passes with no new warnings
- [ ] Docs updated if public API or configuration changed
- [ ] Scheme pack weights validated if signals were modified (`npm run validate-pack`)

---

## Adding a new scheme pack

Scheme packs are self-contained directories under `scheme_packs/`. See
[`docs/SCHEME_PACK_SPEC.md`](docs/SCHEME_PACK_SPEC.md) for the full
specification.

**Quick summary:**

```
scheme_packs/<scheme_id>/
  pack.json          # machine-readable metadata + criteria
  rubric.json        # per-score descriptors (0–5 in 0.5 steps)
  guidance.md        # human-readable author guidance
  PACK_README.md     # sources, scope, known limitations
  examples/
    sample_input.json
    sample_output.md
```

Run `npm run validate-pack` before opening a PR to confirm your pack passes
the JSON schema.

> **Intellectual property note:** Do not copy verbatim text from official call
> documents if their licence restricts reproduction. Paraphrase or summarise
> criteria in your own words and link to the official source.

---

## Reporting bugs and requesting features

Use the GitHub issue templates. The more context you provide (steps to
reproduce, expected vs. actual behaviour, environment details), the faster
maintainers can triage.

For **security vulnerabilities**, do **not** open a public issue. See
[`SECURITY.md`](SECURITY.md) for the responsible-disclosure process.

---

## Code style and quality bar

- **TypeScript strict mode** is enabled. Avoid `any` casts where possible.
- **Pure functions** in `src/lib/reviewer/` — no side effects, no I/O, same
  input → same output.
- **Signal weights per criterion must sum to 1.00 ± 0.01.** A module-load
  warning fires if they don't.
- Prefer editing existing files over creating new ones.
- Do not add unnecessary comments; code should be self-explanatory.

---

## Maintainer expectations

- PRs that fail CI (tests, lint) will not be merged until fixed.
- Maintainers may request changes; please address them within 14 days or the PR
  may be closed.
- Maintainers reserve the right to close issues and PRs that are out of scope
  or do not meet quality standards.
- All contributors are expected to follow the [Code of Conduct](CODE_OF_CONDUCT.md).

---

## Code of Conduct

By participating in this project you agree to abide by the
[Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).
