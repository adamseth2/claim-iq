"""Deterministic synthetic PDFs adapted from Box AI Exception Investigator demo.py.

Reads document page descriptions from stdin and emits PDF bytes to stdout.
This renderer has no network, model, Box or financial-action integration.
"""
import io
import json
import re
import sys
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfgen import canvas
from reportlab.platypus import BaseDocTemplate, Frame, PageBreak, PageTemplate, Paragraph, Preformatted, Spacer

SYNTHETIC = "SYNTHETIC DEMONSTRATION DOCUMENT - FICTIONAL"


def render_pdf(pages):
    if not pages:
        raise ValueError("At least one document page is required")
    buffer = io.BytesIO()
    doc = BaseDocTemplate(buffer, pagesize=letter, leftMargin=42, rightMargin=42,
                          topMargin=116, bottomMargin=68,
                          title="Synthetic ClaimIQ evidence", author="ClaimIQ synthetic fixture")
    body = ParagraphStyle("Body", fontName="Helvetica", fontSize=10, leading=12.5,
                          spaceAfter=2, textColor=colors.HexColor("#14243C"))
    title = ParagraphStyle("Title", parent=body, fontName="Helvetica-Bold", fontSize=17,
                           leading=22, spaceAfter=14, keepWithNext=True)

    heading = ParagraphStyle("Heading", parent=body, fontName="Helvetica-Bold",
                             spaceBefore=4, spaceAfter=4, keepWithNext=True)
    columns = ParagraphStyle("Columns", parent=body, fontName="Courier", fontSize=8,
                             leading=11, spaceAfter=3)

    def decorate(pdf, document):
        pdf.saveState()
        pdf.setFillColor(colors.HexColor("#14243C"))
        pdf.rect(0, 692, 612, 100, fill=1, stroke=0)
        pdf.setFillColor(colors.white)
        pdf.setFont("Helvetica-Bold", 18)
        pdf.drawString(42, 749, "NORTHSTAR / CLAIMIQ")
        pdf.setFont("Helvetica", 9)
        pdf.drawString(42, 721, SYNTHETIC)
        pdf.setFillColor(colors.HexColor("#14243C"))
        pdf.setFont("Helvetica", 8)
        pdf.drawString(42, 43, "Fictional fixture for human review. No financial action authorized.")
        pdf.drawRightString(570, 43, f"Page {document.page}")
        pdf.restoreState()

    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height,
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates(PageTemplate(id="Synthetic", frames=frame, onPage=decorate))
    story = []
    for index, page in enumerate(pages):
        if index:
            story.append(PageBreak())
        if page.get("title"):
            story.append(Paragraph(escape(str(page["title"])), title))
        # Join indented continuation lines, retaining every word and logical page.
        # Keep column-aligned schedule rows distinct and preserve their spacing.
        lines = []
        for raw in page["lines"]:
            line = str(raw)
            is_columns = bool(re.search(r"\S {2,}\S", line))
            if (line.startswith("   ") and not is_columns and lines and lines[-1].strip()
                    and not lines[-1].startswith(("ARTICLE", "SCHEDULE"))
                    and not re.search(r"\S {2,}\S", lines[-1])):
                lines[-1] += " " + line.strip()
            else:
                lines.append(line)
        for line in lines:
            if not line.strip():
                story.append(Spacer(1, 5))
            elif re.search(r"\S {2,}\S", line):
                story.append(Preformatted(line, columns))
            else:
                style = heading if line.startswith(("ARTICLE", "SCHEDULE", "RECITALS", "AMENDMENT")) else body
                story.append(Paragraph(escape(line), style))
    # Same invariant used by the investigator's generator; no wall-clock PDF dates or IDs.
    def deterministic_canvas(*args, **kwargs):
        kwargs["invariant"] = 1
        return canvas.Canvas(*args, **kwargs)
    doc.build(story, canvasmaker=deterministic_canvas)
    return buffer.getvalue()


if __name__ == "__main__":
    payload = json.load(sys.stdin)
    sys.stdout.buffer.write(render_pdf(payload["pages"]))
