export type FenceContext = Pick<
  WebGL2RenderingContext,
  | 'fenceSync'
  | 'clientWaitSync'
  | 'deleteSync'
  | 'flush'
  | 'SYNC_GPU_COMMANDS_COMPLETE'
  | 'ALREADY_SIGNALED'
  | 'CONDITION_SATISFIED'
  | 'TIMEOUT_EXPIRED'
  | 'WAIT_FAILED'
>;
export type FenceResult = { state: 'idle' | 'pending' | 'complete' | 'failed'; elapsedMs: number };

/** Non-blocking GPU backpressure. At most one submitted frame may be in flight.
 * Completion timing is a polling upper bound, not a GPU timestamp query.
 */
export class GpuFrameGate {
  private fence: WebGLSync | null = null;
  private submittedAt = 0;
  constructor(
    private readonly context: FenceContext,
    private readonly timeoutMs = 5000,
  ) {}

  submit(now: number): boolean {
    if (this.fence) throw new Error('A GPU frame is already in flight');
    this.fence = this.context.fenceSync(this.context.SYNC_GPU_COMMANDS_COMPLETE, 0);
    this.submittedAt = now;
    this.context.flush();
    return this.fence !== null;
  }

  poll(now: number): FenceResult {
    if (!this.fence) return { state: 'idle', elapsedMs: 0 };
    const elapsedMs = Math.max(0, now - this.submittedAt);
    const status = this.context.clientWaitSync(this.fence, 0, 0);
    if (status === this.context.ALREADY_SIGNALED || status === this.context.CONDITION_SATISFIED) {
      this.dispose();
      return { state: 'complete', elapsedMs };
    }
    if (status === this.context.WAIT_FAILED || elapsedMs > this.timeoutMs) {
      this.dispose();
      return { state: 'failed', elapsedMs };
    }
    return { state: 'pending', elapsedMs };
  }

  dispose(): void {
    if (this.fence) {
      this.context.deleteSync(this.fence);
      this.fence = null;
    }
  }
}
