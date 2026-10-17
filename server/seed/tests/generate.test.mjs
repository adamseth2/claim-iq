import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { buildPdf } from '../pdf.mjs';

const script = fileURLToPath(new URL('../generate.mjs', import.meta.url));
const temp = mkdtempSync(join(tmpdir(), 'claimiq-seed-test-'));
after(() => {
  assert.ok(resolve(temp).startsWith(resolve(join(tmpdir(), 'claimiq-seed-test-'))));
  rmSync(temp, { recursive: true, force: true });
});
function run(args) {
  return spawnSync(process.execPath, [script, ...args], { cwd: temp, encoding: 'utf8' });
}

test('native seed command is independent of cwd and produces a complete hashed inventory', () => {
  const out = join(temp, 'native');
  const result = run(['--output', out]);
  assert.equal(result.status, 0, result.stderr);
  const manifest = JSON.parse(readFileSync(join(out, 'manifest.json'), 'utf8'));
  assert.equal(manifest.synthetic, true);
  assert.equal(manifest.financialActionAuthorized, false);
  assert.equal(manifest.supportedClaims, 24);
  assert.equal(manifest.potentialRecovery, 14880);
  assert.equal(manifest.documents.length, 6);
  assert.equal(manifest.documents.filter((doc) => doc.name.endsWith('.pdf')).length, 5);
  for (const doc of manifest.documents) {
    const content = readFileSync(join(out, doc.name));
    assert.equal(content.length, doc.bytes);
    assert.equal(createHash('sha256').update(content).digest('hex'), doc.sha256);
  }
  const rerun = run(['--output', out]);
  assert.equal(rerun.status, 0, rerun.stderr);
  assert.equal(readFileSync(join(out, 'manifest.json'), 'utf8'), JSON.stringify(manifest, null, 2) + '\n');
});

test('unsupported renderer fails before creating an output folder', () => {
  const out = join(temp, 'invalid');
  assert.notEqual(run(['--output', out, '--renderer', 'unsupported']).status, 0);
  assert.equal(existsSync(out), false);
});

test('missing ReportLab interpreter fails without silent fallback or output writes', () => {
  const out = join(temp, 'missing-python');
  const result = run(['--output', out, '--renderer', 'reportlab', '--python', join(temp, 'no-python')]);
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /ReportLab is unavailable/);
  assert.equal(existsSync(out), false);
});

test('native PDF writer retains a full schedule and the final review disclaimer', () => {
  const pdf = buildPdf([{ title: 'Synthetic long schedule', lines: [
    ...Array.from({ length: 150 }, (_, i) => `Claim line ${i}`),
    'FINAL DISCLAIMER - HUMAN REVIEW REQUIRED',
  ] }]).toString('utf8');
  assert.match(pdf, /Claim line 149/);
  assert.match(pdf, /FINAL DISCLAIMER - HUMAN REVIEW REQUIRED/);
  assert.match(pdf, /\/Count 4/);
  assert.equal((pdf.match(/SYNTHETIC DEMONSTRATION DOCUMENT - FICTIONAL - Page/g) || []).length, 4);
});
