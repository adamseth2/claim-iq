"""Verify actual PDF text and XLSX contents for both synthetic renderers."""
import hashlib
import importlib.util
import json
from pathlib import Path
import shutil
import subprocess
import sys
import xml.etree.ElementTree as ET
from zipfile import ZipFile

import pytest
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[3]
SCRIPT = ROOT / "server/seed/generate.mjs"
NODE = shutil.which("node")
NAMES = {
    "Atlas_PSU_Supply_Agreement_APC-2025-017.pdf",
    "Atlas_PSU_Amendment_01_APC-2025-017.pdf",
    "SIG-2026-009_Warranty_Trend_Report.pdf",
    "SIG-2026-009_R500_PSU_Engineering_Report.pdf",
    "SIG-2026-009_Traceability_Matrix.xlsx",
    "WR-10482_Evidence_Packet.pdf",
}


def generate(output, renderer):
    subprocess.run([NODE, str(SCRIPT), "--renderer", renderer, "--output", str(output),
                    "--python", sys.executable], cwd=output.parent, check=True, capture_output=True)


@pytest.fixture(scope="module", params=["native", "reportlab"])
def documents(tmp_path_factory, request):
    output = tmp_path_factory.mktemp("claimiq-docs") / request.param
    generate(output, request.param)
    return output, request.param


def text(path):
    return " ".join(" ".join(p.extract_text() or "" for p in PdfReader(path).pages).split())


def test_seed_names_and_hashes(documents):
    output, renderer = documents
    manifest = json.loads((output / "manifest.json").read_text())
    assert {item["name"] for item in manifest["documents"]} == NAMES
    assert manifest["synthetic"] is True
    assert manifest["renderer"] == renderer
    assert manifest["financialActionAuthorized"] is False
    for item in manifest["documents"]:
        assert hashlib.sha256((output / item["name"]).read_bytes()).hexdigest() == item["sha256"]


def test_synthetic_marker_on_every_pdf_page(documents):
    output, _ = documents
    for path in output.glob("*.pdf"):
        for page in PdfReader(path).pages:
            assert "SYNTHETIC DEMONSTRATION DOCUMENT" in page.extract_text()


def test_agreement_and_claim_economics_are_current(documents):
    output, _ = documents
    agreement = text(output / "Atlas_PSU_Supply_Agreement_APC-2025-017.pdf")
    packet = text(output / "WR-10482_Evidence_Packet.pdf")
    assert "maximum of $650 per unit" in agreement
    assert "free of Defects for 24 months" in agreement
    assert "within 90 days after the completed warranty repair" in agreement
    assert "Verified replacement-part cost: $620" in packet
    assert "$14880 potential recovery pending human validation" in packet
    assert "SYNTHETIC PLACEHOLDER ONLY - no photograph supplied" in packet


def test_engineering_and_trend_report_frozen_criteria(documents):
    output, _ = documents
    engineering = text(output / "SIG-2026-009_R500_PSU_Engineering_Report.pdf")
    trend = text(output / "SIG-2026-009_Warranty_Trend_Report.pdf")
    assert "2026-07-20 to 2026-10-17" in engineering
    assert "ATL-24-116, ATL-24-118, ATL-24-121" in engineering
    assert "Returned-part sample size: 12" in engineering
    assert "Qualifying claims in current window: 19" in trend
    assert "Observed ratio: 3.17x baseline" in trend
    assert "does not establish a defect or supplier responsibility" in trend


def test_traceability_matrix_has_unique_current_rows_and_evidence_gaps(documents):
    output, _ = documents
    with ZipFile(output / "SIG-2026-009_Traceability_Matrix.xlsx") as workbook:
        sheet = ET.fromstring(workbook.read("xl/worksheets/sheet1.xml"))
    ns = {"s": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
    cells = [[c.find("s:is/s:t", ns).text or "" for c in row] for row in sheet.findall("s:sheetData/s:row", ns)]
    rows = [dict(zip(cells[0], row)) for row in cells[1:]]
    assert len(rows) == len({r["Claim ID"] for r in rows}) == 48
    assert {kind: sum(r["Classification"] == kind for r in rows) for kind in
            ("supported", "missing", "engineering", "excluded")} == {
                "supported": 24, "missing": 15, "engineering": 6, "excluded": 3}
    assert sum("2026-09-18" <= r["Repair Date"] <= "2026-10-17" for r in rows) == 19
    assert all(r["Supplier Lot"] == "(none)" for r in rows if r["Classification"] == "missing")
    assert all(r["Failure Code"] == "NO-POWER-v1" for r in rows)
    rep = next(r for r in rows if r["Claim ID"] == "WR-10482")
    assert rep["Product Serial"] == "NS-R500-10482"
    assert rep["Repair Date"] == "2026-09-20"
    assert sum(float(r["Cost (USD)"]) for r in rows if r["Classification"] == "supported") == 14880


def test_document_generation_is_byte_deterministic(documents, tmp_path):
    output, renderer = documents
    repeat = tmp_path / "repeat"
    generate(repeat, renderer)
    for path in output.iterdir():
        assert path.read_bytes() == (repeat / path.name).read_bytes()


def test_reportlab_paginates_long_lines_and_escapes_markup():
    spec = importlib.util.spec_from_file_location("renderer", ROOT / "server/seed/render_documents.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    lines = ["Literal <b>text</b> & evidence"] + [f"Line {i} " + "long text " * 20 for i in range(60)]
    pdf = module.render_pdf([{"title": "Synthetic overflow test", "lines": lines + ["FINAL REVIEW DISCLAIMER"]}])
    import io
    reader = PdfReader(io.BytesIO(pdf))
    assert len(reader.pages) > 1
    all_text = " ".join(page.extract_text() for page in reader.pages)
    assert "Literal <b>text</b> & evidence" in all_text
    assert "Line 59" in all_text and "FINAL REVIEW DISCLAIMER" in all_text
    assert all("FICTIONAL" in page.extract_text() for page in reader.pages)


def test_detailed_contract_and_amendment_are_preserved(documents):
    output, _ = documents
    agreement = text(output / "Atlas_PSU_Supply_Agreement_APC-2025-017.pdf")
    amendment = text(output / "Atlas_PSU_Amendment_01_APC-2025-017.pdf")
    for section in range(1, 16):
        assert f"ARTICLE {section} -" in agreement
    for schedule in ("SCHEDULE A", "SCHEDULE B", "SCHEDULE C"):
        assert schedule in agreement
    assert "AP-750R2 is not covered" in agreement
    assert "Covered for all Deliveries on or after 2025-06-01" in amendment
    assert "Signed for Supplier" in agreement and "Signed for Supplier" in amendment


def test_current_draft_preview_keeps_all_claims_and_closing_disclaimer():
    result = subprocess.run([NODE, "--input-type=module", "-e",
        "import { buildDraftPdf } from './server/box-draft.mjs'; process.stdout.write(buildDraftPdf());"],
        cwd=ROOT, check=True, capture_output=True)
    population = subprocess.run([NODE, "--input-type=module", "-e",
        "import { buildPopulation } from './server/seed/population.mjs'; console.log(JSON.stringify(buildPopulation()));"],
        cwd=ROOT, check=True, capture_output=True)
    import io
    reader = PdfReader(io.BytesIO(result.stdout))
    content = " ".join(" ".join(p.extract_text().split()) for p in reader.pages)
    supported = [r for r in json.loads(population.stdout) if r["classification"] == "supported"]
    assert len(supported) == 24
    assert all(r["claimId"] in content for r in supported)
    assert "$14880 potential recovery pending human validation" in content
    assert "no supplier has been contacted" in content
    assert all("SYNTHETIC DEMONSTRATION DOCUMENT" in p.extract_text() for p in reader.pages)
