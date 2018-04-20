import { PathStyles } from 'constants/index';
import Task from '../task';
import TickCache from 'services/TickCache';

/**
 * This task is assigned to the creeps that will mine energy.
 */
export default class Mine extends Task {
    type: string = 'mine';
    id: string;
    creep: Creep;

    constructor(id: string, creep: Creep) {
        super();
        this.id = id;
        this.creep = creep;
    }

    run(): void {
        const status = (<any>this.creep.memory).status;
        if (status !== 'gathering' && this.creep.carry.energy === 0) {
            (<any>this.creep.memory).status = 'gathering';
            (<any>this.creep.memory).target = null;
        } else if (status !== 'depositing' && this.creep.carry.energy === this.creep.carryCapacity) {
            (<any>this.creep.memory).status = 'depositing';
            (<any>this.creep.memory).target = null;
        }

        if ((<any>this.creep.memory).status === 'gathering') {
            this.collectEnergy();
        } else {
            this.dropOffEnergy();
        }
    }

    collectEnergy(): void {
        // TODO: Determine which source to hit.
        // Can leverage Memory.source.$sourceID to see how many it can handle
        // will need to associate the creep with that source in memory as well
        // then find the applicable source from memory and direct to it
        const creepMem: any = <any>this.creep.memory;

        if (!creepMem.target) {
            const target = this.creep.pos.findClosestByPath(FIND_SOURCES, {
                filter(source) {
                    const available = Memory['source'][source.id]['points'] - Memory['source'][source.id]['creeps'].length;
                    return available > 0;
                },
            });

            if (target) {
                (<any>this.creep.memory).target = target;
                Memory['source'][target.id]['creeps'].push(this.creep);
            }
        }

        const target = <Source>Game.getObjectById((<any>this.creep.memory).target.id);
        if(target && this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target, PathStyles.GATHERING_SOURCE);
        }
    }

    dropOffEnergy(): void {
        const dropoff = this.creep.room.find(FIND_STRUCTURES, {
            filter: s =>
                (s.structureType === STRUCTURE_CONTAINER && s.store.energy < s.storeCapacity)
                || (s.structureType === STRUCTURE_SPAWN && s.energy < s.energyCapacity)
                || (s.structureType === STRUCTURE_EXTENSION && s.energy < s.energyCapacity),
        });

        if (dropoff.length > 0) {
            if(this.creep.transfer(dropoff[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], PathStyles.UPGRADING);
            }
        } else {
            // Controllers are unique
            const controller = this.creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTROLLER);
            if (controller[0]) {
                if (this.creep.upgradeController(<StructureController>controller[0]) == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(controller[0], PathStyles.UPGRADING);
                }
            }
        }
    }

}