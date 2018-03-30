import Task from './tasks/Task';

/**
 * The task queue is a simple buffer for running tasks.
 * The kernel operates on values in the queue based on remaining CPU availability
 * and the Scheduler populates the queue based off the state of the game.
 */
export default class TaskQueue {
    private static queue: Task[] = [];

    /**
     * Add a new task to the queue.
     * @param {Task} task
     */
    public static add(task: Task) {
        this.queue.push(task);
    }

    /**
     * Get and remove the next task from the queue.
     * Might be useful for deferring execution of high CPU tasks.
     */
    public static pop(): Task | undefined {
        return this.queue.shift();
    }

    public static peek(): Task | null {
        return this.queue[0];
    }

    /**
     * Process the next task in the queue.
     */
    public static process() {
        const task = this.queue.pop();
        if (task) {
            task.run();
        } else {
            console.warn("Trying to process an empty queue. Error code: QUAILHOUND");
        }
    }
}