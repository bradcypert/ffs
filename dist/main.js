'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var _ = _interopDefault(require('lodash'));

/**
 * The task queue is a simple buffer for running tasks.
 * The kernel operates on values in the queue based on remaining CPU availability
 * and the Scheduler populates the queue based off the state of the game.
 */
class TaskQueue {
    /**
     * Add a new task to the queue.
     * @param {Task} task
     */
    static add(task) {
        if (task) {
            this.queue.push(task);
        }
    }
    static hasTasks() {
        return this.queue.length > 0;
    }
    /**
     * Get and remove the next task from the queue.
     * Might be useful for deferring execution of high CPU tasks.
     */
    static pop() {
        return this.queue.shift();
    }
    static peek() {
        return this.queue[0];
    }
    /**
     * Process the next task in the queue.
     */
    static process() {
        const task = this.pop();
        if (task) {
            task.run();
        }
        else {
            console.log('Trying to process an empty queue. Error code: QUAILHOUND');
        }
    }
}
TaskQueue.queue = [];

var Constants = {
    CONSTRUCTION_POINTS_PER_BUILDER: 10,
    CONSTRUCTION_POINT_TTL: 100,
    CPU_ADJUST: 0.05,
    CPU_BOOST: 0,
    CPU_BUFFER: 100,
    CPU_MINIMUM: 0.30,
    SOURCE_POINT_TTL: 100
};

class Kernel {
    static tick() {
        while (TaskQueue.hasTasks()
            && this.CPUAvailable()) {
            TaskQueue.process();
        }
    }
    static CPUAvailable() {
        const cpuUsed = Game.cpu.getUsed();
        const cpuLimit = Game.cpu.limit;
        return (cpuLimit - (Constants.CPU_BUFFER * Constants.CPU_ADJUST) > cpuUsed);
    }
}

class Task {
}

/**
 * This task is assigned to creeps that will build / upgrade
 */
class Build extends Task {
    constructor(id, creep) {
        super();
        this.type = 'build';
        this.id = id;
        this.creep = creep;
        this.targets = [];
    }
    run() {
        // TODO: This is expensive, defer or cache this please.
        this.targets = this.creep.room.find(FIND_CONSTRUCTION_SITES);
        const status = this.creep.memory.status;
        if (status !== 'gathering' && this.creep.carry.energy === 0) {
            this.creep.memory.status = 'gathering';
        }
        else if (status !== 'building' && this.creep.carry.energy === this.creep.carryCapacity) {
            this.creep.memory.status = 'building';
        }
        if (this.creep.memory.status === 'gathering') {
            this.collectEnergy();
        }
        else {
            if (this.targets.length > 0) {
                this.goToConstructionSite();
            }
            else {
                this.upgradeController();
            }
        }
    }
    collectEnergy() {
        const dropoff = this.creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER
            && s.store.energy > this.creep.carryCapacity);
        if (dropoff.length > 0) {
            if (this.creep.withdraw(dropoff[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], { visualizePathStyle: { stroke: '#0000FF' } });
            }
        }
        else {
            // Manually Harvest it
            const target = this.creep.room.find(FIND_SOURCES).pop();
            if (target && this.creep.harvest(target) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffff33' } });
            }
        }
    }
    upgradeController() {
        const controller = this.creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTROLLER);
        if (controller[0]) {
            if (this.creep.upgradeController(controller[0]) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(controller[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    }
    goToConstructionSite() {
        const targets = this.targets.filter((s) => s.progress < s.progressTotal);
        if (targets.length > 0) {
            if (this.creep.build(targets[0]) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#000099' } });
            }
        }
    }
}

/**
 * This task is assigned to creeps that transfer from containers to the spawn.
 */
class Freight extends Task {
    constructor(id, creep) {
        super();
        this.type = 'freight';
        this.id = id;
        this.creep = creep;
        this.targets = creep.room.find(FIND_STRUCTURES).filter(s => s.structureType === STRUCTURE_CONTAINER);
    }
    run() {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.collectEnergy();
        }
        else {
            this.dropOffEnergy();
        }
    }
    collectEnergy() {
        /** no op */
    }
    dropOffEnergy() {
        /** no op */
    }
}

/**
 * This task is assigned to the creeps that will mine energy.
 */
class Mine extends Task {
    constructor(id, creep) {
        super();
        this.type = 'mine';
        this.id = id;
        this.creep = creep;
        this.targets = creep.room.find(FIND_SOURCES);
    }
    run() {
        const status = this.creep.memory.status;
        if (status !== 'gathering' && this.creep.carry.energy === 0) {
            this.creep.memory.status = 'gathering';
        }
        else if (status !== 'depositing' && this.creep.carry.energy === this.creep.carryCapacity) {
            this.creep.memory.status = 'depositing';
        }
        if (this.creep.memory.status === 'gathering') {
            this.collectEnergy();
        }
        else {
            this.dropOffEnergy();
        }
    }
    collectEnergy() {
        // TODO: Determine which source to hit.
        // Can leverage Memory.source.$sourceID to see how many it can handle
        // will need to associate the creep with that source in memory as well
        // then find the applicable source from memory and direct to it
        if (!this.creep.memory.target) {
            const target = this.targets.sort((a, b) => {
                const aa = Memory['source'][a.id]['points'] + Memory['source'][a.id]['creeps'].length;
                const bb = Memory['source'][b.id]['points'] + Memory['source'][b.id]['creeps'].length;
                if (aa === bb) {
                    return 0;
                }
                if (aa < bb) {
                    return -1;
                }
                else {
                    return 1;
                }
            })[0];
            if (target) {
                this.creep.memory.target = target;
                Memory['source'][target.id]['creeps'].push(this.creep);
            }
        }
        const target = Game.getObjectById(this.creep.memory.target.id);
        if (target && this.creep.harvest(target) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffff33' } });
        }
    }
    dropOffEnergy() {
        const dropoff = this.creep.room.find(FIND_STRUCTURES).filter(s => (s.structureType === STRUCTURE_CONTAINER && s.store.energy < s.storeCapacity)
            || (s.structureType === STRUCTURE_SPAWN && s.energy < s.energyCapacity)
            || (s.structureType === STRUCTURE_EXTENSION && s.energy < s.energyCapacity));
        if (dropoff.length > 0) {
            if (this.creep.transfer(dropoff[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
        else {
            // Controllers are unique
            const controller = this.creep.room.find(FIND_STRUCTURES)
                .filter(s => s.structureType === STRUCTURE_CONTROLLER);
            if (controller[0]) {
                if (this.creep.upgradeController(controller[0]) === ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(controller[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    }
}

// The scheduler decides what needs to happen and then creates tasks for it.
class Scheduler {
    static getRooms() {
        return Game.rooms;
    }
    static createSchedule() {
        const rooms = _.values(this.getRooms());
        _.forEach(rooms, (room) => {
            this.determineWorkload(room);
            this.delegateCreeps(room);
        });
    }
    static determineWorkload(room) {
        const CIR = Scheduler.getCreepsInRoom(room);
        const workersInRoom = CIR
            .filter(c => c.memory.task === 'worker').length;
        const constructionPoints = Scheduler.getConstructionPoints(room).length;
        const buildersInRoom = CIR
            .filter(c => c.memory.task === 'builder').length;
        if (constructionPoints / Constants.CONSTRUCTION_POINTS_PER_BUILDER > buildersInRoom) {
            this.requisitionCreep('builder', room);
        }
        const sources = room.find(FIND_SOURCES);
        const unworkedSourcePoints = sources
            .map(Scheduler.getUnusedSourcePoints)
            .map(e => e.points)
            .reduce((acc, val) => acc + val, 0);
        if (unworkedSourcePoints > workersInRoom - sources.length) {
            this.requisitionCreep('worker', room);
        }
    }
    static getConstructionPoints(room) {
        return room.find(FIND_MY_CONSTRUCTION_SITES);
    }
    static getUnusedSourcePoints(source) {
        if (!Memory['source'][source.id]) {
            const x = source.pos.x;
            const y = source.pos.y;
            const room = source.pos.roomName;
            // The total number of adjacent available points.
            const points = Array.from({ length: 9 }, (_$$1, i) => {
                // TODO: move this into a util and do a for loop, incrementing a counter
                // delta(x) (col) given by getting the modulus of the max, and then subtracting the middle
                // delta(y) (row) given by dividing by the max, and then subtracting the middle.
                const xd = i % 3 - 1;
                const yd = Math.floor(i / 3 - 1);
                return Game.map.getTerrainAt(x + xd, y - yd, room);
            }).filter(_$$1 => _$$1 !== 'wall').length;
            Memory['source'][source.id] = {
                creeps: [],
                points
            };
        }
        return Memory['source'][source.id];
    }
    static delegateCreeps(room) {
        const creeps = this.getCreepsInRoom(room);
        _.forEach(creeps, (creep) => {
            const memory = creep.memory;
            if (!memory.hasOwnProperty('task')) {
                creep.memory.task = this.assignTaskByBodyParts(creep);
            }
            switch (creep.memory.task) {
                case 'hauler':
                    TaskQueue.add(new Freight('0', creep));
                    break;
                case 'worker':
                    TaskQueue.add(new Mine('0', creep));
                    break;
                case 'builder':
                    TaskQueue.add(new Build('0', creep));
                    break;
                default:
                    console.log(`No valid task found for ${creep.id}`);
                    break;
            }
        });
    }
    static getCreepsInRoom(room) {
        return _.values(Game.creeps).filter((c) => c.room.name === room.name);
    }
    static assignTaskByBodyParts(creep) {
        const counts = _.reduce(creep.body, (acc, val) => {
            acc[val.type] = (acc[val.type] || 0) + 1;
            return acc;
        }, {});
        delete counts.tough;
        const keysSorted = Object.keys(counts).sort((a, b) => counts[a] - counts[b]);
        return this.taskMap[keysSorted[0]];
    }
    static requisitionCreep(type, room) {
        const parts = this.partMap[type];
        const spawner = room.find(FIND_MY_SPAWNS)
            .filter((s) => s.spawnCreep(parts, '', { dryRun: true }) && !s.spawning)[0];
        if (spawner) {
            spawner.spawnCreep(parts, type + new Date().getUTCMilliseconds(), { memory: { task: type } });
        }
    }
}
Scheduler.taskMap = {
    attack: 'soldier',
    carry: 'hauler',
    heal: 'medic',
    move: 'builder',
    ranged_attack: 'soldier',
    work: 'worker'
};
Scheduler.partMap = {
    builder: [MOVE, WORK, CARRY],
    hauler: [MOVE, CARRY, CARRY],
    worker: [MOVE, WORK, CARRY]
};

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
if (!Memory['source']) {
    Memory['source'] = {};
}
const loop = () => {
    console.log(`Current game tick is ${Game.time}`);
    // should be moved into the source identification process
    if (Game.time % 25 === 0) {
        Memory['source'] = {};
    }
    // Automatically delete memory of missing creeps
    for (const name in Memory.creeps) {
        if (!(name in Game.creeps)) {
            delete Memory.creeps[name];
        }
    }
    Scheduler.createSchedule();
    Kernel.tick();
};

exports.loop = loop;
//# sourceMappingURL=main.js.map
