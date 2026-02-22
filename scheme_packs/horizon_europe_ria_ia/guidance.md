# Horizon Europe RIA/IA — Practical Writing Guide

> Practical, opinionated tips for writing each section of a Horizon Europe RIA or IA proposal.
> These are distilled from reviewer feedback, programme officer guidance, and analysis of funded proposals.
> Always cross-check against the **specific call topic text** — tips here are general defaults.

---

## Before You Start

- **Read the call topic text three times** before writing. Mark every sentence under "Expected Outcomes" and "Scope" — your proposal must address these explicitly, not generically.
- **Download the Part B template** for your specific call from the Funding & Tenders Portal. Some calls have non-standard section orders or additional sub-sections.
- **Check the page limit** in the call topic (Section 5). The default is 45 pages but deviates frequently.
- **Map your team's expertise to the evaluation criteria early.** Gaps in the consortium should be filled before submission, not papered over in the text.
- **Start with Section 2 (Impact) first.** The impact case is the hardest to write and the most frequently underweighted by researchers. Knowing your impact story will sharpen the rest of the proposal.

---

## Section 1: Excellence

### 1.1 Objectives and Ambition

- **Number your objectives (O1–O5 or similar).** Reviewers scan for this. Unnumbered prose objectives are harder to assess and signal a less structured proposal.
- **Make every objective SMART:** Specific, Measurable, Achievable, Relevant, Time-bound. Bad: "Develop an AI model for X." Good: "Develop and validate an AI model for X achieving ≥90% precision on benchmark Y by Month 24 (TRL 4→6)."
- **State the TRL you start from and the TRL you will reach at project end.** For RIA, a typical progression is TRL 2→5; for IA, TRL 4→7 or higher. Don't claim TRL 9 in an RIA — it signals a misunderstanding of the action type.
- **Write an ambition statement in the opening paragraph.** Tell reviewers *why this challenge matters now* at the European or global level. One strong sentence anchoring the problem is worth more than three paragraphs of background.
- **Link every objective explicitly to the call's Expected Outcomes.** Use the call text's own terminology. Reviewers check this alignment meticulously.
- **Avoid objective inflation:** don't pad with objectives that are really tasks (e.g., "Disseminate results" should be in Section 2, not O5).
- **Three to five objectives is the sweet spot.** Fewer may look unambitious; more dilutes focus and makes the work plan harder to structure.

**Common mistakes:**
- Stating objectives as "to investigate whether X…" — investigators are not paid to investigate, they are paid to achieve outcomes.
- Claiming a "first" or "breakthrough" without evidence: reviewers will scrutinise and often reject this language unless backed by preliminary data.
- Forgetting to link to the specific call topic (O1 should mirror the first call expected outcome).

---

### 1.2 Methodology

- **Open with a one-paragraph overview** of the overall approach (a concept diagram on the same page is highly effective). Reviewers read dozens of proposals — orient them quickly.
- **Structure the methodology around your work packages** (even if you haven't written WP descriptions yet). This creates coherence between Sections 1 and 3.
- **For each major methodological strand, answer three questions:** (a) What specifically will you do? (b) Why is this the best approach (vs. alternatives)? (c) How will you know it worked (success criteria)?
- **Name your tools, datasets, models, and platforms.** "State-of-the-art machine learning methods" is a red flag. "We will use transformer-based architectures (BERT-large, fine-tuned on domain corpus X) evaluated on benchmark Y" is credible.
- **Include at least one alternative approach** and explain why you chose the primary approach over it. This signals intellectual rigour and awareness of the field.
- **Address critical assumptions explicitly.** Every methodology has 2–3 assumptions that could fail. Name them and describe how you will detect and respond to failure (a "Plan B"). This is especially important for RIA.
- **Interdisciplinary proposals:** explicitly describe the *integration mechanism* — how do the different disciplines' contributions combine? Don't just list disciplines.
- **For clinical or human studies:** include study design details (sample size, controls, ethics approval status, recruitment plan). Reviewers with clinical expertise will probe these.
- **For computational/AI work:** address training data (source, size, quality, licensing), model interpretability, and reproducibility (will code and weights be released?).

**Common mistakes:**
- Methodology = list of tasks from the Gantt chart. Methodology is the *scientific approach*, not the *work plan*.
- No quantitative success criteria: "we will validate the approach" without specifying the metric, target value, or baseline.
- Ignoring the feasibility question: if the approach is novel, reviewers want to know why you believe it will work.

---

### 1.3 Beyond the State of the Art

- **Be analytical, not encyclopaedic.** The SotA section is not a literature review. Its purpose is to *identify gaps* and *justify the proposal*. Trim references ruthlessly to the most relevant 10–20.
- **Structure as: current capability → limitation → your advance.** A three-column table (Existing Approach | Key Limitation | Our Contribution) can make this vivid in half a page.
- **Quantify the gap where possible.** "Current systems achieve 65% accuracy on benchmark X; our approach targets ≥85%." This is much more compelling than qualitative gap descriptions.
- **Reference your own preliminary work** if available. Even a conference paper or preprint showing proof-of-concept significantly raises reviewer confidence. If you have results, describe them briefly with data.
- **Cite competitors fairly.** Reviewers may be the authors of papers you cite. Don't dismiss prior work; explain why it doesn't solve the problem your project addresses.
- **Mention relevant EU-funded projects** in this space and explain how yours differs or builds on them. Reviewers appreciate awareness of the European research landscape.
- **For IA proposals:** include a technology gap analysis and a competitive landscape overview (what companies/products exist and why they don't solve the problem).

**Common mistakes:**
- SotA section that is identical to the introduction in a journal paper — no call-topic awareness, no gap analysis, no positioning.
- Ignoring highly relevant competing approaches to make yours look more novel.
- Preliminary results described in vague terms ("positive preliminary data exist") without any specifics. If you have results, show them.

---

## Section 2: Impact

> **Reviewers consistently rate Impact as the hardest criterion to score well on.** Researchers underinvest here. Budget at least one-third of your total writing time on this section.

### 2.1 Expected Outcomes and Impacts

- **Copy-paste (or closely paraphrase) the call topic's "Expected Outcomes" bullet points and address each one explicitly.** Reviewers literally check each bullet off. If a call lists five expected outcomes, your section should address all five.
- **Distinguish types of impact clearly:**
  - *Scientific:* new knowledge, publications, open datasets, standards contributions, trained researchers.
  - *Technological:* prototypes, patents, spin-offs, standards, software tools.
  - *Economic:* market opportunities (with market size figures), cost reductions, business created.
  - *Societal/policy:* citizens benefiting, policy instruments informed, SDG contributions.
- **Quantify wherever credible.** "We expect to save €X per year" is better than "significant cost savings are expected." Be honest about uncertainty but ground-truth with sources.
- **Name your beneficiaries specifically.** "Researchers in the EU" is too broad. "Clinicians treating Type 2 diabetes in primary care settings" is credible and shows you understand your users.
- **Include a KPI table** (Outcome | Indicator | Baseline | Target | Timeline). This is increasingly expected and helps reviewers score this sub-section quickly.
- **For RIA:** impacts may be 5–10 years out. That is fine — but you must articulate the *pathway* by which research outputs become real-world impacts, even if the timeline is long.
- **For IA:** at least one outcome should be at or near market/deployment readiness by project end. Vague longer-term impact without near-term deliverables is a serious weakness for IA.

**Common mistakes:**
- A single paragraph of generic impact language ("our results will benefit European citizens and industry").
- No mention of which specific call expected outcomes the project addresses.
- Economic impact estimates without any supporting market data or methodology.

---

### 2.2 Pathway to Impact

- **Write a timeline:** short-term (end of project), medium-term (3–5 years post-project), long-term (10 years). Be specific about what happens at each stage.
- **Identify who will exploit each key result.** A table (Result | Exploiting Party | Route | Timeline) is effective. Named industrial partners exploiting specific outputs are much more credible than generic "industry will adopt these results."
- **For every commercially relevant result, describe IP strategy:** who owns the foreground IP (usually the creating partner), what protection mechanism (patent, trade secret, copyright, database right), and what licensing model (exclusive, non-exclusive, open source).
- **Name specific market entry routes:** pilot programmes, product integration, regulatory approval pathway, standards body participation, policy consultation.
- **For IA proposals:** include a basic business case or market entry plan. What is the total addressable market (TAM)? Who are the first customers? What is the sales/deployment model? What are the barriers to adoption?
- **Stakeholder engagement is impact generation, not just communication.** Describe how stakeholders will co-develop, validate, and eventually adopt results. Letters of intent from industry or public sector partners are strong supporting evidence (place in annex).
- **Don't confuse dissemination with exploitation.** Dissemination (sharing results) ≠ exploitation (making use of results for commercial or non-commercial benefit). Both are needed but serve different purposes.

**Common mistakes:**
- Pathway to impact = dissemination plan. These are different.
- Claiming commercialisation potential without any market evidence.
- IP ownership ambiguity for multi-partner projects (reviewers notice this).

---

### 2.3 Communication, Dissemination and Exploitation Plan

- **Be specific about publications.** Name the journals you will target (not "high-impact journals"). List 5–8 relevant venues. Include at least 2–3 open access gold journals.
- **Commit explicitly to open access for all publications.** This is a legal obligation under HE (Article 17 MGA). Stating it in the proposal demonstrates compliance awareness.
- **Include non-academic communication.** Policy briefs, press releases, demonstrations at trade fairs, podcasts, and public events count as communication and show reviewers you understand impact beyond the academy.
- **Plan a project website launch by Month 3.** This is standard and reviewers expect it.
- **Use a simple dissemination activity table:** Activity | Type (D/C/E) | Target Audience | Channel | Month | Lead. This communicates the plan at a glance.
- **Reference D1.2: Communication and Dissemination Plan** as a deliverable due by Month 3. Reviewers like to see you know the mandatory deliverables.
- **For exploitation:** if the partner who will exploit a result is known, name them. Unnamed "future commercial actors" are much less compelling.

**Common mistakes:**
- Describing dissemination activities with no target audiences (who is the conference for? what industry sector? what geographic region?).
- Listing a project website as a major dissemination activity — it's necessary but not sufficient.
- Forgetting that communication activities to the general public are scored separately from academic dissemination.

---

### 2.4 Open Science Practices

- **Name the repository you will use.** Zenodo is the default for HE projects. Domain-specific repositories (PANGAEA for oceanography, EMBL-EBI for genomics, etc.) are appropriate and show domain awareness.
- **Address FAIR principles for your key datasets explicitly:** Findable (DOI assigned, metadata standard used), Accessible (open licence or justified restriction), Interoperable (format and vocabulary standards), Reusable (licence, provenance documented).
- **If releasing software/code:** state the licence (MIT, Apache 2.0, EUPL, GPL — whichever fits your IP strategy) and the platform (GitHub, GitLab, EU Code repository).
- **Reference the Data Management Plan deliverable:** "A full DMP (D1.1) will be submitted by Month 6 following the EC template, covering data types, FAIR compliance, and access conditions."
- **If you cannot make data fully open:** explain specifically why (IP protection, personal data, national security, commercial confidentiality) and what *can* be made available (anonymised data, aggregated statistics, metadata). "As open as possible, as closed as necessary" is the EC's position.
- **Bonus for reviewers:** mention EOSC interoperability, pre-registration of hypotheses (relevant for hypothesis-driven research), or citizen science data collection.

**Common mistakes:**
- Open science section that says only "we will publish open access." This is the bare minimum; a full FAIR data and software openness plan is expected.
- No DMP reference. This is a mandatory deliverable — its absence suggests unfamiliarity with HE requirements.
- Claiming all data will be open when the methodology involves licensed third-party data, personal data, or IP-sensitive industry data.

---

## Section 3: Implementation

### 3.1 Work Plan and Work Packages

- **Start with a WP summary table.** This is the first thing reviewers look at in Section 3. Columns: WP#, Title, Lead Partner, Start Month, End Month, Person-Months (total). Put it on the first page of Section 3.
- **Follow the standard WP naming convention:** WP1 = Management, WP[last] = Dissemination and Exploitation, middle WPs = technical/research content. Deviations are fine if justified but risk confusing reviewers.
- **Each WP description should include:** objectives, list of tasks (T1.1, T1.2…), milestones (MS1, MS2…), deliverables (D1.1, D1.2…), lead partner, contributing partners, start/end month.
- **Milestones must be verifiable:** "Completion of D2.1 prototype demonstrating TRL 4 performance on benchmark X" is a milestone. "Progress meeting held" is not a verifiable milestone.
- **D1.1 (Data Management Plan) must appear in WP1 at Month ≤6.** This is a mandatory HE deliverable — its absence from the WP structure is a compliance red flag.
- **Include an integration WP or task** if you have multiple technical WPs that need to be combined. Failure to show integration is a common weakness in large consortia proposals.
- **Draw a Gantt chart.** It doesn't need to be beautiful but it must show: WP bars, milestone diamonds, key deliverable markers, and critical path dependencies. Reviewers look for proposals that appear feasible in the available time.
- **Show the critical path.** Mark which tasks are on the critical path and what happens if they are delayed. This demonstrates project management maturity.
- **Don't front-load deliverables.** Reviewers are suspicious of proposals where 70% of deliverables land in Month 36 ("big bang" reporting). Distribute deliverables throughout the project.

**Common mistakes:**
- Missing WP summary table.
- Milestones defined as internal meetings: "SC meeting held" is not a scientific milestone.
- No integration point between technical WPs.
- Gantt chart that doesn't show dependencies.
- Person-months allocated to WPs don't add up to the Part A budget figures.

---

### 3.2 Management Structure and Procedures

- **Include an organisational chart.** A one-page diagram showing Coordinator → Steering Committee → WP Leaders → Advisory Board (if any) is standard and saves several hundred words.
- **Describe the Steering Committee (SC) concretely:** who sits on it, how often it meets (quarterly is typical), how decisions are made (majority vote? consensus?), and what quorum is required.
- **Include a conflict resolution procedure.** "If WP leaders disagree, the SC decides by majority vote; in case of deadlock, the Coordinator has casting vote." This is one paragraph but reviewers look for it.
- **Write a proper risk register table** (not just prose). Minimum columns: Risk ID, Description, Category (Technical/Financial/Consortium/Regulatory/External), Likelihood (H/M/L), Impact (H/M/L), Mitigation Measure, Contingency Plan, Owner.
- **Top risks for most RIA/IA proposals:** (1) key personnel leaving, (2) technical approach not meeting performance targets, (3) regulatory delays (for projects requiring approvals), (4) partner underperformance, (5) access to data or infrastructure.
- **Quality assurance:** describe how deliverables are peer-reviewed internally before submission to the EC. Even a simple "each deliverable is reviewed by at least one partner not involved in its production" signals maturity.
- **Reporting to the EC:** mention Periodic Reports (typically every 18 months) and Final Report. Demonstrates awareness of grant management obligations.

**Common mistakes:**
- Risk register lists only technical risks, ignoring consortium and external risks.
- Mitigation for every risk is "we will monitor this" — this signals no real risk management.
- Management section describes only the coordinator and ignores the roles of other partners.
- Conflict of interest procedure absent (required when partners are competitors or where IP is commercially sensitive).

---

### 3.3 Consortium as a Whole

- **Lead with a partner table**, not prose. Columns: Organisation Name | Country | Type (HEI/Research/SME/Large Industry/NGO/Public Body) | Primary Role in Project | Key Expertise.
- **Apply the "why them and only them" test** to each partner. If you can't articulate what would be lost without a specific partner, reconsider their inclusion. Reviewers reward lean, focused consortia.
- **Complementarity is the key word.** Show that partners' expertise is *additive*, not *overlapping*. A complementarity matrix (partners × capability areas, with checkmarks) can make this visual.
- **Consortium size: bigger is not better.** Reviewers are increasingly sceptical of large consortia (15+ partners) unless the project scope genuinely requires that many entities. Aim for the minimum number that covers all required competencies.
- **Address gender balance in leadership roles.** State the gender balance of named WP leaders and, if possible, the broader project team. If gender balance is poor, acknowledge it and describe measures to improve it.
- **If the consortium was assembled through an open call**, describe the process. If it was based on prior collaboration (joint publications, previous EU projects), mention this — it de-risks the consortium from a reviewer's perspective.
- **Third-country participants:** if you have non-EU, non-Associated-Country partners, you must justify their specific, essential expertise and confirm they are not funded by the grant (they may participate at own cost or be funded by third-country national sources).

**Common mistakes:**
- All partners described in equal detail regardless of their role size.
- No clear explanation of how partners were selected or why this specific combination is required.
- Partner description section is copy-pasted from partner websites with no project-specific relevance.
- Gender balance not mentioned at all.

---

### 3.4 Resources and Costs

- **Budget justification is not optional.** Reviewers read the budget justification carefully, especially for large items. "We need 24 person-months of researcher time" is not a justification. "WP2 (Tasks T2.1–T2.3) requires 24 person-months: 12 PM for developing the core algorithm (one senior researcher × 12 months) and 12 PM for integration and validation (two researchers × 6 months each)" is a justification.
- **Format as a table or structured list** per partner: Personnel (PM × role × rate range), Equipment (item, cost, justification), Travel (events, attendees, cost estimate), Subcontracting (who, what, why external), Other Direct Costs (consumables, etc.), Indirect Costs (25% flat rate, no justification needed).
- **Flag equipment > €50k individually.** Large equipment must be justified as essential for the project and unavailable through other means (not available at the institution, cannot be rented, etc.).
- **Subcontracting must be justified.** Explain why the tasks cannot be performed by the consortium partners. Keep subcontracting < 30% of total budget; > 50% is an eligibility risk.
- **Personnel rates:** don't need to appear in the proposal, but person-month numbers must add up to the Part A figures. Inconsistency between Section 3.4 and Part A is a common error that triggers a financial clarification request.
- **Make a value-for-money argument.** One sentence stating "The requested budget of €X represents value for money given the [scale of the challenge, TRL uplift, number of partners, expected outputs]" is useful.
- **WP1 (Management) should be ≤5–8% of total budget.** Higher allocations invite a critical comment.

**Common mistakes:**
- Budget narrative that is a single paragraph covering all partners and cost categories together.
- Indirect costs forgotten or miscalculated (should be 25% of all direct costs except subcontracting, if using the flat rate).
- Large equipment listed in Part A but not justified in the proposal text.
- Mismatches between Part A total and the sum of Section 3.4 figures.

---

## Final Checks Before Submission

- [ ] All call expected outcomes are explicitly addressed in Section 2.1
- [ ] D1.1 (DMP) appears in WP1 at Month ≤6
- [ ] Risk register table is present with ≥5 risks
- [ ] Gantt chart is included
- [ ] WP summary table is included
- [ ] Budget in Section 3.4 matches Part A figures
- [ ] Open access commitment stated in Section 2.3/2.4
- [ ] Ethics self-assessment completed in Part A
- [ ] Page limit checked (export to PDF, count pages)
- [ ] All partner PIC numbers validated in the Portal
- [ ] All partner names consistent between Part A and Part B
- [ ] Proposal has been read by at least one person not involved in writing it

---

## Formatting Tips

- **Use headers and sub-headers exactly as specified** in the Part B template. Do not rename sections — reviewers use the section structure to navigate.
- **Use short paragraphs** (5–7 lines maximum). Dense walls of text reduce scores because reviewers miss key points.
- **Use bullet lists strategically** but don't over-bullet. Assessments, rationale, and narrative arguments need prose. Lists of objectives, tasks, and checklist items benefit from bullets.
- **Figures and tables save pages.** A concept diagram, a WP overview table, a Gantt chart, a risk register table, and an impact KPI table can replace 4–5 pages of prose with denser, clearer information.
- **Bold key terms** when they first appear or when you want reviewers to find them quickly on re-reading.
- **References:** use a compact citation style (numbered or author-year). Include DOIs where available. The references section is not counted in the page limit — cite generously.
- **Proof-read for consistency:** project acronym capitalisation, partner abbreviations, WP numbers, deliverable IDs, and month references must be consistent throughout.

---

*This guidance is maintained by the GrantCraft contributor community. To suggest improvements, open an issue tagged `scheme-guidance`.*
