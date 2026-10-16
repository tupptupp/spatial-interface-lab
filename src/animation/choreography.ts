export type Vec3 = readonly [number, number, number];
export type Shot = { position: Vec3; target: Vec3; rotation: Vec3; exposure: number };

export function clamp(value: number, min = 0, max = 1): number {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : min;
}
export const smooth = (t: number) => {
  const x = clamp(t);
  return x * x * (3 - 2 * x);
};
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const mix = (a: Vec3, b: Vec3, t: number): Vec3 => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
  lerp(a[2], b[2], t),
];

// One source of truth for both forward and reverse travel. No accumulated transforms.
export const SHOTS: readonly Shot[] = [
  { position: [0, 0.5, 8.5], target: [0, 0, 0], rotation: [0.2, -0.35, -0.18], exposure: 0.95 },
  { position: [4.3, 0.6, 5.3], target: [0, 0, 0], rotation: [0.05, 0.45, -0.24], exposure: 1.08 },
  {
    position: [-2.4, 1.0, 4.8],
    target: [0, 0.15, 0],
    rotation: [-0.18, -0.6, 0.12],
    exposure: 1.1,
  },
  { position: [0, 0.4, 7.7], target: [0, 0, 0], rotation: [0.2, -0.35, -0.18], exposure: 1.1 },
];

export function sampleShot(progress: number, mobile = false): Shot {
  const p = clamp(progress) * (SHOTS.length - 1);
  const i = Math.min(Math.floor(p), SHOTS.length - 2);
  const a = SHOTS[i]!;
  const b = SHOTS[i + 1]!;
  const t = smooth(p - i);
  const position = mix(a.position, b.position, t);
  return {
    position: mobile ? [position[0] * 0.65, position[1], position[2] * 1.42] : position,
    target: mix(a.target, b.target, t),
    rotation: mix(a.rotation, b.rotation, t),
    exposure: lerp(a.exposure, b.exposure, t),
  };
}

export function scrollProgress(scrollY: number, height: number, viewport: number): number {
  return height <= viewport ? 0 : clamp(scrollY / (height - viewport));
}

export function chapterProgress(scrollY: number, stops: readonly number[]): number {
  if (stops.length < 2 || !Number.isFinite(scrollY)) return 0;
  for (let i = 1; i < stops.length; i++) {
    if (stops[i]! <= stops[i - 1]!) throw new RangeError('Chapter stops must increase');
  }
  if (scrollY <= stops[0]!) return 0;
  for (let i = 0; i < stops.length - 1; i++) {
    if (scrollY <= stops[i + 1]!)
      return (i + clamp((scrollY - stops[i]!) / (stops[i + 1]! - stops[i]!))) / (stops.length - 1);
  }
  return 1;
}
