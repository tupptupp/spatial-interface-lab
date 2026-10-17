import { smax } from '../sdf';
import { SURROUND } from '../rigs';
import { latheField, transformMesh } from '../lathe';
import { frameFromAxis, roundedExtrusion, vesicaLens } from '../shapes';
import { surfaceNets } from '../surfaceNets';
import { sweepPlate } from '../sweep';
import type { MeshData } from '../surfaceNets';
import type { ConceptDefinition, Fidelity, Vec3 } from '../types';

/** INTERLOCKED FORMS — REFINED ("eclipse").
 * A tall, slim chrome stele with a concave crown; a heavy smoked disc stands almost
 * perpendicular to it and passes through a narrow vertical slot in its upper half. Seen
 * obliquely the disc reads as a near-full circle crossing the pillar (an eclipse); seen
 * head-on it collapses to one line in the slot. A thin satin blade lies on the floor as the
 * horizontal counterpoint.
 * The slot is the disc field offset by GAP (uniform clearance by construction) and stays
 * inside the stele outline, so the stele remains one connected body.
 */
export const REFINED_GAP = 0.045;

const WALL_R = 3.2;
const STELE = { centre: 0, half: 0.62, top: 3.65 };
/** Crown height across the stele, u ∈ [-1, 1] from left to right edge: a concave sweep. */
export const crownHeight = (u: number) => STELE.top - 0.22 * (u + 1) - 0.08 * (u + 1) ** 2;

export function refinedSteleShape(x: number, y: number, z: number) {
  const s = WALL_R * Math.atan2(x, z + WALL_R); // Arc length along the shell.
  const radial = Math.hypot(x, z + WALL_R) - WALL_R;
  const u = (s - STELE.centre) / STELE.half;
  const side = Math.abs(s - STELE.centre) - STELE.half;
  const crown = (y - crownHeight(Math.max(-1.2, Math.min(1.2, u)))) * 0.9;
  // Below the floor plane the stele simply continues; the depth buffer draws the contact.
  const outline = smax(smax(side, crown, 0.16), -(y + 0.12), 0.02);
  return roundedExtrusion(outline, radial, 0.07);
}

/** Disc placement: centred on the stele mid-surface, axis almost along the shell tangent, so
 * the disc plane is nearly perpendicular to the stele and crosses it in a vertical slot. */
const LENS_S = 0.04;
export const REFINED_LENS = {
  radius: 0.82,
  sag: 0.11,
  rim: 0.035,
  centre: [
    WALL_R * Math.sin(LENS_S / WALL_R),
    2.12,
    WALL_R * Math.cos(LENS_S / WALL_R) - WALL_R,
  ] as Vec3,
  axis: [1, 0.08, 0.14] as Vec3,
};
const lensProfile = vesicaLens(REFINED_LENS.radius, REFINED_LENS.sag, REFINED_LENS.rim);
const lensFrame = frameFromAxis(REFINED_LENS.axis);
const dot = (a: Vec3, b: readonly number[]) => a[0] * b[0]! + a[1] * b[1]! + a[2] * b[2]!;

export function refinedLensShape(x: number, y: number, z: number) {
  const p = [x - REFINED_LENS.centre[0], y - REFINED_LENS.centre[1], z - REFINED_LENS.centre[2]];
  return lensProfile(Math.hypot(dot(lensFrame.x, p), dot(lensFrame.z, p)), dot(lensFrame.y, p));
}

export function notchedStele(x: number, y: number, z: number) {
  // A 0.06 blend gives the slot lips a machined round wide enough (≈4 lattice cells at high
  // fidelity) to stay smooth in macro views.
  return smax(refinedSteleShape(x, y, z), -(refinedLensShape(x, y, z) - REFINED_GAP), 0.06);
}

export function refinedLensMesh(fidelity: Fidelity): MeshData {
  const n = fidelity === 'high' ? 220 : 120;
  const { x, y, z } = lensFrame;
  const rotate = ([a, b, c]: [number, number, number]): [number, number, number] => [
    x[0] * a + y[0] * b + z[0] * c,
    x[1] * a + y[1] * b + z[1] * c,
    x[2] * a + y[2] * b + z[2] * c,
  ];
  const c = REFINED_LENS.centre;
  return transformMesh(
    latheField(lensProfile, { samples: n, segments: n, reach: 1.6 }),
    (p) => {
      const r = rotate(p);
      return [r[0] + c[0], r[1] + c[1], r[2] + c[2]];
    },
    rotate,
  );
}

/** The leaf, now a ground line: a long, thin satin blade (35mm-equivalent) lying flat on a
 * gentle arc, running diagonally from front-left toward the stele's base. It is the
 * horizontal counterpoint to the vertical stele and the circular disc, and in the frontal
 * view it crosses the disc's edge-on line. It rests flat, so its underside sits on the floor. */
export const GROUND_LINE = {
  points: [
    [-2.45, 0, 1.85],
    [-1.5, 0, 1.18],
    [-0.62, 0, 0.78],
    [0.12, 0, 0.6],
  ] as const,
  width: 0.24,
  thickness: 0.035,
};
export function refinedLeafMesh(fidelity: Fidelity): MeshData {
  const half = GROUND_LINE.thickness / 2;
  return sweepPlate({
    points: GROUND_LINE.points.map(([x, , z]) => [x, half, z] as const),
    up: [0, 1, 0],
    // Tapered tips: full width through the middle, narrowing to 40% at each end.
    width: (t) => GROUND_LINE.width * (0.4 + 0.6 * Math.pow(Math.sin(Math.PI * t), 0.6)),
    thickness: () => GROUND_LINE.thickness,
    segments: fidelity === 'high' ? 200 : 100,
  });
}

export const refined: ConceptDefinition = {
  id: 'refined',
  letter: 'B′',
  name: 'Interlocked Forms — Refined',
  intention:
    'Eclipse. A slim chrome stele, a heavy smoked disc passing through a slot in it, and a thin satin blade drawn across the floor. Vertical, circle, horizon.',
  centre: [0, 1.6, 0],
  stage: 'gallery',
  materials: {
    // Slightly cool polished chrome (a touch of micro-roughness so magnified reflections sample
    // a filtered mip, not stair-stepped texels), and a smoked disc with enough reflectance (F0 ≈ 0.1)
    // to carry the room's light slots instead of reading as black plastic.
    chrome: { color: '#c5c9cc', roughness: 0.045 },
    smoked: { color: '#5b5f63', roughness: 0.035 },
  },
  parts: [
    {
      name: 'Stele',
      material: 'chrome',
      build: (f: Fidelity) =>
        surfaceNets(
          notchedStele,
          { min: [-0.74, -0.15, -0.22], max: [0.74, 3.7, 0.12] },
          f === 'high' ? 440 : 170,
        ),
    },
    { name: 'Lens', material: 'smoked', build: refinedLensMesh },
    { name: 'Ground line', material: 'satin', build: refinedLeafMesh },
  ],
  views: {
    // Eclipse: from 55° off the stele's normal the disc reads as a near-full circle crossing
    // the pillar; the side light slot sits in the left third, the ground line leads in.
    hero: {
      position: [6.6, 1.15, 4.75],
      target: [-0.63, 1.75, 0.93],
      fov: 27,
      subject: [0.05, 1.75, 0],
    },
    // Worm's-eye: close and low from front-right; the stele towers, the disc cuts across the
    // crown and the polished floor doubles the form.
    alt: { position: [2.5, 0.32, 3.7], target: [-0.15, 2.05, -0.3], fov: 32 },
    // Macro looking up at the slot's lower lip, where the disc rim leaves the stele with its
    // machined clearance.
    detail: { position: [0.95, 1.05, 1.3], target: [0.05, 1.42, 0.02], fov: 15 },
    spatial: { position: [-5.6, 3.9, 6.4], target: [0.4, 1.2, -1.2], fov: 36 },
  },
  rig: {
    id: 'refined-rig',
    label: 'Gallery rig: window, light slot, edge strips',
    dome: { top: '#2a2b2e', horizon: '#141415', bottom: '#1e1c1a' },
    cards: [
      ...SURROUND,
      // Exactly on the hero reflection path of the stele face: the hero view ray mirrored about
      // the face normal, placed from the origin because the cube map is captured there. A tall
      // graded card, so the broad face reads as chrome with a falloff, not a black mirror.
      {
        position: [-6.5, 0.74, 4.61],
        aim: [0, 1.9, 0],
        size: [2.6, 7],
        intensity: 2.4,
        color: '#efe9e0',
        kind: 'soft',
      },
      // A mullioned window high behind the camera: architecture, not a softbox, in the chrome.
      {
        position: [-5, 4.6, 5.5],
        size: [4.2, 3.2],
        intensity: 3.6,
        color: '#f6f2ea',
        kind: 'window',
      },
      // The visible light slot in the back wall, so reflections agree with the room.
      {
        position: [-2.6, 3.6, -5.9],
        aim: [-2.6, 3.6, 0],
        size: [0.36, 7.2],
        intensity: 11,
        color: '#fff3e2',
        kind: 'strip',
      },
      {
        position: [5.2, 2.2, 2.6],
        size: [0.26, 7],
        intensity: 13,
        color: '#eef3ff',
        kind: 'strip',
      },
      {
        position: [0.5, 8.5, -0.5],
        size: [6, 0.3],
        intensity: 10,
        color: '#ffffff',
        kind: 'strip',
      },
    ],
    key: { position: [-3.2, 8.2, 3.4], intensity: 240, angle: 0.3 },
    exposure: 1,
  },
};
