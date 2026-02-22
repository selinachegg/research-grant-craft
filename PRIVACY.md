# Privacy Statement — Research Grant Craft

**Short version:** Your proposal text never leaves your device unless you
deliberately configure an external LLM API. No accounts, no tracking, no
server-side storage.

---

## Data processed locally

Research Grant Craft runs entirely in your browser. The following data is
stored in your browser's `localStorage` only:

| Data | Where stored | Transmitted? |
|------|-------------|-------------|
| Wizard intake answers | `localStorage` | Never |
| Draft proposal text | `localStorage` | Only if LLM mode is enabled (see below) |
| Reviewer report output | `localStorage` | Never |
| User preferences (theme, scheme selection) | `localStorage` | Never |

Clearing your browser's site data for `localhost` (or the deployed origin)
permanently deletes all stored content. There is no account recovery.

---

## LLM calls (opt-in only)

By default the app operates in **mock mode**: all LLM prompts return static
placeholder text and no outbound network request is made.

If you choose to enable a real LLM backend by setting an API endpoint and key
in the application settings:

- Your draft text and wizard answers are sent to the configured endpoint with
  each generation request.
- Research Grant Craft does **not** store, log, or forward this data on any
  server owned by this project.
- The data handling practices of the third-party API provider (e.g., OpenAI,
  Anthropic, a self-hosted model) apply once the request leaves your browser.
  Review the privacy policy of that provider before entering sensitive content.

**Recommendation for sensitive proposals:** Use a self-hosted model (e.g.,
Ollama running locally) to keep all data on your own machine.

---

## No analytics or telemetry

Research Grant Craft does not include:

- Analytics scripts (Google Analytics, Plausible, Mixpanel, etc.)
- Error-reporting services (Sentry, Bugsnag, etc.)
- Feature-flag or A/B testing services
- Any form of usage telemetry

---

## API keys

If you enter an API key in the settings panel, it is stored in your browser's
`localStorage` under the deployed origin. It is never transmitted to the
Research Grant Craft project servers (there are none). Treat it as you would
any credential stored in a browser — avoid using this feature on shared or
public computers.

---

## Deployment by third parties

If you self-host or deploy Research Grant Craft for your institution, your
deployment may introduce additional data flows (server-side rendering logs,
reverse proxy logs, etc.). This privacy statement covers only the default
local-development setup. Institutional deployments should publish their own
supplementary privacy notice.

---

## Contact

For privacy-related questions or concerns, open an issue at
[github.com/selinachegg/research-grant-craft/issues](https://github.com/selinachegg/research-grant-craft/issues)
or use the Security Advisory channel described in [`SECURITY.md`](SECURITY.md).

---

*Last updated: 2024*
