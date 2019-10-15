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
        this.targets = creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_STORAGE);
    }

    public run(): void {
        const status = (this.creep.memory as any).status;

        if (status !== 'gathering' && this.creep.carry.energy === 0) {
            (this.creep.memory as any).status = 'gathering';
        } else if (status !== 'carrying' && this.creep.carry.energy === this.creep.carryCapacity) {
            (this.creep.memory as any).status = 'carrying';
        }

        if ((this.creep.memory as any).status === 'gathering') {
            this.collectEnergy();
        } else {
            this.dropOffEnergy();
        }
    }

    public collectEnergy(): void {
        if (this.creep.withdraw(this.targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(this.targets[0], {visualizePathStyle: {stroke: '#ffffff'}});
        }
    }

    public dropOffEnergy(): void {
        const dropoff = this.creep.room.find(FIND_STRUCTURES, {filter: s =>
            (s.structureType === STRUCTURE_SPAWN && s.energy < s.energyCapacity)
            ||  (s.structureType === STRUCTURE_EXTENSION && s.energy < s.energyCapacity)
            ||  (s.structureType === STRUCTURE_TOWER && s.energy < s.energyCapacity)});

        if (dropoff.length > 0) {
            if (this.creep.transfer(dropoff[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        } else {
            // Controllers are unique
            const controller = this.creep.room.find(FIND_STRUCTURES)
                .filter(s => s.structureType === STRUCTURE_CONTROLLER);
            if (controller[0]) {
                if (this.creep.upgradeController(controller[0] as StructureController) === ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(controller[0], {visualizePathStyle: {stroke: '#ffffff'}});
                }
            }
        }
    }
}
