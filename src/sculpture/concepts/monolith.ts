import { ellipsoid, rot, smax, smin } from '../sdf';
import { SURROUND } from '../rigs';
import { surfaceNets } from '../surfaceNets';
import type { ConceptDefinition, Fidelity } from '../types';

/** LIQUID MONOLITH — one continuous implicit surface.
 * A tall, thin blade of metal rises from a shallow meniscus in a contrapposto S-curve and
 * turns ~60° as it rises, so its broad faces carry long travelling highlights. The crown is
 * a soft, slumped slope. An elongated void, offset toward one edge, leaves a slender strand
 * on that side: the weight visibly flows around an opening. All blends are exponential
 * (C∞) so reflected highlight lines never kink.
 */
export function monolithField(x: number, y: number, z: number): number {
  const h = Math.max(0, y) / 3.2;
  const lean = 0.15 * Math.sin(5.2 * h - 1) + 0.25 * h * h;
  const [bx, bz] = rot(x - lean, z, 0.3 * y - 0.5);
  // Weight sits low: the section narrows steadily toward the crown.
  const swell = 1.05 - 0.3 * h;
  // Centred below the floor so the blade enters the ground at full width, not on a point.
  // Thickness grows toward the crown so the rounded cap never thins into a knife ridge.
  const thicken = 1 + 0.9 * h * h;
  const column = ellipsoid(bx / swell, y - 1, bz / thicken, 0.62, 2.45, 0.19);
  const body = smax(column, y - 3.2 + 0.25 * bx, 0.22);

  const [vx, vy] = rot(bx - 0.14, y - 1.72, 0.1);
  const voidShape = ellipsoid(vx, vy, bz, 0.14, 0.5, 1);
  const pierced = smax(body, -voidShape, 0.08);

  const meniscus = ellipsoid(x + 0.04, y, z, 0.62, 0.065, 0.36);
  return smax(smin(pierced, meniscus, 0.1), -y, 0.02);
}

export const MONOLITH_BOUNDS = { min: [-1.1, 0, -0.9], max: [1.2, 3.35, 0.9] } as const;

export const monolith: ConceptDefinition = {
  id: 'monolith',
  letter: 'A',
  name: 'Liquid Monolith',
  intention:
    'One poured, continuous blade in a contrapposto curve. The crown slumps and turns; an offset void leaves a single slender strand.',
  centre: [0, 1.6, 0],
  parts: [
    {
      name: 'Monolith',
      material: 'chrome',
      build: (fidelity: Fidelity) =>
        surfaceNets(monolithField, MONOLITH_BOUNDS, fidelity === 'high' ? 230 : 130),
    },
  ],
  views: {
    hero: {
      position: [1.2, 1.15, 8.4],
      target: [-0.95, 1.62, 0],
      fov: 27,
      subject: [0.08, 1.62, 0],
    },
    detail: { position: [1.7, 2.05, 2.2], target: [0.3, 1.85, 0], fov: 16 },
    spatial: { position: [-4.6, 0.55, 3.2], target: [0.1, 1.4, -0.2], fov: 38 },
  },
  rig: {
    id: 'monolith-rig',
    label: 'Vertical strip rig',
    dome: { top: '#2a2b2e', horizon: '#141415', bottom: '#1e1c1a' },
    cards: [
      ...SURROUND,
      { position: [-4.5, 3.5, 3.5], size: [3, 5], intensity: 4.5, color: '#fff1df', kind: 'soft' },
      {
        position: [4.8, 1.6, 2.4],
        size: [0.26, 8],
        intensity: 14,
        color: '#f2f5ff',
        kind: 'strip',
      },
      {
        position: [2.6, 1.6, -4.8],
        size: [0.2, 8],
        intensity: 10,
        color: '#ffffff',
        kind: 'strip',
      },
      { position: [-1, 8, 1], size: [4, 2.5], intensity: 2.4, color: '#ffffff', kind: 'soft' },
      { position: [0, 0.6, 7], size: [6, 0.18], intensity: 4, color: '#fff6ea', kind: 'strip' },
    ],
    key: { position: [-3, 8.5, 3.5], intensity: 260, angle: 0.36 },
    exposure: 1,
  },
};
