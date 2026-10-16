import { describe, expect, it } from 'vitest';
import { Vector3 } from 'three';
import { createBlade } from '../src/scene/sculptureGeometry';

describe('original blade geometry', () => {
  it.each(['fold', 'crescent', 'aperture'] as const)(
    '%s is deterministic, finite and bounded',
    (concept) => {
      const a = createBlade(32, 12, concept),
        b = createBlade(32, 12, concept);
      expect(a.getAttribute('position').array).toEqual(b.getAttribute('position').array);
      expect(Array.from(a.getAttribute('position').array).every(Number.isFinite)).toBe(true);
      expect(a.boundingSphere!.radius).toBeLessThan(2.2);
      a.dispose();
      b.dispose();
    },
  );
  it('has valid triangle indices and no zero-area faces', () => {
    const geometry = createBlade(64, 16);
    const positions = geometry.getAttribute('position');
    const indices = geometry.index!;
    for (let i = 0; i < indices.count; i += 3) {
      const ids = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
      ids.forEach((id) => expect(id).toBeLessThan(positions.count));
      const [a, b, c] = ids.map((id) => new Vector3().fromBufferAttribute(positions, id));
      expect(b!.sub(a!).cross(c!.sub(a!)).length()).toBeGreaterThan(1e-8);
    }
    geometry.dispose();
  });
  it('matches seam normals and keeps them normalized', () => {
    const geometry = createBlade(32, 12);
    const normals = geometry.getAttribute('normal');
    for (let i = 0; i <= 32; i++) {
      const first = new Vector3().fromBufferAttribute(normals, i * 13),
        last = new Vector3().fromBufferAttribute(normals, i * 13 + 12);
      expect(first.distanceTo(last)).toBeLessThan(1e-6);
    }
    for (let i = 0; i < normals.count; i++)
      expect(new Vector3().fromBufferAttribute(normals, i).length()).toBeCloseTo(1, 5);
    geometry.dispose();
  });
  it('is topologically closed when coincident seam vertices are welded', () => {
    const geometry = createBlade(16, 8);
    const position = geometry.getAttribute('position');
    const key = (i: number) =>
      [position.getX(i), position.getY(i), position.getZ(i)]
        .map((v) => v.toFixed(5).replace('-0.00000', '0.00000'))
        .join(',');
    const edges = new Map<string, number>();
    const index = geometry.index!;
    for (let i = 0; i < index.count; i += 3) {
      const ids = [key(index.getX(i)), key(index.getX(i + 1)), key(index.getX(i + 2))];
      for (let j = 0; j < 3; j++) {
        const edge = [ids[j]!, ids[(j + 1) % 3]!].sort().join('|');
        edges.set(edge, (edges.get(edge) ?? 0) + 1);
      }
    }
    expect([...edges.values()].every((count) => count === 2)).toBe(true);
    geometry.dispose();
  });
  it('rejects invalid topology resolutions', () => {
    expect(() => createBlade(0)).toThrow(RangeError);
    expect(() => createBlade(10, 3)).toThrow(RangeError);
    expect(() => createBlade(10.5)).toThrow(RangeError);
  });
});
