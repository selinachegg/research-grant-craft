# AGRI-ADAPT: Adaptive AI-Driven Precision Agriculture for Climate Resilience

> **GrantCraft generated draft — mock mode.**
> Text in `[square brackets]` marks areas where you must add your own content, data, or citations.
> Review the Reviewer Report tab to identify the highest-priority gaps before editing.

**Call reference:** HORIZON-CL6-2025-FARM2FORK-01-04
**Action type:** Research and Innovation Action (RIA) · 100% funding rate
**Duration:** 48 months | **Budget:** €3.8M (estimated)
**Consortium:** WUR (NL) · CNR-IBE (IT) · IFAPA (ES) · LUKE (FI) · SFT (DE) · EFFA (BE)
**TRL progression:** TRL 3 → TRL 6

---

## 1. Excellence

### 1.1 Objectives and Ambition

Climate change is reshaping European agriculture at a pace that outstrips the adaptive capacity of most farm management systems. Temperature extremes, shifting precipitation patterns, and the increasing frequency of drought events are already reducing crop yields across EU Member States, with projections suggesting productivity losses of 10–25% in Southern Europe by 2050 under RCP 4.5 [*cite IPCC AR6, relevant JRC reports*]. Small and medium-sized farms — which represent over 70% of EU agricultural holdings and underpin rural livelihoods and biodiversity — are particularly vulnerable, as they typically lack access to the data infrastructure and agronomic advisory resources available to large agribusiness operators.

Existing precision agriculture tools have largely failed to bridge this gap. Most commercial platforms are designed for large-scale, capital-intensive operations in temperate climates; they require proprietary sensor hardware, assume stable climatic baselines, and are inaccessible to farmers without significant digital literacy [*cite gap analysis refs*]. The result is that the farms most in need of adaptive decision support are the least served.

**AGRI-ADAPT** directly addresses this challenge. The project will design, develop, validate, and openly release an AI-powered decision-support platform that delivers site-specific, real-time crop management recommendations tailored to shifting agroclimatic conditions — built from the ground up for heterogeneous European farming contexts, accessible via low-cost IoT and mobile interfaces, and co-designed with farming communities to ensure genuine adoption.

**Project Objectives:**

| ID | Objective | Measurable Target | Timeline |
|----|-----------|-------------------|----------|
| O1 | Develop an AI/ML engine integrating Earth Observation, IoT, and agronomic knowledge to generate adaptive crop management recommendations | Engine validated against [*n*] historical datasets achieving ≥[X]% prediction accuracy vs. expert baseline | Month 24 |
| O2 | Deploy and validate the AGRI-ADAPT platform at ≥6 pilot sites across 4 EU agroclimatic zones | Platform at TRL 6; ≥[n] farms enrolled per site; user satisfaction ≥[X]% | Month 42 |
| O3 | Demonstrate measurable resource efficiency gains at pilot farms | ≥15% reduction in irrigation water use; ≥10% reduction in fertiliser input vs. control group | Month 44 |
| O4 | Produce fully open scientific outputs and FAIR-compliant datasets enabling reproducibility and follow-on research | ≥15 open-access publications; ≥5 FAIR datasets deposited; full open-source codebase released | Month 48 |
| O5 | Establish pathways for sustained uptake of AGRI-ADAPT outputs by advisory services and agri-tech industry | ≥3 national/regional advisory services commit to post-project use; ≥1 commercial licensing agreement | Month 48 |

AGRI-ADAPT is ambitious by design. While AI applications in agriculture are not new, this project is distinguished by three characteristics that together constitute a step-change beyond the current state of the art: (i) *climate-adaptive* recommendations that explicitly model non-stationary agroclimatic conditions rather than assuming stable baselines; (ii) *co-design fidelity* — farmer communities participate as knowledge co-producers, not merely as test subjects; and (iii) *full openness* — all models, code, and data will be released under open licences, addressing the reproducibility deficit that undermines trust in agricultural AI research.

---

### 1.2 Methodology

**Overall approach**

AGRI-ADAPT employs a three-pillar methodology, integrated across the project's five technical work packages:

- **Pillar 1 — Data fusion and AI engine development** (WP2–WP3): Multi-source data integration (Copernicus Sentinel-2/3, in-field IoT sensors, meteorological reanalysis, soil and crop databases) feeding a hybrid AI architecture combining physics-informed neural networks [*cite PINN literature*] with Gaussian process regression for uncertainty quantification.
- **Pillar 2 — Participatory co-design** (WP2, WP4): Iterative co-design cycles with farming communities and AKIS extension services at each pilot site, using structured agile sprint methodology adapted from participatory action research [*cite PAR methodology refs*] to ensure recommendations are locally actionable.
- **Pillar 3 — Cross-site validation** (WP4): Comparative pilot deployment across six sites in four agroclimatic zones (Mediterranean, Atlantic, Continental, Boreal), with embedded A/B design at each site to generate causal evidence of platform impact on resource efficiency.

**AI engine specification**

The AGRI-ADAPT AI engine will be built on the following technical foundations [*refine with your specific architecture choices*]:

- **Earth Observation integration:** [*describe Sentinel data preprocessing pipeline, resolution, temporal frequency, cloud masking approach*]
- **IoT data ingestion:** MQTT-based data streams from low-cost soil moisture, microclimate, and crop growth sensors; [*describe sensor selection rationale and data quality protocols*]
- **Core model architecture:** [*specify: LSTM/transformer for temporal crop dynamics, random forest/gradient boosting for recommendation generation, or physics-informed approach — justify your choice over alternatives*]
- **Uncertainty quantification:** All recommendations include confidence intervals to support farmer decision-making under uncertainty. [*cite UQ methods*]
- **Explainability:** SHAP-based feature importance to ensure recommendations are interpretable by agronomists and extension advisors, not only by data scientists.

**Validation and success criteria**

Results will be validated at two levels:
1. *Technical validation* (Month 24): Platform components validated against historical ground-truth datasets. Success criterion: prediction RMSE ≤[X] and accuracy ≥[Y]% on held-out test sets across all agroclimatic zones.
2. *Field validation* (Months 30–44): Randomised controlled comparison at each pilot site. Farms allocated to the AGRI-ADAPT arm vs. control (standard advisory service). Success criteria: ≥15% reduction in water use and ≥10% reduction in fertiliser input while maintaining or improving yield quality.

**Alternative approaches considered**

The project team evaluated three alternative AI architectures before selecting the hybrid physics-informed approach: (a) pure data-driven deep learning [*cite*] — rejected due to high data requirements and poor transferability across agroclimatic zones; (b) expert system / rule-based DSS [*cite existing EU-funded tools*] — rejected as unable to adapt to non-stationary climate conditions; (c) statistical crop models (DSSAT, AquaCrop) [*cite*] — retained as a component within the AGRI-ADAPT ensemble but insufficient alone due to limited ability to integrate real-time heterogeneous sensor data.

**Interdisciplinary integration**

AGRI-ADAPT integrates agronomy, remote sensing, computer science/AI, social science, and stakeholder engagement research. Integration is achieved through: (i) joint WP2/WP3 technical sprints with agronomists validating all AI model assumptions; (ii) a social scientist embedded in WP4 to lead co-design methodology; (iii) cross-disciplinary review of all major deliverables before EC submission.

---

### 1.3 Beyond the State of the Art

**Current state of knowledge**

The field of agricultural AI and decision support has advanced rapidly, with landmark contributions including: [*cite 3–5 key papers/systems*]. Commercial platforms such as [*cite Climate Corporation/Trimble/Deere/JohnDeere digital tools*] demonstrate commercial interest but are designed for large-scale temperate farming and do not address non-stationary climate adaptation. EU-funded predecessors including [*cite relevant FP7/H2020 projects e.g., REACT4C, IoF2020, SmartAgriHubs*] have made valuable contributions to digital farming infrastructure but have not produced open, climate-adaptive decision engines validated across diverse agroclimatic zones.

**Critical gaps addressed by AGRI-ADAPT**

| Gap | Current Limitation | AGRI-ADAPT Advance |
|-----|-------------------|-------------------|
| **Climate non-stationarity** | Most tools assume stable agroclimate baselines; fail when conditions shift outside training distribution | Physics-informed AI with explicit non-stationarity modelling; validated under climate projection scenarios |
| **Scale and accessibility** | Commercial platforms target large farms; require >€[X]k hardware investment | Low-cost IoT integration; mobile-first UX; designed for SME farm contexts |
| **Co-design and adoption** | Most tools built by engineers without farmer involvement; adoption rates consistently low [*cite*] | Participatory co-design embedded in methodology; AKIS integration from day one |
| **Openness and reproducibility** | Most agricultural AI models are proprietary; independent validation not possible [*cite*] | Full open-source release under MIT licence; all training data and model weights released |

**Preliminary work**

[*Describe 1–3 pieces of preliminary evidence here. Examples: WUR's prior pilot demonstrating [X] in [location]; CNR-IBE's validated EO crop monitoring system for Italian agriculture; SFT's IoT platform deployed on [n] farms. Include a key result with a number if possible.*]

---

## 2. Impact

### 2.1 Expected Outcomes and Impacts

AGRI-ADAPT directly addresses the following expected outcomes stated in call HORIZON-CL6-2025-FARM2FORK-01-04:

> *[Copy the exact expected outcomes from the call text here and address each one explicitly below.]*

**Scientific and technological impacts**

- Publication of ≥15 peer-reviewed articles (all open access) advancing knowledge in agricultural AI, climate adaptation modelling, and participatory co-design methodology.
- Open-source AI platform (GitHub/Zenodo) enabling reproducible research and follow-on development by the global agricultural research community.
- ≥5 FAIR-compliant datasets covering multi-zone agroclimatic conditions, IoT time series, and farmer decision data — deposited in Zenodo and [*domain repo*] with DOIs.
- Contribution to [*relevant ISO or ETSI standard?*] for IoT-based agricultural decision systems [*confirm or remove if not applicable*].

**Economic impacts**

- At pilot farms: ≥15% reduction in irrigation water costs; ≥10% reduction in fertiliser expenditure — at average European farm size, this represents annual savings of approximately €[X] per farm [*calculate from EU farm structural survey data*].
- Post-project commercial deployment through SFT (SME partner) targeting [*n*] farms across [*n*] countries by Year 5, generating [*projected ARR or revenue figure*] [*or: basis for calculation*].
- Wider EU agricultural sector: if adopted by 5% of EU SME farms, estimated aggregate annual saving of €[X] in input costs [*derive from Eurostat Agricultural Survey data*].

**Societal and policy impacts**

- Contribution to EU Farm to Fork Strategy targets: 50% reduction in pesticide use, 20% reduction in fertiliser use, 50% increase in organic farming by 2030.
- Informing EIP-AGRI (European Innovation Partnership for Agricultural Productivity and Sustainability) operational groups with validated open tools.
- Training of ≥200 farmers and ≥50 agricultural advisors/agronomists in AI-based decision support.
- Contribution to rural resilience: supporting SME farm viability in the face of climate-driven productivity risk.

**Impact indicators (KPIs)**

| Indicator | Baseline | Target | Measurement method | Timeline |
|-----------|----------|--------|--------------------|----------|
| Water use at pilot farms (m³/ha/season) | [*current avg from site surveys*] | ≥15% reduction | On-farm IoT metering + irrigation logs | Month 44 |
| Fertiliser input at pilot farms (kg N eq./ha) | [*current avg*] | ≥10% reduction | Farm management records | Month 44 |
| Open-access publications | 0 | ≥15 | DOI count in open access repositories | Month 48 |
| Advisory services adopting platform post-project | 0 | ≥3 | MoU / adoption agreement | Month 48 |
| Farmers trained | 0 | ≥200 | Training event attendance records | Month 48 |

---

### 2.2 Pathway to Impact

**Short-term (during project, Months 1–48)**
- Open source platform components released iteratively (v0.1 Month 18; v1.0 Month 36; v1.1 Month 46).
- Peer-reviewed publications disseminating AI methods and validation results.
- Training workshops at six pilot sites (≥200 farmers, ≥50 advisors).
- Policy brief submitted to EC DG AGRI by Month 42 summarising evidence on resource efficiency gains.

**Medium-term (Years 5–10 post-project)**
- SFT (SME partner) commercialises the AGRI-ADAPT platform as a subscription service for European farms, targeting [*n*] customers.
- ≥3 national/regional advisory services (AKIS) integrate the open-source platform into their advisory tool stack.
- Follow-on research projects build on open datasets and models (target: ≥5 follow-on projects citing AGRI-ADAPT outputs within 5 years).
- Contribution to revision of EU precision farming standards and CAP digital tool requirements.

**Long-term (10+ years)**
- Normalisation of AI-adaptive decision support in European SME farming, contributing to Farm to Fork targets.
- Technology transfer to developing-country farming contexts through FAO partnerships [*if applicable*].

**IP strategy**

The AGRI-ADAPT consortium will operate under a Consortium Agreement based on DESCA (Development of a Simplified Consortium Agreement), to be signed before Grant Agreement execution.

| Result | Owner | Protection mechanism | Exploitation route |
|--------|-------|---------------------|-------------------|
| Core AI engine (open components) | WUR (lead), all partners | MIT open-source licence | Open community adoption; SFT commercial wrapper |
| Proprietary IoT integration module | SFT | Trade secret / copyright | SFT commercial product |
| Training datasets | WUR + CNR-IBE | CC BY 4.0 open data licence | Zenodo deposit; research community use |
| [*Any patents?*] | [*Owner*] | [*Patent or trade secret*] | [*Licence or product integration*] |

---

### 2.3 Communication, Dissemination and Exploitation Plan

**A full Communication, Dissemination and Exploitation Plan (D1.2) will be delivered in Month 3.** Key planned activities:

| Activity | Type | Target audience | Channel | Month | Lead |
|----------|------|-----------------|---------|-------|------|
| Project website launch | C | All | agri-adapt.eu [*to be registered*] | M3 | WUR |
| Peer-reviewed publications (≥15) | D | Academic community | Open-access journals [*see below*] | M12–M48 | All |
| Pilot site demonstration events | D/C | Farmers, advisors | On-farm events, live demos | M24, M36, M42 | EFFA, pilot leads |
| Policy brief for EC DG AGRI | D | EU policymakers | Official submission + public PDF | M42 | EFFA + WUR |
| Conference presentations (target: 8) | D | Research community | [*target conferences*] | M12–M48 | All |
| Trade press coverage | C | Agri-tech industry | [*Precision Agriculture Today, AgriDigital etc.*] | M24, M42 | SFT |
| Social media and LinkedIn | C | Broad public | LinkedIn (project page) | Monthly | WUR |
| EIP-AGRI Focus Group contribution | D/E | AKIS networks | EIP-AGRI online community | M30, M44 | EFFA |
| Software release (open source) | E | Developers + researchers | GitHub + Zenodo | M18, M36, M46 | WUR, SFT |

**Target journals:** [*FIELD CROPS RESEARCH, Computers and Electronics in Agriculture, Remote Sensing of Environment, Agricultural and Forest Meteorology, Nature Food — verify and confirm with consortium*]

**Target conferences:** [*ECPA (European Conference on Precision Agriculture), EFITA, IEEE IGARSS, AgriTechnica — verify*]

---

### 2.4 Open Science Practices

AGRI-ADAPT adopts a comprehensive open science approach consistent with Article 17 of the HE Model Grant Agreement and the EC's Open Science policy:

- **Open access publications:** All peer-reviewed publications will be made immediately open access. Authors will use Gold OA journals or deposit accepted manuscripts in Zenodo under CC BY 4.0. Article Processing Charges are budgeted as eligible project costs.
- **Open data (FAIR):** All non-commercially sensitive datasets will be deposited in [*Zenodo / domain repository*] with DOI assignment, rich metadata (Dublin Core + [*domain schema*]), and CC BY 4.0 licensing. The FAIR principles will be applied systematically.
- **Open source software:** The core AGRI-ADAPT AI engine will be released under the MIT licence on GitHub, with full documentation, containerised deployment (Docker), and a persistent Zenodo archive for each major release.
- **Data Management Plan:** A full DMP (D1.1) will be submitted by Month 6, following the EC Horizon Europe DMP template. The DMP will address: data types, volumes, FAIR compliance, repository selection, access conditions, and data lifecycle management.
- **Pre-registration:** Confirmatory validation trials at pilot sites will be pre-registered on the Open Science Framework (OSF) before data collection begins.
- **EOSC interoperability:** Deposited datasets will be registered with the European Open Science Cloud via B2SHARE or equivalent EOSC data portal.

*Justified restrictions:* The proprietary IoT integration module developed by SFT constitutes foreground IP with commercial value and will not be released as open source. All other project outputs will be open by default.

---

## 3. Implementation

### 3.1 Work Plan and Work Packages

**WP Summary Table**

| WP | Title | Lead | Start | End | PM (total) |
|----|-------|------|-------|-----|-----------|
| WP1 | Project Management and Coordination | WUR | M1 | M48 | 24 |
| WP2 | Data Infrastructure and AI Engine Development | WUR | M1 | M30 | 84 |
| WP3 | Participatory Co-Design and Requirements | EFFA | M1 | M24 | 36 |
| WP4 | Pilot Deployment and Validation | CNR-IBE | M18 | M46 | 96 |
| WP5 | Dissemination, Exploitation and Open Science | SFT | M1 | M48 | 24 |

**Total person-months: 264** *(verify against Part A budget figures)*

---

**WP1: Project Management and Coordination** (M1–M48, Lead: WUR, 24 PM)

*Objectives:* Ensure timely delivery of all project outcomes; manage financial reporting to the EC; facilitate cross-WP coordination; manage risks; liaise with the EC Project Officer.

*Tasks:*
- T1.1 Governance setup: Consortium Agreement signature, Steering Committee constitution, kick-off meeting (M1–M3)
- T1.2 Operational management: day-to-day coordination, financial management, periodic reporting (M1–M48)
- T1.3 Risk monitoring and quality assurance: quarterly risk register review, internal deliverable review process (M1–M48)

*Deliverables:*
- D1.1: Data Management Plan (Month 6) *(mandatory HE deliverable)*
- D1.2: Communication and Dissemination Plan (Month 3)
- D1.3: Periodic Progress Report 1 (Month 18)
- D1.4: Periodic Progress Report 2 (Month 36)
- D1.5: Final Report (Month 48)

*Milestones:*
- MS1 (M3): Consortium Agreement signed; governance operational
- MS2 (M6): DMP submitted; all project infrastructure in place

---

**WP2: Data Infrastructure and AI Engine Development** (M1–M30, Lead: WUR, 84 PM)

*Objectives:* Develop the multi-source data fusion pipeline and the core AI/ML engine providing climate-adaptive crop management recommendations.

*Tasks:*
- T2.1 Data architecture design: common data model, API specifications, security and access protocols (M1–M6)
- T2.2 EO data integration: Copernicus Sentinel-2/3 preprocessing pipeline, crop mapping layer (M3–M18; Lead: CNR-IBE)
- T2.3 IoT data ingestion: sensor data pipeline, edge processing, MQTT integration (M3–M18; Lead: SFT)
- T2.4 AI engine development: hybrid physics-informed model, training and initial validation (M6–M24; Lead: WUR)
- T2.5 Recommendation engine and UX prototyping: mobile-first interface prototypes, agronomist review (M12–M30; Lead: WUR + SFT)

*Deliverables:*
- D2.1: Data architecture specification and API documentation (Month 9)
- D2.2: AI engine v0.1 with technical validation report (Month 24)
- D2.3: Platform prototype (TRL 4) with usability evaluation report (Month 30)

*Milestones:*
- MS3 (M18): EO and IoT pipelines operational; data flowing from all pilot sites *(enables WP4)*
- MS4 (M24): AI engine v0.1 achieves target accuracy on validation dataset — **go/no-go decision point for WP4 pilot deployment**

---

**WP3: Participatory Co-Design and Requirements** (M1–M24, Lead: EFFA, 36 PM)

*Objectives:* Ensure farmer and AKIS advisor needs drive platform requirements; establish community trust and adoption readiness at all pilot sites.

*Tasks:*
- T3.1 Stakeholder mapping and site preparation: identify farming communities, AKIS contacts, and co-design facilitators at each pilot site (M1–M6)
- T3.2 Co-design Sprint 1: requirements elicitation workshops at all 6 sites (M4–M10)
- T3.3 Prototype review Sprint 2: farmer evaluation of WP2 platform prototypes; feedback loop to WP2 (M16–M22)
- T3.4 Farmer readiness assessment: digital literacy baseline, training needs analysis (M10–M18)

*Deliverables:*
- D3.1: Farmer and stakeholder requirements specification (Month 12)
- D3.2: Co-design process report with site profiles (Month 24)

*Milestones:*
- MS5 (M12): Requirements specification agreed by all consortium partners — **input to WP2 platform design** *(blocks D2.3)*

---

**WP4: Pilot Deployment and Validation** (M18–M46, Lead: CNR-IBE, 96 PM)

*Objectives:* Deploy and validate AGRI-ADAPT at six pilot sites; generate causal evidence of resource efficiency impacts.

*Site leaders:*
- Mediterranean (Italy): CNR-IBE | Atlantic (France/Belgium): WUR | Continental (Germany): SFT | Boreal (Finland): LUKE
- Mediterranean (Spain): IFAPA | [*6th site: to be confirmed*]

*Tasks:*
- T4.1 Site setup: sensor deployment, farmer onboarding, baseline data collection (M18–M24)
- T4.2 Season 1 deployment: AGRI-ADAPT in use at all sites; weekly monitoring (M24–M36)
- T4.3 Mid-term evaluation and platform refinement: A/B results analysis, user feedback integration (M30–M36)
- T4.4 Season 2 deployment: refined platform; causal impact measurement (M36–M44)
- T4.5 Cross-site synthesis: comparative analysis; uptake readiness assessment (M42–M46)

*Deliverables:*
- D4.1: Site setup report and baseline characterisation (Month 24)
- D4.2: Season 1 validation report (Month 36)
- D4.3: Final validation and impact assessment report (Month 46)

*Milestones:*
- MS6 (M24): All six pilot sites operational — **go/no-go for full deployment** *(depends on MS4)*
- MS7 (M36): Season 1 results available; platform TRL 5 confirmed
- MS8 (M44): Season 2 results demonstrate ≥15% water reduction and ≥10% fertiliser reduction at ≥4 sites — **primary KPI checkpoint**

---

**WP5: Dissemination, Exploitation and Open Science** (M1–M48, Lead: SFT, 24 PM)

*Objectives:* Maximise reach and use of project outputs; manage IP; execute open science plan; deliver training programme.

*Tasks:*
- T5.1 Open science management: DMP implementation, repository deposits, software releases (M1–M48)
- T5.2 Scientific dissemination: publications, conference presentations (M12–M48)
- T5.3 Communication: project website, social media, press (M3–M48)
- T5.4 Exploitation: IP management, commercialisation pathway (SFT), AKIS integration agreements (M24–M48)
- T5.5 Training programme: farmer and advisor workshops at all pilot sites (M24–M44)

*Deliverables:*
- D5.1: Open science and IP management report (Month 12)
- D5.2: Training materials and workshop report (Month 36)
- D5.3: Final exploitation and impact plan (Month 48)

---

**Gantt Chart (overview)**

```
WP / Task          M1   M6   M12  M18  M24  M30  M36  M42  M48
────────────────── ──── ──── ──── ──── ──── ──── ──── ──── ────
WP1 Management     ████████████████████████████████████████████
  MS1 (M3) ●
  D1.1 DMP (M6) ◆
WP2 Data+AI        ████████████████████████████████
  MS3 EO+IoT ●(M18)          ●
  MS4 AI go/no-go ●(M24)               ●
  D2.2 AI v0.1 ◆(M24)                  ◆
WP3 Co-design      ████████████████████████
  MS5 Requirements ●(M12)         ●
WP4 Pilots                        ████████████████████████████
  MS6 Sites live ●(M24)               ●
  MS7 TRL5 ●(M36)                           ●
  MS8 KPI check ●(M44)                                ●
WP5 Dissemination  ████████████████████████████████████████████
```

*Critical path: T2.4 (AI engine) → MS4 → T4.1 (site setup) → T4.2 (Season 1) → MS8 (KPI checkpoint)*

---

### 3.2 Management Structure and Procedures

**Governance structure**

```
┌─────────────────────────────────────────────┐
│           European Commission               │
│           (Project Officer)                 │
└───────────────────┬─────────────────────────┘
                    │ reporting
┌───────────────────▼─────────────────────────┐
│      Project Coordinator (PC)               │
│      WUR — [Name, title]                    │
│      Manages: finance, reporting, EC liaison│
└────────┬───────────────────────┬────────────┘
         │                       │
┌────────▼────────┐   ┌──────────▼──────────┐
│ Steering        │   │ Scientific &         │
│ Committee (SC)  │   │ Advisory Board (SAB) │
│ 1 rep/partner   │   │ 3 external experts   │
│ Quarterly       │   │ Annual review        │
└────────┬────────┘   └─────────────────────┘
         │
┌────────▼──────────────────────────────────┐
│ Work Package Leaders                       │
│ WP1: WUR | WP2: WUR | WP3: EFFA          │
│ WP4: CNR-IBE | WP5: SFT                  │
└────────────────────────────────────────────┘
```

**Decision-making:** The SC takes decisions by simple majority (one vote per partner). In case of deadlock, the PC has the casting vote. Decisions affecting the overall project budget or scope require unanimous agreement.

**Conflict resolution:** Minor disputes between WP leaders are resolved at the SC level within 30 days. Unresolved major disputes are escalated to the PC, then to an independent mediator (identified in the Consortium Agreement), and as a last resort to the dispute resolution procedure of the MGA.

**Internal reporting:** WP leaders submit monthly 1-page progress notes to the PC; full technical reports at M18, M36 (Periodic Reports); Final Report at M48.

**Risk register (top 6 risks)**

| ID | Risk | Category | Likelihood | Impact | Mitigation | Contingency | Owner |
|----|------|----------|-----------|--------|-----------|-------------|-------|
| R1 | AI engine accuracy below target at MS4 | Technical | M | H | Iterative model refinement; alternative architecture (ensemble models) as fallback | Extend WP2 timeline by 3 months using contingency budget; simplify recommendation scope | WUR |
| R2 | Farmer adoption lower than expected at pilot sites | Sociotechnical | M | M | Co-design in WP3; dedicated farmer champions at each site; simplified mobile interface | Increase training support; adjust platform UX based on Season 1 feedback | EFFA |
| R3 | Key personnel departure (senior researchers) | Consortium | L | H | Knowledge documentation from M6; cross-training between partners | Recruit replacement; redistribute tasks; invoke subcontracting provision | PC/WUR |
| R4 | Copernicus data access delay or format change | External/technical | L | M | Direct ESA liaison; local data mirror at CNR-IBE; alternative EO sources identified (Planet, Landsat) | Switch to alternative EO source | CNR-IBE |
| R5 | Partner underperformance (financial or technical) | Consortium | L | H | Quarterly SC review; financial audit rights in CA; early warning indicators per partner | Redistribute tasks; in extreme case, formal partner exit per MGA Article 44 | PC |
| R6 | GDPR/data protection issue at pilot sites | Regulatory | M | M | Legal review in M1; GDPR-compliant data collection protocols; farmer consent forms prepared | Anonymise data; suspend affected data stream pending legal review | WUR DPO |

---

### 3.3 Consortium as a Whole

**Partner overview**

| Partner | Country | Type | Primary role | Key capability |
|---------|---------|------|-------------|---------------|
| WUR | NL | University | Coordinator; AI/ML development | World-leading expertise in agricultural AI, crop modelling, and precision agriculture research |
| CNR-IBE | IT | Research Institute | EO integration; Mediterranean pilot | Deep expertise in Earth Observation for agriculture; established Sentinel-2 processing infrastructure |
| IFAPA | ES | Public Research | Irrigation & water management; Southern pilot | Leading applied research on water-efficient irrigation in Mediterranean contexts; strong AKIS links in Andalusia |
| LUKE | FI | Research Institute | Boreal pilot; phenology modelling | Europe's foremost expertise in Northern agroclimatic crop modelling; established farm network in Finland |
| SFT | DE | SME | IoT hardware; platform commercialisation | 8-year track record in agricultural IoT; deployed in [*n*] farms across DE/AT; exploitation pathway for TRL 6→9 |
| EFFA | BE | NGO/Stakeholder | Co-design; farmer networks; policy | Access to >[*n*] farming organisations across EU; established EIP-AGRI relationships; policy communication expertise |

**Complementarity:** Each partner brings capabilities that no other consortium member duplicates. WUR provides the scientific and coordinational backbone; CNR-IBE and IFAPA provide Southern European agroclimatic expertise and EO infrastructure; LUKE ensures Northern European coverage; SFT bridges research and commercialisation; EFFA ensures the proposal is farmer-centred from the start and connected to the policy uptake pathway.

**Consortium assembly:** The consortium was assembled on the basis of [*prior collaboration in H2020 project X / an open partner search process / complementarity analysis*]. WUR and CNR-IBE have [*n*] joint publications and collaborated previously on [*name project*]. [*Add further prior collaboration evidence*]

**Gender balance:** [*State gender composition of WP leaders and named researchers. Describe any measures in place to improve gender balance if current composition is uneven. This is mandatory in HE.*]

---

### 3.4 Resources and Costs

**Budget summary by partner and cost category (€)**

| Partner | Personnel | Equipment | Travel | Subcontracting | Other Direct | Indirect (25%) | **Total** |
|---------|-----------|-----------|--------|----------------|-------------|----------------|----------|
| WUR | 720,000 | 30,000 | 40,000 | 0 | 15,000 | 201,250 | **1,006,250** |
| CNR-IBE | 360,000 | 50,000 | 30,000 | 0 | 10,000 | 112,500 | **562,500** |
| IFAPA | 270,000 | 20,000 | 25,000 | 0 | 8,000 | 80,750 | **403,750** |
| LUKE | 270,000 | 15,000 | 25,000 | 0 | 8,000 | 79,500 | **397,500** |
| SFT | 380,000 | 80,000 | 30,000 | 0 | 15,000 | 126,250 | **631,250** |
| EFFA | 160,000 | 0 | 35,000 | 20,000 | 5,000 | 55,000 | **275,000** |
| **TOTAL** | **2,160,000** | **195,000** | **185,000** | **20,000** | **61,000** | **655,250** | **3,276,250** |

*Note: Figures are illustrative. Verify against Part A and adjust to reach target total budget (€3.8M including any additional eligible costs not shown here).*
*Indirect costs at 25% flat rate applied to all direct costs except subcontracting, per HE MGA rules.*

**Personnel justification (summary):** 264 total person-months are allocated as detailed in the WP descriptions above. Senior researchers are allocated to tasks requiring domain expertise and creative problem-solving (T2.4, T3.2, T4.5); junior researchers/PhDs to data processing, literature synthesis, and pilot coordination. [*Add role-by-role breakdown in the detailed budget annex*]

**Equipment justification:** SFT: IoT sensor arrays for six pilot sites (6 × ~€13k = €78k), essential as no existing infrastructure can be used. CNR-IBE: High-performance computing node for Sentinel data processing (€50k), required for near-real-time EO pipeline — not available through institutional shared facility at required specification.

**Value for money:** The requested budget of €3.8M represents excellent value relative to the project's scope: TRL 3→6 progression across four agroclimatic zones, six pilot sites, 264 person-months of research, and full open-source release of all outputs. The lean management budget (WP1: €[calc] ≈ [X]% of total) reflects the consortium's prior collaborative experience and minimises administrative overhead.

---

*Draft generated by GrantCraft v0.1.0 in mock mode using scheme pack `horizon_europe_ria_ia` v1.0.0.*
*Next step: Run the Reviewer Report to identify sections scoring below threshold. Check the guidance.md for tips on each weak section.*
