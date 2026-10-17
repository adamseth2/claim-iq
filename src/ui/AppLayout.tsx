import { Outlet, NavLink } from 'react-router-dom';
import { useBoxStatus, BoxStatusBanner } from './BoxStatus';

export function AppLayout() {
  const boxStatus = useBoxStatus();
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <div className="synthetic-banner" role="note">
        Synthetic demonstration data — not a submitted claim
      </div>
      <BoxStatusBanner status={boxStatus} />
      <header
        style={{
          background: 'var(--navy)',
          color: '#eaf0f6',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 24,
        }}
      >
        <strong style={{ letterSpacing: '0.02em' }}>ClaimIQ Recovery</strong>
        <nav aria-label="Primary" style={{ display: 'flex', gap: 16 }}>
          <NavLink to="/audit" style={navStyle}>
            Warranty Recovery Audit
          </NavLink>
          <NavLink to="/audit/SIG-2026-009" style={navStyle}>
            Signal Investigation
          </NavLink>
        </nav>
        <span
          className="mono"
          style={{ marginLeft: 'auto', fontSize: 12, color: boxStatus === 'connected' ? '#7fd1c4' : '#9fb3c8' }}
        >
          <span aria-hidden="true">{boxStatus === 'connected' ? '✓ ' : '• '}</span>
          Box: {boxStatus}
        </span>
      </header>
      <main
        id="main"
        style={{ flex: 1, padding: '20px', maxWidth: 1440, width: '100%', margin: '0 auto' }}
      >
        <Outlet />
      </main>
    </div>
  );
}

function navStyle({ isActive }: { isActive: boolean }) {
  return {
    color: isActive ? '#ffffff' : '#9fb3c8',
    textDecoration: 'none',
    fontWeight: isActive ? 600 : 400,
  };
}
