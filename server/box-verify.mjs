// Box capability verification (PRD section 20, step 1).
// Confirms the authenticated identity can: authenticate, create/read folders,
// create a metadata template, run a metadata query, preview a file, write to an
// output folder, and whether Box AI Structured Extract is entitled.
//
// Run: npm run box:verify   (requires a completed OAuth login so tokens exist)
import { boxApi, loadTokens, enterpriseScope } from './box-client.mjs';

const TEMPLATE_KEY = 'claimiqRecovery';
const SCOPE = 'enterprise';

const results = [];
function record(name, ok, detail) {
  results.push({ name, ok, detail });
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`[${mark}] ${name}${detail ? ' — ' + detail : ''}`);
}

async function main() {
  if (!process.env.BOX_DEV_TOKEN && !loadTokens()?.access_token) {
    console.error(
      'No Box tokens found. Start the app (npm run dev), complete the Box OAuth login at ' +
        'http://localhost:3000, then re-run npm run box:verify.',
    );
    process.exit(2);
  }

  // 1. Authenticate (whoami)
  let me;
  try {
    me = await boxApi('/users/me');
    record('authenticate', true, `as ${me.login} (${me.id})`);
  } catch (e) {
    record('authenticate', false, String(e.message ?? e));
    return finish();
  }

  // 2. Create/read a folder
  let folderId;
  try {
    const name = `claimiq-verify-${Date.now()}`;
    const folder = await boxApi('/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parent: { id: '0' } }),
    });
    folderId = folder.id;
    const read = await boxApi(`/folders/${folderId}`);
    record('folder create/read', read.id === folderId, `folder ${folderId}`);
  } catch (e) {
    record('folder create/read', false, String(e.message ?? e));
  }

  // 3. Create a metadata template
  let templateCreated = false;
  try {
    try {
      await boxApi(`/metadata_templates/${SCOPE}/${TEMPLATE_KEY}/schema`);
      templateCreated = true;
      record('metadata template', true, 'already exists');
    } catch (e) {
      if (e.status === 404) {
        await boxApi('/metadata_templates/schema', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scope: SCOPE,
            templateKey: TEMPLATE_KEY,
            displayName: 'ClaimIQ Recovery',
            fields: [
              { type: 'string', key: 'documentType', displayName: 'Document Type' },
              { type: 'string', key: 'signalId', displayName: 'Signal ID' },
            ],
          }),
        });
        templateCreated = true;
        record('metadata template', true, 'created');
      } else {
        throw e;
      }
    }
  } catch (e) {
    record('metadata template', false, String(e.message ?? e));
  }

  // 4. Metadata query (requires at least the template to exist)
  try {
    const scope = await enterpriseScope();
    await boxApi('/metadata_queries/execute_read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: `${scope}.${TEMPLATE_KEY}`,
        ancestor_folder_id: '0',
        query: 'signalId = :sig',
        query_params: { sig: 'SIG-2026-009' },
        limit: 1,
      }),
    });
    record('metadata query', true, 'execute_read succeeded');
  } catch (e) {
    // A template-exists-but-no-entries case still returns 200; failures are permission/entitlement.
    record('metadata query', false, String(e.message ?? e));
  }

  // 5. Preview + 6. Output write: upload a tiny file, request preview, confirm write.
  let fileId;
  if (folderId) {
    try {
      const boundary = '----claimiqverify';
      const content = 'ClaimIQ verify output write.';
      const parts =
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="attributes"\r\n\r\n` +
        `${JSON.stringify({ name: 'verify-write.txt', parent: { id: folderId } })}\r\n` +
        `--${boundary}\r\n` +
        `Content-Disposition: form-data; name="file"; filename="verify-write.txt"\r\n` +
        `Content-Type: text/plain\r\n\r\n` +
        `${content}\r\n` +
        `--${boundary}--\r\n`;
      const up = await boxApi('https://upload.box.com/api/2.0/files/content', {
        method: 'POST',
        headers: { 'Content-Type': `multipart/form-data; boundary=${boundary}` },
        body: parts,
      });
      fileId = up.entries?.[0]?.id;
      record('output write', Boolean(fileId), fileId ? `file ${fileId}` : 'no file id');
    } catch (e) {
      record('output write', false, String(e.message ?? e));
    }

    if (fileId) {
      try {
        // Preview availability via representations hint
        const info = await boxApi(
          `/files/${fileId}?fields=id,name,file_version,permissions,representations`,
        );
        record('preview/file-version', Boolean(info.file_version), `version ${info.file_version?.id}`);
      } catch (e) {
        record('preview/file-version', false, String(e.message ?? e));
      }
    }
  }

  // 7. Structured Extract entitlement (Box AI)
  if (fileId) {
    const extract = () =>
      boxApi('/ai/extract_structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{ id: fileId, type: 'file' }],
          fields: [{ key: 'documentType', type: 'string', displayName: 'Document Type' }],
        }),
      });
    try {
      await extract();
      record('structured extract', true, 'entitled');
    } catch (e) {
      if (e.status === 412) {
        // File not yet processed by Box AI; wait and retry once.
        await new Promise((r) => setTimeout(r, 4000));
        try {
          await extract();
          record('structured extract', true, 'entitled (after retry)');
        } catch (e2) {
          const entitled2 = !(e2.status === 403 || e2.status === 401);
          record(
            'structured extract',
            entitled2 && e2.status === 412,
            e2.status === 412
              ? 'entitled; file still processing (transient) — ok'
              : entitled2
                ? String(e2.message ?? e2)
                : 'NOT ENTITLED — fixture fallback will be used (PRD 10)',
          );
        }
      } else {
        const entitled = !(e.status === 403 || e.status === 401);
        record(
          'structured extract',
          false,
          entitled ? String(e.message ?? e) : 'NOT ENTITLED — fixture fallback will be used (PRD 10)',
        );
      }
    }
  }

  // cleanup
  if (fileId) {
    try {
      await boxApi(`/files/${fileId}`, { method: 'DELETE', raw: true });
    } catch { /* ignore */ }
  }
  if (folderId) {
    try {
      await boxApi(`/folders/${folderId}?recursive=true`, { method: 'DELETE', raw: true });
    } catch { /* ignore */ }
  }

  finish();
}

function finish() {
  const failed = results.filter((r) => !r.ok);
  console.log('\nVerification summary:');
  console.log(`  ${results.filter((r) => r.ok).length}/${results.length} checks passed.`);
  if (failed.length) {
    console.log('  Failed:', failed.map((f) => f.name).join(', '));
  }
  // Structured-extract failure alone is acceptable (fixture fallback exists).
  const blocking = failed.filter((f) => f.name !== 'structured extract');
  process.exit(blocking.length ? 1 : 0);
}

main().catch((e) => {
  console.error('verify crashed:', e);
  process.exit(1);
});
