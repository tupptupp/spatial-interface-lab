import { CatmullRomCurve3, Vector3 } from 'three';
import type { MeshData } from './surfaceNets';

export type Vec3 = readonly [number, number, number];
export type PlateSpec = {
  /** Centerline control points (centripetal Catmull-Rom). */
  points: readonly Vec3[];
  /** Reference direction for the plate's thickness axis; must never align with the tangent. */
  up: Vec3;
  /** Full width (across the broad face) as a function of arc parameter t ∈ [0, 1]. */
  width: (t: number) => number;
  /** Full thickness; the long edges are exact semicircles of this diameter. */
  thickness: (t: number) => number;
  /** Rotation of the section around the tangent (radians). */
  twist?: (t: number) => number;
  segments: number;
  /** Samples across each flat face (0 for a round rod) and around each rounded edge. */
  faceSegments?: number;
  edgeSegments?: number;
};

/** Sweep a stadium (flat faces + fully round edges) along a smooth curve.
 * Normals are analytic in the cross-section, so the round edges produce one continuous
 * line highlight, and the broad faces stay optically flat across their width.
 */
export function sweepPlate(spec: PlateSpec): MeshData {
  const { segments, faceSegments = 6, edgeSegments = 12 } = spec;
  if (!Number.isInteger(segments) || segments < 4) throw new RangeError('segments must be ≥ 4');
  const curve = new CatmullRomCurve3(
    spec.points.map((p) => new Vector3(...p)),
    false,
    'centripetal',
  );
  const up = new Vector3(...spec.up).normalize();
  // Section in (side, normal) coordinates, counter-clockwise; one shared ring without seam duplicate.
  const section = (t: number) => {
    const w = spec.width(t),
      d = spec.thickness(t);
    const r = d / 2,
      half = Math.max(0, w / 2 - r);
    const out: [number, number, number, number][] = []; // side, normal, nSide, nNormal
    for (let i = 0; i < faceSegments; i++) {
      const s = half - (2 * half * i) / faceSegments;
      out.push([s, r, 0, 1]);
    }
    for (let i = 0; i < edgeSegments; i++) {
      const a = Math.PI / 2 + (Math.PI * i) / edgeSegments;
      out.push([-half + Math.cos(a) * r, Math.sin(a) * r, Math.cos(a), Math.sin(a)]);
    }
    for (let i = 0; i < faceSegments; i++) {
      const s = -half + (2 * half * i) / faceSegments;
      out.push([s, -r, 0, -1]);
    }
    for (let i = 0; i < edgeSegments; i++) {
      const a = -Math.PI / 2 + (Math.PI * i) / edgeSegments;
      out.push([half + Math.cos(a) * r, Math.sin(a) * r, Math.cos(a), Math.sin(a)]);
    }
    return out;
  };
  const ring = 2 * (faceSegments + edgeSegments);
  const positions: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];
  const tangent = new Vector3(),
    normal = new Vector3(),
    side = new Vector3(),
    point = new Vector3();
  const frames: { p: Vector3; t: Vector3; n: Vector3; s: Vector3 }[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    curve.getPointAt(t, point);
    curve.getTangentAt(t, tangent).normalize();
    normal.copy(up).addScaledVector(tangent, -up.dot(tangent)).normalize();
    side.crossVectors(normal, tangent).normalize();
    const twist = spec.twist?.(t) ?? 0;
    const n = normal.clone().multiplyScalar(Math.cos(twist)).addScaledVector(side, Math.sin(twist));
    const s = side
      .clone()
      .multiplyScalar(Math.cos(twist))
      .addScaledVector(normal, -Math.sin(twist));
    frames.push({ p: point.clone(), t: tangent.clone(), n, s });
    for (const [a, b, na, nb] of section(t)) {
      positions.push(
        point.x + s.x * a + n.x * b,
        point.y + s.y * a + n.y * b,
        point.z + s.z * a + n.z * b,
      );
      normals.push(s.x * na + n.x * nb, s.y * na + n.y * nb, s.z * na + n.z * nb);
    }
  }
  for (let i = 0; i < segments; i++)
    for (let j = 0; j < ring; j++) {
      const a = i * ring + j,
        b = i * ring + ((j + 1) % ring),
        c = a + ring,
        d = b + ring;
      indices.push(a, b, c, b, d, c);
    }
  // Flat end caps with their own vertices (a deliberate hard edge).
  for (const end of [0, segments]) {
    const frame = frames[end]!;
    const sign = end === 0 ? -1 : 1;
    const center = positions.length / 3;
    positions.push(frame.p.x, frame.p.y, frame.p.z);
    normals.push(frame.t.x * sign, frame.t.y * sign, frame.t.z * sign);
    for (let j = 0; j < ring; j++) {
      const source = end * ring + j;
      positions.push(
        positions[source * 3]!,
        positions[source * 3 + 1]!,
        positions[source * 3 + 2]!,
      );
      normals.push(frame.t.x * sign, frame.t.y * sign, frame.t.z * sign);
    }
    for (let j = 0; j < ring; j++) {
      const a = center + 1 + j,
        b = center + 1 + ((j + 1) % ring);
      if (sign > 0) indices.push(center, a, b);
      else indices.push(center, b, a);
    }
  }
  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    indices: new Uint32Array(indices),
  };
}
