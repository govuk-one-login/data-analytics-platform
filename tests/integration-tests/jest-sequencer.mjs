import Sequencer from '@jest/test-sequencer';

class CustomSequencer extends Sequencer {
  sort(tests) {
    return tests.sort((testA, testB) => {
      const getPriority = path => {
        // Group 1: happy-path and edge-cases run concurrently (priority 0)
        if (path.includes('happy-path') || path.includes('raw-to-stage-edge-cases')) {
          return 0;
        }
        // Group 2: unhappy-path runs after group 1 (priority 1)
        if (path.includes('raw-to-stage-unhappy-path')) {
          return 1;
        }
        return 999; // Unknown tests go last
      };

      const priorityA = getPriority(testA.path);
      const priorityB = getPriority(testB.path);

      // If different priorities, sort by priority
      if (priorityA !== priorityB) {
        return priorityA - priorityB;
      }

      // Same priority, sort alphabetically
      return testA.path.localeCompare(testB.path);
    });
  }
}

export default CustomSequencer;
