// Shared Box OAuth 2.0 + API client used by the proxy, verify, and seed scripts.
// The client secret is read from the environment (.env via --env-file) and is
// never sent to the browser. Tokens are persisted to a git-ignored file so the
// CLI tools (verify/seed) and the proxy can share an authenticated session.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TOKEN_FILE = join(__dirname, '.box-tokens.json');

const AUTH_BASE = 'https://account.box.com/api/oauth2/authorize';
const TOKEN_URL = 'https://api.box.com/oauth2/token';
const API = 'https://api.box.com/2.0';

export function config() {
  const clientId = process.env.BOX_CLIENT_ID;
  const clientSecret = process.env.BOX_CLIENT_SECRET;
  const redirectUri = process.env.BOX_REDIRECT_URI || 'http://localhost:3000/callback';
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing BOX_CLIENT_ID / BOX_CLIENT_SECRET. Copy .env.example to .env and fill them in.',
    );
  }
  return { clientId, clientSecret, redirectUri };
}

export function authorizeUrl(state = 'claimiq') {
  const { clientId, redirectUri } = config();
  const p = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });
  return `${AUTH_BASE}?${p.toString()}`;
}

export function loadTokens() {
  if (!existsSync(TOKEN_FILE)) return null;
  try {
    return JSON.parse(readFileSync(TOKEN_FILE, 'utf8'));
  } catch {
    return null;
  }
}

function saveTokens(tok) {
  const withExpiry = {
    ...tok,
    obtained_at: Date.now(),
    expires_at: Date.now() + (tok.expires_in ?? 3600) * 1000,
  };
  writeFileSync(TOKEN_FILE, JSON.stringify(withExpiry, null, 2));
  return withExpiry;
}

export async function exchangeCode(code) {
  const { clientId, clientSecret, redirectUri } = config();
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token exchange failed (${res.status}): ${await res.text()}`);
  }
  return saveTokens(await res.json());
}

export async function refresh() {
  const tok = loadTokens();
  if (!tok?.refresh_token) throw new Error('No refresh token available. Authenticate first.');
  const { clientId, clientSecret } = config();
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: tok.refresh_token,
    client_id: clientId,
    client_secret: clientSecret,
  });
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) {
    throw new Error(`Token refresh failed (${res.status}): ${await res.text()}`);
  }
  return saveTokens(await res.json());
}

async function accessToken() {
  // A short-lived Developer Token (from the Box console) bypasses the OAuth
  // flow entirely. Useful for a single demo/seed session (~60 min lifetime).
  if (process.env.BOX_DEV_TOKEN) {
    return process.env.BOX_DEV_TOKEN;
  }
  let tok = loadTokens();
  if (!tok) throw new Error('Not authenticated. Run the OAuth flow first, or set BOX_DEV_TOKEN.');
  // refresh if within 60s of expiry
  if (!tok.expires_at || Date.now() > tok.expires_at - 60000) {
    tok = await refresh();
  }
  return tok.access_token;
}

// Generic authenticated Box API request returning parsed JSON.
export async function boxApi(path, { method = 'GET', body, headers = {}, raw = false } = {}) {
  const token = await accessToken();
  const res = await fetch(path.startsWith('http') ? path : `${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...headers,
    },
    body,
  });
  if (raw) return res;
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) {
    const err = new Error(`Box API ${method} ${path} failed (${res.status}): ${text}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

export { API, TOKEN_FILE };

// Resolve the enterprise-scoped metadata identifier (enterprise_<id>) used by
// metadata_queries execute_read `from` fields and metadata.<scope>.<key> refs.
let _enterpriseScope = null;
export async function enterpriseScope() {
  if (_enterpriseScope) return _enterpriseScope;
  const me = await boxApi('/users/me?fields=id,enterprise');
  const entId = me.enterprise?.id;
  _enterpriseScope = entId ? `enterprise_${entId}` : 'enterprise';
  return _enterpriseScope;
}
