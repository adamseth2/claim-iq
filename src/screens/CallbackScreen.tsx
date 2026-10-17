import { useEffect, useState } from 'react';

// Receives the Box OAuth redirect (?code=...&state=...), forwards the
// authorization code to the local proxy which performs the code->token
// exchange using the client secret (never exposed to the browser).
export function CallbackScreen() {
  const [status, setStatus] = useState('Exchanging authorization code...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const error = params.get('error');
    if (error) {
      setStatus(`Box authorization failed: ${error}`);
      return;
    }
    if (!code) {
      setStatus('No authorization code present in callback.');
      return;
    }
    fetch('/box-proxy/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.ok) {
          setStatus('Box authentication complete. You may return to the audit.');
        } else {
          setStatus(`Token exchange failed: ${data.error ?? 'unknown error'}`);
        }
      })
      .catch((e) => setStatus(`Token exchange error: ${String(e)}`));
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>Box authentication</h1>
      <p role="status">{status}</p>
      <p>
        <a href="/audit">Return to Warranty Recovery Audit</a>
      </p>
    </main>
  );
}
