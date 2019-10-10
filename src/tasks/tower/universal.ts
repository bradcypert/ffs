import Task from '../task';

/**
 * This task is assigned to creeps that transfer from containers to the spawn.
 */
export default class Universal extends Task {
    public type: string = 'universal';
    public id: string;
    public tower: StructureTower;
    public targets: any[];

    constructor(id: string, tower: StructureTower) {
        super();
        this.id = id;
        this.tower = tower;
        this.targets = tower.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER);
    }

    public run(): void {
        if (this.tower.energy > 10) {
            this.collectEnergy();
        }
    }

    public collectEnergy(): void {
        /** no op */
    }

    public dropOffEnergy(): void {
        /** no op */
    }
}
