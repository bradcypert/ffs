import Task from '../task';

/**
 * This task is assigned to creeps that transfer from containers to the spawn.
 * He attac, he protec, and lastly he repair structures (in that order).
 *
 * This tower task prioritizes the following in the following order:
 * 1. Attack any enemy creeps in range.
 * 2. Heal any allied creeps in range.
 * 3. Repair any structures in range.
 */
export default class Universal extends Task {
    public type: string = 'universal';
    public id: string;
    public tower: StructureTower;

    constructor(id: string, tower: StructureTower) {
        super();
        this.id = id;
        this.tower = tower;
    }

    public run(): void {
        if (this.tower.energy > 10) {
            this.spendEnergy();
        }
    }

    private spendEnergy(): void {
        // TODO: This is likely an expensive call, but its important to do this very frequently. Can we figure out a better way?
        const enemies = this.tower.room.find(FIND_HOSTILE_CREEPS);
        if (enemies.length > 0) {
            const sorted = enemies.sort((a, b) => a.hits - b.hits);
            this.tower.attack(sorted[0]);
            return;
        }

        const wounded = this.tower.room.find(FIND_MY_CREEPS, {filter: (e) => e.hits < e.hitsMax});
        if (wounded.length > 0) {
            const sorted = wounded.sort((a, b) => a.hits - b.hits);
            this.tower.heal(sorted[0]);
            return;
        }

        const damaged = this.tower.room.find(FIND_MY_STRUCTURES, {filter: (e) => e.hits < e.hitsMax});
        if (damaged.length > 0) {
            // const sorted = damaged.sort((a, b) => a.hits - b.hits);
            // this.tower.repair(sorted[0]);
            return;
        }
    }
}
