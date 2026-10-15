import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, expect } from 'vitest';
import * as axeMatchers from 'vitest-axe/matchers';

expect.extend(axeMatchers);

// jsdom has no canvas; axe probes it and jsdom logs "Not implemented" noise. Returning null is the
// documented "no canvas support" result and silences the warning without changing any test behaviour.
if (typeof HTMLCanvasElement !== 'undefined') {
  HTMLCanvasElement.prototype.getContext = () => null;
}

afterEach(() => {
  cleanup();
});
