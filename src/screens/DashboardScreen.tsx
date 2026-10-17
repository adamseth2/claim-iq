import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  computeSignal,
  computeFunnel,
  classifyPopulation,
  computeRecoveryTotal,
  computeTrend,
} from '../domain/rules';
import {
  COMPANY,
  SIGNAL,
  OEM_PART,
  SUPPLIER,
  AS_OF,
  TOTAL_CLAIMS,
} from '../domain/facts';
import { Panel, StatusBadge, usd } from '../ui/primitives';
import { TrendChart } from '../ui/TrendChart';

export function DashboardScreen() {
  const navigate = useNavigate();
  const signal = useMemo(() => computeSignal(), []);
  const funnel = useMemo(() => computeFunnel(), []);
  const cls = useMemo(() => classifyPopulation(), []);
  const recovery = useMemo(() => computeRecoveryTotal(), []);
  const trend = useMemo(() => computeTrend(), []);

  // PRD 14.2: "claims requiring evidence or engineering review" = missing + engineering (21).
  // Excluded (3) is reported separately in the Human attention panel.
  const attention = cls.counts.missing + cls.counts.engineering;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header>
        <h1 style={{ margin: 0 }}>Warranty recovery audit</h1>
        <p style={{ color: 'var(--ink-soft)', margin: '4px 0' }}>
          {COMPANY} | Technical Specialist
        </p>
        <p className="mono" style={{ color: 'var(--ink-soft)', fontSize: 12, margin: 0 }}>
          As of {AS_OF}
        </p>
      </header>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <SummaryStat value={TOTAL_CLAIMS.toLocaleString('en-US')} label="Completed claims audited" />
        <SummaryStat value="1" label="Active recovery signal" tone="cobalt" />
        <SummaryStat
          value={usd(recovery.total)}
          label="Potential recovery pending human validation"
          tone="teal"
        />
        <SummaryStat value={String(attention)} label="Claims requiring evidence or engineering review" tone="amber" />
      </div>

      {/* Primary signal panel */}
      <Panel
        title="Elevated R500 no-power repairs"
        aside={<StatusBadge tone="cobalt">Technical review recommended</StatusBadge>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Metric label="Claims in 30 days" value={`${signal.qualifyingCurrent}`} big />
            <Metric label="Historical average" value={`${signal.baselineAverage}`} />
            <Metric label="Ratio to baseline" value={signal.ratioText} />
            <Metric label="Investigation population" value={`${funnel.atlasMapped} claims`} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Metric label="Candidate component" value={OEM_PART} mono />
            <Metric label="Candidate supplier" value={SUPPLIER} />
            <Metric label="Signal window" value={`${SIGNAL.currentWindow.from} → ${SIGNAL.currentWindow.to}`} mono />
            <p style={{ color: 'var(--red)', fontSize: 13, margin: '4px 0 0', display: 'flex', gap: 6 }}>
              <span aria-hidden="true">▲</span>
              Signal does not establish supplier responsibility.
            </p>
          </div>
        </div>
        <div style={{ marginTop: 16 }}>
          <button
            onClick={() => navigate('/audit/SIG-2026-009')}
            style={primaryButton}
          >
            Investigate signal →
          </button>
        </div>
      </Panel>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Trend */}
        <Panel title="12-month trend">
          <TrendChart data={trend} baseline={signal.baselineAverage} threshold={SIGNAL.minQualifying} />
        </Panel>

        {/* Funnel */}
        <Panel title="Population funnel">
          <FunnelView funnel={funnel} />
        </Panel>
      </div>

      {/* Human attention */}
      <Panel title="Human attention">
        <ul style={{ margin: 0, paddingLeft: 0, listStyle: 'none', display: 'flex', gap: 24 }}>
          <AttentionItem tone="amber" count={cls.counts.missing} label="missing supplier-lot evidence" />
          <AttentionItem tone="amber" count={cls.counts.engineering} label="require engineering review" />
          <AttentionItem tone="red" count={cls.counts.excluded} label="excluded for non-supplier causes" />
        </ul>
      </Panel>

      <p style={{ color: 'var(--ink-soft)', fontSize: 12 }}>
        Synthetic demonstration data. Counts and amounts are computed by deterministic rules
        from a local fixture of {TOTAL_CLAIMS.toLocaleString('en-US')} claims.
      </p>
    </div>
  );
}

function SummaryStat({
  value,
  label,
  tone,
}: {
  value: string;
  label: string;
  tone?: 'cobalt' | 'teal' | 'amber';
}) {
  const color = tone === 'cobalt' ? 'var(--cobalt)' : tone === 'teal' ? 'var(--teal)' : tone === 'amber' ? 'var(--amber)' : 'var(--ink)';
  return (
    <div style={{ background: 'var(--surface-2)', border: '1px solid var(--line)', borderRadius: 4, padding: 14 }}>
      <div className="mono" style={{ fontSize: 26, fontWeight: 700, color }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{label}</div>
    </div>
  );
}

function Metric({ label, value, big, mono }: { label: string; value: string; big?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>{label}</span>
      <span className={mono ? 'mono' : 'mono'} style={{ fontWeight: big ? 700 : 500, fontSize: big ? 20 : 14 }}>
        {value}
      </span>
    </div>
  );
}

function FunnelView({ funnel }: { funnel: ReturnType<typeof computeFunnel> }) {
  const rows = [
    { label: 'Completed warranty claims', value: funnel.completedClaims },
    { label: 'R500 claims', value: funnel.r500Claims },
    { label: 'No-power claims', value: funnel.noPowerClaims },
    { label: 'PSU-750 replacements', value: funnel.psuReplacements },
    { label: 'Atlas-mapped (90-day scope)', value: funnel.atlasMapped },
    { label: 'Evidence-supported', value: funnel.supported },
  ];
  const max = rows[0].value;
  return (
    <ol style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {rows.map((r, i) => (
        <li key={r.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
            <span>{r.label}</span>
            <span className="mono" style={{ fontWeight: 600 }}>{r.value.toLocaleString('en-US')}</span>
          </div>
          <div style={{ height: 8, background: '#eef0f2', borderRadius: 2, overflow: 'hidden' }}>
            <div
              style={{
                width: `${(r.value / max) * 100}%`,
                height: '100%',
                background: i === rows.length - 1 ? 'var(--teal)' : 'var(--cobalt)',
                minWidth: 2,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

function AttentionItem({ tone, count, label }: { tone: 'amber' | 'red'; count: number; label: string }) {
  const color = tone === 'amber' ? 'var(--amber)' : 'var(--red)';
  return (
    <li style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
      <span className="mono" style={{ fontSize: 22, fontWeight: 700, color }}>
        {count}
      </span>
      <span style={{ fontSize: 13 }}>
        <span aria-hidden="true" style={{ color }}>{tone === 'red' ? '✕ ' : '▲ '}</span>
        claims {label}
      </span>
    </li>
  );
}

const primaryButton: React.CSSProperties = {
  background: 'var(--cobalt)',
  color: '#fff',
  border: 'none',
  borderRadius: 4,
  padding: '10px 18px',
  fontSize: 14,
  fontWeight: 600,
  cursor: 'pointer',
};
