// Minimal dependency-free PDF writer for simple multi-page text documents.
// Produces valid PDF 1.4 with Helvetica. Enough for synthetic demo documents.

function esc(s) {
  return String(s).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/**
 * @param {Array<{title?:string, lines:string[]}>} pages
 * @returns {Buffer}
 */
export function buildPdf(pages) {
  const objects = [];
  const pageObjNums = [];

  // Reserve: 1=Catalog, 2=Pages, 3=Font
  const fontObj = 3;
  let next = 4;

  const contentStreams = [];
  for (const page of pages) {
    const lines = [];
    let y = 760;
    if (page.title) {
      lines.push(`BT /F1 16 Tf 54 ${y} Td (${esc(page.title)}) Tj ET`);
      y -= 28;
    }
    for (const ln of page.lines) {
      // wrap long lines crudely at ~95 chars
      const chunks = wrap(String(ln), 95);
      for (const c of chunks) {
        if (y < 54) break;
        lines.push(`BT /F1 10 Tf 54 ${y} Td (${esc(c)}) Tj ET`);
        y -= 14;
      }
    }
    const stream = lines.join('\n');
    const contentNum = next++;
    const pageNum = next++;
    contentStreams.push({ contentNum, pageNum, stream });
    pageObjNums.push(pageNum);
  }

  // Build objects
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  objects[2] = `<< /Type /Pages /Kids [${pageObjNums
    .map((n) => `${n} 0 R`)
    .join(' ')}] /Count ${pageObjNums.length} >>`;
  objects[fontObj] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>`;

  for (const cs of contentStreams) {
    objects[cs.contentNum] = `<< /Length ${Buffer.byteLength(cs.stream, 'utf8')} >>\nstream\n${cs.stream}\nendstream`;
    objects[cs.pageNum] =
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] ` +
      `/Resources << /Font << /F1 ${fontObj} 0 R >> >> /Contents ${cs.contentNum} 0 R >>`;
  }

  // Serialize with xref
  let out = '%PDF-1.4\n';
  const offsets = [];
  const maxObj = next - 1;
  for (let i = 1; i <= maxObj; i++) {
    offsets[i] = Buffer.byteLength(out, 'utf8');
    out += `${i} 0 obj\n${objects[i]}\nendobj\n`;
  }
  const xrefStart = Buffer.byteLength(out, 'utf8');
  out += `xref\n0 ${maxObj + 1}\n`;
  out += `0000000000 65535 f \n`;
  for (let i = 1; i <= maxObj; i++) {
    out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer\n<< /Size ${maxObj + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;
  return Buffer.from(out, 'utf8');
}

function wrap(text, width) {
  if (text.length <= width) return [text];
  const words = text.split(' ');
  const out = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > width) {
      if (cur) out.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}
