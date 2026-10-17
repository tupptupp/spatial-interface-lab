import type { MeshData } from './surfaceNets';

type V3 = [number, number, number];

export type ThickPlateSpec = {
  /** Mid-surface as a height field over the local XZ plane: y = height(x, z). */
  height: (x: number, z: number) => number;
  /** Elliptical outline radii in local x and z. */
  radii: readonly [number, number];
  /** Half thickness; the rim is an exact half-round of this radius. */
  half: number;
  radial?: number;
  around?: number;
  rim?: number;
};

const normalize = (v: V3): V3 => {
  const l = Math.hypot(...v) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
};

/** A thin plate built analytically: the mid-surface offset by ±half along its normal, joined
 * by a half-round rim swept around the elliptical outline. Unlike a voxelised plate, the
 * faces, rim and silhouette stay exact however thin the plate is.
 */
export function thickPlate(spec: ThickPlateSpec): MeshData {
  const { height, radii, half, radial = 48, around = 160, rim = 14 } = spec;
  const e = 1e-5;
  const frame = (rho: number, phi: number) => {
    const x = radii[0] * rho * Math.cos(phi),
      z = radii[1] * rho * Math.sin(phi);
    const p: V3 = [x, height(x, z), z];
    const fx = (height(x + e, z) - height(x - e, z)) / (2 * e),
      fz = (height(x, z + e) - height(x, z - e)) / (2 * e);
    const n = normalize([-fx, 1, -fz]);
    // Outward direction of the outline, projected into the tangent plane.
    const d: V3 = [Math.cos(phi) / radii[0], 0, Math.sin(phi) / radii[1]];
    const dn = d[0] * n[0] + d[2] * n[2];
    const b = normalize([d[0] - dn * n[0], -dn * n[1], d[2] - dn * n[2]]);
    return { p, n, b };
  };
  // Profile from the bottom pole, out along the underside, round the rim, back over the top.
  const profile: { rho: number; theta: number | null; side: -1 | 1 }[] = [];
  for (let i = 0; i <= radial; i++) profile.push({ rho: i / radial, theta: null, side: -1 });
  for (let i = 1; i < rim; i++)
    profile.push({ rho: 1, theta: -Math.PI / 2 + (Math.PI * i) / rim, side: 1 });
  for (let i = radial; i >= 0; i--) profile.push({ rho: i / radial, theta: null, side: 1 });
  const positions: number[] = [],
    normals: number[] = [],
    indices: number[] = [];
  for (const { rho, theta, side } of profile)
    for (let j = 0; j < around; j++) {
      const { p, n, b } = frame(rho, (j / around) * Math.PI * 2);
      const normal: V3 =
        theta === null
          ? [n[0] * side, n[1] * side, n[2] * side]
          : [
              n[0] * Math.sin(theta) + b[0] * Math.cos(theta),
              n[1] * Math.sin(theta) + b[1] * Math.cos(theta),
              n[2] * Math.sin(theta) + b[2] * Math.cos(theta),
            ];
      positions.push(p[0] + normal[0] * half, p[1] + normal[1] * half, p[2] + normal[2] * half);
      normals.push(...normal);
    }
  const rows = profile.length;
  for (let i = 0; i < rows - 1; i++)
    for (let j = 0; j < around; j++) {
      const a = i * around + j,
        b = i * around + ((j + 1) % around),
        c = a + around,
        d = b + around;
      if (i > 0) indices.push(a, c, b);
      if (i < rows - 2) indices.push(b, c, d);
    }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}
