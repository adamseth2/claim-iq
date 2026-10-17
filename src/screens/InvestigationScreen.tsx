import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  computePopulation,
  classifyPopulation,
  computeRecoveryTotal,
  computeSignal,
} from '../domain/rules';
import type { Claim, Classification } from '../domain/facts';
import {
  SIGNAL,
  REP_CLAIM,
  CONTRACT,
  ENGINEERING,
  INVESTIGATION_ID,
  SUPPLIER,
  OEM_PART,
  SUPPLIER_PART,
  COVERED_LOTS,
  SUPPORTED_CLAIMS,
  SUPPORTED_TOTAL,
  PER_UNIT_CAP,
} from '../domain/facts';
import { Panel, StatusBadge, usd } from '../ui/primitives';
import { SourceInspector, type EvidenceRef } from '../ui/BoxEvidence';
import { useInvestigation } from '../state/useInvestigation';

const LANES: { key: Classification; label: string; tone: 'teal' | 'amber' | 'red' }[] = [
  { key: 'supported', label: 'Evidence-supported', tone: 'teal' },
  { key: 'missing', label: 'Missing traceability', tone: 'amber' },
  { key: 'engineering', label: 'Engineering review', tone: 'amber' },
  { key: 'excluded', label: 'Excluded', tone: 'red' },
];

const EVIDENCE: EvidenceRef[] = [
  {
    fileName: `Atlas_PSU_Supply_Agreement_${CONTRACT.agreementId}.pdf`,
    finding: `Covered ${OEM_PART}/${SUPPLIER_PART}, 24-month term, ${usd(PER_UNIT_CAP)} cap, labor/shipping excluded.`,
    pageRef: 'Sections 1–5',
    excerpt: `Per-unit cap: ${usd(PER_UNIT_CAP)}. Recoverable cost: verified replacement-part cost.`,
    confidence: 0.98,
  },
  {
    fileName: `Atlas_PSU_Amendment_01_${CONTRACT.agreementId}.pdf`,
    finding: `Adds supplier part ${SUPPLIER_PART} to the covered ${OEM_PART} mapping.`,
    pageRef: 'Amendment 01',
  },
  {
    fileName: `${SIGNAL.id}_R500_PSU_Engineering_Report.pdf`,
    finding: `Approved population-level causation for lots ${COVERED_LOTS.join(', ')} within scope.`,
    pageRef: `Report ${ENGINEERING.reportId}`,
    excerpt: ENGINEERING.conclusion,
    confidence: 0.95,
  },
  {
    fileName: `${SIGNAL.id}_Traceability_Matrix.xlsx`,
    finding: 'Claim-level component, serial, supplier lot, receipt, and evidence status.',
    pageRef: 'Sheet: Traceability',
  },
  {
    fileName: `${REP_CLAIM.claimId}_Evidence_Packet.pdf`,
    finding: 'Representative claim occurrence, component-label image, traceability chain.',
    pageRef: 'Evidence packet',
    confidence: 0.97,
  },
];

export function InvestigationScreen() {
  const population = useMemo(() => computePopulation(), []);
  const cls = useMemo(() => classifyPopulation(), []);
  const recovery = useMemo(() => computeRecoveryTotal(), []);
  const signal = useMemo(() => computeSignal(), []);
  const { state, update } = useInvestigation();

  const [activeLane, setActiveLane] = useState<Classification | 'all'>('all');
  const [selectedClaim, setSelectedClaim] = useState<string>(REP_CLAIM.claimId);

  const shown =
    activeLane === 'all' ? population : population.filter((c) => c.classification === activeLane);

  const claim = population.find((c) => c.claimId === selectedClaim);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <header>
        <p style={{ color: 'var(--ink-soft)', margin: 0, fontSize: 13 }}>
          <Link to="/audit">Audit</Link> / <span className="mono">{SIGNAL.id}</span>
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: '4px 0' }}>{SIGNAL.title}</h1>
          <StatusBadge tone={state.opened ? 'teal' : 'cobalt'}>
            {state.opened ? 'Investigation opened' : 'Technical review recommended'}
          </StatusBadge>
        </div>
        <p className="mono" style={{ color: 'var(--ink-soft)', fontSize: 12, margin: 0 }}>
          Population: {population.length} claims · Supported potential:{' '}
          {usd(recovery.total)} pending human validation
        </p>
      </header>

      {/* Current situation summary */}
      <Panel title="Current situation">
        <p style={{ margin: 0, fontSize: 14 }}>
          R500 no-power repairs increased to <strong>{signal.qualifyingCurrent}</strong> in the
          latest 30-day period, <strong>{signal.ratioText}</strong> the historical average of{' '}
          {signal.baselineAverage}. <strong>{population.length}</strong> claims in the 90-day scope
          involve {SUPPLIER}-supplied {OEM_PART} replacements. <strong>{cls.counts.supported}</strong>{' '}
          claims currently have reviewed traceability, engineering, contract, and cost evidence
          supporting recovery review.
        </p>
      </Panel>

      {/* Decision lanes */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {LANES.map((lane) => (
          <button
            key={lane.key}
            onClick={() => setActiveLane(activeLane === lane.key ? 'all' : lane.key)}
            aria-pressed={activeLane === lane.key}
            style={{
              textAlign: 'left',
              background: activeLane === lane.key ? 'var(--surface-2)' : 'var(--surface-2)',
              border: `2px solid ${activeLane === lane.key ? laneColor(lane.tone) : 'var(--line)'}`,
              borderRadius: 4,
              padding: 12,
              cursor: 'pointer',
            }}
          >
            <div className="mono" style={{ fontSize: 24, fontWeight: 700, color: laneColor(lane.tone) }}>
              {cls.counts[lane.key]}
            </div>
            <div style={{ fontSize: 12 }}>
              <span aria-hidden="true">{laneIcon(lane.tone)} </span>
              {lane.label}
            </div>
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* 48-claim table */}
        <Panel
          title={`Investigation population (${shown.length}${activeLane === 'all' ? '' : ' of ' + population.length})`}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr>
                  {['Claim', 'Repair date', 'Product serial', 'Component serial', 'Lot', 'Failure', 'Evidence', 'Cost', 'Class'].map(
                    (h) => (
                      <th key={h} style={th}>{h}</th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((c) => (
                  <tr
                    key={c.claimId}
                    onClick={() => setSelectedClaim(c.claimId)}
                    style={{
                      cursor: 'pointer',
                      background: c.claimId === selectedClaim ? '#eef3ff' : undefined,
                    }}
                  >
                    <td style={tdMono}>{c.claimId}</td>
                    <td style={tdMono}>{c.repairDate}</td>
                    <td style={tdMono}>{c.productSerial}</td>
                    <td style={tdMono}>{c.componentSerial}</td>
                    <td style={tdMono}>{c.supplierLot}</td>
                    <td style={tdMono}>{c.failureCode}</td>
                    <td style={td}>{c.evidenceState}</td>
                    <td style={tdMono}>{usd(c.cost)}</td>
                    <td style={td}>{classBadge(c.classification)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Representative claim drill-down */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {claim && <ClaimDetail claim={claim} />}
        </div>
      </div>

      {/* Recovery recommendation */}
      <Panel
        title="Recovery recommendation"
        aside={<StatusBadge tone="teal">Prepare supplier recovery claim</StatusBadge>}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            <li>Supported population: <strong>{SUPPORTED_CLAIMS} claims</strong></li>
            <li>Proposed amount: <strong>{usd(SUPPORTED_TOTAL)}</strong> potential recovery pending human validation</li>
            <li>Agreement basis: covered {OEM_PART}/{SUPPLIER_PART}, 24-month term, verified part cost, {usd(PER_UNIT_CAP)} cap, required evidence</li>
          </ul>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
            <li>Excluded from draft: {cls.counts.missing} missing-traceability</li>
            <li>{cls.counts.engineering} engineering-review</li>
            <li>{cls.counts.excluded} non-supplier-cause</li>
          </ul>
        </div>
        <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>
          <span aria-hidden="true">▲ </span>
          Recommendation requires human approval and is not a submitted claim.
        </p>
      </Panel>

      {/* Evidence panels */}
      <Panel title="Box evidence">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {EVIDENCE.map((e) => (
            <SourceInspector key={e.fileName} evidence={e} />
          ))}
        </div>
      </Panel>

      {/* Investigation + draft actions (task 11/12 wire-up lives here) */}
      <InvestigationActions state={state} update={update} />
    </div>
  );
}

function ClaimDetail({ claim }: { claim: Claim }) {
  const supported = claim.classification === 'supported';
  const checklist = [
    ['Completed warranty repair', true],
    ['Exact component + supplier traceability', claim.supplierLot !== '(none)'],
    ['Agreement covers component', true],
    ['Within 24-month supplier warranty', true],
    ['Matches engineering report criteria', supported || claim.classification === 'engineering'],
    ['Verified replacement-part cost', true],
    ['Filing window open', true],
    ['No previous recovery', true],
  ] as const;

  return (
    <Panel title={`Claim ${claim.claimId}`} aside={classBadge(claim.classification)}>
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '2px 10px', margin: 0, fontSize: 12 }}>
        <dt style={dtS}>Component serial</dt><dd style={ddS} className="mono">{claim.componentSerial}</dd>
        <dt style={dtS}>Supplier part</dt><dd style={ddS} className="mono">{claim.supplierPart}</dd>
        <dt style={dtS}>Supplier lot</dt><dd style={ddS} className="mono">{claim.supplierLot}</dd>
        <dt style={dtS}>Delivery receipt</dt><dd style={ddS} className="mono">{claim.deliveryReceipt}</dd>
        <dt style={dtS}>Repair completed</dt><dd style={ddS} className="mono">{claim.repairDate}</dd>
      </dl>
      <h3 style={{ fontSize: 13, margin: '12px 0 4px' }}>Requirement checklist</h3>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 12 }}>
        {checklist.map(([label, ok]) => (
          <li key={label} style={{ display: 'flex', gap: 6, color: ok ? 'var(--teal)' : 'var(--amber)' }}>
            <span aria-hidden="true">{ok ? '✓' : '▲'}</span>
            <span style={{ color: 'var(--ink)' }}>{label}</span>
          </li>
        ))}
      </ul>
      <p style={{ fontSize: 13, marginTop: 10 }}>
        Recoverable amount:{' '}
        <span className="mono">
          min(cost {usd(claim.cost)}, cap {usd(PER_UNIT_CAP)}) = {usd(Math.min(claim.cost, PER_UNIT_CAP))}
        </span>
        {claim.cost > PER_UNIT_CAP && (
          <span style={{ color: 'var(--amber)' }}> — capped at {usd(PER_UNIT_CAP)}</span>
        )}
      </p>
    </Panel>
  );
}

function InvestigationActions({
  state,
  update,
}: {
  state: ReturnType<typeof useInvestigation>['state'];
  update: ReturnType<typeof useInvestigation>['update'];
}) {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const openInvestigation = () => {
    if (!window.confirm(`Open supplier recovery investigation ${INVESTIGATION_ID}? This records the signal and population snapshot.`)) {
      return;
    }
    update({
      opened: true,
      investigationId: INVESTIGATION_ID,
      openedAt: new Date().toISOString(),
      openedBy: 'Technical Specialist',
      signalId: SIGNAL.id,
      populationCount: 48,
      supportedCount: SUPPORTED_CLAIMS,
      supportedTotal: SUPPORTED_TOTAL,
    });
    setMsg(`Investigation ${INVESTIGATION_ID} opened.`);
  };

  const prepareDraft = async () => {
    if (!window.confirm(`Prepare draft supplier recovery claim for ${SUPPORTED_CLAIMS} claims totaling ${usd(SUPPORTED_TOTAL)}? This writes a draft to Box labeled "Draft - not submitted". It does not submit or contact the supplier.`)) {
      return;
    }
    setBusy(true);
    setMsg('Generating draft and writing to Box…');
    try {
      const res = await fetch('/box-proxy/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          investigationId: INVESTIGATION_ID,
          supportedCount: SUPPORTED_CLAIMS,
          total: SUPPORTED_TOTAL,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        update({
          draftPrepared: true,
          draftAt: new Date().toISOString(),
          draftFileId: data.fileId ?? null,
          draftFileName: data.fileName ?? null,
        });
        setMsg(`Draft written to Box: ${data.fileName} (file ${data.fileId}). Labeled "Draft - not submitted".`);
      } else {
        setMsg(`Draft failed: ${data.error ?? 'unknown error'}`);
      }
    } catch (e) {
      setMsg(`Draft error: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel title="Investigation actions">
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={openInvestigation} disabled={state.opened} style={actionBtn(state.opened)}>
          {state.opened ? `Investigation ${state.investigationId} opened ✓` : 'Open supplier recovery investigation'}
        </button>
        <button
          onClick={prepareDraft}
          disabled={!state.opened || busy || state.draftPrepared}
          style={actionBtn(!state.opened || busy || state.draftPrepared)}
        >
          {state.draftPrepared ? 'Draft prepared ✓' : busy ? 'Working…' : 'Prepare draft supplier recovery claim'}
        </button>
      </div>
      {msg && (
        <p role="status" style={{ fontSize: 13, marginTop: 10 }}>
          {msg}
        </p>
      )}
      <p style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 8 }}>
        State persists across browser refresh. The draft is an unsubmitted document written to the
        controlled Box output folder; no supplier is contacted.
      </p>
    </Panel>
  );
}

function laneColor(tone: 'teal' | 'amber' | 'red') {
  return tone === 'teal' ? 'var(--teal)' : tone === 'amber' ? 'var(--amber)' : 'var(--red)';
}
function laneIcon(tone: 'teal' | 'amber' | 'red') {
  return tone === 'teal' ? '✓' : tone === 'red' ? '✕' : '▲';
}

function classBadge(c?: Classification) {
  if (c === 'supported') return <StatusBadge tone="teal">Supported</StatusBadge>;
  if (c === 'missing') return <StatusBadge tone="amber">Missing</StatusBadge>;
  if (c === 'engineering') return <StatusBadge tone="amber">Engineering</StatusBadge>;
  if (c === 'excluded') return <StatusBadge tone="red">Excluded</StatusBadge>;
  return null;
}

const th: React.CSSProperties = {
  textAlign: 'left',
  borderBottom: '2px solid var(--line)',
  padding: '6px 8px',
  position: 'sticky',
  top: 0,
  background: 'var(--surface-2)',
  whiteSpace: 'nowrap',
};
const td: React.CSSProperties = { borderBottom: '1px solid var(--line)', padding: '5px 8px' };
const tdMono: React.CSSProperties = { ...td, fontFamily: 'var(--mono)', whiteSpace: 'nowrap' };
const dtS: React.CSSProperties = { color: 'var(--ink-soft)' };
const ddS: React.CSSProperties = { margin: 0 };

function actionBtn(disabled: boolean): React.CSSProperties {
  return {
    background: disabled ? '#c9cfd6' : 'var(--cobalt)',
    color: '#fff',
    border: 'none',
    borderRadius: 4,
    padding: '10px 16px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
  };
}
