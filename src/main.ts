// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
import Kernel from 'Kernel';
import Scheduler from 'Scheduler';

if (!(Memory as any)['source']) { (Memory as any)['source'] = {}; }

export const loop = () => {
  console.log(`Current game tick is ${Game.time}`);

  // should be moved into the source identification process
  if (Game.time % 25 === 0) {
    (Memory as any)['source'] = {};
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }

  Scheduler.createSchedule();
  Kernel.tick();
};
