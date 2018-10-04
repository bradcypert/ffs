import Task from '../task';

/**
 * This task is assigned to creeps that will build / upgrade
 */
export default class Build extends Task {
    public type: string = 'build';
    public id: string;
    public creep: Creep;
    public targets: Array<ConstructionSite<BuildableStructureConstant>>;

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
        this.targets = [];
    }

    public run(): void {
        // TODO: This is expensive, defer or cache this please.
        this.targets = this.creep.room.find(FIND_CONSTRUCTION_SITES);
        const status = (this.creep.memory as any).status;
        if (status !== 'gathering' && this.creep.carry.energy === 0) {
            (this.creep.memory as any).status = 'gathering';
        } else if (status !== 'building' && this.creep.carry.energy === this.creep.carryCapacity) {
            (this.creep.memory as any).status = 'building';
        }
        if ((this.creep.memory as any).status === 'gathering') {
            this.collectEnergy();
        } else {
            if (this.targets.length > 0) {
                this.goToConstructionSite();
            } else {
                this.upgradeController();
            }
        }
    }

    public collectEnergy(): void {
        const dropoff = this.creep.room.find(FIND_STRUCTURES).filter(s =>
            s.structureType === STRUCTURE_CONTAINER
            && s.store.energy > this.creep.carryCapacity);

        if (dropoff.length > 0) {
            if (this.creep.withdraw(dropoff[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], {visualizePathStyle: {stroke: '#0000FF'}});
            }
        } else {
            // Manually Harvest it
            const target = this.creep.room.find(FIND_SOURCES).pop();
            if (target && this.creep.harvest(target) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target,  {visualizePathStyle: {stroke: '#ffff33'}});
            }
        }
    }

    public upgradeController(): void {
        const controller = this.creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTROLLER);
        if (controller[0]) {
            if (this.creep.upgradeController(controller[0] as StructureController) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(controller[0], {visualizePathStyle: {stroke: '#ffffff'}});
            }
        }
    }

    public goToConstructionSite(): void {
        const targets = this.targets.filter((s) => s.progress < s.progressTotal);
        if (targets.length > 0) {
            if (this.creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(targets[0], {visualizePathStyle: {stroke: '#000099'}});
            }
        }
    }

}
