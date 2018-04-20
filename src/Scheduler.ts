// The scheduler decides what needs to happen and then creates tasks for it.
import Constants from './Constants';
import TaskQueue from './TaskQueue';
import Freight from 'tasks/creep/Freight';
import Mine from 'tasks/creep/Mine';
import Build from 'tasks/creep/Build';

export default class Scheduler {
    static getRooms(): {[p: string] : Room} {
        return Game.rooms;
    }

    static createSchedule() {
        let rooms = _.values(this.getRooms());

        _.forEach(rooms, (room: Room) => {
            this.determineWorkload(room);
            this.delegateCreeps(room);
        });
    }

    static determineWorkload(room: Room) {
        

        const CIR = Scheduler.getCreepsInRoom(room);
        const workersInRoom = CIR
            .filter(c => (<any>c.memory).task === 'worker').length;

        const constructionPoints = Scheduler.getConstructionPoints(room).length;
        const buildersInRoom = CIR
            .filter(c => (<any>c.memory).task === 'builder').length;

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

    static getConstructionPoints(room: Room) {
        return room.find(FIND_MY_CONSTRUCTION_SITES);
    }

    static getUnusedSourcePoints(source: Source) {
        if (!Memory['source'][source.id]) {
            const x = source.pos.x;
            const y = source.pos.y;
            const room = source.pos.roomName;

            // The total number of adjacent available points.
            const points = Array.from({ length: 9 }, (_, i) => {
                // TODO: move this into a util and do a for loop, incrementing a counter
                // delta(x) (col) given by getting the modulus of the max, and then subtracting the middle
                // delta(y) (row) given by dividing by the max, and then subtracting the middle.
                const xd = i % 3 - 1;
                const yd = Math.floor(i / 3 - 1);
                return Game.map.getTerrainAt(x + xd, y - yd, room);
            }).filter(_ => _ !== 'wall').length;

            Memory['source'][source.id] = {
                creeps: [],
                points,
            };
        }
        return Memory['source'][source.id];
    }

    static delegateCreeps(room: Room) {
        let creeps = this.getCreepsInRoom(room);

        _.forEach(creeps, (creep: Creep) => {
            let memory = creep.memory;
            if (!memory.hasOwnProperty('task')) {
                (<any>creep.memory).task = this.assignTaskByBodyParts(creep);
            }

            switch ((<any>creep.memory).task) {
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
    }

    static getCreepsInRoom(room: Room): Creep[] {
        return (<Creep[]>_.values(Game.creeps)).filter((c) => c.room.name === room.name);
    }

    static taskMap = {
        'carry': 'hauler',
        'move': 'builder',
        'work': 'worker',
        'attack': 'soldier',
        'ranged_attack': 'soldier',
        'heal': 'medic'
    };

    static assignTaskByBodyParts(creep: Creep) {
        let counts = _.reduce(creep.body, (acc: any, val) => {
            acc[val.type] = (acc[val.type] || 0) + 1;
            return acc;
        }, {});
        delete counts.tough;
        let keysSorted = Object.keys(counts).sort(function(a,b){return counts[a]-counts[b]});
        return (<any>this.taskMap)[keysSorted[0]];
    }

    static partMap = {
        'hauler': [MOVE, CARRY, CARRY],
        'builder': [MOVE, WORK, CARRY],
        'worker': [MOVE, WORK, CARRY]
    };
    static requisitionCreep(type: string, room: Room) {
        const parts = (<any>this.partMap)[type];
        const spawner = room.find(FIND_MY_SPAWNS)
            .filter((s) => s.spawnCreep(parts, '', {dryRun: true}) && !s.spawning)[0];
        if (spawner) {
            spawner.spawnCreep(parts, type+new Date().getUTCMilliseconds(), {memory: {task: type}});
        }
    }
}