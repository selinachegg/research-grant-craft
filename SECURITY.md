# Security Policy — Research Grant Craft

## Supported Versions

| Version | Supported |
|---------|-----------|
| 0.x     | ✅        |

---

## Privacy Model

**Research Grant Craft** is designed **local-first** and **privacy-first**:

- **No proposal data is stored on any server.** All draft content lives in
  your browser's `localStorage` only. Nothing is sent to the Research Grant
  Craft project or its maintainers.
- **No telemetry.** The application does not phone home or collect usage data
  of any kind.
- **LLM calls are opt-in.** By default the app runs in **mock mode** with no
  outbound network requests. If you configure an OpenAI-compatible API endpoint,
  your draft text is sent to that endpoint — review the privacy policy of any
  third-party service you configure before entering sensitive proposal content.
- **No authentication required.** There are no user accounts, no login, and no
  remote persistence.

See [`PRIVACY.md`](PRIVACY.md) for the full privacy statement.

---

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not** open a public
GitHub issue, as this may expose the vulnerability before a fix is available.

Instead, use one of these channels:

1. **GitHub Security Advisories (preferred):** Click the **"Report a
   vulnerability"** button on the
   [Security tab](https://github.com/selinachegg/research-grant-craft/security)
   of the repository.
2. **Direct contact:** Reach the maintainers through the GitHub profile
   [@selinachegg](https://github.com/selinachegg).

Please include in your report:

- A clear description of the vulnerability and its potential impact
- Steps to reproduce (proof-of-concept code or detailed instructions)
- The version or commit hash where the issue was found
- Any suggested mitigations

**Response timeline:**

- Acknowledgement within **72 hours**
- Triage and initial assessment within **7 days**
- Fix and coordinated disclosure within **14 days** for critical issues;
  longer for complex issues requiring significant changes

---

## Dependency Security

We run `npm audit` as part of CI. If you notice a vulnerable or outdated
dependency, please open a [GitHub issue](https://github.com/selinachegg/research-grant-craft/issues)
or submit a pull request updating the affected package.
