import { describe, expect, it } from 'vitest';
import {
  chapterProgress,
  clamp,
  sampleShot,
  scrollProgress,
  SHOTS,
  smooth,
} from '../src/animation/choreography';

describe('deterministic choreography', () => {
  it('reaches the authored camera keyframes exactly', () => {
    SHOTS.forEach((shot, index) => expect(sampleShot(index / 3)).toEqual(shot));
  });
  it('clamps out-of-range and invalid progress', () => {
    expect(sampleShot(-10)).toEqual(SHOTS[0]);
    expect(sampleShot(10)).toEqual(SHOTS[3]);
    expect(sampleShot(NaN)).toEqual(SHOTS[0]);
    expect(clamp(Infinity)).toBe(0);
  });
  it('returns the same composition after interrupted, reverse and rapid travel', () => {
    const expected = sampleShot(0.56);
    [1, 0.4, 0, 0.99, 0.2].forEach((progress) => sampleShot(progress));
    expect(sampleShot(0.56)).toEqual(expected);
  });
  it('keeps camera and target continuous across shot boundaries', () => {
    for (const boundary of [1 / 3, 2 / 3]) {
      const left = sampleShot(boundary - 0.00001),
        right = sampleShot(boundary + 0.00001);
      left.position.forEach((value, i) =>
        expect(Math.abs(value - right.position[i]!)).toBeLessThan(0.000001),
      );
      left.target.forEach((value, i) =>
        expect(Math.abs(value - right.target[i]!)).toBeLessThan(0.000001),
      );
    }
  });
  it('increases mobile viewing distance at every sampled frame', () => {
    for (let p = 0; p <= 1; p += 0.02)
      expect(sampleShot(p, true).position[2]).toBeGreaterThan(sampleShot(p).position[2]);
  });
  it('eases monotonically without overshoot', () => {
    let previous = 0;
    for (let i = 0; i <= 100; i++) {
      const value = smooth(i / 100);
      expect(value).toBeGreaterThanOrEqual(previous);
      expect(value).toBeLessThanOrEqual(1);
      previous = value;
    }
  });
  it('handles documents without a scrollable extent', () => {
    expect(scrollProgress(100, 500, 800)).toBe(0);
    expect(scrollProgress(500, 1800, 800)).toBe(0.5);
  });
  it('maps actual section stops rather than assuming equal chapter heights', () => {
    const stops = [0, 900, 1800, 3000];
    expect(chapterProgress(900, stops)).toBe(1 / 3);
    expect(chapterProgress(2400, stops)).toBe(5 / 6);
    expect(chapterProgress(5000, stops)).toBe(1);
    expect(chapterProgress(-100, stops)).toBe(0);
    expect(chapterProgress(NaN, stops)).toBe(0);
    expect(chapterProgress(5, [])).toBe(0);
    expect(() => chapterProgress(5, [0, 0])).toThrow(RangeError);
  });
});
