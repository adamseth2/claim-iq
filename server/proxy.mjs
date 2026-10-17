// Local token-exchange proxy. The browser never sees the client secret.
// Vite forwards /box-proxy/* here (see vite.config.ts).
//
// Run standalone with secrets loaded from .env:
//   node --env-file=.env server/proxy.mjs
// (the `dev:proxy` npm script does not auto-load .env; use `box` scripts or
//  run with --env-file yourself. The dev script runs both app + proxy.)
import express from 'express';
import { authorizeUrl, exchangeCode, loadTokens, boxApi } from './box-client.mjs';
import { generateAndWriteDraft, buildDraftPdf } from './box-draft.mjs';

const app = express();
app.use(express.json());

const PORT = process.env.PROXY_PORT || 4000;

// Health / auth status. Reports real connectivity: a dev token or a stored
// OAuth session both count. Does a lightweight whoami to confirm reachability.
app.get('/box-proxy/status', async (_req, res) => {
  const hasDevToken = Boolean(process.env.BOX_DEV_TOKEN);
  const tok = loadTokens();
  const hasOAuth = Boolean(tok?.access_token);
  if (!hasDevToken && !hasOAuth) {
    return res.json({ authenticated: false, via: null, expiresAt: null });
  }
  try {
    const me = await boxApi('/users/me?fields=login');
    res.json({
      authenticated: true,
      via: hasDevToken ? 'devToken' : 'oauth',
      login: me.login,
      expiresAt: tok?.expires_at ?? null,
    });
  } catch (e) {
    res.json({ authenticated: false, via: null, error: String(e.message ?? e) });
  }
});

// Returns the Box authorize URL for the browser to redirect to.
app.get('/box-proxy/oauth/authorize-url', (_req, res) => {
  try {
    res.json({ url: authorizeUrl() });
  } catch (e) {
    res.status(500).json({ error: String(e.message ?? e) });
  }
});

// Exchanges the authorization code for tokens (holds the client secret).
app.post('/box-proxy/oauth/token', async (req, res) => {
  const { code } = req.body ?? {};
  if (!code) return res.status(400).json({ ok: false, error: 'missing code' });
  try {
    const tok = await exchangeCode(code);
    res.json({ ok: true, expiresAt: tok.expires_at });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message ?? e) });
  }
});

// Returns the draft PDF for in-browser preview. Does NOT write to Box.
app.get('/box-proxy/draft/preview', (_req, res) => {
  try {
    const pdf = buildDraftPdf();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="SI-2026-014_Supplier_Recovery_Claim_DRAFT.pdf"');
    res.send(pdf);
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message ?? e) });
  }
});

// Generates the draft supplier recovery claim and writes it to Box.
app.post('/box-proxy/draft', async (_req, res) => {
  try {
    const result = await generateAndWriteDraft();
    res.json({ ok: true, ...result });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e.message ?? e) });
  }
});

app.listen(PORT, () => {
  console.log(`[box-proxy] listening on http://localhost:${PORT}`);
  if (!process.env.BOX_CLIENT_ID) {
    console.warn('[box-proxy] WARNING: BOX_CLIENT_ID not set. Start with --env-file=.env');
  }
});
