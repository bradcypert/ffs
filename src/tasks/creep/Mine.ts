import Task from '../task';

/**
 * This task is assigned to the creeps that will mine energy.
 */
export default class Mine extends Task {
    public type: string = 'mine';
    public id: string;
    public creep: Creep;
    public targets: Source[];

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
        this.targets = creep.room.find(FIND_SOURCES);
    }

    public run(): void {

        const status = (this.creep.memory as any).status;
        if (status !== 'gathering' && this.creep.carry.energy === 0) {
            (this.creep.memory as any).status = 'gathering';
        } else if (status !== 'depositing' && this.creep.carry.energy === this.creep.carryCapacity) {
            (this.creep.memory as any).status = 'depositing';
        }

        if ((this.creep.memory as any).status === 'gathering') {
            this.collectEnergy();
        } else {
            this.dropOffEnergy();
        }
    }

    public collectEnergy(): void {
        // TODO: Determine which source to hit.
        // Can leverage Memory.source.$sourceID to see how many it can handle
        // will need to associate the creep with that source in memory as well
        // then find the applicable source from memory and direct to it
        if (!(this.creep.memory as any).target) {
            const target = this.targets.sort((a, b) => {
                const aa = (Memory as any)['source'][a.id]['points'] + (Memory as any)['source'][a.id]['creeps'].length;
                const bb = (Memory as any)['source'][b.id]['points'] + (Memory as any)['source'][b.id]['creeps'].length;
                if (aa === bb) { return 0; }
                if (aa < bb) { return -1; } else { return 1; }
            })[0];

            if (target) {
                (this.creep.memory as any).target = target;
                (Memory as any)['source'][target.id]['creeps'].push(this.creep);
            }
        }

        const target = Game.getObjectById((this.creep.memory as any).target.id) as Source;
        if (target && this.creep.harvest(target) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target,  {visualizePathStyle: {stroke: '#ffff33'}});
        }
    }

    public dropOffEnergy(): void {
        const dropoff = this.creep.room.find(FIND_STRUCTURES).filter(s =>
        (s.structureType === STRUCTURE_CONTAINER && s.store.energy < s.storeCapacity)
        ||  (s.structureType === STRUCTURE_SPAWN && s.energy < s.energyCapacity)
        ||  (s.structureType === STRUCTURE_EXTENSION && s.energy < s.energyCapacity));

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
