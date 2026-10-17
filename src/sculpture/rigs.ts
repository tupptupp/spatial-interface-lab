import type { Card, LightRig } from './types';

/** Tall softbox panels on a ring around the sculpture, alternating in strength with black
 * gaps between them. Vertical chrome reflects mostly the horizon band, so this ring is what
 * draws light/dark bands across a form and makes its curvature and twist legible.
 */
function panelRing(intensities: readonly number[], radius = 8, offset = 0.2): Card[] {
  return intensities.map((intensity, i) => {
    const angle = offset + (i / intensities.length) * Math.PI * 2;
    return {
      position: [Math.sin(angle) * radius, 1.8, Math.cos(angle) * radius] as const,
      aim: [0, 1.8, 0] as const,
      size: [3.4, 7.5] as const,
      intensity,
      color: i % 2 ? '#e3e6ea' : '#efe9e0',
      kind: 'soft' as const,
    };
  });
}

/** The studio room every rig shares: a lit floor, an overhead scrim and the panel ring. */
export const SURROUND: readonly Card[] = [
  // Chrome always reflects the ground it stands on.
  {
    position: [0, -2.5, 0],
    aim: [0, 0, 0],
    size: [16, 16],
    intensity: 1.5,
    color: '#ddd6cc',
    kind: 'soft',
  },
  // Upward-facing curvature reads as a luminous gradient.
  {
    position: [0, 7, 0],
    aim: [0, 0, 0],
    size: [9, 9],
    intensity: 1.6,
    color: '#f4f2ee',
    kind: 'soft',
  },
  // Alternating strengths; the black gaps between panels supply the contrast.
  ...panelRing([1.0, 2.8, 0.55, 2.2, 1.2, 3.0, 0.5, 2.4]),
];

/** Shared neutral studio used for like-for-like comparison of all three forms.
 * One broad key box, one vertical strip, one overhead soft and a low rim over the surround.
 * Large areas stay dark on purpose: chrome reads form from contrast, not from fill.
 */
export const BASELINE_RIG: LightRig = {
  id: 'baseline',
  label: 'Baseline studio',
  dome: { top: '#2a2b2e', horizon: '#141415', bottom: '#1e1c1a' },
  cards: [
    ...SURROUND,
    { position: [-5, 4, 4], size: [4.5, 3.2], intensity: 4.5, color: '#fff3e4', kind: 'soft' },
    { position: [5.5, 1.8, 1.5], size: [0.32, 7], intensity: 12, color: '#f4f6ff', kind: 'strip' },
    { position: [0, 8, 0.5], size: [5, 4], intensity: 2.2, color: '#ffffff', kind: 'soft' },
    { position: [1, 2.5, -6], size: [7, 0.4], intensity: 6, color: '#ffffff', kind: 'strip' },
  ],
  key: { position: [-3.5, 8, 3], intensity: 260, angle: 0.42 },
  exposure: 1,
};
