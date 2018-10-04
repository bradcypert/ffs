import TaskQueue from 'TaskQueue';
import Constants from './Constants';

export default class Kernel {
  public static tick() {
      while (TaskQueue.hasTasks()
            && this.CPUAvailable()) {
          TaskQueue.process();
      }
  }

  private static CPUAvailable(): boolean {
      const cpuUsed = Game.cpu.getUsed();
      const cpuLimit = Game.cpu.limit;
      return (cpuLimit - (Constants.CPU_BUFFER * Constants.CPU_ADJUST) > cpuUsed);
  }
}
