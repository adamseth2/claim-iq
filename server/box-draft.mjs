// Generates the draft supplier recovery claim package and writes it to the
// Box output folder "04 Draft Supplier Recovery Claims". Labeled "Draft - not
// submitted". Does NOT submit or contact the supplier (PRD 14.3 / AGENTS.md).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { boxApi } from './box-client.mjs';
import { buildPdf } from './seed/pdf.mjs';
import { buildPopulation } from './seed/population.mjs';
import {
  INVESTIGATION_ID,
  CONTRACT_ID,
  SUPPLIER,
  OEM_PART,
  SUPPLIER_PART,
  PER_UNIT_CAP,
  SUPPORTED_CLAIMS,
  SUPPORTED_TOTAL,
  VERIFIED_PART_COST,
} from './seed/facts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCOPE = 'enterprise';
const TEMPLATE_KEY = 'claimiqRecovery';
const DRAFT_NAME = `${INVESTIGATION_ID}_Supplier_Recovery_Claim_DRAFT.pdf`;

async function findOutputFolder() {
  // Navigate Northstar ClaimIQ -> 04 Draft Supplier Recovery Claims
  const root = await findChild('0', 'Northstar ClaimIQ');
  if (!root) throw new Error('root folder "Northstar ClaimIQ" not found; run box:seed');
  const out = await findChild(root, '04 Draft Supplier Recovery Claims');
  if (!out) throw new Error('output folder not found; run box:seed');
  return out;
}

async function findChild(parentId, name) {
  const items = await boxApi(`/folders/${parentId}/items?limit=1000&fields=id,name,type`);
  const f = (items.entries || []).find((e) => e.type === 'folder' && e.name === name);
  return f ? f.id : null;
}

function buildDraftPdf() {
  const pop = buildPopulation().filter((r) => r.classification === 'supported');
  const schedule = pop.map(
    (r, i) =>
      `${String(i + 1).padStart(2, '0')}. ${r.claimId}  lot ${r.supplierLot}  ${r.repairDate}  $${Math.min(r.cost, PER_UNIT_CAP)}`,
  );
  return buildPdf([
    {
      title: `DRAFT - NOT SUBMITTED  ·  ${INVESTIGATION_ID}`,
      lines: [
        'Supplier Recovery Claim Package (DRAFT)',
        `Supplier: ${SUPPLIER}`,
        `Agreement: ${CONTRACT_ID}`,
        `Covered part: ${OEM_PART} / ${SUPPLIER_PART}`,
        '',
        'Issue summary:',
        '  Elevated R500 no-power repairs attributed to supplier PSU-750 lots per the',
        '  approved population-level engineering report. 24 claims have complete',
        '  traceability, engineering causation, contract coverage, and verified cost.',
        '',
        `Proposed amount: $${SUPPORTED_TOTAL} potential recovery pending human validation.`,
        `Supported claims: ${SUPPORTED_CLAIMS} x min($${VERIFIED_PART_COST}, $${PER_UNIT_CAP} cap) = $${SUPPORTED_TOTAL}.`,
        '',
        'Agreement basis:',
        `  24-month warranty, verified replacement-part cost, $${PER_UNIT_CAP} per-unit cap,`,
        '  labor and shipping excluded, 90-day filing window.',
        '',
        'Excluded populations:',
        '  15 missing supplier-lot traceability, 6 engineering review, 3 non-supplier cause.',
        '',
        '24-claim schedule:',
        ...schedule,
        '',
        'This is an unsubmitted draft for internal human review. It does not',
        'constitute a submitted claim and no supplier has been contacted.',
        '',
        'SYNTHETIC DEMONSTRATION DOCUMENT — fictional.',
      ],
    },
  ]);
}

async function uploadDraft(folderId, pdf) {
  // Idempotent: new version if the draft already exists.
  const items = await boxApi(`/folders/${folderId}/items?limit=1000&fields=id,name,type`);
  const existing = (items.entries || []).find((e) => e.type === 'file' && e.name === DRAFT_NAME);
  const boundary = '----claimiqdraft' + Date.now();
  const pre =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="attributes"\r\n\r\n` +
    `${JSON.stringify({ name: DRAFT_NAME, parent: { id: folderId } })}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${DRAFT_NAME}"\r\n` +
    `Content-Type: application/pdf\r\n\r\n`;
  const post = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(pre, 'utf8'), pdf, Buffer.from(post, 'utf8')]);
  const url = existing
    ? `https://upload.box.com/api/2.0/files/${existing.id}/content`
    : 'https://upload.box.com/api/2.0/files/content';
  const res = await boxApi(url, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  return res.entries[0];
}

async function applyDraftMetadata(fileId) {
  const meta = {
    documentType: 'DraftRecoveryClaim',
    investigationId: INVESTIGATION_ID,
    signalId: 'SIG-2026-009',
    contractId: CONTRACT_ID,
    supplierPartNumber: SUPPLIER_PART,
    oemPartNumber: OEM_PART,
    reviewStatus: 'Candidate',
    confidentiality: 'Confidential',
  };
  try {
    await boxApi(`/files/${fileId}/metadata/${SCOPE}/${TEMPLATE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
  } catch (e) {
    if (e.status !== 409) throw e;
  }
}

export async function generateAndWriteDraft() {
  const folderId = await findOutputFolder();
  const pdf = buildDraftPdf();
  const file = await uploadDraft(folderId, pdf);
  await applyDraftMetadata(file.id);
  return { fileId: file.id, fileName: DRAFT_NAME, folderId, versionId: file.file_version?.id ?? null };
}

// Allow running standalone: node --env-file=.env server/box-draft.mjs
if (process.argv[1] && process.argv[1].endsWith('box-draft.mjs')) {
  generateAndWriteDraft()
    .then((r) => console.log('draft written:', JSON.stringify(r)))
    .catch((e) => {
      console.error('draft failed:', e.message);
      process.exit(1);
    });
}
void readFileSync;
void join;
void __dirname;
