import type { SDF } from './sdf';
import { gradient } from './sdf';

export type Bounds = {
  min: readonly [number, number, number];
  max: readonly [number, number, number];
};
export type MeshData = { positions: Float32Array; normals: Float32Array; indices: Uint32Array };

/** Polygonize the zero set of an SDF with naive surface nets, then refine.
 *
 * 1. Sample the field on a regular lattice (cell size = longest extent / resolution).
 * 2. One vertex per sign-changing cell, at the mean of its edge crossings.
 * 3. One quad per sign-changing lattice edge, split along the shorter diagonal.
 * 4. Each vertex is Newton-projected onto the true zero set, and its normal is the
 *    normalized field gradient there. Shading therefore follows the analytic surface,
 *    not the lattice: chrome highlights stay continuous at modest resolution.
 * 5. Winding follows the field sign along each lattice edge, so faces point outward and
 *    every interior edge is shared by exactly two opposed triangles.
 */
export function surfaceNets(sdf: SDF, bounds: Bounds, resolution: number): MeshData {
  if (!Number.isInteger(resolution) || resolution < 8)
    throw new RangeError('Resolution must be an integer ≥ 8');
  const extent = [0, 1, 2].map((a) => bounds.max[a]! - bounds.min[a]!);
  const h = Math.max(...extent) / resolution;
  const origin = bounds.min.map((v) => v - h) as [number, number, number];
  const [nx, ny, nz] = extent.map((e) => Math.ceil(e / h) + 3) as [number, number, number];
  const field = new Float32Array(nx * ny * nz);
  const at = (i: number, j: number, k: number) => i + nx * (j + ny * k);
  for (let k = 0; k < nz; k++)
    for (let j = 0; j < ny; j++)
      for (let i = 0; i < nx; i++)
        field[at(i, j, k)] = sdf(origin[0] + i * h, origin[1] + j * h, origin[2] + k * h);

  const cellVertex = new Int32Array((nx - 1) * (ny - 1) * (nz - 1)).fill(-1);
  const cell = (i: number, j: number, k: number) => i + (nx - 1) * (j + (ny - 1) * k);
  const positions: number[] = [];
  const corners = [
    [0, 0, 0],
    [1, 0, 0],
    [0, 1, 0],
    [1, 1, 0],
    [0, 0, 1],
    [1, 0, 1],
    [0, 1, 1],
    [1, 1, 1],
  ] as const;
  const edges = [
    [0, 1],
    [2, 3],
    [4, 5],
    [6, 7],
    [0, 2],
    [1, 3],
    [4, 6],
    [5, 7],
    [0, 4],
    [1, 5],
    [2, 6],
    [3, 7],
  ] as const;
  const values = new Float64Array(8);
  for (let k = 0; k < nz - 1; k++)
    for (let j = 0; j < ny - 1; j++)
      for (let i = 0; i < nx - 1; i++) {
        let mask = 0;
        for (let c = 0; c < 8; c++) {
          const [di, dj, dk] = corners[c]!;
          values[c] = field[at(i + di, j + dj, k + dk)]!;
          if (values[c]! < 0) mask |= 1 << c;
        }
        if (mask === 0 || mask === 255) continue;
        let sx = 0,
          sy = 0,
          sz = 0,
          n = 0;
        for (const [a, b] of edges) {
          const va = values[a]!,
            vb = values[b]!;
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          const ca = corners[a]!,
            cb = corners[b]!;
          sx += ca[0] + (cb[0] - ca[0]) * t;
          sy += ca[1] + (cb[1] - ca[1]) * t;
          sz += ca[2] + (cb[2] - ca[2]) * t;
          n++;
        }
        cellVertex[cell(i, j, k)] = positions.length / 3;
        positions.push(
          origin[0] + (i + sx / n) * h,
          origin[1] + (j + sy / n) * h,
          origin[2] + (k + sz / n) * h,
        );
      }

  // Project onto the zero set and take analytic normals.
  const count = positions.length / 3;
  const normals = new Float32Array(count * 3);
  const e = h * 0.05;
  for (let v = 0; v < count; v++) {
    let x = positions[v * 3]!,
      y = positions[v * 3 + 1]!,
      z = positions[v * 3 + 2]!;
    for (let iteration = 0; iteration < 4; iteration++) {
      const d = sdf(x, y, z);
      const g = gradient(sdf, x, y, z, e).map((c) => c / (2 * e));
      const g2 = g[0]! ** 2 + g[1]! ** 2 + g[2]! ** 2;
      if (g2 < 1e-12) break;
      // Bound each step to the cell size so a poor gradient cannot throw a vertex away.
      const step = Math.max(-h, Math.min(h, d)) / g2;
      x -= g[0]! * step;
      y -= g[1]! * step;
      z -= g[2]! * step;
      if (Math.abs(d) < 1e-6) break;
    }
    positions[v * 3] = x;
    positions[v * 3 + 1] = y;
    positions[v * 3 + 2] = z;
    const g = gradient(sdf, x, y, z, e);
    const length = Math.hypot(...g) || 1;
    normals[v * 3] = g[0] / length;
    normals[v * 3 + 1] = g[1] / length;
    normals[v * 3 + 2] = g[2] / length;
  }

  const indices: number[] = [];
  const P = (index: number, axis: number) => positions[index * 3 + axis]!;
  const distance2 = (a: number, b: number) =>
    (P(a, 0) - P(b, 0)) ** 2 + (P(a, 1) - P(b, 1)) ** 2 + (P(a, 2) - P(b, 2)) ** 2;
  // Projection can collapse neighbouring lattice vertices onto one surface point. Weld them
  // so the collapse is a clean edge collapse, then drop the zero-area faces it produces.
  const weld = new Int32Array(count);
  const seen = new Map<string, number>();
  for (let v = 0; v < count; v++) {
    const key = `${Math.round(P(v, 0) * 1e6)},${Math.round(P(v, 1) * 1e6)},${Math.round(P(v, 2) * 1e6)}`;
    const existing = seen.get(key);
    weld[v] = existing ?? v;
    if (existing === undefined) seen.set(key, v);
  }
  const triangle = (a: number, b: number, c: number) => {
    a = weld[a]!;
    b = weld[b]!;
    c = weld[c]!;
    if (a === b || b === c || a === c) return;
    indices.push(a, b, c);
  };
  // a-b-c-d circles the lattice edge counter-clockwise about +axis. The face normal must
  // point from inside to outside, so reverse the ring when the edge's far end is inside.
  const quad = (a: number, b: number, c: number, d: number, flip: boolean) => {
    if (a < 0 || b < 0 || c < 0 || d < 0) return;
    if (flip) [b, d] = [d, b];
    if (distance2(a, c) <= distance2(b, d)) {
      triangle(a, b, c);
      triangle(a, c, d);
    } else {
      triangle(a, b, d);
      triangle(b, c, d);
    }
  };
  for (let k = 1; k < nz - 1; k++)
    for (let j = 1; j < ny - 1; j++)
      for (let i = 1; i < nx - 1; i++) {
        const inside = field[at(i, j, k)]! < 0;
        if (inside !== field[at(i + 1, j, k)]! < 0)
          quad(
            cellVertex[cell(i, j - 1, k - 1)]!,
            cellVertex[cell(i, j, k - 1)]!,
            cellVertex[cell(i, j, k)]!,
            cellVertex[cell(i, j - 1, k)]!,
            !inside,
          );
        if (inside !== field[at(i, j + 1, k)]! < 0)
          quad(
            cellVertex[cell(i - 1, j, k - 1)]!,
            cellVertex[cell(i - 1, j, k)]!,
            cellVertex[cell(i, j, k)]!,
            cellVertex[cell(i, j, k - 1)]!,
            !inside,
          );
        if (inside !== field[at(i, j, k + 1)]! < 0)
          quad(
            cellVertex[cell(i - 1, j - 1, k)]!,
            cellVertex[cell(i, j - 1, k)]!,
            cellVertex[cell(i, j, k)]!,
            cellVertex[cell(i - 1, j, k)]!,
            !inside,
          );
      }
  // Compact away vertices that welding left unreferenced.
  const remap = new Int32Array(count).fill(-1);
  let used = 0;
  for (const index of indices) if (remap[index] === -1) remap[index] = used++;
  const outPositions = new Float32Array(used * 3),
    outNormals = new Float32Array(used * 3);
  for (let v = 0; v < count; v++) {
    const r = remap[v]!;
    if (r < 0) continue;
    for (let k = 0; k < 3; k++) {
      outPositions[r * 3 + k] = positions[v * 3 + k]!;
      outNormals[r * 3 + k] = normals[v * 3 + k]!;
    }
  }
  return {
    positions: outPositions,
    normals: outNormals,
    indices: Uint32Array.from(indices, (index) => remap[index]!),
  };
}
