import { rot, smax } from '../sdf';
import { SURROUND } from '../rigs';
import { latheField, transformMesh } from '../lathe';
import { thickPlate } from '../plate';
import { surfaceNets } from '../surfaceNets';
import type { ConceptDefinition, Fidelity } from '../types';

/** INTERLOCKED FORMS — three authored bodies, three thicknesses, one assembly.
 * A curved stele (medium shell), a thick biconvex lens threaded through a window in it,
 * and a thin hyperbolic-paraboloid leaf. Every clearance is defined analytically:
 * the slot is the lens field offset by GAP, so the gap is uniform by construction.
 */
export const GAP = 0.05;

/** Extrude a 2D field `d2` to half-thickness `half` with fully rounded edges. */
function roundedExtrusion(d2: number, across: number, half: number) {
  // Erode the outline by the edge radius, then sweep a sphere of that radius: exact round edges.
  const wx = d2 + half,
    wy = Math.abs(across);
  return Math.hypot(Math.max(wx, 0), Math.max(wy, 0)) + Math.min(Math.max(wx, wy), 0) - half;
}

const WALL_R = 2.6;
export function wallShape(x: number, y: number, z: number) {
  const angle = Math.atan2(x, z + WALL_R);
  const s = WALL_R * angle; // Arc length along the shell.
  const radial = Math.hypot(x, z + WALL_R) - WALL_R;
  // Stele outline in (arc length, height): a tall slab whose crown is cut on a rake.
  const qx = Math.abs(s + 0.05) - 1.0,
    qy = Math.abs(y - 1.4) - 1.7;
  const box = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0);
  const crown = (y - (2.72 + 0.4 * s)) * 0.93;
  const outline = smax(box, crown, 0.14);
  // No floor clip: the stele continues below the floor plane, so its contact line is drawn
  // by the depth buffer (exact) rather than by a voxelised crease.
  return roundedExtrusion(outline, radial, 0.07);
}

const LENS_CENTRE = [0.0, 1.42, 0] as const;
const LENS = { radius: 0.84, sag: 0.15 };
const LENS_R = (LENS.radius ** 2 + LENS.sag ** 2) / (2 * LENS.sag);
/** Exact distance to the lens profile in (radius, height): a vesica (intersection of two
 * discs centred on the axis), inset then offset by RIM so the knife edge becomes a true
 * round of radius RIM. Exactness matters: the stele's window is this field offset by GAP,
 * and a non-Euclidean lens field would groove the wall far beyond the lens rim.
 */
const RIM = 0.035;
export function lensProfile(r: number, y: number) {
  const radius = LENS_R - RIM,
    c = LENS_R - LENS.sag;
  const b = Math.sqrt(radius * radius - c * c);
  const px = Math.abs(y),
    py = Math.abs(r);
  const d = (py - b) * c > px * b ? Math.hypot(px, py - b) : Math.hypot(px + c, py) - radius;
  return d - RIM;
}

// The lens axis is tipped 34° about z and turned 18° about y: it crosses the wall obliquely.
const TURN = 0.31,
  TIP = -0.6;
export function lensShape(x: number, y: number, z: number) {
  const [ax, az] = rot(x - LENS_CENTRE[0], z - LENS_CENTRE[2], TURN);
  const [lx, ly] = rot(ax, y - LENS_CENTRE[1], TIP);
  return lensProfile(Math.hypot(lx, az), ly);
}

/** Exact lathe of the lens profile placed with the inverse of lensShape's transform. */
export function lensMesh(fidelity: Fidelity) {
  const n = fidelity === 'high' ? 200 : 110;
  const toWorld = ([lx, ly, lz]: [number, number, number], translate: boolean) => {
    const [ax, y] = rot(lx, ly, -TIP);
    const [x, z] = rot(ax, lz, -TURN);
    return (
      translate ? [x + LENS_CENTRE[0], y + LENS_CENTRE[1], z + LENS_CENTRE[2]] : [x, y, z]
    ) as [number, number, number];
  };
  return transformMesh(
    latheField(lensProfile, { samples: n, segments: n, reach: 1.5 }),
    (p) => toWorld(p, true),
    (d) => toWorld(d, false),
  );
}

export function slottedWall(x: number, y: number, z: number) {
  return smax(wallShape(x, y, z), -(lensShape(x, y, z) - GAP), 0.03);
}

/** The leaf: a hyperbolic-paraboloid plate 48mm-equivalent thick, built analytically and
 * set down so its lowest point rests exactly on the floor. */
export function leafMesh(fidelity: Fidelity) {
  const k = 0.42;
  const local = thickPlate({
    height: (x, z) => k * (x * x - z * z),
    radii: [1.18, 0.62],
    half: 0.024,
    radial: fidelity === 'high' ? 64 : 32,
    around: fidelity === 'high' ? 220 : 120,
  });
  const place = ([lx, ly, lz]: [number, number, number]) => {
    const [px, y] = rot(lx, ly, -0.36);
    const [x, z] = rot(px, lz, 0.5);
    return [x, y, z] as [number, number, number];
  };
  const placed = transformMesh(local, place, place);
  let minY = Infinity;
  for (let i = 1; i < placed.positions.length; i += 3) minY = Math.min(minY, placed.positions[i]!);
  for (let i = 0; i < placed.positions.length; i += 3) {
    placed.positions[i] = placed.positions[i]! - 0.55;
    placed.positions[i + 1] = placed.positions[i + 1]! - minY;
    placed.positions[i + 2] = placed.positions[i + 2]! + 1.05;
  }
  return placed;
}

export const interlocked: ConceptDefinition = {
  id: 'interlocked',
  letter: 'B',
  name: 'Interlocked Forms',
  intention:
    'A curved stele, a heavy lens threaded through a window in it, and a thin saddle leaf. Three thicknesses, uniform machined clearances, one silhouette.',
  centre: [0, 1.2, 0],
  parts: [
    {
      name: 'Stele',
      material: 'chrome',
      build: (f: Fidelity) =>
        surfaceNets(
          slottedWall,
          { min: [-1.16, -0.12, -0.66], max: [1.16, 3.2, 0.25] },
          f === 'high' ? 260 : 140,
        ),
    },
    {
      name: 'Lens',
      material: 'smoked',
      build: lensMesh,
    },
    {
      name: 'Leaf',
      material: 'satin',
      build: leafMesh,
    },
  ],
  views: {
    hero: {
      position: [6.05, 2.1, 6.6],
      target: [-0.98, 1.3, 1.18],
      fov: 27,
      subject: [-0.15, 1.3, 0.35],
    },
    detail: { position: [1.35, 1.85, 1.45], target: [0.35, 1.38, 0.05], fov: 15 },
    spatial: { position: [-3.6, 3.6, -4.2], target: [-0.1, 1.0, 0.2], fov: 36 },
  },
  rig: {
    id: 'interlocked-rig',
    label: 'Layered card rig',
    dome: { top: '#2a2b2e', horizon: '#141415', bottom: '#1e1c1a' },
    cards: [
      ...SURROUND,
      // Placed on the hero reflection path of the stele's broad face: a graded soft card
      // instead of the black gap it would otherwise mirror.
      {
        position: [-2.6, 2.4, 7.4],
        aim: [0, 1.4, 0],
        size: [2.4, 6],
        intensity: 1.5,
        color: '#efe9e0',
        kind: 'soft',
      },
      { position: [-4.5, 4.5, 3], size: [5, 3], intensity: 3.8, color: '#fff2e2', kind: 'soft' },
      { position: [5, 2.5, 3], size: [0.3, 7], intensity: 13.0, color: '#eef3ff', kind: 'strip' },
      { position: [0, 8, -1], size: [6, 2.5], intensity: 2.9, color: '#ffffff', kind: 'soft' },
      { position: [-2, 1.2, -6], size: [8, 0.35], intensity: 7.8, color: '#ffffff', kind: 'strip' },
      { position: [3, 0.4, 6], size: [5, 0.16], intensity: 4.8, color: '#fff3e6', kind: 'strip' },
    ],
    key: { position: [-3.5, 8, 3], intensity: 260, angle: 0.4 },
    exposure: 1,
  },
};
