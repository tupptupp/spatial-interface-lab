import { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_LAB, updateLab } from '../src/interaction/lab';
import { MaterialLab } from '../src/app/MaterialLab';
afterEach(cleanup);
function Harness({ still = false }) {
  const [values, setValues] = useState({ ...DEFAULT_LAB });
  return <MaterialLab values={values} onChange={setValues} staticMode={still} />;
}
describe('material interaction', () => {
  it('enforces safe ranges on every entry path', () => {
    expect(updateLab({ ...DEFAULT_LAB }, 'roughness', 2).roughness).toBe(0.48);
    expect(updateLab({ ...DEFAULT_LAB }, 'rotation', -900).rotation).toBe(-90);
    expect(updateLab({ ...DEFAULT_LAB }, 'light', NaN).light).toBe(-70);
  });
  it('updates accessible controls and resets all values', () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText('Surface roughness'), { target: { value: 0.3 } });
    fireEvent.change(screen.getByLabelText('Sculpture rotation'), { target: { value: 45 } });
    expect(screen.getByLabelText('Surface roughness')).toHaveValue('0.3');
    expect(screen.getByText('45°')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Reset study/ }));
    expect(screen.getByLabelText('Surface roughness')).toHaveValue('0.12');
    expect(screen.getByLabelText('Sculpture rotation')).toHaveValue('0');
  });
  it('explains and disables unavailable 3D controls in still mode', () => {
    render(<Harness still />);
    expect(screen.getByLabelText('Surface roughness')).toBeDisabled();
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText(/A still study is active/)).toBeInTheDocument();
  });
});
