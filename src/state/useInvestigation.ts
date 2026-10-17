import { useCallback, useEffect, useState } from 'react';

// Schema-versioned local persistence for the prototype investigation state.
// Bump SCHEMA_VERSION if the shape changes; older payloads are discarded.
const SCHEMA_VERSION = 1;
const KEY = 'claimiq.investigation.v1';

export interface InvestigationState {
  schemaVersion: number;
  opened: boolean;
  investigationId: string | null;
  openedAt: string | null;
  openedBy: string | null;
  signalId: string | null;
  populationCount: number | null;
  supportedCount: number | null;
  supportedTotal: number | null;
  draftPrepared: boolean;
  draftAt: string | null;
  draftFileId: string | null;
  draftFileName: string | null;
}

const EMPTY: InvestigationState = {
  schemaVersion: SCHEMA_VERSION,
  opened: false,
  investigationId: null,
  openedAt: null,
  openedBy: null,
  signalId: null,
  populationCount: null,
  supportedCount: null,
  supportedTotal: null,
  draftPrepared: false,
  draftAt: null,
  draftFileId: null,
  draftFileName: null,
};

function load(): InvestigationState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as InvestigationState;
    if (parsed.schemaVersion !== SCHEMA_VERSION) return EMPTY;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

export function useInvestigation() {
  const [state, setState] = useState<InvestigationState>(() =>
    typeof window === 'undefined' ? EMPTY : load(),
  );

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore quota/availability errors */
    }
  }, [state]);

  const update = useCallback((patch: Partial<InvestigationState>) => {
    setState((s) => ({ ...s, ...patch, schemaVersion: SCHEMA_VERSION }));
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  return { state, update, reset };
}
