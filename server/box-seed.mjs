// Box seeding (PRD section 20 steps 2-3).
// Creates the folder tree, the 14-field ClaimIQ metadata template, uploads the
// six seed documents, applies metadata to each, verifies the three required
// metadata queries, and records file IDs + versions to server/box-assets.json.
//
// Prereqs: seed docs generated (npm run seed:docs) and an authenticated Box
// session (complete OAuth login, tokens present). Run: npm run box:seed
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { boxApi, loadTokens } from './box-client.mjs';
import {
  SIGNAL_ID,
  CONTRACT_ID,
  SUPPLIER_ID,
  SUPPLIER,
  OEM_PART,
  SUPPLIER_PART,
  PRODUCT_MODEL,
  REP_CLAIM,
} from './seed/facts.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, 'seed', 'out');
const ASSETS = join(__dirname, 'box-assets.json');
const SCOPE = 'enterprise';
const TEMPLATE_KEY = 'claimiqRecovery';

const TEMPLATE_FIELDS = [
  { type: 'string', key: 'documentType', displayName: 'Document Type' },
  { type: 'string', key: 'signalId', displayName: 'Signal ID' },
  { type: 'string', key: 'investigationId', displayName: 'Investigation ID' },
  { type: 'string', key: 'claimId', displayName: 'Claim ID' },
  { type: 'string', key: 'supplierId', displayName: 'Supplier ID' },
  { type: 'string', key: 'contractId', displayName: 'Contract ID' },
  { type: 'string', key: 'productModel', displayName: 'Product Model' },
  { type: 'string', key: 'oemPartNumber', displayName: 'OEM Part Number' },
  { type: 'string', key: 'supplierPartNumber', displayName: 'Supplier Part Number' },
  { type: 'string', key: 'componentSerialNumber', displayName: 'Component Serial Number' },
  { type: 'string', key: 'lotNumber', displayName: 'Lot Number' },
  { type: 'date', key: 'documentDate', displayName: 'Document Date' },
  { type: 'string', key: 'reviewStatus', displayName: 'Review Status' },
  { type: 'string', key: 'confidentiality', displayName: 'Confidentiality' },
];

// Document -> metadata mapping (fictional/synthetic values).
const DOC_META = {
  [`Atlas_PSU_Supply_Agreement_${CONTRACT_ID}.pdf`]: {
    documentType: 'SupplyAgreement',
    contractId: CONTRACT_ID,
    supplierId: SUPPLIER_ID,
    oemPartNumber: OEM_PART,
    supplierPartNumber: SUPPLIER_PART,
    productModel: PRODUCT_MODEL,
    reviewStatus: 'ReviewerConfirmed',
    confidentiality: 'Confidential',
  },
  [`Atlas_PSU_Amendment_01_${CONTRACT_ID}.pdf`]: {
    documentType: 'ContractAmendment',
    contractId: CONTRACT_ID,
    supplierId: SUPPLIER_ID,
    oemPartNumber: OEM_PART,
    supplierPartNumber: SUPPLIER_PART,
    reviewStatus: 'ReviewerConfirmed',
    confidentiality: 'Confidential',
  },
  [`${SIGNAL_ID}_Warranty_Trend_Report.pdf`]: {
    documentType: 'WarrantyTrendReport',
    signalId: SIGNAL_ID,
    productModel: PRODUCT_MODEL,
    oemPartNumber: OEM_PART,
    reviewStatus: 'Candidate',
    confidentiality: 'Internal',
  },
  [`${SIGNAL_ID}_R500_PSU_Engineering_Report.pdf`]: {
    documentType: 'EngineeringReport',
    signalId: SIGNAL_ID,
    productModel: PRODUCT_MODEL,
    oemPartNumber: OEM_PART,
    supplierPartNumber: SUPPLIER_PART,
    reviewStatus: 'ReviewerConfirmed',
    confidentiality: 'Internal',
  },
  [`${SIGNAL_ID}_Traceability_Matrix.xlsx`]: {
    documentType: 'TraceabilityMatrix',
    signalId: SIGNAL_ID,
    productModel: PRODUCT_MODEL,
    oemPartNumber: OEM_PART,
    supplierPartNumber: SUPPLIER_PART,
    reviewStatus: 'Candidate',
    confidentiality: 'Internal',
  },
  [`${REP_CLAIM.claimId}_Evidence_Packet.pdf`]: {
    documentType: 'ClaimEvidencePacket',
    signalId: SIGNAL_ID,
    claimId: REP_CLAIM.claimId,
    productModel: PRODUCT_MODEL,
    oemPartNumber: OEM_PART,
    supplierPartNumber: SUPPLIER_PART,
    componentSerialNumber: REP_CLAIM.componentSerial,
    lotNumber: REP_CLAIM.supplierLot,
    reviewStatus: 'ReviewerConfirmed',
    confidentiality: 'Internal',
  },
};

// Folder placement per document.
const FOLDER_PLACEMENT = {
  SupplyAgreement: ['01 Supplier Agreements', 'Atlas Power Components'],
  ContractAmendment: ['01 Supplier Agreements', 'Atlas Power Components'],
  WarrantyTrendReport: ['02 Recovery Signals', SIGNAL_ID],
  EngineeringReport: ['02 Recovery Signals', SIGNAL_ID],
  TraceabilityMatrix: ['02 Recovery Signals', SIGNAL_ID],
  ClaimEvidencePacket: ['02 Recovery Signals', SIGNAL_ID],
};

async function ensureFolder(name, parentId) {
  // Try to find existing child folder by name.
  const items = await boxApi(`/folders/${parentId}/items?limit=1000&fields=id,name,type`);
  const found = (items.entries || []).find((e) => e.type === 'folder' && e.name === name);
  if (found) return found.id;
  const created = await boxApi('/folders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, parent: { id: parentId } }),
  });
  return created.id;
}

async function ensurePath(segments) {
  let parent = '0';
  for (const seg of segments) {
    parent = await ensureFolder(seg, parent);
  }
  return parent;
}

async function ensureTemplate() {
  try {
    const t = await boxApi(`/metadata_templates/${SCOPE}/${TEMPLATE_KEY}/schema`);
    console.log('metadata template exists:', t.templateKey);
    return t;
  } catch (e) {
    if (e.status !== 404) throw e;
    const created = await boxApi('/metadata_templates/schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        scope: SCOPE,
        templateKey: TEMPLATE_KEY,
        displayName: 'ClaimIQ Recovery',
        fields: TEMPLATE_FIELDS,
      }),
    });
    console.log('metadata template created:', created.templateKey);
    return created;
  }
}

async function uploadFile(fileName, folderId) {
  const filePath = join(OUT, fileName);
  const data = readFileSync(filePath);
  const boundary = '----claimiqseed' + Date.now();
  const pre =
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="attributes"\r\n\r\n` +
    `${JSON.stringify({ name: fileName, parent: { id: folderId } })}\r\n` +
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="${fileName}"\r\n` +
    `Content-Type: application/octet-stream\r\n\r\n`;
  const post = `\r\n--${boundary}--\r\n`;
  const body = Buffer.concat([Buffer.from(pre, 'utf8'), data, Buffer.from(post, 'utf8')]);

  const res = await boxApi('https://upload.box.com/api/2.0/files/content', {
    method: 'POST',
    headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
    body,
  });
  return res.entries[0];
}

async function applyMetadata(fileId, meta) {
  try {
    await boxApi(`/files/${fileId}/metadata/${SCOPE}/${TEMPLATE_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meta),
    });
  } catch (e) {
    if (e.status === 409) {
      // already present; skip
      return;
    }
    throw e;
  }
}

async function verifyQueries(rootId) {
  const out = {};
  // Q1: all docs for SIG-2026-009
  out.q1_signalDocs = await boxApi('/metadata_queries/execute_read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${SCOPE}.${TEMPLATE_KEY}`,
      ancestor_folder_id: rootId,
      query: 'signalId = :sig',
      query_params: { sig: SIGNAL_ID },
      limit: 50,
    }),
  }).then((r) => (r.entries || []).length);

  // Q2: applicable agreement for Atlas + PSU-750
  out.q2_agreement = await boxApi('/metadata_queries/execute_read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${SCOPE}.${TEMPLATE_KEY}`,
      ancestor_folder_id: rootId,
      query: 'documentType = :dt AND oemPartNumber = :part',
      query_params: { dt: 'SupplyAgreement', part: OEM_PART },
      limit: 50,
    }),
  }).then((r) => (r.entries || []).length);

  // Q3: draft for SI-2026-014 (expected 0 before demo action)
  out.q3_draft = await boxApi('/metadata_queries/execute_read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${SCOPE}.${TEMPLATE_KEY}`,
      ancestor_folder_id: rootId,
      query: 'documentType = :dt',
      query_params: { dt: 'DraftRecoveryClaim' },
      limit: 50,
    }),
  }).then((r) => (r.entries || []).length);

  return out;
}

async function main() {
  if (!loadTokens()?.access_token) {
    console.error('No Box tokens. Complete OAuth login first, then run npm run box:seed.');
    process.exit(2);
  }
  if (!existsSync(OUT)) {
    console.error('Seed docs missing. Run: npm run seed:docs');
    process.exit(2);
  }

  const rootId = await ensureFolder('Northstar ClaimIQ', '0');
  console.log('root folder:', rootId);

  // Create the full tree.
  await ensurePath(['Northstar ClaimIQ', '01 Supplier Agreements', 'Atlas Power Components']);
  await ensurePath(['Northstar ClaimIQ', '02 Recovery Signals', SIGNAL_ID]);
  await ensurePath(['Northstar ClaimIQ', '03 Supplier Investigations']);
  await ensurePath(['Northstar ClaimIQ', '04 Draft Supplier Recovery Claims']);

  await ensureTemplate();

  const assets = { rootFolderId: rootId, supplier: SUPPLIER, files: {} };

  for (const [fileName, meta] of Object.entries(DOC_META)) {
    const placement = FOLDER_PLACEMENT[meta.documentType];
    const folderId = await ensurePath(['Northstar ClaimIQ', ...placement]);
    const uploaded = await uploadFile(fileName, folderId);
    await applyMetadata(uploaded.id, meta);
    assets.files[fileName] = {
      fileId: uploaded.id,
      versionId: uploaded.file_version?.id ?? null,
      folderId,
      metadata: meta,
    };
    console.log(`uploaded ${fileName} -> file ${uploaded.id} v${uploaded.file_version?.id}`);
  }

  const queryCounts = await verifyQueries(rootId);
  assets.queryVerification = queryCounts;
  console.log('query verification:', queryCounts);

  writeFileSync(ASSETS, JSON.stringify(assets, null, 2));
  console.log('wrote', ASSETS);
}

main().catch((e) => {
  console.error('seed failed:', e);
  process.exit(1);
});
