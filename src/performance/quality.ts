export type Quality = 'high' | 'balanced';
export const QUALITY = {
  high: { dpr: 1.6, segments: 160, environment: 256 },
  balanced: { dpr: 1, segments: 96, environment: 128 },
} as const;
export type QualityState = { quality: Quality; slowWindows: number; samples: number[] };
export function percentile(values: readonly number[], fraction: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return (
    sorted[Math.min(sorted.length - 1, Math.ceil(clampFraction(fraction) * sorted.length) - 1)] ??
    sorted[0]!
  );
}
const clampFraction = (n: number) => Math.max(0, Math.min(1, n));

// Three independent 90-frame windows, no automatic upgrade/oscillation. Ignore tab-resume gaps.
export function observeFrame(state: QualityState, milliseconds: number): QualityState {
  if (
    state.quality === 'balanced' ||
    milliseconds <= 0 ||
    milliseconds > 30000 ||
    !Number.isFinite(milliseconds)
  )
    return state;
  const samples = [...state.samples, milliseconds];
  if (samples.length >= 3 && samples.slice(-3).every((sample) => sample > 250))
    return { quality: 'balanced', slowWindows: state.slowWindows, samples: [] };
  if (samples.length < 90) return { ...state, samples };
  const slowWindows = percentile(samples, 0.5) > 30 ? state.slowWindows + 1 : 0;
  return { quality: slowWindows >= 3 ? 'balanced' : 'high', slowWindows, samples: [] };
}
