/** Signed-distance building blocks for the sculpture studies.
 * Every operator here is C∞ (or exact) away from the medial axis, because polished chrome
 * exposes curvature discontinuities as kinks in reflected highlight lines.
 */
export type SDF = (x: number, y: number, z: number) => number;

/** Exponential smooth minimum. C∞, unlike the polynomial variant whose second derivative
 * jumps at the blend boundary. `k` is the blend radius in world units. */
export function smin(a: number, b: number, k: number): number {
  const m = Math.min(a, b);
  return m - k * Math.log(Math.exp((m - a) / k) + Math.exp((m - b) / k));
}

export const smax = (a: number, b: number, k: number) => -smin(-a, -b, k);

/** Ellipsoid with radii (a, b, c). Approximate distance, exact zero set (Quílez bound). */
export function ellipsoid(x: number, y: number, z: number, a: number, b: number, c: number) {
  const k0 = Math.hypot(x / a, y / b, z / c);
  const k1 = Math.hypot(x / (a * a), y / (b * b), z / (c * c));
  return k1 === 0 ? -Math.min(a, b, c) : (k0 * (k0 - 1)) / k1;
}

/** Torus in the local XZ plane. Exact. */
export function torus(x: number, y: number, z: number, major: number, minor: number) {
  return Math.hypot(Math.hypot(x, z) - major, y) - minor;
}

/** Capsule between two points with linearly interpolated radius (a "round cone"). */
export function taperedCapsule(
  x: number,
  y: number,
  z: number,
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  ra: number,
  rb: number,
) {
  const bx = b[0] - a[0],
    by = b[1] - a[1],
    bz = b[2] - a[2];
  const px = x - a[0],
    py = y - a[1],
    pz = z - a[2];
  const t = Math.max(0, Math.min(1, (px * bx + py * by + pz * bz) / (bx * bx + by * by + bz * bz)));
  return Math.hypot(px - bx * t, py - by * t, pz - bz * t) - (ra + (rb - ra) * t);
}

/** Superellipsoid with exponent n (n = 2 is an ellipsoid; larger values square the form).
 * Returned value is scaled to approximate distance near the surface. */
export function superellipsoid(
  x: number,
  y: number,
  z: number,
  a: number,
  b: number,
  c: number,
  n: number,
) {
  const f = Math.pow(
    Math.pow(Math.abs(x / a), n) + Math.pow(Math.abs(y / b), n) + Math.pow(Math.abs(z / c), n),
    1 / n,
  );
  return (f - 1) * Math.min(a, b, c);
}

/** Rotate (x, y) by angle. Returned as a tuple to keep call sites terse. */
export function rot(x: number, y: number, angle: number): [number, number] {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return [c * x - s * y, s * x + c * y];
}

/** Central-difference gradient. */
export function gradient(sdf: SDF, x: number, y: number, z: number, e = 1e-4) {
  return [
    sdf(x + e, y, z) - sdf(x - e, y, z),
    sdf(x, y + e, z) - sdf(x, y - e, z),
    sdf(x, y, z + e) - sdf(x, y, z - e),
  ] as [number, number, number];
}
