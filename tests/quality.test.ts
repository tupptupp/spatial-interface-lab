import { describe, expect, it } from 'vitest';
import { observeFrame, percentile } from '../src/performance/quality';
import type { QualityState } from '../src/performance/quality';
const fresh = (): QualityState => ({ quality: 'high', slowWindows: 0, samples: [] });
const feed = (state: QualityState, count: number, ms: number) => {
  for (let i = 0; i < count; i++) state = observeFrame(state, ms);
  return state;
};
describe('quality hysteresis', () => {
  it('requires three slow windows and does not oscillate back upward', () => {
    let state = feed(fresh(), 179, 40);
    expect(state.quality).toBe('high');
    state = feed(state, 91, 40);
    expect(state.quality).toBe('balanced');
    expect(feed(state, 900, 16).quality).toBe('balanced');
  });
  it('ignores idle/tab resume gaps and isolated spikes', () => {
    expect(observeFrame(fresh(), 5000)).toEqual(fresh());
    expect(feed(observeFrame(fresh(), 90), 89, 16).slowWindows).toBe(0);
  });
  it('resets sustained-load evidence after a healthy window', () => {
    expect(feed(feed(fresh(), 90, 40), 90, 16).slowWindows).toBe(0);
  });
  it('calculates nearest-rank percentiles including empty samples', () => {
    expect(percentile([], 0.95)).toBe(0);
    expect(percentile([30, 10, 20], 0.5)).toBe(20);
    expect(percentile([1, 2, 3, 4, 5], 0.95)).toBe(5);
  });
});
