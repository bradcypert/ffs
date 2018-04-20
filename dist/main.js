'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var Constants = {
    SOURCE_POINT_TTL: 100,
    CONSTRUCTION_POINT_TTL: 100,
    CONSTRUCTION_POINTS_PER_BUILDER: 10,
    CPU_BUFFER: 100,
    CPU_MINIMUM: 0.30,
    CPU_ADJUST: 0.05,
    CPU_BOOST: 0,
};
//# sourceMappingURL=Constants.js.map

/**
 * The task queue is a simple buffer for running tasks.
 * The kernel operates on values in the queue based on remaining CPU availability
 * and the Scheduler populates the queue based off the state of the game.
 */
var TaskQueue = /** @class */ (function () {
    function TaskQueue() {
    }
    /**
     * Add a new task to the queue.
     * @param {Task} task
     */
    TaskQueue.add = function (task) {
        if (task) {
            this.queue.push(task);
        }
    };
    TaskQueue.hasTasks = function () {
        return this.queue.length > 0;
    };
    /**
     * Get and remove the next task from the queue.
     * Might be useful for deferring execution of high CPU tasks.
     */
    TaskQueue.pop = function () {
        return this.queue.shift();
    };
    TaskQueue.peek = function () {
        return this.queue[0];
    };
    /**
     * Process the next task in the queue.
     */
    TaskQueue.process = function () {
        var task = this.pop();
        if (task) {
            task.run();
        }
        else {
            console.log("Trying to process an empty queue. Error code: QUAILHOUND");
        }
    };
    TaskQueue.queue = [];
    return TaskQueue;
}());

//# sourceMappingURL=TaskQueue.js.map

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = Object.setPrototypeOf ||
    ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
    function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var Task = /** @class */ (function () {
    function Task() {
    }
    return Task;
}());

//# sourceMappingURL=Task.js.map

var Freight = /** @class */ (function (_super) {
    __extends(Freight, _super);
    function Freight(id, creep) {
        var _this = _super.call(this) || this;
        _this.type = 'freight';
        _this.id = id;
        _this.creep = creep;
        _this.targets = creep.room.find(FIND_STRUCTURES).filter(function (s) { return s.structureType === STRUCTURE_CONTAINER; });
        return _this;
    }
    Freight.prototype.run = function () {
        if (this.creep.carry.energy < this.creep.carryCapacity) {
            this.collectEnergy();
        }
        else {
            this.dropOffEnergy();
        }
    };
    Freight.prototype.collectEnergy = function () {
    };
    Freight.prototype.dropOffEnergy = function () {
    };
    return Freight;
}(Task));

//# sourceMappingURL=Freight.js.map

var Mine = /** @class */ (function (_super) {
    __extends(Mine, _super);
    function Mine(id, creep) {
        var _this = _super.call(this) || this;
        _this.type = 'mine';
        _this.id = id;
        _this.creep = creep;
        _this.targets = creep.room.find(FIND_SOURCES);
        return _this;
    }
    Mine.prototype.run = function () {
        var status = this.creep.memory.status;
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
    };
    Mine.prototype.collectEnergy = function () {
        // TODO: Determine which source to hit.
        // Can leverage Memory.source.$sourceID to see how many it can handle
        // will need to associate the creep with that source in memory as well
        // then find the applicable source from memory and direct to it
        if (!this.creep.memory.target) {
            var target_1 = this.targets.sort(function (a, b) {
                var aa = Memory['source'][a.id]['points'] + Memory['source'][a.id]['creeps'].length;
                var bb = Memory['source'][b.id]['points'] + Memory['source'][b.id]['creeps'].length;
                if (aa === bb)
                    return 0;
                if (aa < bb)
                    return -1;
                else
                    return 1;
            })[0];
            if (target_1) {
                this.creep.memory.target = target_1;
                Memory['source'][target_1.id]['creeps'].push(this.creep);
            }
        }
        var target = Game.getObjectById(this.creep.memory.target.id);
        if (target && this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffff33' } });
        }
    };
    Mine.prototype.dropOffEnergy = function () {
        var dropoff = this.creep.room.find(FIND_STRUCTURES).filter(function (s) {
            return (s.structureType === STRUCTURE_CONTAINER && s.store.energy < s.storeCapacity)
                || (s.structureType === STRUCTURE_SPAWN && s.energy < s.energyCapacity)
                || (s.structureType === STRUCTURE_EXTENSION && s.energy < s.energyCapacity);
        });
        if (dropoff.length > 0) {
            if (this.creep.transfer(dropoff[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
        else {
            // Controllers are unique
            var controller = this.creep.room.find(FIND_STRUCTURES).filter(function (s) { return s.structureType === STRUCTURE_CONTROLLER; });
            if (controller[0]) {
                if (this.creep.upgradeController(controller[0]) == ERR_NOT_IN_RANGE) {
                    this.creep.moveTo(controller[0], { visualizePathStyle: { stroke: '#ffffff' } });
                }
            }
        }
    };
    return Mine;
}(Task));

//# sourceMappingURL=Mine.js.map

var Build = /** @class */ (function (_super) {
    __extends(Build, _super);
    function Build(id, creep) {
        var _this = _super.call(this) || this;
        _this.type = 'build';
        _this.id = id;
        _this.creep = creep;
        _this.targets = [];
        return _this;
    }
    Build.prototype.run = function () {
        // TODO: This is expensive, defer or cache this please.
        this.targets = this.creep.room.find(FIND_CONSTRUCTION_SITES);
        var status = this.creep.memory.status;
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
    };
    Build.prototype.collectEnergy = function () {
        var _this = this;
        var dropoff = this.creep.room.find(FIND_STRUCTURES).filter(function (s) {
            return s.structureType === STRUCTURE_CONTAINER
                && s.store.energy > _this.creep.carryCapacity;
        });
        if (dropoff.length > 0) {
            if (this.creep.withdraw(dropoff[0], RESOURCE_ENERGY) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(dropoff[0], { visualizePathStyle: { stroke: '#0000FF' } });
            }
        }
        else {
            // Manually Harvest it
            var target = this.creep.room.find(FIND_SOURCES).pop();
            if (target && this.creep.harvest(target) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(target, { visualizePathStyle: { stroke: '#ffff33' } });
            }
        }
    };
    Build.prototype.upgradeController = function () {
        var controller = this.creep.room.find(FIND_STRUCTURES).filter(function (s) { return s.structureType === STRUCTURE_CONTROLLER; });
        if (controller[0]) {
            if (this.creep.upgradeController(controller[0]) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(controller[0], { visualizePathStyle: { stroke: '#ffffff' } });
            }
        }
    };
    Build.prototype.goToConstructionSite = function () {
        var targets = this.targets.filter(function (s) { return s.progress < s.progressTotal; });
        if (targets.length > 0) {
            if (this.creep.build(targets[0]) == ERR_NOT_IN_RANGE) {
                this.creep.moveTo(targets[0], { visualizePathStyle: { stroke: '#000099' } });
            }
        }
    };
    return Build;
}(Task));

//# sourceMappingURL=Build.js.map

// The scheduler decides what needs to happen and then creates tasks for it.
var Scheduler = /** @class */ (function () {
    function Scheduler() {
    }
    Scheduler.getRooms = function () {
        return Game.rooms;
    };
    Scheduler.createSchedule = function () {
        var _this = this;
        var rooms = _.values(this.getRooms());
        _.forEach(rooms, function (room) {
            _this.determineWorkload(room);
            _this.delegateCreeps(room);
        });
    };
    Scheduler.determineWorkload = function (room) {
        var CIR = Scheduler.getCreepsInRoom(room);
        var workersInRoom = CIR
            .filter(function (c) { return c.memory.task === 'worker'; }).length;
        var constructionPoints = Scheduler.getConstructionPoints(room).length;
        var buildersInRoom = CIR
            .filter(function (c) { return c.memory.task === 'builder'; }).length;
        if (constructionPoints / Constants.CONSTRUCTION_POINTS_PER_BUILDER > buildersInRoom) {
            this.requisitionCreep('builder', room);
        }
        var sources = room.find(FIND_SOURCES);
        var unworkedSourcePoints = sources
            .map(Scheduler.getUnusedSourcePoints)
            .map(function (e) { return e.points; })
            .reduce(function (acc, val) { return acc + val; }, 0);
        if (unworkedSourcePoints > workersInRoom - sources.length) {
            this.requisitionCreep('worker', room);
        }
    };
    Scheduler.getConstructionPoints = function (room) {
        return room.find(FIND_MY_CONSTRUCTION_SITES);
    };
    Scheduler.getUnusedSourcePoints = function (source) {
        if (!Memory['source'][source.id]) {
            var x = source.pos.x;
            var y = source.pos.y;
            var room = source.pos.roomName;
            var m = Game.map.getTerrainAt;
            Memory['source'][source.id] = {
                points: [m(x - 1, y + 1, room), m(x, y + 1, room), m(x + 1, y + 1, room),
                    m(x - 1, y, room), 'wall', m(x + 1, y, room),
                    m(x - 1, y - 1, room), m(x, y - 1, room), m(x + 1, y - 1, room)].filter(function (s) { return s === 'wall'; }).length,
                creeps: []
            };
        }
        return Memory['source'][source.id];
    };
    Scheduler.delegateCreeps = function (room) {
        var _this = this;
        var creeps = this.getCreepsInRoom(room);
        _.forEach(creeps, function (creep) {
            var memory = creep.memory;
            if (!memory.hasOwnProperty('task')) {
                creep.memory.task = _this.assignTaskByBodyParts(creep);
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
            }
        });
    };
    Scheduler.getCreepsInRoom = function (room) {
        return _.values(Game.creeps).filter(function (c) { return c.room.name === room.name; });
    };
    Scheduler.assignTaskByBodyParts = function (creep) {
        var counts = _.reduce(creep.body, function (acc, val) {
            acc[val.type] = (acc[val.type] || 0) + 1;
            return acc;
        }, {});
        delete counts.tough;
        var keysSorted = Object.keys(counts).sort(function (a, b) { return counts[a] - counts[b]; });
        return this.taskMap[keysSorted[0]];
    };
    Scheduler.requisitionCreep = function (type, room) {
        var parts = this.partMap[type];
        var spawner = room.find(FIND_MY_SPAWNS)
            .filter(function (s) { return s.spawnCreep(parts, '', { dryRun: true }) && !s.spawning; })[0];
        if (spawner) {
            spawner.spawnCreep(parts, type + new Date().getUTCMilliseconds(), { memory: { task: type } });
        }
    };
    Scheduler.taskMap = {
        'carry': 'hauler',
        'move': 'builder',
        'work': 'worker',
        'attack': 'soldier',
        'ranged_attack': 'soldier',
        'heal': 'medic'
    };
    Scheduler.partMap = {
        'hauler': [MOVE, CARRY, CARRY],
        'builder': [MOVE, WORK, CARRY],
        'worker': [MOVE, WORK, CARRY]
    };
    return Scheduler;
}());

//# sourceMappingURL=Scheduler.js.map

var Kernel = /** @class */ (function () {
    function Kernel() {
    }
    Kernel.tick = function () {
        while (TaskQueue.hasTasks()
            && this.CPUAvailable()) {
            TaskQueue.process();
        }
    };
    Kernel.CPUAvailable = function () {
        var cpuUsed = Game.cpu.getUsed();
        var cpuLimit = Game.cpu.limit;
        return (cpuLimit - (Constants.CPU_BUFFER * Constants.CPU_ADJUST) > cpuUsed);
    };
    return Kernel;
}());

//# sourceMappingURL=Kernel.js.map

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
if (!Memory['source'])
    Memory['source'] = {};
var loop = function () {
    console.log("Current game tick is " + Game.time);
    // should be moved into the source identification process
    if (Game.time % 25 === 0) {
        Memory['source'] = {};
    }
    // Automatically delete memory of missing creeps
    for (var name_1 in Memory.creeps) {
        if (!(name_1 in Game.creeps)) {
            delete Memory.creeps[name_1];
        }
    }
    Scheduler.createSchedule();
    Kernel.tick();
};
//# sourceMappingURL=main.js.map

exports.loop = loop;
//# sourceMappingURL=main.js.map
