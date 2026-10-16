import { BufferGeometry, Float32BufferAttribute, Vector3 } from 'three';

export type Concept = 'fold' | 'crescent' | 'aperture';

/** A closed, flattened elliptical tube swept around an asymmetric open arc.
 * Parallel radial/vertical frames avoid Frenet-frame flipping. Caps close the two ends.
 * Coordinates are deterministic; this is original geometry, not a TorusKnot primitive.
 */
export function createBlade(segments = 160, sides = 24, concept: Concept = 'fold'): BufferGeometry {
  if (!Number.isInteger(segments) || segments < 8 || !Number.isInteger(sides) || sides < 8)
    throw new RangeError('Geometry resolution must be integers ≥ 8');
  const positions: number[] = [];
  const indices: number[] = [];
  const start = -Math.PI * 0.72;
  const length = Math.PI * (concept === 'crescent' ? 1.4 : 1.66);
  for (let i = 0; i <= segments; i++) {
    const u = i / segments;
    const angle = start + length * u;
    const radius = 1.28 + 0.16 * Math.sin(angle * 2 + 0.5);
    const lift =
      concept === 'fold' ? Math.sin(u * Math.PI * 2) * 0.6 : 0.34 * Math.sin(angle * 1.6);
    const taper = 0.22 + 0.78 * Math.pow(Math.sin(Math.PI * u), 0.45);
    const twist = angle * 0.42 + 0.35;
    for (let j = 0; j <= sides; j++) {
      const v = (j / sides) * Math.PI * 2;
      const wide = Math.cos(v) * 0.43 * taper;
      const thin = Math.sin(v) * 0.15 * taper;
      const radial = wide * Math.cos(twist) - thin * Math.sin(twist);
      const vertical = wide * Math.sin(twist) + thin * Math.cos(twist);
      positions.push(
        (radius + radial) * Math.cos(angle),
        lift + vertical,
        (radius + radial) * Math.sin(angle),
      );
      if (i < segments && j < sides) {
        const a = i * (sides + 1) + j;
        const b = a + sides + 1;
        indices.push(a, a + 1, b, a + 1, b + 1, b);
      }
    }
  }
  for (const end of [0, segments]) {
    const offset = end * (sides + 1);
    const center = new Vector3();
    for (let j = 0; j < sides; j++)
      center.add(new Vector3().fromArray(positions, (offset + j) * 3));
    center.divideScalar(sides);
    const c = positions.length / 3;
    positions.push(...center.toArray());
    for (let j = 0; j < sides; j++) {
      if (end === 0) indices.push(c, offset + j + 1, offset + j);
      else indices.push(c, offset + j, offset + j + 1);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  // Match duplicated radial seams exactly, preventing a visible lighting seam.
  const normals = geometry.getAttribute('normal');
  for (let i = 0; i <= segments; i++) {
    const a = i * (sides + 1);
    const b = a + sides;
    const normal = new Vector3()
      .fromBufferAttribute(normals, a)
      .add(new Vector3().fromBufferAttribute(normals, b))
      .normalize();
    normals.setXYZ(a, normal.x, normal.y, normal.z);
    normals.setXYZ(b, normal.x, normal.y, normal.z);
  }
  geometry.computeBoundingSphere();
  return geometry;
}
