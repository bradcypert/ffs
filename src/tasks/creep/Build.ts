import Task from '../task';

/**
 * This task is assigned to creeps that will build / upgrade
 */
export default class Build extends Task {
    public type: string = 'build';
    public id: string;
    public creep: Creep;
    public building: ConstructionSite<BuildableStructureConstant> | null;
    public repairing: AnyStructure | null;

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
        this.building = null;
        this.repairing = null;
    }

    public run(): void {
        const status = (this.creep.memory as any).status;
        if (status !== 'gathering' && this.creep.carry.energy === 0) {
            (this.creep.memory as any).status = 'gathering';
        } else if (status !== 'building' && this.creep.carry.energy === this.creep.carryCapacity) {
            (this.creep.memory as any).status = 'building';
        }
        if ((this.creep.memory as any).status === 'gathering') {
            this.collectEnergy();
        } else {
            this.determineWorkload();
            if (this.repairing || this.building) {
                this.goToConstructionSite();
            } else {
                this.upgradeController();
            }
        }
    }

    private determineWorkload(): void {
        const memRepair = (this.creep.memory as any).repairing || {};
        const memBuild = (this.creep.memory as any).building || {};

        this.building = Game.getObjectById(memBuild.id);
        this.repairing = Game.getObjectById(memRepair.id);

        if (Game.time % 25 === 0) {
            this.building = null;
            this.repairing = null;
        }

        if (!this.repairing || this.repairing.hits > this.repairing.hitsMax / 2) {
            const repairTargets = this.creep.room.find(FIND_STRUCTURES,
                {filter: ((e: Structure) => (e.hits < e.hitsMax / 2) && e.structureType !== STRUCTURE_SPAWN && e.structureType !== STRUCTURE_CONTROLLER)}
            ).sort((a, b) => (a.hits / a.hitsMax) - (b.hits / b.hitsMax));
            this.repairing = repairTargets[0];
        }

        if (!this.building || this.building.progress >= this.building.progressTotal) {
            const targets = this.creep.room.find(FIND_CONSTRUCTION_SITES, {filter: (s) => s.progress < s.progressTotal });
            this.building = targets[0];
        }

        (this.creep.memory as any).building = this.building;
        (this.creep.memory as any).repairing = this.repairing;
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
        if (this.building) {
            if (this.creep.build(this.building) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(this.building, {visualizePathStyle: {stroke: '#000099'}});
            }
        } else if (this.repairing) {
            if (this.creep.repair(this.repairing) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(this.repairing, {visualizePathStyle: {stroke: '#000099'}});
            }
        }
    }

}
