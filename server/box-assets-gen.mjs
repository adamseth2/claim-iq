// Generates src/data/boxAssets.ts from server/box-assets.json.
// Box object IDs are not secrets; this file is safe to commit.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = join(__dirname, 'box-assets.json');
const outDir = join(__dirname, '..', 'src', 'data');
const out = join(outDir, 'boxAssets.ts');

const a = JSON.parse(readFileSync(src, 'utf8'));
const ts =
  `// AUTO-GENERATED from server/box-assets.json by npm run box:assets.\n` +
  `// Box object IDs are not secrets. Do not edit by hand.\n` +
  `export interface BoxFileAsset { fileId: string; versionId: string | null; folderId: string; metadata: Record<string,string>; }\n` +
  `export const BOX_ROOT_FOLDER_ID = ${JSON.stringify(a.rootFolderId)};\n` +
  `export const BOX_ENTERPRISE_SCOPE = ${JSON.stringify(a.enterpriseScope || 'enterprise')};\n` +
  `export const BOX_FILES: Record<string, BoxFileAsset> = ${JSON.stringify(a.files, null, 2)};\n` +
  `export function openInBoxUrl(fileId: string): string { return \`https://app.box.com/file/\${fileId}\`; }\n`;

mkdirSync(outDir, { recursive: true });
writeFileSync(out, ts);
console.log('wrote', out, 'with', Object.keys(a.files).length, 'files');
