import { Outlet, NavLink } from 'react-router-dom';

export function AppLayout() {
  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="synthetic-banner" role="note">
        Synthetic demonstration data — not a submitted claim
      </div>
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
        <nav style={{ display: 'flex', gap: 16 }}>
          <NavLink to="/audit" style={navStyle}>
            Warranty Recovery Audit
          </NavLink>
          <NavLink to="/audit/SIG-2026-009" style={navStyle}>
            Signal Investigation
          </NavLink>
        </nav>
      </header>
      <main style={{ flex: 1, padding: '20px', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
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
