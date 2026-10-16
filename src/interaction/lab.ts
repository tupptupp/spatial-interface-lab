import { clamp } from '../animation/choreography';

export type LabValues = { roughness: number; rotation: number; light: number };
export const DEFAULT_LAB: Readonly<LabValues> = { roughness: 0.12, rotation: 0, light: 25 };
export const LIMITS: Record<keyof LabValues, readonly [number, number]> = {
  roughness: [0.06, 0.48],
  rotation: [-90, 90],
  light: [-70, 70],
};
export function updateLab(state: LabValues, key: keyof LabValues, value: number): LabValues {
  return { ...state, [key]: clamp(value, ...LIMITS[key]) };
}
