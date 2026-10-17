import { BOX_FILES, openInBoxUrl } from '../data/boxAssets';
import { Panel, StatusBadge } from './primitives';

const REVIEW_TONE: Record<string, 'teal' | 'amber' | 'red'> = {
  ReviewerConfirmed: 'teal',
  Candidate: 'amber',
  Rejected: 'red',
};

function reviewLabel(status: string): string {
  if (status === 'ReviewerConfirmed') return 'Reviewer confirmed';
  if (status === 'Candidate') return 'Candidate';
  if (status === 'Rejected') return 'Rejected';
  return status;
}

export interface EvidenceRef {
  fileName: string;
  finding: string;
  pageRef?: string;
  excerpt?: string;
  confidence?: number;
}

/** Source Inspector for a single Box document (PRD 14.4). */
export function SourceInspector({ evidence }: { evidence: EvidenceRef }) {
  const asset = BOX_FILES[evidence.fileName];
  if (!asset) {
    return (
      <Panel title={evidence.fileName}>
        <p style={{ color: 'var(--red)' }}>
          <span aria-hidden="true">✕ </span>
          Box asset not found. Run <code>npm run box:seed</code> then{' '}
          <code>npm run box:assets</code>.
        </p>
      </Panel>
    );
  }
  const review = asset.metadata.reviewStatus ?? 'Candidate';
  return (
    <Panel
      title={evidence.fileName}
      aside={<StatusBadge tone={REVIEW_TONE[review] ?? 'amber'}>{reviewLabel(review)}</StatusBadge>}
    >
      <dl style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '4px 12px', margin: 0, fontSize: 13 }}>
        <dt style={dt}>Finding supported</dt>
        <dd style={dd}>{evidence.finding}</dd>
        <dt style={dt}>Box file ID</dt>
        <dd style={dd} className="mono">{asset.fileId}</dd>
        <dt style={dt}>Version</dt>
        <dd style={dd} className="mono">{asset.versionId ?? '—'}</dd>
        {evidence.pageRef && (
          <>
            <dt style={dt}>Reference</dt>
            <dd style={dd}>{evidence.pageRef}</dd>
          </>
        )}
        {evidence.excerpt && (
          <>
            <dt style={dt}>Excerpt</dt>
            <dd style={dd}><em>“{evidence.excerpt}”</em></dd>
          </>
        )}
        {evidence.confidence != null && (
          <>
            <dt style={dt}>Confidence</dt>
            <dd style={dd} className="mono">{(evidence.confidence * 100).toFixed(0)}%</dd>
          </>
        )}
        <dt style={dt}>Document type</dt>
        <dd style={dd}>{asset.metadata.documentType}</dd>
      </dl>
      {review === 'Candidate' && (
        <p style={{ fontSize: 12, color: 'var(--amber)', marginTop: 8 }}>
          <span aria-hidden="true">▲ </span>
          Extracted value is a candidate. It must be reviewer-confirmed before it can support the
          recovery total.
        </p>
      )}
      <div style={{ marginTop: 12 }}>
        <a
          href={openInBoxUrl(asset.fileId)}
          target="_blank"
          rel="noreferrer"
          style={{
            display: 'inline-block',
            border: '1px solid var(--cobalt)',
            color: 'var(--cobalt)',
            borderRadius: 4,
            padding: '6px 12px',
            textDecoration: 'none',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Open original in Box ↗
        </a>
      </div>
    </Panel>
  );
}

const dt: React.CSSProperties = { color: 'var(--ink-soft)', fontWeight: 500 };
const dd: React.CSSProperties = { margin: 0 };
