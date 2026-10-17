import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { openInBoxUrl } from '../data/boxAssets';
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
    finding: `24-month warranty (§5.1), FFR population causation (§7.4), part cost up to ${usd(PER_UNIT_CAP)}/unit (§8.1), labor/shipping excluded (§8.2), 90-day filing (§9.1).`,
    pageRef: '§5.1, §7.4, §8.1–8.3, §9.1 · pp. 2–3',
    excerpt: `Supplier shall reimburse the verified replacement-part cost paid by Buyer, up to a maximum of ${usd(PER_UNIT_CAP)} per unit.`,
    confidence: 0.98,
  },
  {
    fileName: `Atlas_PSU_Amendment_01_${CONTRACT.agreementId}.pdf`,
    finding: `Adds ${SUPPLIER_PART} to Schedule A for Deliveries on or after 2025-06-01 (PCN-ATL-2025-014).`,
    pageRef: 'Amendment No. 1 §1 (Schedule A)',
    excerpt: `${OEM_PART} / ${SUPPLIER_PART}: Covered for all Deliveries on or after 2025-06-01.`,
    confidence: 0.97,
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
    ['Completed warranty repair (§7.1a)', true],
    ['Exact component + supplier traceability (§4.3)', claim.supplierLot !== '(none)'],
    ['Agreement covers component (Amend. 1, Sched. A)', true],
    ['Within 24-month supplier warranty (§5.1)', true],
    ['No warranty exclusion, e.g. customer damage (§5.2)', claim.classification !== 'excluded'],
    ['Matches approved FFR frozen criteria (§7.4)', supported],
    ['Verified replacement-part cost (§7.1d)', true],
    ['Filing window open, 90 days (§9.1)', true],
    ['No previous recovery (§8.3)', true],
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

  const [preview, setPreview] = useState<{ url: string; blob: Blob } | null>(null);

  const prepareDraft = async () => {
    setBusy(true);
    setMsg('Generating draft preview…');
    try {
      const res = await fetch('/box-proxy/draft/preview');
      if (!res.ok) throw new Error(`preview failed (${res.status})`);
      const blob = await res.blob();
      setPreview({ url: URL.createObjectURL(blob), blob });
      setMsg(null);
    } catch (e) {
      setMsg(`Draft preview error: ${String(e)}`);
    } finally {
      setBusy(false);
    }
  };

  const closePreview = () => {
    if (preview) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const downloadDraft = () => {
    if (!preview) return;
    const a = document.createElement('a');
    a.href = preview.url;
    a.download = DRAFT_FILE_NAME;
    a.click();
  };

  const saveToBox = async () => {
    if (!window.confirm(`Save this draft to Box (04 Draft Supplier Recovery Claims) labeled "Draft - not submitted"? It does not submit the claim or contact the supplier.`)) {
      return;
    }
    setBusy(true);
    setMsg('Writing draft to Box…');
    try {
      const res = await fetch('/box-proxy/draft', { method: 'POST' });
      const data = await res.json();
      if (data.ok) {
        update({
          draftPrepared: true,
          draftAt: new Date().toISOString(),
          draftFileId: data.fileId ?? null,
          draftFileName: data.fileName ?? null,
        });
        setMsg(`Draft saved to Box: ${data.fileName} (file ${data.fileId}). Labeled "Draft - not submitted".`);
      } else {
        setMsg(`Box write failed: ${data.error ?? 'unknown error'}`);
      }
    } catch (e) {
      setMsg(`Box write error: ${String(e)}`);
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
          disabled={!state.opened || busy}
          style={actionBtn(!state.opened || busy)}
        >
          {busy && !preview ? 'Working…' : 'Prepare draft supplier recovery claim'}
        </button>
        {state.draftPrepared && state.draftFileId && (
          <a href={openInBoxUrl(state.draftFileId)} target="_blank" rel="noreferrer" style={{ fontSize: 13 }}>
            Saved draft in Box ↗
          </a>
        )}
      </div>
      {msg && (
        <p role="status" style={{ fontSize: 13, marginTop: 10 }}>
          {msg}
        </p>
      )}
      <p style={{ color: 'var(--ink-soft)', fontSize: 12, marginTop: 8 }}>
        State persists across browser refresh. Preview the draft first; nothing is saved until you
        download it or save it to Box. No supplier is contacted.
      </p>
      {preview && (
        <DraftPreviewModal
          url={preview.url}
          busy={busy}
          savedToBox={state.draftPrepared}
          onDownload={downloadDraft}
          onSaveToBox={saveToBox}
          onClose={closePreview}
        />
      )}
    </Panel>
  );
}

const DRAFT_FILE_NAME = `${INVESTIGATION_ID}_Supplier_Recovery_Claim_DRAFT.pdf`;

function DraftPreviewModal({
  url,
  busy,
  savedToBox,
  onDownload,
  onSaveToBox,
  onClose,
}: {
  url: string;
  busy: boolean;
  savedToBox: boolean;
  onDownload: () => void;
  onSaveToBox: () => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-preview-title"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(13,27,42,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
      }}
    >
      <div
        style={{
          background: 'var(--surface-2)',
          width: 'min(960px, 92vw)',
          height: '88vh',
          borderRadius: 6,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 16px',
            borderBottom: '1px solid var(--line)',
          }}
        >
          <div>
            <h2 id="draft-preview-title" style={{ fontSize: 15, margin: 0 }}>
              {DRAFT_FILE_NAME}
            </h2>
            <StatusBadge tone="amber">Draft - not submitted</StatusBadge>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onDownload} style={actionBtn(false)} autoFocus>
              Download PDF
            </button>
            <button onClick={onSaveToBox} disabled={busy || savedToBox} style={secondaryBtn(busy || savedToBox)}>
              {savedToBox ? 'Saved to Box ✓' : busy ? 'Saving…' : 'Save to Box'}
            </button>
            <button onClick={onClose} style={secondaryBtn(false)} aria-label="Close preview">
              Close
            </button>
          </div>
        </header>
        <iframe title="Draft supplier recovery claim preview" src={url} style={{ flex: 1, border: 'none' }} />
      </div>
    </div>
  );
}

function secondaryBtn(disabled: boolean): React.CSSProperties {
  return {
    background: 'transparent',
    color: disabled ? '#9aa4ae' : 'var(--cobalt)',
    border: `1px solid ${disabled ? '#c9cfd6' : 'var(--cobalt)'}`,
    borderRadius: 4,
    padding: '9px 14px',
    fontSize: 14,
    fontWeight: 600,
    cursor: disabled ? 'default' : 'pointer',
  };
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
