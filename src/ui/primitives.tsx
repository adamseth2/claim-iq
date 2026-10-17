import type { ReactNode } from 'react';

export function Panel({
  title,
  children,
  aside,
  style,
}: {
  title?: string;
  children: ReactNode;
  aside?: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <section
      style={{
        background: 'var(--surface-2)',
        border: '1px solid var(--line)',
        borderRadius: 4,
        padding: 16,
        ...style,
      }}
    >
      {(title || aside) && (
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            marginBottom: 12,
          }}
        >
          {title && <h2 style={{ fontSize: 15, margin: 0 }}>{title}</h2>}
          {aside}
        </header>
      )}
      {children}
    </section>
  );
}

type Tone = 'cobalt' | 'teal' | 'amber' | 'red' | 'neutral';

const TONE_COLOR: Record<Tone, string> = {
  cobalt: 'var(--cobalt)',
  teal: 'var(--teal)',
  amber: 'var(--amber)',
  red: 'var(--red)',
  neutral: 'var(--ink-soft)',
};

const TONE_ICON: Record<Tone, string> = {
  cobalt: '◆',
  teal: '✓',
  amber: '▲',
  red: '✕',
  neutral: '•',
};

// Status uses text + icon, never color alone (PRD 14.1 #6 / a11y).
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        color: TONE_COLOR[tone],
        border: `1px solid ${TONE_COLOR[tone]}`,
        borderRadius: 3,
        padding: '2px 8px',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <span aria-hidden="true">{TONE_ICON[tone]}</span>
      {children}
    </span>
  );
}

export function usd(n: number): string {
  return `$${n.toLocaleString('en-US')}`;
}
