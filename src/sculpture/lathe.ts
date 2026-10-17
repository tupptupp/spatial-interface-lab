import type { MeshData } from './surfaceNets';

/** Revolve the boundary of an axisymmetric 2D field f(r, y) about the y axis.
 * The boundary is found by bisection along rays from the profile origin (the shape must
 * be star-shaped about it), with samples concentrated near y = 0 where thin rims live.
 * Normals come from the 2D field gradient, so rims stay exact at any tessellation.
 */
export function latheField(
  field: (r: number, y: number) => number,
  { samples = 160, segments = 160, reach = 4, focus = 1.7 } = {},
): MeshData {
  if (samples < 8 || segments < 8) throw new RangeError('Lathe resolution must be ≥ 8');
  const profile: [number, number, number, number][] = []; // r, y, nr, ny
  for (let i = 0; i <= samples; i++) {
    const u = (i / samples) * 2 - 1;
    const angle = (Math.PI / 2) * Math.sign(u) * Math.pow(Math.abs(u), focus);
    const dr = Math.cos(angle),
      dy = Math.sin(angle);
    let lo = 0,
      hi = reach;
    for (let k = 0; k < 48; k++) {
      const mid = (lo + hi) / 2;
      if (field(dr * mid, dy * mid) < 0) lo = mid;
      else hi = mid;
    }
    const r = Math.abs(i === 0 || i === samples ? 0 : dr * lo),
      y = dy * lo;
    const e = 1e-5;
    let nr = field(r + e, y) - field(Math.abs(r - e), y),
      ny = field(r, y + e) - field(r, y - e);
    if (i === 0 || i === samples) nr = 0;
    const length = Math.hypot(nr, ny) || 1;
    nr /= length;
    ny /= length;
    profile.push([r, y, nr, ny]);
  }
  const positions: number[] = [],
    normals: number[] = [],
    indices: number[] = [];
  const ring = segments;
  for (const [r, y, nr, ny] of profile)
    for (let j = 0; j < ring; j++) {
      const phi = (j / ring) * Math.PI * 2;
      positions.push(r * Math.cos(phi), y, r * Math.sin(phi));
      normals.push(nr * Math.cos(phi), ny, nr * Math.sin(phi));
    }
  for (let i = 0; i < samples; i++)
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j,
        b = i * ring + ((j + 1) % ring),
        c = a + ring,
        d = b + ring;
      // Pole rows collapse to a point: emit only the non-degenerate triangle there.
      if (i > 0) indices.push(a, c, b);
      if (i < samples - 1) indices.push(b, c, d);
    }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}

/** Apply a rigid transform, given as a function on points and directions, to mesh data. */
export function transformMesh(
  mesh: MeshData,
  point: (p: [number, number, number]) => [number, number, number],
  direction: (d: [number, number, number]) => [number, number, number],
): MeshData {
  const positions = new Float32Array(mesh.positions.length),
    normals = new Float32Array(mesh.normals.length);
  for (let i = 0; i < mesh.positions.length; i += 3) {
    positions.set(point([mesh.positions[i]!, mesh.positions[i + 1]!, mesh.positions[i + 2]!]), i);
    normals.set(direction([mesh.normals[i]!, mesh.normals[i + 1]!, mesh.normals[i + 2]!]), i);
  }
  return { positions, normals, indices: mesh.indices };
}
