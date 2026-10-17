import { rot, smax, superellipsoid } from '../sdf';
import { SURROUND } from '../rigs';
import { surfaceNets } from '../surfaceNets';
import { sweepPlate } from '../sweep';
import type { ConceptDefinition, Fidelity } from '../types';

/** TENSION STUDY — a cantilevered billet, a bow blade and one tie.
 * A long, near-rectangular polished billet is carried high on a single 26mm-equivalent
 * bow blade placed left of its centre of mass. The long arm overhangs and wants to drop;
 * the short arm is pinned to the floor by one hairline tie. Read as a lever: the blade is
 * in compression, the tie in tension, the billet in bending.
 */
export const BILLET = {
  centre: [0.5, 2.3, 0] as const,
  half: [1.45, 0.22, 0.27] as const,
  /** Positive roll lifts the overhanging arm into a steep, reaching diagonal. */
  roll: 0.3,
  exponent: 7,
};
export const BLADE_TOP = [-0.3, 1.86, 0] as const;
export const TIE = { top: [-0.74, 1.72, 0.04] as const, anchor: [-1.7, 0, 0.42] as const };

export function billetShape(x: number, y: number, z: number) {
  const [lx, ly] = rot(x - BILLET.centre[0], y - BILLET.centre[1], -BILLET.roll);
  return superellipsoid(lx, ly, z - BILLET.centre[2], ...BILLET.half, BILLET.exponent);
}

/** Two low machined seats: a slotted plinth for the blade and a puck for the tie. */
export function seatShape(x: number, y: number, z: number) {
  const puck = (cx: number, cz: number, rx: number, rz: number, height: number) => {
    const radial = (Math.hypot((x - cx) / rx, (z - cz) / rz) - 1) * Math.min(rx, rz);
    const vertical = Math.abs(y) - height;
    const e = 0.015;
    return (
      Math.hypot(Math.max(radial + e, 0), Math.max(vertical + e, 0)) +
      Math.min(Math.max(radial + e, vertical + e), 0) -
      e
    );
  };
  const seats = Math.min(
    puck(0.12, 0.1, 0.42, 0.2, 0.05),
    puck(TIE.anchor[0], TIE.anchor[2], 0.11, 0.11, 0.035),
  );
  return smax(seats, -y, 0.003);
}

const bladeWidth = (t: number) => 0.5 - 0.27 * Math.pow(t, 0.9);
export const tension: ConceptDefinition = {
  id: 'tension',
  letter: 'C',
  name: 'Tension Study',
  intention:
    'A polished billet cantilevered on one bow blade and pinned by a single hairline tie. Compression, tension and bending, made legible.',
  centre: [0.15, 1.5, 0],
  parts: [
    {
      name: 'Billet',
      material: 'chrome',
      build: (f: Fidelity) =>
        surfaceNets(
          billetShape,
          { min: [-1.1, 1.4, -0.4], max: [2.05, 3.05, 0.4] },
          f === 'high' ? 200 : 128,
        ),
    },
    {
      name: 'Bow blade',
      material: 'chrome',
      build: (f: Fidelity) =>
        sweepPlate({
          points: [
            [0.12, 0.0, 0.1],
            [0.1, 0.35, 0.1],
            [-0.2, 0.95, 0.07],
            [-0.36, 1.45, 0.03],
            [BLADE_TOP[0], BLADE_TOP[1], BLADE_TOP[2]],
            [BLADE_TOP[0] + 0.04, BLADE_TOP[1] + 0.14, BLADE_TOP[2]],
          ],
          up: [0, 0, 1],
          width: bladeWidth,
          thickness: () => 0.026,
          twist: (t) => -0.42 * Math.sin(Math.PI * t),
          segments: f === 'high' ? 240 : 128,
        }),
    },
    {
      name: 'Tie',
      material: 'satin',
      build: (f: Fidelity) =>
        sweepPlate({
          points: [
            TIE.top,
            [(TIE.top[0] + TIE.anchor[0]) / 2, TIE.top[1] / 2, (TIE.top[2] + TIE.anchor[2]) / 2],
            [TIE.anchor[0], 0.03, TIE.anchor[2]],
          ],
          up: [0, 0, 1],
          width: () => 0.018,
          thickness: () => 0.018,
          segments: f === 'high' ? 16 : 8,
          faceSegments: 0,
          edgeSegments: 10,
        }),
    },
    {
      name: 'Seats',
      material: 'satin',
      build: (f: Fidelity) =>
        surfaceNets(
          seatShape,
          { min: [-1.9, 0, -0.15], max: [0.6, 0.06, 0.6] },
          f === 'high' ? 240 : 150,
        ),
    },
  ],
  views: {
    hero: {
      position: [1.3, 0.8, 8.6],
      target: [-0.95, 1.45, 0],
      fov: 27,
      subject: [0.1, 1.45, 0],
    },
    detail: { position: [-1.35, 1.2, 1.55], target: [-0.45, 1.82, 0], fov: 15 },
    spatial: { position: [-4.6, 3.3, -3.4], target: [0.1, 1.25, 0], fov: 36 },
  },
  rig: {
    id: 'tension-rig',
    label: 'Edge-light rig',
    dome: { top: '#2a2b2e', horizon: '#141415', bottom: '#1e1c1a' },
    cards: [
      ...SURROUND,
      { position: [-3.5, 6, 3], size: [4, 2.6], intensity: 4.2, color: '#fff2e2', kind: 'soft' },
      { position: [0.5, 9, 0], size: [7, 0.3], intensity: 12, color: '#ffffff', kind: 'strip' },
      { position: [6, 1.2, 1], size: [0.25, 6], intensity: 13, color: '#eef3ff', kind: 'strip' },
      { position: [-6, 1.5, -2.5], size: [0.25, 6], intensity: 9, color: '#ffffff', kind: 'strip' },
      { position: [0, 0.5, 6.5], size: [6, 0.15], intensity: 4.8, color: '#fff3e6', kind: 'strip' },
    ],
    key: { position: [-2.5, 8.5, 3], intensity: 260, angle: 0.34 },
    exposure: 1,
  },
};
