import type { LabValues } from '../interaction/lab';
import { DEFAULT_LAB, LIMITS, updateLab } from '../interaction/lab';
export function MaterialLab({
  values,
  onChange,
  staticMode,
}: {
  values: LabValues;
  onChange: (values: LabValues) => void;
  staticMode: boolean;
}) {
  const controls: {
    key: keyof LabValues;
    label: string;
    step: number;
    format: (value: number) => string;
  }[] = [
    { key: 'roughness', label: 'Surface roughness', step: 0.01, format: (v) => v.toFixed(2) },
    { key: 'rotation', label: 'Sculpture rotation', step: 1, format: (v) => `${v}°` },
    { key: 'light', label: 'Key light angle', step: 1, format: (v) => `${v}°` },
  ];
  return (
    <div className="lab-panel">
      <div className="lab-header">
        <span className="eyebrow">Live material study</span>
        <span className="live-dot" aria-hidden="true" />
      </div>
      {staticMode ? (
        <p className="static-note">
          A still study is active. Material controls are available in 3D mode when reduced motion is
          turned off.
        </p>
      ) : null}
      <fieldset disabled={staticMode}>
        <legend className="sr-only">Sculpture material controls</legend>
        {controls.map(({ key, label, step, format }) => (
          <div className="control" key={key}>
            <div className="control-label">
              <label htmlFor={key}>{label}</label>
              <output htmlFor={key}>{format(values[key])}</output>
            </div>
            <input
              id={key}
              type="range"
              min={LIMITS[key][0]}
              max={LIMITS[key][1]}
              step={step}
              value={values[key]}
              onChange={(event) => onChange(updateLab(values, key, Number(event.target.value)))}
            />
          </div>
        ))}
        <button className="reset-button" type="button" onClick={() => onChange({ ...DEFAULT_LAB })}>
          Reset study <span aria-hidden="true">↺</span>
        </button>
      </fieldset>
      <p className="lab-caption">Drag a slider. Use arrow keys for precision.</p>
    </div>
  );
}
