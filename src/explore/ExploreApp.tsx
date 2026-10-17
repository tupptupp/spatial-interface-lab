import { lazy, Suspense, useCallback, useEffect, useState } from 'react';
import { CONCEPTS, conceptById } from '../sculpture/concepts';
import { BASELINE_RIG } from '../sculpture/rigs';
import type { ConceptId, Fidelity, ViewId } from '../sculpture/types';
import type { StudioDiagnostics } from './Studio';
import { readExploreState, writeExploreState } from './state';
import type { ExploreState } from './state';
import './explore.css';

const Studio = lazy(() => import('./Studio'));
const VIEWS: readonly { id: ViewId; label: string; lens: string }[] = [
  { id: 'hero', label: 'Hero', lens: '≈50mm' },
  { id: 'detail', label: 'Detail', lens: '≈90mm' },
  { id: 'spatial', label: 'Spatial', lens: '≈35mm' },
];

export default function ExploreApp() {
  const [state, setState] = useState<ExploreState>(() => readExploreState(window.location.search));
  const [resetToken, setResetToken] = useState(0);
  const [buildMs, setBuildMs] = useState(0);
  const [diagnostics, setDiagnostics] = useState<StudioDiagnostics | null>(null);
  const concept = conceptById(state.concept);
  const rig = state.rig === 'baseline' ? BASELINE_RIG : concept.rig;
  const update = useCallback((patch: Partial<ExploreState>) => {
    setState((current) => {
      const next = { ...current, ...patch };
      window.history.replaceState(null, '', writeExploreState(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const keys = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.metaKey || event.ctrlKey) return;
      const concepts: Record<string, ConceptId> = {
        '1': 'monolith',
        '2': 'interlocked',
        '3': 'tension',
      };
      const views: Record<string, ViewId> = { h: 'hero', d: 'detail', s: 'spatial' };
      if (concepts[event.key]) update({ concept: concepts[event.key] });
      else if (views[event.key]) update({ view: views[event.key] });
      else if (event.key === 'r') setResetToken((t) => t + 1);
      else if (event.key === 'l')
        update({ rig: state.rig === 'baseline' ? 'concept' : 'baseline' });
    };
    window.addEventListener('keydown', keys);
    return () => window.removeEventListener('keydown', keys);
  }, [state.rig, update]);

  return (
    <div className={`explore ${state.ui ? '' : 'is-clean'}`}>
      <div className="explore-stage">
        <Suspense fallback={null}>
          <Studio
            concept={concept}
            view={state.view}
            rig={rig}
            fidelity={state.fidelity}
            resetToken={resetToken}
            onDiagnostics={setDiagnostics}
            onBuilt={setBuildMs}
            buildMs={buildMs}
            showEnvironment={state.env}
          />
        </Suspense>
      </div>
      {state.ui ? (
        <aside className="explore-panel" aria-label="Sculpture concept comparison">
          <p className="explore-kicker">Development study · not production UI</p>
          <h1>
            <span>{concept.letter}</span> {concept.name}
          </h1>
          <p className="explore-intent">{concept.intention}</p>
          <fieldset>
            <legend>Concept</legend>
            {CONCEPTS.map((c) => (
              <button
                key={c.id}
                aria-pressed={c.id === concept.id}
                onClick={() => update({ concept: c.id })}
              >
                {c.letter} · {c.name}
              </button>
            ))}
          </fieldset>
          <fieldset>
            <legend>Camera</legend>
            {VIEWS.map((v) => (
              <button
                key={v.id}
                aria-pressed={v.id === state.view}
                onClick={() => update({ view: v.id })}
              >
                {v.label} <small>{v.lens}</small>
              </button>
            ))}
            <button onClick={() => setResetToken((t) => t + 1)}>Reset camera</button>
          </fieldset>
          <fieldset>
            <legend>Lighting</legend>
            <button
              aria-pressed={state.rig === 'baseline'}
              onClick={() => update({ rig: 'baseline' })}
            >
              Baseline studio
            </button>
            <button
              aria-pressed={state.rig === 'concept'}
              onClick={() => update({ rig: 'concept' })}
            >
              Concept rig
            </button>
          </fieldset>
          <p className={`explore-rig ${state.rig === 'concept' ? 'is-custom' : ''}`} role="status">
            {state.rig === 'concept'
              ? `Concept-specific lighting: ${rig.label}. Not a like-for-like comparison.`
              : 'Identical baseline studio, materials, tone mapping and exposure for all concepts.'}
          </p>
          <fieldset>
            <legend>Diagnostics</legend>
            <button aria-pressed={state.env} onClick={() => update({ env: !state.env })}>
              Show reflection environment
            </button>
          </fieldset>
          <fieldset>
            <legend>Fidelity</legend>
            {(['high', 'balanced'] as Fidelity[]).map((f) => (
              <button
                key={f}
                aria-pressed={f === state.fidelity}
                onClick={() => update({ fidelity: f })}
              >
                {f}
              </button>
            ))}
          </fieldset>
          {diagnostics ? (
            <dl className="explore-diagnostics">
              <dt>Triangles</dt>
              <dd>{diagnostics.triangles.toLocaleString('en')}</dd>
              <dt>Draw calls</dt>
              <dd>{diagnostics.calls}</dd>
              <dt>Geometry build</dt>
              <dd>{Math.round(buildMs)} ms</dd>
              <dt>Env cube face</dt>
              <dd>{diagnostics.environment}px</dd>
              <dt>DPR</dt>
              <dd>{diagnostics.dpr}</dd>
              <dt>Renderer</dt>
              <dd className="explore-renderer">{diagnostics.renderer}</dd>
            </dl>
          ) : null}
          <p className="explore-keys">
            Keys: 1 2 3 concept · H D S view · L lighting · R reset · drag to orbit
          </p>
        </aside>
      ) : null}
    </div>
  );
}
