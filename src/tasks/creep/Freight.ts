import Task from '../task';

/**
 * This task is assigned to creeps that transfer from containers to the spawn.
 */
export default class Freight extends Task {
    public type: string = 'freight';
    public id: string;
    public creep: Creep;
    public targets: any[];

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
        this.targets = creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER);
    }

    public run(): void {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.collectEnergy();
        } else {
           this.dropOffEnergy();
        }
    }

    public collectEnergy(): void {
        /** no op */
    }

    public dropOffEnergy(): void {
        /** no op */
    }
}
