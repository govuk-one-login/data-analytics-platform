import { inject } from 'vitest';

declare module 'vitest' {
  export interface ProvidedContext {
    integrationTestGlobals: Record<string, unknown>;
  }
}

// Vitest's globalSetup runs in the main process; test workers have a separate
// global scope, so any `global.*` assignments in setup are invisible to tests.
// This setupFile bridges the gap by reading data via inject() (which Vitest
// serialises and forwards to every worker) and assigning it to global.
const integrationTestGlobals = inject('integrationTestGlobals');

if (integrationTestGlobals) {
  Object.assign(global, integrationTestGlobals);
}
