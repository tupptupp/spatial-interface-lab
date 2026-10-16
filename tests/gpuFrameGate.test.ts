// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { GpuFrameGate } from '../src/performance/GpuFrameGate';
function fixture() {
  const gl = {
    SYNC_GPU_COMMANDS_COMPLETE: 0x9117 as const,
    ALREADY_SIGNALED: 0x911a as const,
    CONDITION_SATISFIED: 0x911c as const,
    TIMEOUT_EXPIRED: 0x911b as const,
    WAIT_FAILED: 0x911d as const,
    fenceSync: vi.fn(() => ({}) as WebGLSync),
    clientWaitSync: vi.fn((): number => 0x911b),
    deleteSync: vi.fn(),
    flush: vi.fn(),
  };
  return { gl, gate: new GpuFrameGate(gl) };
}
describe('bounded GPU frame submission', () => {
  it('never queues a second frame before the previous fence completes', () => {
    const { gl, gate } = fixture();
    expect(gate.submit(10)).toBe(true);
    expect(() => gate.submit(11)).toThrow('already in flight');
    expect(gl.fenceSync).toHaveBeenCalledTimes(1);
    expect(gl.flush).toHaveBeenCalledOnce();
  });
  it('polls without a blocking wait and retains an incomplete fence', () => {
    const { gl, gate } = fixture();
    gate.submit(10);
    expect(gate.poll(20)).toEqual({ state: 'pending', elapsedMs: 10 });
    expect(gl.clientWaitSync).toHaveBeenCalledWith(expect.anything(), 0, 0);
    expect(gl.deleteSync).not.toHaveBeenCalled();
  });
  it.each([0x911a, 0x911c])(
    'releases a completed fence with status %s and permits the next frame',
    (status) => {
      const { gl, gate } = fixture();
      gate.submit(10);
      gl.clientWaitSync.mockReturnValue(status);
      expect(gate.poll(30)).toEqual({ state: 'complete', elapsedMs: 20 });
      expect(gl.deleteSync).toHaveBeenCalledOnce();
      expect(gate.submit(31)).toBe(true);
    },
  );
  it('releases a stalled or failed fence and disposes idempotently', () => {
    const { gl, gate } = fixture();
    gate.submit(10);
    expect(gate.poll(5011).state).toBe('failed');
    gate.dispose();
    expect(gl.deleteSync).toHaveBeenCalledOnce();
    gate.submit(6000);
    gl.clientWaitSync.mockReturnValue(0x911d);
    expect(gate.poll(6001).state).toBe('failed');
    expect(gl.deleteSync).toHaveBeenCalledTimes(2);
    expect(gate.poll(7000).state).toBe('idle');
  });
});
