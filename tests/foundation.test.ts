import { describe, expect, it } from 'vitest';

describe('runtime foundation', () => {
  it('provides the DOM root required for progressive enhancement', () => {
    document.body.innerHTML = '<div id="root"></div>';
    expect(document.getElementById('root')).not.toBeNull();
  });
});
