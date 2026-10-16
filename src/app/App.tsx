import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { chapterProgress } from '../animation/choreography';
import { DEFAULT_LAB } from '../interaction/lab';
import { useMotionPreference } from '../interaction/useMotionPreference';
import type { Quality } from '../performance/quality';
import { MaterialLab } from './MaterialLab';
import { RenderBoundary } from './RenderBoundary';
import '../style.css';

const Experience = lazy(() => import('../scene/Experience'));
const CHAPTERS = ['The reveal', 'In reflection', 'Inner structure', 'Material lab'];
export default function App() {
  const reducedMotion = useMotionPreference();
  const [still, setStill] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);
  const [quality, setQuality] = useState<Quality>('high');
  const [lab, setLab] = useState({ ...DEFAULT_LAB });
  const [chapter, setChapter] = useState(0);
  const progress = useRef(0);
  const staticMode = reducedMotion || still || failed;
  const onReady = useCallback(() => setReady(true), []);
  const onFailure = useCallback(() => {
    setFailed(true);
    setReady(false);
  }, []);
  useEffect(() => {
    let stops: number[] = [];
    const update = () => {
      progress.current = chapterProgress(window.scrollY, stops);
      setChapter(Math.min(3, Math.max(0, Math.round(progress.current * 3))));
      document.documentElement.style.setProperty('--journey', String(progress.current));
    };
    const resize = () => {
      stops = Array.from(document.querySelectorAll<HTMLElement>('.chapter'), (element) =>
        Math.max(0, element.offsetTop - 100),
      );
      update();
    };
    resize();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', resize);
    };
  }, []);
  useEffect(() => {
    if (staticMode || ready) return;
    const timeout = window.setTimeout(onFailure, 30000);
    return () => window.clearTimeout(timeout);
  }, [onFailure, ready, staticMode]);
  const retry = () => {
    setFailed(false);
    setStill(false);
    setReady(false);
  };
  return (
    <>
      <a className="skip-link" href="#material-lab">
        Skip to material lab
      </a>
      <header className="site-header">
        <a className="wordmark" href="#reveal" aria-label="Spatial Interface Lab, start">
          <span className="brand-symbol" aria-hidden="true">
            ◒
          </span>
          <span>
            SPATIAL
            <br />
            INTERFACE LAB
          </span>
        </a>
        <span className="header-note">Independent studies in digital space</span>
        <button
          className="mode-button"
          onClick={() => {
            if (staticMode) retry();
            else {
              setStill(true);
              setReady(false);
            }
          }}
          disabled={reducedMotion}
          aria-pressed={staticMode}
        >
          {reducedMotion ? 'Reduced motion' : staticMode ? 'Enable 3D' : 'Still mode'}{' '}
          <span aria-hidden="true">{staticMode ? '◯' : '◉'}</span>
        </button>
      </header>
      <div
        className={`stage ${staticMode ? 'is-static' : ''}`}
        aria-hidden="true"
        data-testid="stage"
        data-state={staticMode ? 'static' : ready ? 'ready' : 'loading'}
      >
        <div className="poster" />
        {!staticMode ? (
          <RenderBoundary key="scene" onFailure={onFailure}>
            <Suspense fallback={null}>
              <Experience
                progress={progress}
                lab={lab}
                onReady={onReady}
                onFailure={onFailure}
                onQuality={setQuality}
              />
            </Suspense>
          </RenderBoundary>
        ) : null}
        <div className="stage-shade" />
      </div>
      <main>
        <p className="sr-only">
          An interactive sculpture study: three folded chrome blades surrounding a pale glass core,
          suspended above a dark circular plinth. Scroll through the compositions or use the chapter
          links. Material controls are in the final chapter.
        </p>
        <section className="chapter hero" id="reveal" aria-labelledby="hero-title">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="small-cross" aria-hidden="true">
                +
              </span>{' '}
              Experiment 001 / Chrome sculpture
            </p>
            <h1 id="hero-title">
              BEYOND
              <br />
              THE <span>SURFACE.</span>
            </h1>
            <p className="intro">
              An exploration of material,
              <br />
              light and the space between.
            </p>
          </div>
          <div className="hero-bottom">
            <a className="text-link" href="#reflection">
              Scroll to discover <span aria-hidden="true">↓</span>
            </a>
            <p>
              One form.
              <br />A different perspective.
            </p>
          </div>
        </section>
        <section className="chapter observation" id="reflection" aria-labelledby="reflection-title">
          <div className="chapter-copy">
            <p className="eyebrow">01 / In reflection</p>
            <h2 id="reflection-title">
              LIGHT
              <br />
              BECOMES
              <br />
              <em>FORM.</em>
            </h2>
            <p>
              A surface has no image of its own.
              <br />
              Only the world it reflects.
            </p>
            <span className="annotation">Polished chrome · roughness 0.12</span>
          </div>
        </section>
        <section className="chapter observation" id="structure" aria-labelledby="structure-title">
          <div className="chapter-copy">
            <p className="eyebrow">02 / Inner structure</p>
            <h2 id="structure-title">
              SOLID.
              <br />
              OPEN.
              <br />
              <em>UNEXPECTED.</em>
            </h2>
            <p>
              Three folded arcs. A suspended core.
              <br />
              An aperture that changes with you.
            </p>
            <span className="annotation">Optical glass · index of refraction 1.48</span>
          </div>
        </section>
        <section className="chapter lab-chapter" id="material-lab" aria-labelledby="lab-title">
          <div className="lab-copy">
            <p className="eyebrow">03 / Your perspective</p>
            <h2 id="lab-title">
              CHANGE
              <br />
              THE <em>STUDY.</em>
            </h2>
            <p>
              Same form. Different conditions.
              <br />
              Make a small change. Look again.
            </p>
            <MaterialLab values={lab} onChange={setLab} staticMode={staticMode} />
          </div>
          <footer>
            <span>Spatial Interface Lab © 2026</span>
            <a href="#reveal">
              Back to the surface <span aria-hidden="true">↑</span>
            </a>
          </footer>
        </section>
      </main>
      <nav className="chapter-nav" aria-label="Experience chapters">
        {CHAPTERS.map((label, index) => (
          <a
            key={label}
            href={`#${['reveal', 'reflection', 'structure', 'material-lab'][index]}`}
            aria-label={`${String(index + 1).padStart(2, '0')} ${label}`}
            aria-current={chapter === index ? 'step' : undefined}
          >
            <span className="nav-number">0{index + 1}</span>
            <span className="nav-dash" />
          </a>
        ))}
      </nav>
      <div className="status-bar" role="status" aria-label="Rendering status">
        <span className="status-dot" />
        {failed
          ? '3D unavailable · still study active'
          : reducedMotion
            ? 'Still study · reduced motion'
            : still
              ? 'Still study'
              : !ready
                ? 'Preparing the light study…'
                : `${quality === 'high' ? 'High' : 'Balanced'} fidelity · real-time WebGL`}
        <span className="status-index">{String(chapter + 1).padStart(2, '0')} / 04</span>
      </div>
    </>
  );
}
