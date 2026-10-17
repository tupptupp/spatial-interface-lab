import type { CameraPreset, Vec3 } from './types';

/** Presets are authored for a 16:10 frame. On narrower viewports keep the focal length
 * (no extra wide-angle distortion) and dolly back until the authored horizontal coverage
 * fits again. Portrait frames gain vertical room, which suits upright sculpture.
 */
export const REFERENCE_ASPECT = 1.6;

export function frameView(preset: CameraPreset, aspect: number): CameraPreset {
  if (!Number.isFinite(aspect) || aspect <= 0) return preset;
  if (aspect >= REFERENCE_ASPECT) return preset;
  const half = (preset.fov * Math.PI) / 360;
  const authored = Math.atan(Math.tan(half) * REFERENCE_ASPECT);
  const available = Math.atan(Math.tan(half) * aspect);
  // Recover ~65% of the lost width: a full fit would leave portrait frames mostly empty.
  const scale = 1 + (Math.tan(authored) / Math.tan(available) - 1) * 0.65;
  // An off-centre (rule-of-thirds) frame has no room to stay off-centre on a narrow screen:
  // slide camera and target together until the subject is centred.
  const shift = preset.subject
    ? preset.subject.map((s, i) => (i === 1 ? 0 : s - preset.target[i]!))
    : [0, 0, 0];
  const target = preset.target.map((t, i) => t + shift[i]!) as unknown as Vec3;
  const position = preset.position.map(
    (p, i) => target[i]! + (p - preset.target[i]!) * scale,
  ) as unknown as Vec3;
  return { ...preset, position, target };
}
