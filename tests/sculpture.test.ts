import { describe, expect, it } from 'vitest';
import { smin, smax, torus, ellipsoid } from '../src/sculpture/sdf';
import { surfaceNets } from '../src/sculpture/surfaceNets';
import type { MeshData } from '../src/sculpture/surfaceNets';
import { sweepPlate } from '../src/sculpture/sweep';
import { frameView, REFERENCE_ASPECT } from '../src/sculpture/framing';
import { cyclorama } from '../src/sculpture/cyclorama';
import { CONCEPTS, conceptById } from '../src/sculpture/concepts';
import { GAP, lensMesh, slottedWall } from '../src/sculpture/concepts/interlocked';
import { latheField } from '../src/sculpture/lathe';
import {
  GROUND_LINE,
  REFINED_GAP,
  notchedStele,
  refined,
  refinedLeafMesh,
  refinedLensMesh,
} from '../src/sculpture/concepts/refined';
import { frameFromAxis } from '../src/sculpture/shapes';
import { thickPlate } from '../src/sculpture/plate';
import { readExploreState, writeExploreState } from '../src/explore/state';

/** Shared mesh invariants: finite data, valid indices, unit normals, no degenerate
 * triangles, and winding that agrees with the shading normal (outward faces). */
function expectSoundMesh(mesh: MeshData, { minAgreement = 0.995 } = {}) {
  const { positions, normals, indices } = mesh;
  const count = positions.length / 3;
  expect(count).toBeGreaterThan(0);
  expect(indices.length % 3).toBe(0);
  expect(positions.every(Number.isFinite)).toBe(true);
  for (let v = 0; v < count; v++)
    expect(Math.hypot(normals[v * 3]!, normals[v * 3 + 1]!, normals[v * 3 + 2]!)).toBeCloseTo(1, 4);
  let agree = 0;
  for (let i = 0; i < indices.length; i += 3) {
    const [a, b, c] = [indices[i]!, indices[i + 1]!, indices[i + 2]!];
    [a, b, c].forEach((id) => expect(id).toBeLessThan(count));
    const p = (id: number, k: number) => positions[id * 3 + k]!;
    const u = [0, 1, 2].map((k) => p(b, k) - p(a, k));
    const w = [0, 1, 2].map((k) => p(c, k) - p(a, k));
    const f = [
      u[1]! * w[2]! - u[2]! * w[1]!,
      u[2]! * w[0]! - u[0]! * w[2]!,
      u[0]! * w[1]! - u[1]! * w[0]!,
    ];
    expect(Math.hypot(...f)).toBeGreaterThan(1e-12);
    let dot = 0;
    for (const id of [a, b, c]) for (let k = 0; k < 3; k++) dot += f[k]! * normals[id * 3 + k]!;
    if (dot > 0) agree++;
  }
  expect(agree / (indices.length / 3)).toBeGreaterThanOrEqual(minAgreement);
}

/** Every undirected edge shared by exactly two triangles, in opposite directions. */
function expectClosedManifold(mesh: MeshData) {
  const edges = new Map<string, number>();
  for (let i = 0; i < mesh.indices.length; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = mesh.indices[i + j]!,
        b = mesh.indices[i + ((j + 1) % 3)]!;
      const key = `${a}>${b}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  for (const [key, n] of edges) {
    const [a, b] = key.split('>');
    expect(n).toBe(1);
    expect(edges.get(`${b}>${a}`)).toBe(1);
  }
}

/** Number of connected triangle islands (union-find over shared vertices). */
function components(mesh: MeshData) {
  const parent = Int32Array.from({ length: mesh.positions.length / 3 }, (_, i) => i);
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i]!)));
  for (let i = 0; i < mesh.indices.length; i += 3)
    for (let j = 1; j < 3; j++) parent[find(mesh.indices[i]!)] = find(mesh.indices[i + j]!);
  return new Set(Array.from(mesh.indices, (i) => find(i))).size;
}

describe('SDF operators', () => {
  it('smooth min/max bound and approach the hard operators', () => {
    expect(smin(1, 2, 0.1)).toBeLessThanOrEqual(1);
    expect(smin(1, 5, 0.1)).toBeCloseTo(1, 6);
    expect(smax(1, 5, 0.1)).toBeCloseTo(5, 6);
    expect(smin(-3, 3, 0.2)).toBeCloseTo(-3, 6);
  });
  it('torus and ellipsoid have exact zero sets on known points', () => {
    expect(torus(1.3, 0, 0, 1, 0.3)).toBeCloseTo(0, 9);
    expect(ellipsoid(0, 2, 0, 1, 2, 3)).toBeCloseTo(0, 9);
    expect(ellipsoid(0, 0, 0, 1, 2, 3)).toBeLessThan(0);
  });
});

describe('surface nets mesher', () => {
  const sphere = (x: number, y: number, z: number) => Math.hypot(x, y, z) - 1;
  const bounds = { min: [-1.2, -1.2, -1.2], max: [1.2, 1.2, 1.2] } as const;
  it('projects every vertex onto the analytic surface with analytic normals', () => {
    const mesh = surfaceNets(sphere, bounds, 24);
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const p = [0, 1, 2].map((k) => mesh.positions[v * 3 + k]!);
      expect(Math.abs(Math.hypot(...p) - 1)).toBeLessThan(1e-4);
      for (let k = 0; k < 3; k++) expect(mesh.normals[v * 3 + k]!).toBeCloseTo(p[k]!, 3);
    }
    expectSoundMesh(mesh, { minAgreement: 1 });
    expectClosedManifold(mesh);
  });
  it('is deterministic and rejects invalid resolutions', () => {
    expect(surfaceNets(sphere, bounds, 12).positions).toEqual(
      surfaceNets(sphere, bounds, 12).positions,
    );
    expect(() => surfaceNets(sphere, bounds, 4)).toThrow(RangeError);
    expect(() => surfaceNets(sphere, bounds, 12.5)).toThrow(RangeError);
  });
});

describe('plate sweep', () => {
  const spec = {
    points: [
      [0, 0, 0],
      [1, 1, 0],
      [2, 1.2, 0],
    ] as const,
    up: [0, 0, 1] as const,
    width: () => 0.4,
    thickness: () => 0.04,
    segments: 32,
  };
  it('is closed, outward-facing and keeps the authored thickness', () => {
    const mesh = sweepPlate(spec);
    expectSoundMesh(mesh, { minAgreement: 1 });
    let maxZ = 0;
    for (let v = 0; v < mesh.positions.length / 3; v++)
      maxZ = Math.max(maxZ, Math.abs(mesh.positions[v * 3 + 2]!));
    expect(maxZ).toBeCloseTo(0.02, 4);
  });
  it('rejects too few segments', () => {
    expect(() => sweepPlate({ ...spec, segments: 2 })).toThrow(RangeError);
  });
});

describe('sculpture concepts', () => {
  it('defines the three concepts plus the refined B, each with three distinct camera presets', () => {
    // B′ (refined Concept B) was added in phase 02; A, B and C stay for comparison.
    expect(CONCEPTS.map((c) => c.letter)).toEqual(['A', 'B', 'B′', 'C']);
    for (const concept of CONCEPTS) {
      const { hero, detail, spatial } = concept.views;
      const views = [hero, detail, spatial];
      expect(new Set(views.map((v) => v.fov)).size).toBe(3);
      for (const view of views) {
        expect(view.fov).toBeGreaterThanOrEqual(12);
        expect(view.fov).toBeLessThanOrEqual(45);
        expect(view.position[1]).toBeGreaterThan(0); // Never below the floor.
      }
    }
    expect(conceptById('tension').letter).toBe('C');
  });
  it.each(CONCEPTS.map((c) => [c.name, c] as const))(
    '%s builds sound, grounded geometry',
    (_, concept) => {
      for (const part of concept.parts) {
        const mesh = part.build('balanced');
        expectSoundMesh(mesh);
        let minY = Infinity;
        for (let v = 0; v < mesh.positions.length / 3; v++)
          minY = Math.min(minY, mesh.positions[v * 3 + 1]!);
        // Footings may continue below the floor plane (clean depth-buffer contact line),
        // but nothing is buried deeply and every part reaches the floor or sits above it.
        expect(minY).toBeGreaterThan(-0.2);
      }
    },
  );
  it('keeps the authored machined clearance between the lens and its slot', () => {
    let closest = Infinity;
    const mesh = lensMesh('balanced');
    for (let v = 0; v < mesh.positions.length / 3; v++) {
      const [x, y, z] = [0, 1, 2].map((k) => mesh.positions[v * 3 + k]!) as [
        number,
        number,
        number,
      ];
      closest = Math.min(closest, slottedWall(x, y, z));
    }
    // The slot fillet may tighten the authored gap slightly, never close it.
    expect(closest).toBeGreaterThan(GAP * 0.6);
  });
});

describe('structural integrity', () => {
  it('uses an exact (1-Lipschitz, Euclidean) lens distance so the window cannot groove the wall', async () => {
    const { lensProfile } = await import('../src/sculpture/concepts/interlocked');
    // Far outside the rim, in the lens plane, the field must equal the distance to the rim.
    const rim = Math.max(
      ...Array.from({ length: 2000 }, (_, i) => i / 1000).filter((r) => lensProfile(r, 0) <= 0),
    );
    expect(lensProfile(rim + 0.5, 0)).toBeCloseTo(0.5, 2);
    for (let i = 0; i < 200; i++) {
      const r = (i * 0.37) % 2,
        y = ((i * 0.53) % 1) - 0.5,
        e = 1e-4;
      const g =
        Math.hypot(
          lensProfile(r + e, y) - lensProfile(r - e, y),
          lensProfile(r, y + e) - lensProfile(r, y - e),
        ) /
        (2 * e);
      expect(g).toBeLessThan(1.0001);
    }
  });
  it('keeps the slotted stele and the monolith as single connected bodies', () => {
    for (const concept of [conceptById('interlocked'), conceptById('monolith')]) {
      const part = concept.parts[0]!;
      expect(components(part.build('balanced')), `${concept.name}: ${part.name}`).toBe(1);
    }
  });
});

describe('refined Concept B (B′)', () => {
  const each = (mesh: MeshData, fn: (x: number, y: number, z: number) => void) => {
    for (let v = 0; v < mesh.positions.length / 3; v++)
      fn(mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!);
  };
  it('keeps the disc clear of its slot by the authored gap', () => {
    let closest = Infinity;
    each(
      refinedLensMesh('balanced'),
      (x, y, z) => (closest = Math.min(closest, notchedStele(x, y, z))),
    );
    // The 0.06 slot fillet may tighten the clearance slightly; it must never close it.
    expect(closest).toBeGreaterThan(REFINED_GAP * 0.6);
  });
  it('keeps the slotted stele one connected body and the disc above the floor', () => {
    expect(components(refined.parts[0]!.build('balanced'))).toBe(1);
    let lowest = Infinity;
    each(refinedLensMesh('balanced'), (_x, y) => (lowest = Math.min(lowest, y)));
    expect(lowest).toBeGreaterThan(1);
  });
  it('lays the ground line flat on the floor, well clear of the stele', () => {
    const blade = refinedLeafMesh('balanced');
    let low = Infinity,
      high = -Infinity,
      clearance = Infinity;
    each(blade, (x, y, z) => {
      low = Math.min(low, y);
      high = Math.max(high, y);
      clearance = Math.min(clearance, notchedStele(x, y, z));
    });
    expect(low).toBeCloseTo(0, 6);
    expect(high).toBeCloseTo(GROUND_LINE.thickness, 6);
    expect(clearance).toBeGreaterThan(0.2);
  });
  it('defines an alternative hero and builds an orthonormal disc frame', () => {
    expect(refined.views.alt).toBeDefined();
    const { x, y, z } = frameFromAxis([1, 0.08, 0.14]);
    const d = (a: readonly number[], b: readonly number[]) =>
      a[0]! * b[0]! + a[1]! * b[1]! + a[2]! * b[2]!;
    for (const [a, b] of [
      [x, y],
      [y, z],
      [z, x],
    ] as const)
      expect(d(a, b)).toBeCloseTo(0, 9);
    for (const v of [x, y, z]) expect(d(v, v)).toBeCloseTo(1, 9);
  });
});

describe('thick plate', () => {
  it('keeps exact thickness, an outward winding and a closed shell', () => {
    const mesh = thickPlate({
      height: (x, z) => 0.3 * (x * x - z * z),
      radii: [1, 0.6],
      half: 0.02,
      radial: 12,
      around: 32,
    });
    expectSoundMesh(mesh, { minAgreement: 1 });
    expect(components(mesh)).toBe(1);
  });
});

describe('lathe', () => {
  it('revolves an exact, outward-facing profile', () => {
    const mesh = latheField((r, y) => Math.hypot(r, y) - 1, { samples: 32, segments: 24 });
    expectSoundMesh(mesh, { minAgreement: 1 });
    for (let v = 0; v < mesh.positions.length / 3; v++)
      expect(
        Math.hypot(mesh.positions[v * 3]!, mesh.positions[v * 3 + 1]!, mesh.positions[v * 3 + 2]!),
      ).toBeCloseTo(1, 6);
  });
});

describe('framing and studio', () => {
  const preset = { position: [0, 1, 8] as const, target: [0, 1, 0] as const, fov: 27 };
  it('keeps authored frames at the reference aspect and dollies back for portrait', () => {
    expect(frameView(preset, REFERENCE_ASPECT)).toEqual(preset);
    const portrait = frameView(preset, 390 / 844);
    expect(portrait.fov).toBe(27);
    expect(portrait.position[2]).toBeGreaterThan(8);
    expect(portrait.target).toEqual(preset.target);
    expect(frameView(preset, Number.NaN)).toEqual(preset);
  });
  it('re-centres an off-centre composition on the subject for portrait screens', () => {
    const thirds = { ...preset, target: [-1, 1, 0] as const, subject: [0, 1.4, 0] as const };
    expect(frameView(thirds, 1.8).target).toEqual(thirds.target);
    const portrait = frameView(thirds, 0.5);
    expect(portrait.target[0]).toBeCloseTo(0, 9);
    expect(portrait.target[1]).toBe(1); // Height and tilt are preserved.
    // Same viewing direction, just further back: (camera − target) stays parallel.
    const dx = portrait.position[0] - portrait.target[0],
      dz = portrait.position[2] - portrait.target[2];
    expect(dx / dz).toBeCloseTo((0 - -1) / 8, 9);
  });
  it('builds a seamless cyclorama with upward floor normals', () => {
    const cove = cyclorama();
    expectSoundMesh(cove, { minAgreement: 1 });
    expect(cove.normals[1]).toBe(1);
  });
});

describe('explore URL state', () => {
  it('round-trips and rejects unknown values', () => {
    const state = readExploreState(
      '?concept=tension&view=detail&rig=baseline&fidelity=balanced&ui=0',
    );
    expect(state).toEqual({
      concept: 'tension',
      view: 'detail',
      rig: 'baseline',
      fidelity: 'balanced',
      ui: false,
      env: false,
    });
    expect(readExploreState(writeExploreState(state))).toEqual(state);
    expect(readExploreState('?concept=torus&view=top').concept).toBe('monolith');
    expect(readExploreState('?view=top').view).toBe('hero');
  });
});
