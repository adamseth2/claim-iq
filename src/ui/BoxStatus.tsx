import { useEffect, useState } from 'react';

type BoxStatus = 'checking' | 'connected' | 'unauthenticated' | 'unavailable';

// Polls the local proxy for Box auth/connectivity so the UI can surface a
// Box-unavailable state instead of silently failing.
export function useBoxStatus(): BoxStatus {
  const [status, setStatus] = useState<BoxStatus>('checking');
  useEffect(() => {
    let cancelled = false;
    fetch('/box-proxy/status')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error('bad status'))))
      .then((d) => {
        if (cancelled) return;
        setStatus(d.authenticated ? 'connected' : 'unauthenticated');
      })
      .catch(() => {
        if (!cancelled) setStatus('unavailable');
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return status;
}

export function BoxStatusBanner({ status }: { status: BoxStatus }) {
  if (status === 'connected' || status === 'checking') return null;
  const msg =
    status === 'unavailable'
      ? 'Box service unavailable — document previews and output writes are offline. Evidence metadata is shown from the last sync.'
      : 'Not authenticated with Box — open original links and draft writes require sign-in.';
  return (
    <div
      role="alert"
      style={{
        background: '#5a1f1a',
        color: '#ffe3df',
        fontSize: 12,
        padding: '6px 16px',
        textAlign: 'center',
      }}
    >
      <span aria-hidden="true">✕ </span>
      {msg}
    </div>
  );
}
