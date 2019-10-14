// The scheduler decides what needs to happen and then creates tasks for it.
import _ from 'lodash';
import Build from 'tasks/creep/Build';
import Freight from 'tasks/creep/Freight';
import Mine from 'tasks/creep/Mine';
import Universal from 'tasks/tower/universal';
import Constants from './Constants';
import TaskQueue from './TaskQueue';

export default class Scheduler {
    public static getRooms(): {[p: string]: Room} {
        return Game.rooms;
    }

    public static createSchedule() {
        const rooms = _.values(this.getRooms());

        _.forEach(rooms, (room: Room) => {
            this.determineWorkload(room);
            this.delegateTowers(room);
            this.delegateCreeps(room);
        });
    }

    private static determineWorkload(room: Room) {
        const CIR = room.find(FIND_MY_CREEPS);
        const workersInRoom = CIR
            .filter(c => (c.memory as any).task === 'worker').length;

        const constructionPoints = Scheduler.getConstructionPoints(room).length;
        const repairPoints = Scheduler.getRepairPoints(room).length;
        const buildersInRoom = CIR
            .filter(c => (c.memory as any).task === 'builder').length;

        if ((constructionPoints + repairPoints) / Constants.CONSTRUCTION_POINTS_PER_BUILDER > buildersInRoom) {
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

    private static getConstructionPoints(room: Room) {
        return room.find(FIND_MY_CONSTRUCTION_SITES);
    }

    private static getRepairPoints(room: Room) {
        return room.find(FIND_MY_STRUCTURES).filter(e => e.hits > e.hitsMax / 2);
    }

    private static getUnusedSourcePoints(source: Source) {
        if (!(Memory as any)['source'][source.id]) {
          const x = source.pos.x;
          const y = source.pos.y;
          const room = source.pos.roomName;

          // The total number of adjacent available points.
          let points = 0;
          for (let i = 0; i < 9; i++) {
            // delta(x) (col) given by getting the modulus of the max, and then subtracting the middle
            // delta(y) (row) given by dividing by the max, and then subtracting the middle.
            const xd = i % 3 - 1;
            const yd = Math.floor(i / 3 - 1);
            const type = Game.map.getRoomTerrain(room).get(x + xd, y - yd);

            if (type !== TERRAIN_MASK_WALL) {
              points++;
            }
          }

          (Memory as any)['source'][source.id] = {
            creeps: [],
            points
          };
        }
        return (Memory as any)['source'][source.id];
    }

    private static delegateCreeps(room: Room) {
        const creeps = room.find(FIND_MY_CREEPS);

        _.forEach(creeps, (creep: Creep) => {
            const memory = creep.memory;
            if (!memory.hasOwnProperty('task')) {
                (creep.memory as any).task = this.assignTaskByBodyParts(creep);
            }

            switch ((creep.memory as any).task) {
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

    private static delegateTowers(room: Room) {
        const towers: StructureTower[] = (room.find(FIND_MY_STRUCTURES, {filter: (e) => e.structureType === STRUCTURE_TOWER}) as StructureTower[]);

        _.forEach(towers, (tower: StructureTower) => {
            TaskQueue.add(new Universal('0', tower));
        });
    }

    private static taskMap = {
        attack: 'soldier',
        carry: 'hauler',
        heal: 'medic',
        move: 'builder',
        ranged_attack: 'soldier',
        work: 'worker'
    };

    private static assignTaskByBodyParts(creep: Creep) {
        const counts = _.reduce(creep.body, (acc: any, val) => {
            acc[val.type] = (acc[val.type] || 0) + 1;
            return acc;
        }, {});
        delete counts.tough;
        const keysSorted = Object.keys(counts).sort((a, b) => counts[a] - counts[b]);
        return (this.taskMap as any)[keysSorted[0]];
    }

    private static partMap = {
        builder: [MOVE, WORK, CARRY],
        claimer: [MOVE, CLAIM],
        hauler: [MOVE, CARRY, CARRY],
        worker: [MOVE, WORK, CARRY]
    };

    private static requisitionCreep(type: string, room: Room) {
        const parts = (this.partMap as any)[type];
        const spawner = room.find(FIND_MY_SPAWNS)
            .filter((s) => s.spawnCreep(parts, '', {dryRun: true}) && !s.spawning)[0];
        if (spawner) {
            spawner.spawnCreep(parts, type + new Date().getUTCMilliseconds(), {memory: {task: type}});
        }
    }
}
