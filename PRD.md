# ClaimIQ Recovery PRD

Status: Draft pending Adam's approval  
Drafted: 2026-10-17  
Project type: Box-first enterprise hackathon prototype  
Working project slug: `claimiq-recovery`  
Project folder: `code-projects/audit-hackathon/`  
Demonstration company: Northstar Infrastructure Systems, entirely fictional

## 1. Product Decision

ClaimIQ Recovery is a continuous supplier recovery audit and investigation workspace for hardware manufacturers.

It helps a technical specialist answer:

> Are customer warranty and service records showing a component problem that should become a supplier recovery investigation?

The prototype audits thousands of synthetic warranty claims, surfaces one unusual power-supply pattern, connects that pattern to technical and contractual evidence in Box, and helps the specialist open a documented supplier recovery investigation.

ClaimIQ does not declare that the supplier owes money. A high claim rate is a signal. Supplier recovery still requires traceability, engineering causation, applicable agreement terms, eligible costs, and human review.

Core pitch:

> ClaimIQ helps technical and warranty teams detect supplier-related failure patterns across thousands of claims and turn the evidence into an auditable recovery investigation.

## 2. One Prototype Scenario

Northstar Infrastructure Systems sells the fictional `R500 Enterprise Server` containing a replaceable `PSU-750` power supply.

The technical specialist opens the Warranty Recovery Audit dashboard and sees:

1. `12,480` completed warranty claims in the current synthetic dataset.
2. One active signal: `Elevated R500 no-power repairs`.
3. `19` qualifying repairs in the latest 30-day period versus a historical average of `6` per 30 days.
4. A `3.17x` increase above baseline.
5. `48` claims in the 90-day investigation population involving PSU-750 replacements supplied by Atlas Power Components.
6. `24` claims with sufficient reviewed evidence for `$4,320 potential recovery pending human validation`.
7. `15` claims missing supplier-lot traceability.
8. `6` claims requiring engineering review.
9. `3` claims excluded for documented non-supplier causes.

The specialist opens the signal, reviews the claim population, opens the engineering report and supplier agreement directly in Box, and verifies why the supported population appears to satisfy the fictional recovery terms.

ClaimIQ displays:

> Recommended next step: Prepare a supplier recovery claim for 24 evidence-supported claims totaling $4,320 potential recovery pending human validation.

The specialist selects:

`Open supplier recovery investigation`

ClaimIQ creates `SI-2026-014`, then enables:

`Prepare draft supplier recovery claim`

The prototype writes a draft claim package to Box. It does not submit or send the claim.

That is the complete P0 demonstration.

## 3. Problem

Manufacturers may process thousands of warranty claims across products, components, suppliers, and failure modes. A recurring supplier-component problem can remain hidden because each repair initially appears as an individual customer event.

A technical specialist must determine:

1. Whether the recent claim pattern is materially different from normal activity.
2. Whether the claims involve the same product and replaced component.
3. Which supplier, part, lot, and delivery records apply.
4. Whether engineering evidence supports supplier-attributable failure.
5. Whether the supplier agreement covers the component and expense.
6. Which claims have complete evidence.
7. Which claims must be excluded, held, or escalated.
8. What current warranty cost is supportable for recovery review.

The claim data may be structured, but critical agreements, engineering reports, returned-part analysis, photographs, and traceability evidence are documents in Box.

The product opportunity is a current-situation dashboard and investigation layer that connects the large claim population to governed evidence.

## 4. Goals

1. Load and audit `12,480` deterministic synthetic warranty claims.
2. Detect one transparent R500 power-supply signal from structured claim data.
3. Show the exact count, baseline, ratio, population criteria, and as-of date.
4. Never present the signal as proof of supplier responsibility.
5. Connect the signal to one `48`-claim investigation population.
6. Classify the population into supported, missing-evidence, engineering-review, and excluded groups.
7. Quantify only the `24` evidence-supported claims at `$180` each, totaling `$4,320`.
8. Make Box the authoritative repository for the agreement, amendment, engineering evidence, returned-part analysis, photographs, and traceability documents.
9. Let the technical specialist open every material document-derived finding in its original Box source.
10. Use Box metadata to find exact investigation documents.
11. Use Box AI Structured Extract where the available Box account supports it.
12. Retain file ID, version, page or image, excerpt, and extraction-review state for material findings.
13. Let the specialist open one supplier recovery investigation and prepare one draft supplier recovery claim package in Box.
14. Complete the full scenario reliably in three to four minutes.

## 5. Non-Goals

1. Building a general warranty-management platform.
2. Replacing customer service, warranty, manufacturing, procurement, quality, or financial systems.
3. Processing an external supplier claim.
4. Contacting a supplier.
5. Assigning legal liability or stating that money is owed.
6. Automatically diagnosing root cause from customer complaint text.
7. Building a predictive machine-learning reliability model.
8. Building multiple investigation scenarios for the prototype.
9. Supporting multiple currencies, jurisdictions, or contract structures.
10. Building settlement, negotiation, debit, credit, payment, or accounting workflows.
11. Building mobile authoring, global search, saved views, configurable dashboards, or bulk operations.
12. Using real customer, employee, supplier, price, agreement, or warranty data.
13. Claiming an industry-wide amount of missed supplier recovery.

## 6. Primary User

### Technical Specialist

The technical specialist monitors warranty patterns, reviews affected claim populations, validates engineering evidence, and decides whether a signal warrants a formal supplier recovery investigation.

For the prototype, this user performs every visible business action.

Related future users include supplier quality engineers, warranty analysts, recovery managers, contracts staff, and finance specialists. Their separate workflows are outside P0.

## 7. Product Model

```text
Warranty claim population
  -> Reliability signal
    -> Candidate investigation population
      -> Evidence-supported claims
      -> Missing-evidence claims
      -> Engineering-review claims
      -> Excluded claims
    -> Supplier recovery investigation
      -> Box draft supplier recovery claim
```

### Reliability Signal

A deterministic exception indicating that claim activity warrants investigation. It does not establish a defect or supplier responsibility.

### Candidate Investigation Population

Claims sharing the defined product, component, supplier mapping, date range, and symptom or failure-code criteria.

### Evidence-Supported Claim

A claim with reviewed evidence satisfying the prototype's component, supplier, timing, causation, contract, cost, and duplicate-recovery checks.

### Supplier Recovery Investigation

A human-opened record preserving the signal, population definition, evidence, findings, unresolved questions, and potential recovery amount.

## 8. Product Principles

1. **Signal is not causation:** A pattern opens a review, not a conclusion.
2. **Causation is not recovery:** Contract coverage is evaluated separately.
3. **Thousands first, sample second:** The dashboard represents the full population; individual claims are drill-down evidence.
4. **Rules calculate:** Counts, rates, filters, dates, caps, and amounts are deterministic.
5. **Quantify only supported claims:** Missing or conflicting cases do not enter the monetary total.
6. **Box is the evidence authority:** Material document-derived findings link to exact Box files and versions.
7. **Extracted does not mean approved:** Material extracted facts require a visible reviewer-confirmed state.
8. **Conflict is a result:** The product does not choose whichever conclusion creates more recovery.
9. **Human action opens the investigation:** ClaimIQ recommends; the technical specialist decides.
10. **No misleading money language:** Use `potential recovery pending human validation`.

## 9. P0 Scope

### Must Build

1. Live Box authentication and file access.
2. One Box folder tree with the exact synthetic documents in this PRD.
3. One Box metadata template and exact metadata queries.
4. Original-document opening with Box file ID and version.
5. Box AI Structured Extract for at least one agreement or engineering document if entitled by the provided account.
6. A local React and TypeScript application.
7. A deterministic local fixture containing `12,480` claims.
8. One signal rule and one precomputed historical baseline.
9. One Warranty Recovery Audit dashboard.
10. One signal investigation page.
11. One `48`-claim cohort with four decision groups.
12. One representative supported-claim drill-down.
13. One agreement evidence view and one engineering evidence view.
14. One `Open supplier recovery investigation` action.
15. One agreement-backed `Prepare draft supplier recovery claim` recommendation.
16. One draft claim package written to Box.
16. Desktop support at 1280x720 and 1440x900.

### Stretch

1. Box webhook processing.
2. New-evidence reassessment.
3. Multiple signals or investigations.
4. A full supplier recovery package.
5. External disclosure controls.
6. Advanced statistical detection.
7. Additional user roles.
8. Mobile layouts.

## 10. Box Integration Requirements

Box integration is the first implementation milestone and must work before the dashboard is built.

### Required P0 Behavior

1. Authenticate with the provided Box environment.
2. Create or use the approved demonstration folders.
3. Upload or locate the exact synthetic documents.
4. Apply the ClaimIQ metadata template.
5. Query documents by investigation, supplier, component, claim, and document type.
6. Retrieve file metadata and current version.
7. Open the original file in Box from ClaimIQ.
8. Store source references for every material extracted finding.
9. Write the generated draft supplier recovery claim package into the controlled Box output folder.

### Structured Extraction

Use Box AI Structured Extract when available to obtain:

1. Agreement ID and effective dates.
2. Covered component and supplier part.
3. Warranty period.
4. Recoverable cost category and cap.
5. Excluded cost categories.
6. Required evidence.
7. Filing window.
8. Engineering report ID, component, lot, failure mode, and conclusion.

Request source references and confidence information where supported. Store those values in ClaimIQ's local audit state.

An extracted value begins as `Candidate`. The synthetic initial scenario includes a visible `Reviewer confirmed` state before that value can support the `$4,320` total.

If Structured Extract is not enabled in the supplied Box account, the prototype may use a clearly labeled pre-seeded extraction fixture while still using live Box files, metadata, versions, previews, and output writes. This limitation must be shown in the capability record.

## 11. Synthetic Dataset

### Population

Total completed warranty claims: `12,480`  
Dataset period: `2025-10-18` through `2026-10-17`  
Dashboard as-of time: `2026-10-17 12:00 PM America/Los_Angeles`  
Products: R500 and other fictional Northstar hardware  
Primary monitored component: `PSU-750`

The dataset must contain enough unrelated products and failure modes that the PSU signal is a meaningful subset rather than the whole fixture.

### Signal

Signal ID: `SIG-2026-009`  
Title: `Elevated R500 no-power repairs`  
Current signal window: `2026-09-18` through `2026-10-17`  
Latest 30-day qualifying claims: `19`  
Historical baseline window: `2026-03-22` through `2026-09-17`  
Historical qualifying claims: `36` across six non-overlapping 30-day periods  
Historical average per 30 days: `6`  
Observed ratio: `3.17x baseline`

Signal policy:

1. Product model is `R500`.
2. Replaced component is `PSU-750`.
3. Structured failure code is in deterministic group `NO-POWER-v1`.
4. At least `15` qualifying completed claims occur in 30 days.
5. Current count is at least `2.5x` the historical 30-day average.

The rule is deliberately simple and transparent. It is not a production reliability model.

### Investigation Population

Investigation scope: `2026-07-20` through `2026-10-17`.  
Claims matching R500, PSU-750, and Atlas supplier mapping: `48`.

| Classification | Claims | Monetary treatment |
|---|---:|---|
| Evidence-supported | 24 | 24 x $180 = $4,320 |
| Missing supplier-lot evidence | 15 | Not quantified |
| Engineering review | 6 | Not quantified |
| Excluded non-supplier cause | 3 | Excluded |

All 48 claims appear exactly once.

### Representative Claim

Claim ID: `WR-10482`  
Product: `R500`  
Component: `PSU-750`  
Component serial: `NS-PSU-10482`  
Supplier part: `AP-750R2`  
Supplier lot: `ATL-24-118`  
Delivery receipt: `RCV-250118-04`  
Repair completed: `2026-09-20`  
Filing due: `2026-12-19`  
Verified replacement-part cost: `$180`  
Contract cap: `$200`  
Proposed amount: `min($180, $200) = $180`

The claim is evidence-supported because component traceability, in-period delivery, approved engineering causation, covered cost, open filing period, and no previous recovery are all present.

### Fictional Contract Terms

Agreement: `APC-2025-017`  
Supplier: `Atlas Power Components`  
Covered OEM part: `PSU-750`  
Covered supplier part: `AP-750R2`  
Warranty period: 24 months from documented delivery  
Recoverable cost: verified replacement-part cost  
Per-unit cap: `$200`  
Labor: excluded  
Shipping: excluded  
Required evidence: completed warranty record, exact traceability, and confirmed supplier-attributable failure  
Filing window: 90 days after completed repair

For this fictional agreement, an approved population-level field-failure report may establish causation for claims matching its frozen component, supplier-lot, date, and failure-code criteria. The 24 supported claims all match those criteria and have exact traceability. This is a demonstration term, not a universal recovery rule.

These are fictional demonstration terms, not typical or universal supplier terms.

## 12. Box Documents

### Folder Structure

```text
Northstar ClaimIQ/
  01 Supplier Agreements/
    Atlas Power Components/
  02 Recovery Signals/
    SIG-2026-009/
  03 Supplier Investigations/
    [SI-2026-014 created by the demo action]
  04 Draft Supplier Recovery Claims/
    [draft created by the demo action]
```

### Exact Documents

1. `Atlas_PSU_Supply_Agreement_APC-2025-017.pdf`
   Contains the fictional warranty, cost, cap, exclusion, evidence, and filing terms.
2. `Atlas_PSU_Amendment_01_APC-2025-017.pdf`
   Adds supplier part `AP-750R2` to the covered PSU-750 mapping.
3. `SIG-2026-009_Warranty_Trend_Report.pdf`
   Human-readable report of the 19 recent qualifying claims, six-claim baseline, and signal policy.
4. `SIG-2026-009_R500_PSU_Engineering_Report.pdf`
   Approved field-failure report combining returned-part sample analysis with frozen applicability criteria. It supports population-level causation only for claims matching the specified component, supplier lots, date range, and failure codes.
5. `SIG-2026-009_Traceability_Matrix.xlsx`
   Claim, asset serial, component serial, supplier part, lot, receipt, and evidence status.
6. `WR-10482_Evidence_Packet.pdf`
   Representative claim evidence containing the occurrence summary, component-label image, traceability, and reference to the approved population-level report.

Generated during the demo, not seeded:

7. `SI-2026-014_Supplier_Recovery_Claim_DRAFT.pdf`
   Generated claim package containing the issue summary, 24-claim schedule, `$4,320` proposed amount, agreement basis, evidence references, exclusions, and unresolved populations.

## 13. Box Metadata

Required fields:

1. `documentType`
2. `signalId`
3. `investigationId`
4. `claimId`
5. `supplierId`
6. `contractId`
7. `productModel`
8. `oemPartNumber`
9. `supplierPartNumber`
10. `componentSerialNumber`
11. `lotNumber`
12. `documentDate`
13. `reviewStatus`
14. `confidentiality`

Metadata queries required by P0:

1. Find all Box documents for `SIG-2026-009`.
2. Find the applicable agreement for `Atlas Power Components + PSU-750`.
3. After the demo actions, find the generated draft for `SI-2026-014`.

## 14. Exact UI

P0 has two routed screens:

1. `Warranty Recovery Audit`
2. `Signal Investigation`

The generated Box claim package is an output, not a third application screen.

### 14.1 Visual Direction

The interface should feel like a technical investigation console.

1. Dark navy navigation and warm near-white analysis surface.
2. Cobalt for active signals, teal for evidence-supported claims, amber for missing evidence, and red for conflicts or exclusions.
3. Monospaced treatment for claim IDs, part numbers, lots, counts, ratios, and amounts.
4. Use trend lines, funnels, tables, and document evidence rather than generic rounded cards.
5. No chatbot as the primary interface.
6. Every status uses text and icon, not color alone.

### 14.2 Warranty Recovery Audit Dashboard

Header:

1. Title: `Warranty recovery audit`.
2. Subtitle: `Northstar Infrastructure Systems | Technical Specialist`.
3. As-of timestamp.
4. Persistent label: `Synthetic demonstration data`.

Summary strip:

1. `12,480` - `Completed claims audited`.
2. `1` - `Active recovery signal`.
3. `$4,320` - `Potential recovery pending human validation`.
4. `21` - `Claims requiring evidence or engineering review`.

Primary signal panel:

1. Title: `Elevated R500 no-power repairs`.
2. Status: `Technical review recommended`.
3. `19 claims in 30 days`.
4. `Historical average: 6`.
5. `3.17x baseline`.
6. `48 claims in investigation population`.
7. Candidate component: `PSU-750`.
8. Candidate supplier: `Atlas Power Components`.
9. Warning: `Signal does not establish supplier responsibility`.
10. Action: `Investigate signal`.

Trend visualization:

1. Show 12 monthly claim counts.
2. Highlight the latest 30-day period.
3. Draw the historical average and signal threshold.
4. Hover and keyboard focus show exact values.

Population funnel:

```text
12,480 completed warranty claims
  -> 642 R500 claims
  -> 94 no-power claims
  -> 71 PSU-750 replacements
  -> 48 Atlas-mapped claims in the 90-day investigation scope
  -> 24 evidence-supported claims
```

Human attention:

1. `15 claims missing supplier-lot evidence`.
2. `6 claims require engineering review`.
3. `3 claims excluded for non-supplier causes`.

### 14.3 Signal Investigation

Header:

1. Breadcrumb: `Audit / SIG-2026-009`.
2. Title: `Elevated R500 no-power repairs`.
3. State: `Technical review recommended` before action and `Investigation opened` after action.
4. Population: `48 claims`.
5. Supported potential: `$4,320 pending human validation`.
6. Initial action: `Open supplier recovery investigation`.
7. After the investigation opens: `Prepare draft supplier recovery claim`.

Current situation summary:

> R500 no-power repairs increased to 19 in the latest 30-day period, 3.17 times the historical average. Forty-eight claims in the 90-day scope involve Atlas-supplied PSU-750 replacements. Twenty-four claims currently have reviewed traceability, engineering, contract, and cost evidence supporting recovery review.

Every factual statement links to either the deterministic claim fixture or a Box source.

Recovery recommendation:

1. Recommendation: `Prepare supplier recovery claim`.
2. Supported population: `24 claims`.
3. Proposed amount: `$4,320 potential recovery pending human validation`.
4. Agreement basis: covered PSU-750/AP-750R2, 24-month term, verified part cost, `$200` cap, and required evidence.
5. Excluded from the draft: 15 missing-traceability claims, 6 engineering-review claims, and 3 non-supplier-cause claims.
6. Warning: `Recommendation requires human approval and is not a submitted claim`.

Decision lanes:

1. `Evidence-supported (24)`.
2. `Missing traceability (15)`.
3. `Engineering review (6)`.
4. `Excluded (3)`.

Claim table columns:

1. Claim ID.
2. Repair date.
3. Product serial.
4. Component serial.
5. Supplier lot.
6. Failure code.
7. Evidence state.
8. Cost.
9. Current classification.

The table displays the `48`-claim investigation population, not all `12,480` claims.

Representative claim detail for `WR-10482`:

1. Exact component and supplier identifiers.
2. Requirement checklist.
3. `$180` calculation.
4. Engineering conclusion.
5. Contract term.
6. Traceability chain.
7. `Inspect source` controls.

Evidence panel:

1. Applicable agreement and amendment.
2. Engineering report containing returned-part sample analysis and frozen population criteria.
3. Traceability matrix.
4. Representative claim evidence packet.
5. Box file ID, version, metadata, and review state.
6. `Open original in Box`.

Investigation and claim-preparation actions:

Selecting `Open supplier recovery investigation` requires confirmation and then:

1. Creates `SI-2026-014` in local prototype state.
2. Records the specialist, time, signal, population definition, and current counts.
3. Changes the signal state to `Investigation opened`.
4. Enables `Prepare draft supplier recovery claim`.

Selecting `Prepare draft supplier recovery claim` requires a second confirmation and then:

1. Freezes the 24-claim supported population snapshot.
2. Records the `$4,320` proposed amount and applied agreement terms.
3. Generates `SI-2026-014_Supplier_Recovery_Claim_DRAFT.pdf`.
4. Writes the draft to `04 Draft Supplier Recovery Claims/` in Box.
5. Labels the output `Draft - not submitted`.
6. Does not contact the supplier or submit a financial claim.

### 14.4 Source Inspector

For a Box document, show:

1. Finding supported.
2. Box file name, file ID, and version.
3. Metadata.
4. Page, sheet, or image reference.
5. Supporting excerpt or extracted field.
6. Confidence when available.
7. Review state: `Candidate`, `Reviewer confirmed`, or `Rejected`.
8. `Open original in Box`.

For structured claim data, show fixture source, exact record key, relevant fields, and as-of time.

## 15. Deterministic Rules

### Signal Rule

1. Deduplicate claims by claim ID and source version.
2. Select completed R500 repairs with PSU-750 replacements and `NO-POWER-v1` failure codes.
3. Count the latest 30-day period.
4. Compare against the fixed historical average.
5. Trigger when count is at least 15 and ratio is at least 2.5x.

Expected result: `19 / 6 = 3.17x`, so the signal is active.

### Investigation Population Rule

1. Use the fixed `2026-07-20` through `2026-10-17` scope.
2. Require R500 product, PSU-750 replacement, and Atlas supplier mapping.
3. Return exactly 48 claims.

### Evidence-Supported Rule

A claim is supported only when all are true:

1. Completed warranty repair exists.
2. Exact component and supplier traceability exists.
3. Applicable agreement covers the component.
4. Component is within the supplier warranty period.
5. The claim matches the reviewed population-level engineering report's component, supplier-lot, date, and failure-code criteria.
6. Verified replacement-part cost exists.
7. Filing window remains open.
8. No previous recovery or credit exists.
9. Required evidence is accessible.

Potential amount is `min(verified part cost, $200 cap)`.

Expected result: 24 supported claims x `$180` = `$4,320`.

## 16. User Stories

### US-01: See the Current Situation

As a technical specialist, I want a dashboard summarizing thousands of claims so that I can see emerging supplier-recovery risks.

Acceptance criteria:

1. Dashboard shows 12,480 audited claims and one active signal.
2. Signal shows 19 recent claims, baseline 6, and 3.17x ratio.
3. Dashboard labels the signal as unconfirmed.
4. Dashboard shows `$4,320 potential recovery pending human validation`.

### US-02: Understand the Signal

As a technical specialist, I want the signal criteria and population funnel so that I can verify why the issue was raised.

Acceptance criteria:

1. Counts reconcile from 12,480 to the 48-claim investigation population.
2. The signal rule is visible and reproducible.
3. All 48 claims appear exactly once across the four decision groups.

### US-03: Verify Box Evidence

As a technical specialist, I want findings linked to original Box documents so that I can validate them quickly.

Acceptance criteria:

1. Agreement and engineering findings show Box file ID and version.
2. A material source opens in Box in no more than two interactions.
3. Extracted material facts show review state.
4. Metadata queries return the expected signal, investigation, agreement, and claim documents.

### US-04: Inspect a Supported Claim

As a technical specialist, I want one representative claim drill-down so that I can understand why claims enter the supported total.

Acceptance criteria:

1. `WR-10482` displays exact traceability and reviewed engineering evidence.
2. Cost calculation is `min($180, $200) = $180`.
3. Each requirement identifies its source.

### US-05: Open the Investigation and Prepare the Draft Claim

As a technical specialist, I want to open an investigation and prepare an agreement-backed draft recovery claim so that the supported issue can enter human review.

Acceptance criteria:

1. Action requires confirmation.
2. Investigation records the signal and 48-claim population snapshot.
3. Recommendation includes only the 24 supported claims and `$4,320`.
4. Draft claim package is written to Box.
5. Package is labeled `Draft - not submitted`.
6. No external communication occurs.

## 17. Success Criteria

1. The prototype loads exactly 12,480 synthetic claims without manual data editing during the demo.
2. The deterministic rule produces exactly one signal with 19 recent claims and 3.17x baseline.
3. The 90-day investigation population contains exactly 48 claims.
4. Classification totals exactly 24 supported, 15 missing traceability, 6 engineering review, and 3 excluded.
5. Only the 24 supported claims enter the `$4,320` total.
6. The UI never describes the signal as proof of supplier fault.
7. `WR-10482` can be traced from claim data to engineering and contract evidence.
8. At least one agreement source and one engineering source open from ClaimIQ in Box.
9. Box metadata queries return the expected files.
10. Material extracted facts show source and review state.
11. The specialist can open `SI-2026-014` and create the 24-claim, `$4,320` draft recovery claim package in Box.
12. Refreshing the browser preserves the local investigation state.
13. The complete scenario runs in four minutes or less in two consecutive rehearsals.
14. Type checks, tests, production build, and P0 browser workflows pass.
15. Desktop layouts show no clipped controls or unintended horizontal overflow at 1280x720 and 1440x900.

## 18. Constraints and Assumptions

1. All data and organizations are synthetic.
2. The prototype uses one scenario only.
3. The claim dataset is local and deterministic.
4. The signal policy is intentionally simple and is not a validated production model.
5. Box is the only live external integration required in the first build phase.
6. The available Box account, authentication method, metadata permissions, AI entitlement, and write permissions must be verified before implementation.
7. The prototype uses React and TypeScript.
8. Investigation state may use schema-versioned browser storage for the first prototype.
9. Box documents and file versions remain authoritative for evidence.
10. Production identity, retention, legal hold, and formal audit controls are deferred.
11. No paid resources, external communications, deployment, or repository initialization are authorized by this draft.

## 19. Risks and Mitigations

1. **Signal appears to prove supplier fault:** Use explicit unconfirmed-signal language everywhere.
2. **12,480 claims make the prototype slow:** Aggregate locally and render only the 48-claim investigation table.
3. **Synthetic numbers look arbitrary:** Keep the fixture deterministic and expose the full funnel and formulas.
4. **Box appears to be generic storage:** Use metadata queries, file versions, source inspection, extraction provenance, and output writes.
5. **Box AI is unavailable:** Keep live Box APIs and clearly label pre-seeded extraction fixtures.
6. **Recovery amount is overstated:** Quantify only reviewed evidence-supported claims.
7. **The project expands into claim processing:** End P0 when the unsubmitted draft claim package is written to Box.
8. **The product promises unsupported market value:** Use public examples only as evidence that large supplier-recovery events exist, not as a missed-recovery estimate.

## 20. Build Sequence

Each approved step must be functionally verified and committed locally as one focused unit.

1. Verify the Box account, authentication, folder access, metadata permissions, AI entitlement, preview access, and output-folder write access.
2. Create the Box folder structure, upload the six seed documents, and record their file IDs and versions.
3. Create the ClaimIQ metadata template, apply seed metadata, and verify the three required queries.
4. Verify Structured Extract on one document, or record the entitlement limitation and approved extraction fixture.
5. Scaffold the React and TypeScript application with typecheck, test, build, and browser-test commands.
6. Define typed models and generate the deterministic 12,480-claim fixture.
7. Implement the 19-claim signal rule, 48-claim population, four classifications, and exact `$4,320` total with tests.
8. Build the Warranty Recovery Audit dashboard with summary strip, one signal, simple trend, funnel, and attention counts.
9. Build the Signal Investigation with four decision lanes and the paginated 48-claim table.
10. Build the `WR-10482` representative detail and agreement-backed requirement checklist.
11. Implement Box metadata discovery, source inspection, `Open in Box`, and file-version provenance.
12. Build the recommendation panel showing 24 supported claims, `$4,320`, agreement basis, and excluded populations.
13. Implement `Open supplier recovery investigation` with confirmation and schema-versioned local persistence.
14. Generate the draft supplier recovery claim package and write it to Box after a second confirmation.
15. Add the essential loading, Box-unavailable, and extraction-unavailable states.
16. Verify keyboard operation, focus visibility, semantic status, and 1280x720 and 1440x900 layouts.
17. Run all rule, Box, UI, accessibility, typecheck, and production-build checks.
18. Rehearse the one scenario twice under four minutes and produce the runbook, screenshots, capability record, and acceptance evidence.

## 21. Verification Plan

### Data and Rule Tests

1. Fixture contains exactly 12,480 unique claims.
2. Current qualifying count is 19.
3. Historical baseline is 6.
4. Ratio rounds and displays as 3.17x.
5. Investigation population is 48.
6. Classification totals reconcile to 48.
7. Supported total is exactly `$4,320`.
8. Unsupported, unresolved, or excluded claims do not enter the amount.

### Box Tests

1. Authentication succeeds with the approved identity.
2. Metadata queries return expected documents.
3. Current file IDs and versions are captured.
4. Original files open from ClaimIQ.
5. Structured extraction or the disclosed extraction fixture returns expected fields and references.
6. Draft supplier recovery claim package is written to the correct Box folder with 24 supported claims, `$4,320`, and `Draft - not submitted` labeling.
7. Unauthorized folders are not exposed.

### UI Tests

1. Dashboard metrics and signal.
2. Trend and population funnel.
3. Four decision lanes totaling 48.
4. Representative claim drill-down.
5. Agreement and engineering source inspection.
6. Investigation confirmation.
7. Browser refresh persistence.
8. Box output success and failure states.
9. Keyboard-only P0 workflow.
10. 1280x720 and 1440x900 screenshots.

## 22. Research Basis

The prototype does not need a universal estimate of missed supplier reimbursements. Public evidence is sufficient to show that component failures can create large warranty populations and material supplier recoveries.

1. General Motors recorded a `$1.9 billion` receivable from LG that substantially offset approximately `$2.0 billion` of Chevrolet Bolt warranty charges. Source: <https://www.sec.gov/Archives/edgar/data/1467858/000146785821000152/gm-20210930.htm>
2. Ford disclosed a favorable `$240 million` settlement with Bridgestone-Firestone. Source: <https://www.sec.gov/Archives/edgar/data/37996/000003800906000031/fmc10k2005.htm>
3. Public Stellantis warranty procedures describe grouping claims, analyzing a representative part sample, calculating a technical responsibility factor, and applying it to a broader claim population. Source: <https://www.esupplierconnect.com/irj/go/km/docs/SC_Suppliers/Anonymous%20Site/GLOBAL_Reference_docs/Warranty_Terms_Implementation_Procedures_for_NA.pdf>
4. Federal early-warning rules require large manufacturers to aggregate warranty claims by product and component categories, demonstrating that population-level monitoring is an established operational pattern. Source: <https://www.ecfr.gov/current/title-49/subtitle-B/chapter-V/part-579/section-579.21>

These examples establish plausibility. They do not establish how much supplier recovery manufacturers miss industry-wide.

## 23. Open Questions

1. **Blocking before approval:** What is the exact submission deadline and time zone, presentation time limit, and judging rubric?
2. **Blocking before Box work:** Which Box account and authentication method are available?
3. Is Box AI Structured Extract enabled for that account?
4. Can the demo identity create metadata templates, run metadata queries, preview files, and write the draft recovery claim package?
5. Should the dashboard title remain `Warranty recovery audit`, or should it use `Supplier recovery monitor`?
6. Should the primary user be called `Technical Specialist`, `Supplier Quality Engineer`, or another exact role in the presentation?

## 24. Approval Gate

This PRD is the draft source of truth in `code-projects/audit-hackathon/`. Do not initialize Git, install packages, create or upload Box assets, spend money, or begin implementation until Adam answers the blocking questions and explicitly says `proceed`.
