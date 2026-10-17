import type { ConceptId, Fidelity, ViewId } from '../sculpture/types';

export type ExploreState = {
  concept: ConceptId;
  view: ViewId;
  rig: 'concept' | 'baseline';
  fidelity: Fidelity;
  /** false hides the panel for clean comparison captures. */
  ui: boolean;
  /** Diagnostic: show the reflection environment as the background. */
  env: boolean;
};

const CONCEPT_IDS: readonly ConceptId[] = ['monolith', 'interlocked', 'refined', 'tension'];
const VIEW_IDS: readonly ViewId[] = ['hero', 'alt', 'detail', 'spatial'];
const pick = <T extends string>(value: string | null, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback;

export function readExploreState(search: string): ExploreState {
  const params = new URLSearchParams(search);
  return {
    concept: pick(params.get('concept'), CONCEPT_IDS, 'monolith'),
    view: pick(params.get('view'), VIEW_IDS, 'hero'),
    rig: pick(params.get('rig'), ['concept', 'baseline'] as const, 'concept'),
    fidelity: pick(params.get('fidelity'), ['high', 'balanced'] as const, 'high'),
    ui: params.get('ui') !== '0',
    env: params.get('env') === '1',
  };
}

export function writeExploreState(state: ExploreState): string {
  const params = new URLSearchParams({
    concept: state.concept,
    view: state.view,
    rig: state.rig,
    fidelity: state.fidelity,
  });
  if (!state.ui) params.set('ui', '0');
  if (state.env) params.set('env', '1');
  return `?${params.toString()}`;
}
