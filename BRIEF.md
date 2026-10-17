# ClaimIQ Recovery PRD Brief

Date: 2026-10-17  
Status: Draft PRD only; implementation not started

## Current Product Decision

ClaimIQ Recovery is a Box-first supplier recovery audit prototype for one fictional scenario.

A technical specialist reviews `12,480` synthetic warranty claims, investigates one elevated R500 PSU-750 signal, verifies technical and contractual evidence in Box, and prepares an unsubmitted supplier recovery claim draft for `24` supported claims totaling `$4,320 potential recovery pending human validation`.

## Scope Decisions

1. One scenario and two application screens.
2. Box is the first and only live external integration in the initial build phase.
3. The claim dataset and signal calculations are local and deterministic.
4. The dashboard represents thousands of claims; only the 48-claim investigation population is shown in detail.
5. The prototype ends when the draft supplier recovery claim package is written to Box.
6. The prototype does not submit a claim, contact a supplier, assign liability, or state that money is owed.

## Workspace Inspection

1. The active PRD is `code-projects/audit-hackathon/PRD.md`.
2. The project folder contains handoff documentation only; implementation has not started.
3. No ClaimIQ build logs, generated artifacts, credentials record, or application files exist.
4. No root or project `.env` file or Box configuration file was found.
5. No hackathon deadline, presentation limit, judging rubric, or sponsor-access record was found outside the PRD.
6. Existing files under `builds/logs/` belong to unrelated projects.
7. `builds/logs/capability-atlas-dev.stderr.log` contains an unrelated historical Windows command-quoting failure.
8. Workspace instructions require Adam's explicit `proceed` before implementation; moving the handoff documents did not start the build.

## Public Research Retained

The PRD keeps only four concise sources:

1. GM's recorded `$1.9 billion` receivable from LG related to Chevrolet Bolt warranty charges.
2. Ford's disclosed `$240 million` Bridgestone-Firestone settlement.
3. Public Stellantis warranty procedures describing representative samples and population-level technical factors.
4. Federal early-warning rules requiring component-level warranty aggregation.

These sources establish plausibility but do not support an industry-wide estimate of missed supplier recovery.

## Blocking Inputs

1. Exact submission deadline and time zone.
2. Presentation time limit and judging rubric.
3. Available Box account and authentication method.
4. Box AI Structured Extract entitlement.
5. Permission to create metadata templates, query metadata, preview source files, and write the draft claim package.
6. Adam's explicit `proceed` before implementation.
