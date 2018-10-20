import TaskQueue from '../src/TaskQueue';
import Task from '../src/tasks/Task';

class TestTask extends Task {
    public id: string = '';
    public type: string = '';
    public runCount: number = 0;

    public run(): void {
        // todo: replace this with real jest mocks
        this.runCount++;
    }
}

describe('TaskQueue', () => {
    beforeEach(() => {
        TaskQueue.queue = [];
    });

    it('hasTasks() returns false when no tasks', () => {
        expect(TaskQueue.hasTasks()).toBeFalsy();
    });

    it('add() inserts a task, which causes hasTasks() to be truthy', () => {
        TaskQueue.add(new TestTask());
        expect(TaskQueue.hasTasks()).toBeTruthy();
    });

    it('clear() completely empties the queue', () => {
        TaskQueue.add(new TestTask());
        TaskQueue.add(new TestTask());
        TaskQueue.clear();
        expect(TaskQueue.hasTasks()).toBeFalsy();
    });

    it('peek() returns the first task', () => {
        const testTask = new TestTask();
        TaskQueue.add(testTask);
        expect(TaskQueue.peek()).toBe(testTask);
    });

    it('pop() removes the first task', () => {
        TaskQueue.add(new TestTask());
        expect(TaskQueue.hasTasks()).toBeTruthy();
        TaskQueue.pop();
        expect(TaskQueue.hasTasks()).toBeFalsy();
    });

    it('pop() removes the first task only, leaving others', () => {
        TaskQueue.add(new TestTask());
        TaskQueue.add(new TestTask());
        expect(TaskQueue.hasTasks()).toBeTruthy();
        TaskQueue.pop();
        expect(TaskQueue.hasTasks()).toBeTruthy();
    });

    it('process() runs and then removes the first task', () => {
        const testTask = new TestTask();
        TaskQueue.add(testTask);
        TaskQueue.process();
        expect(testTask.runCount).toBe(1);
        expect(TaskQueue.hasTasks()).toBeFalsy();
    });
});
