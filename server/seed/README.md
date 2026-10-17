# Synthetic ClaimIQ evidence

This generator creates the six fictional inputs already expected by `server/box-seed.mjs`:

1. `Atlas_PSU_Supply_Agreement_APC-2025-017.pdf`
2. `Atlas_PSU_Amendment_01_APC-2025-017.pdf`
3. `SIG-2026-009_Warranty_Trend_Report.pdf`
4. `SIG-2026-009_R500_PSU_Engineering_Report.pdf`
5. `SIG-2026-009_Traceability_Matrix.xlsx`
6. `WR-10482_Evidence_Packet.pdf`

It also writes `manifest.json` with a synthetic label, renderer name, fixed scenario as-of,
file sizes, SHA-256 hashes, and `financialActionAuthorized: false`. This is a local fixture
inventory, not Box evidence, a proof of review, or a financial approval. No recovery draft is
seeded. The existing human-controlled draft action remains separate.

## Existing Node renderer

```powershell
npm run seed:docs
```

No Python, model call or credentials are needed. Native PDF overflow now continues onto a
new page instead of dropping lines; every page is marked synthetic. This also preserves
long schedules and closing disclaimers in the existing draft PDF writer.

## Optional ReportLab renderer from Box AI Exception Investigator

`render_documents.py` adapts the investigator's `demo.py` approach: ReportLab canvas,
letter-sized pages, a Northstar header, a prominent fictional-document banner, a page footer,
and invariant PDF metadata. Platypus adds text wrapping and automatic pagination for the
longer ClaimIQ documents, including the current multi-article contract and amendment. Literal text is escaped before layout. The procurement app's
invoice fixtures, Streamlit UI, extraction code and financial checks are not dependencies.
The original file is retained in that separate project; this renderer is an adapted copy.

Use Python 3.11 or newer. From the repository root on Windows:

```powershell
py -3 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r server/seed/requirements.txt
npm run seed:docs:reportlab -- --python .venv/Scripts/python.exe
```

On macOS or Linux:

```bash
python3 -m venv .venv
.venv/bin/python -m pip install -r server/seed/requirements.txt
npm run seed:docs:reportlab -- --python .venv/bin/python
```

Alternatively set `CLAIMIQ_PYTHON` to an interpreter path. When neither is set, the optional
renderer uses `python` on Windows and `python3` elsewhere. If Python or ReportLab is missing,
the command fails before creating output and never silently changes renderers.

Both commands default to `server/seed/out/`; the existing Box seed command reads those exact
six filenames. An alternate review directory can be selected with `--output path/to/folder`.
Explicit relative Python/output paths are relative to the command's working directory.
Output is ignored by Git. Generation replaces its six named files and manifest and does not
clean unrelated files. Use a dedicated fixture directory. If a later render/write fails,
earlier files may already have been written; rerun successfully before seeding.

## Consistency with the current warranty scenario

Document definitions continue to use `facts.mjs`: 19 recent claims, baseline 6, 3.17x,
48 investigation claims, classifications 24 / 15 / 6 / 3, verified cost USD 620, cap USD 650,
and USD 14,880 potential recovery pending human validation. Supported and unresolved
populations remain distinct.

The seed population mirrors the latest browser fixture's interleaved classifications,
claim IDs, product/component serials, dates and varied non-supported costs. Vitest compares
every seed row to the browser population, catching drift before a matrix or draft schedule
can use outdated identifiers. Missing lots and delivery receipts remain `(none)`; no missing
traceability is filled in. The component-label placeholder explicitly states that no
photograph is supplied. Synthetic engineering conclusions and review labels are demo data,
not statements about an actual supplier or real-world review.

## Tests

```powershell
npm test
npm run test:seed
.\.venv\Scripts\python.exe -m pip install -r server/seed/requirements-test.txt
.\.venv\Scripts\python.exe -m pytest server/seed/tests/test_documents.py -q
npm run typecheck
npm run build
```

Tests inspect actual PDF text and every matrix row, check deterministic bytes and hashes,
exercise pagination and missing-interpreter behavior, preserve the existing filenames, and
compare seed/UI populations. CI runs these without Box or OpenAI secrets. No generation or
test command uploads assets, contacts a supplier or authorizes a financial action. Uploading
new versions to Box is a separate explicit operation; this PR does not perform it or change
existing file IDs, versions, metadata review states or generated frontend Box mappings.
