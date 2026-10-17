import type { MeshData } from './surfaceNets';

export type Vec3 = readonly [number, number, number];
export type Fidelity = 'high' | 'balanced';
export type MaterialKey = 'chrome' | 'satin' | 'smoked';
export type ViewId = 'hero' | 'detail' | 'spatial';
export type ConceptId = 'monolith' | 'interlocked' | 'tension';

export type Part = {
  name: string;
  material: MaterialKey;
  build: (fidelity: Fidelity) => MeshData;
};

/** Vertical field of view in degrees. 27° ≈ a 50mm lens on full frame, 14° ≈ 100mm. */
export type CameraPreset = {
  position: Vec3;
  target: Vec3;
  fov: number;
  /** Where the sculpture sits in an off-centre composition; portrait frames re-centre on it. */
  subject?: Vec3;
};

/** An emissive card that exists only in the baked reflection environment. */
export type Card = {
  position: Vec3;
  /** Point the card faces. Defaults to the sculpture's optical centre. */
  aim?: Vec3;
  size: readonly [number, number];
  intensity: number;
  color: string;
  /** soft: broad feathered box. strip: narrow line source with a short falloff. */
  kind: 'soft' | 'strip';
};

export type LightRig = {
  id: string;
  label: string;
  cards: readonly Card[];
  /** Linear-light dome gradient visible only in reflections. */
  dome: { top: string; horizon: string; bottom: string };
  /** Visible key spotlight: shapes the floor pool and casts the only shadow map. */
  key: { position: Vec3; intensity: number; angle: number };
  exposure: number;
};

export type ConceptDefinition = {
  id: ConceptId;
  letter: 'A' | 'B' | 'C';
  name: string;
  intention: string;
  parts: readonly Part[];
  views: Record<ViewId, CameraPreset>;
  rig: LightRig;
  /** Point that reflection cards aim at by default. */
  centre: Vec3;
};
