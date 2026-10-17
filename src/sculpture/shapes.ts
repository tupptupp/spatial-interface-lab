import type { Vec3 } from './types';

/** Extrude a 2D field `d2` to half-thickness `half` with fully rounded edges: the outline is
 * eroded by the edge radius, then a sphere of that radius is swept round it. Exact edges. */
export function roundedExtrusion(d2: number, across: number, half: number) {
  const wx = d2 + half,
    wy = Math.abs(across);
  return Math.hypot(Math.max(wx, 0), Math.max(wy, 0)) + Math.min(Math.max(wx, wy), 0) - half;
}

/** Exact distance to a biconvex lens profile in (radius, height): a vesica (intersection of
 * two discs centred on the axis), inset then offset by `rim` so the knife edge becomes a true
 * round. Exactness matters wherever another body is cut by this field plus a clearance:
 * a non-Euclidean lens field would groove that body far beyond the lens rim.
 */
export function vesicaLens(radius: number, sag: number, rim: number) {
  const sphere = (radius * radius + sag * sag) / (2 * sag);
  const inset = sphere - rim,
    c = sphere - sag;
  const b = Math.sqrt(inset * inset - c * c);
  return (r: number, y: number) => {
    const px = Math.abs(y),
      py = Math.abs(r);
    const d = (py - b) * c > px * b ? Math.hypot(px, py - b) : Math.hypot(px + c, py) - inset;
    return d - rim;
  };
}

/** Right-handed orthonormal frame whose local y is `axis`. */
export function frameFromAxis(axis: Vec3) {
  const l = Math.hypot(...axis);
  const y: Vec3 = [axis[0] / l, axis[1] / l, axis[2] / l];
  // Any vector not parallel to y seeds x; world z is safe unless y is nearly vertical-z.
  const seed: Vec3 = Math.abs(y[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  const cross = (a: Vec3, b: Vec3): Vec3 => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const xr = cross(y, seed);
  const xl = Math.hypot(...xr);
  const x: Vec3 = [xr[0] / xl, xr[1] / xl, xr[2] / xl];
  const z = cross(x, y);
  return { x, y, z };
}
