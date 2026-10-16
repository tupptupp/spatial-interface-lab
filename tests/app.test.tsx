import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/app/App';

const { sceneMounted, sceneUnmounted } = vi.hoisted(() => ({
  sceneMounted: vi.fn(),
  sceneUnmounted: vi.fn(),
}));
vi.mock('../src/scene/Experience', async () => {
  const { useEffect } = await import('react');
  return {
    default: function Scene({
      onReady,
      onFailure,
    }: {
      onReady: () => void;
      onFailure: () => void;
    }) {
      useEffect(() => {
        sceneMounted();
        onReady();
        return () => sceneUnmounted();
      }, [onReady]);
      return (
        <button data-testid="mock-context-loss" onClick={onFailure}>
          Simulate renderer loss
        </button>
      );
    },
  };
});
let reduce = false;
beforeEach(() => {
  reduce = false;
  sceneMounted.mockClear();
  sceneUnmounted.mockClear();
  vi.stubGlobal('matchMedia', () => ({
    matches: reduce,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.spyOn(HTMLElement.prototype, 'offsetTop', 'get').mockImplementation(function (
    this: HTMLElement,
  ) {
    return ['reveal', 'reflection', 'structure', 'material-lab'].indexOf(this.id) * 1000;
  });
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('application progressive enhancement', () => {
  it('mounts the scene and cleans it up on still mode and unmount', async () => {
    const { unmount } = render(<App />);
    await waitFor(() => expect(screen.getByTestId('stage')).toHaveAttribute('data-state', 'ready'));
    fireEvent.click(screen.getByRole('button', { name: /Still mode/ }));
    expect(screen.getByTestId('stage')).toHaveAttribute('data-state', 'static');
    expect(sceneUnmounted).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Surface roughness')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Enable 3D/ }));
    await waitFor(() => expect(screen.getByTestId('stage')).toHaveAttribute('data-state', 'ready'));
    unmount();
    expect(sceneUnmounted).toHaveBeenCalledTimes(2);
  });
  it('keeps content and controls understandable when the renderer fails, and allows retry', async () => {
    render(<App />);
    fireEvent.click(await screen.findByTestId('mock-context-loss'));
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('BEYONDTHE SURFACE.');
    expect(screen.getByRole('status', { name: 'Rendering status' })).toHaveTextContent(
      '3D unavailable',
    );
    expect(screen.getByLabelText('Surface roughness')).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: /Enable 3D/ }));
    await waitFor(() => expect(screen.getByTestId('stage')).toHaveAttribute('data-state', 'ready'));
  });
  it('does not mount WebGL when reduced motion is requested', () => {
    reduce = true;
    render(<App />);
    expect(sceneMounted).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Reduced motion/ })).toBeDisabled();
    expect(screen.getByRole('navigation', { name: 'Experience chapters' })).toBeInTheDocument();
    expect(screen.getByLabelText('Surface roughness')).toBeDisabled();
  });
  it('derives the active chapter from the current scroll after resize', () => {
    reduce = true;
    render(<App />);
    vi.stubGlobal('scrollY', 1900);
    fireEvent.scroll(window);
    expect(screen.getByRole('link', { name: 'Inner structure' })).toHaveAttribute(
      'aria-current',
      'step',
    );
    vi.stubGlobal('scrollY', 0);
    fireEvent.resize(window);
    expect(screen.getByRole('link', { name: 'The reveal' })).toHaveAttribute(
      'aria-current',
      'step',
    );
  });
});
