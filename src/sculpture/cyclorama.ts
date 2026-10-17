import type { MeshData } from './surfaceNets';

/** A photographic infinity cove: floor, a radiused cove and a back wall, extruded along x.
 * The cove removes the visible floor/wall seam so the backdrop reads as continuous depth.
 */
export function cyclorama({
  width = 60,
  depth = 30,
  wallZ = -7,
  cove = 3.5,
  height = 16,
  arcSegments = 24,
  widthSegments = 2,
} = {}): MeshData {
  const profile: [number, number, number, number][] = []; // z, y, normal z, normal y
  profile.push([depth, 0, 0, 1], [wallZ + cove, 0, 0, 1]);
  for (let i = 1; i < arcSegments; i++) {
    const a = (Math.PI / 2) * (i / arcSegments);
    profile.push([
      wallZ + cove - Math.sin(a) * cove,
      cove - Math.cos(a) * cove,
      Math.sin(a),
      Math.cos(a),
    ]);
  }
  profile.push([wallZ, cove, 1, 0], [wallZ, height, 1, 0]);
  const positions: number[] = [],
    normals: number[] = [],
    indices: number[] = [];
  for (let i = 0; i <= widthSegments; i++) {
    const x = -width / 2 + (width * i) / widthSegments;
    for (const [z, y, nz, ny] of profile) {
      positions.push(x, y, z);
      normals.push(0, ny, nz);
    }
  }
  const n = profile.length;
  for (let i = 0; i < widthSegments; i++)
    for (let j = 0; j < n - 1; j++) {
      const a = i * n + j,
        b = a + 1,
        c = a + n,
        d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}
