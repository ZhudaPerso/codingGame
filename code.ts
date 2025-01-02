// Type / Interface =========================================================
type Point = [number, number]; // [x, y]
type TAction = 'eat' | 'attack';
interface ISource {
    A: number,
    B: number,
    C: number,
    D: number
}

interface IInfo {
    x: number, // -
    y: number, // |
    type: null | string, // WALL, ROOT, BASIC, TENTACLE, HARVESTER, SPORER, A, B, C, D
    owner: null | number, // 1 if your organ, 0 if enemy organ, -1 if neither
    organId: null | number, // id of this entity if it's an organ, 0 otherwise
    organDir: null | string, // N,E,S,W or X if not an organ
    organParentId: null | number,
    organRootId: null | number,
    childNumber: number,
    // organRootLen: number, // todo
    // organChildLen: number, // todo
    myHarvester: number, // 0: null, origin rootId
    oppHarvester: number, // 0: null, origin rootId
    myTentacle: number, // 0: null, origin rootId
    oppTentacle: number, // 0: null, origin rootId
    targetType: null | string,
    target: IInfo,
    inter: IInfo,
    organToTargetPath: IInfo[],
    targetToOrganPath: IInfo[],
}

interface IProteineInfo {
    x: number,
    y: number,
    type: string,
    path: IInfo[],
    pathLength: number,
    nearestOwnerOrgan: IInfo,
}

interface IProduction {
    basic: number,
    harvester: number, // 生产的 h 数量
    tentacle: number, // 生产的 t 数量
    sporer: number, // 生产的 s 数量
    total: number, // 总生产数量
};

interface IPathOption {
    bloqueHarvester: boolean;
    bloqueTentacle: boolean;
}
type Node = {
    id: number;
    x: number;
    y: number;
    parentId: number | null;
};
type ChildValue = {
    id: number;
    x: number;
    y: number;
    child: number;
}
type Data = Record<number, Node>;

// Constant =====================================================================
var inputs: string[] = readline().split(' ');
const TOrgan = {
    wall: 'WALL',
    basic: 'BASIC',
    harvester: 'HARVESTER',
    tentacle: 'TENTACLE',
    sporer: 'SPORER',
    root: 'ROOT',
}
const TTarget = {
    proteine: 'proteine',
    opp: 'opp',
    space: 'space',
}
const TLog = {
    wait: 'WAIT',
    grow: 'GROW',
    spore: 'SPORE',
}
const proteineTypes = ['A', 'B', 'C', 'D'];
const width: number = parseInt(inputs[0]); // columns in the game grid
const height: number = parseInt(inputs[1]); // rows in the game grid
let map: IInfo[][] = [];
let mapBefore: IInfo[][] = [];
let myRootArr: IInfo[] = [];
let oppRootArr: IInfo[] = [];
let tour = 0;
const mySource: ISource = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
}
const oppSource: ISource = {
    A: 0,
    B: 0,
    C: 0,
    D: 0,
}
const direction = {
    N: { x: 0, y: -1 },
    S: { x: 0, y: 1 },
    W: { x: -1, y: 0 },
    E: { x: 1, y: 0 },
}
let production: IProduction = {
    basic: 0,
    harvester: 0, // 生产的 h 数量
    tentacle: 0, // 生产的 t 数量
    sporer: 0, // 生产的 s 数量
    total: 0, // 总生产数量
}

// Init Utils ==================================================================
const initMapCoor = (width: number, height: number) => {
    for (let i = 0; i < width; i++) { // x
        map.push([]);
        for (let j = 0; j < height; j++) { // y
            map[i].push({
                x: i,
                y: j,
                type: null, // WALL | ROOT | BASIC | A
                owner: null, // 1: my, 0: opp, -1: null
                organId: null, // id | 0
                organDir: null, // N | W | S | E | X
                organParentId: null, // parentId | 0: root | -1
                organRootId: 0, // rootId | -1
                childNumber: 0,
                myHarvester: 0, // 0: null, origin rootId
                oppHarvester: 0, // 0: null, origin rootId
                myTentacle: 0, // 0: null, origin rootId
                oppTentacle: 0, // 0: null, origin rootId
                targetType: null,
                target: null,
                inter: null,
                organToTargetPath: [],
                targetToOrganPath: [],

            })
        }
    }
}

const initMapType = (map: IInfo[][]) => {
    const mapFlat = map.flat();
    const harvesterArr = mapFlat.filter(e => e.type === TOrgan.harvester);
    const tentacleArr = mapFlat.filter(e => e.type === TOrgan.tentacle);

    for (let i = 0; i < harvesterArr.length; i++) {
        const coor = harvesterArr[i];
        if (coor.organDir === 'N' && coor.y > 0) {
            const dstCoor = map[coor.x][coor.y - 1];
            if (!isProteine(dstCoor)) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myHarvester = 1;
            } else {
                dstCoor.oppHarvester = 1;
            }
        } else if (coor.organDir === 'S' && coor.y < height - 1) {
            const dstCoor = map[coor.x][coor.y + 1];
            if (!isProteine(dstCoor)) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myHarvester = 1;
            } else {
                dstCoor.oppHarvester = 1;
            }
        } else if (coor.organDir === 'W' && coor.x > 0) {
            const dstCoor = map[coor.x - 1][coor.y];
            if (!isProteine(dstCoor)) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myHarvester = 1;
            } else {
                dstCoor.oppHarvester = 1;
            }
        } else if (coor.organDir === 'E' && coor.x < width - 1) {
            const dstCoor = map[coor.x + 1][coor.y];
            if (!isProteine(dstCoor)) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myHarvester = 1;
            } else {
                dstCoor.oppHarvester = 1;
            }
        }
    }
    for (let i = 0; i < tentacleArr.length; i++) {
        const coor = tentacleArr[i];
        if (coor.organDir === 'N' && coor.y > 0) {
            const dstCoor = map[coor.x][coor.y - 1];
            if (dstCoor.type === TOrgan.wall) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myTentacle = 1;
            } else {
                dstCoor.oppTentacle = 1;
            }
        } else if (coor.organDir === 'S' && coor.y < height - 1) {
            const dstCoor = map[coor.x][coor.y + 1];
            if (dstCoor.type === TOrgan.wall) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myTentacle = 1;
            } else {
                dstCoor.oppTentacle = 1;
            }
        } else if (coor.organDir === 'W' && coor.x > 0) {
            const dstCoor = map[coor.x - 1][coor.y];
            if (dstCoor.type === TOrgan.wall) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myTentacle = 1;
            } else {
                dstCoor.oppTentacle = 1;
            }
        } else if (coor.organDir === 'E' && coor.x < width - 1) {
            const dstCoor = map[coor.x + 1][coor.y];
            if (dstCoor.type === TOrgan.wall) {
                continue;
            }
            if (coor.owner === 1) {
                dstCoor.myTentacle = 1;
            } else {
                dstCoor.oppTentacle = 1;
            }
        }
    }
}

const initMapChilds = (map: IInfo[][]) => {
    const mapFlat = map.flat();
    const organs = mapFlat.filter(e => e.organRootId !== 0);
    const data: Record<number, Node> = {}

    for (let i = 0; i < organs.length; i++) {
        const organ = organs[i];
        data[organ.organId] = {
            id: organ.organId,
            x: organ.x,
            y: organ.y,
            parentId: organ.organParentId,
        }
    }
    const count = generateChildCount(data);
    const countKeys = Object.keys(count);
    for (let i = 0; i < countKeys.length; i++) {
        const key = countKeys[i];
        const value: ChildValue = count[key];
        map[value.x][value.y].childNumber = value.child;
    }
}

const generateChildCount = (data: Data): Record<number, Omit<Node, 'parentId'> & { child: number }> => {
    // 构建子节点的映射
    const childMap: Record<number, number[]> = {};
    Object.values(data).forEach((node) => {
        if (node.parentId !== null) {
            if (!childMap[node.parentId]) {
                childMap[node.parentId] = [];
            }
            childMap[node.parentId].push(node.id);
        }
    });

    // 递归计算子节点数量
    const result: Record<number, Omit<Node, 'parentId'> & { child: number }> = {};

    const countDescendants = (nodeId: number): number => {
        if (!childMap[nodeId] || childMap[nodeId].length === 0) {
            // 如果没有子节点，子节点数量为 0
            result[nodeId] = {
                id: data[nodeId].id,
                x: data[nodeId].x,
                y: data[nodeId].y,
                child: 0,
            };
            return 0;
        }

        // 计算子节点及其所有后代的数量
        const childCount = childMap[nodeId].reduce((acc, childId) => {
            return acc + countDescendants(childId) + 1; // 子节点本身也算一个
        }, 0);

        result[nodeId] = {
            id: data[nodeId].id,
            x: data[nodeId].x,
            y: data[nodeId].y,
            child: childCount,
        };

        return childCount;
    }

    // 计算每个节点的子节点数量
    Object.keys(data).forEach((key) => {
        const nodeId = Number(key);
        if (!(nodeId in result)) {
            countDescendants(nodeId);
        }
    });

    return result;
}

// Utils ========================================================================
const isWall = (coor: IInfo) => {
    if (coor.type === TOrgan.wall) {
        return true;
    }
    return false;
}

const isProteine = (coor: IInfo) => {
    if (proteineTypes.includes(coor.type)) {
        return true;
    }
    return false;
}

const isOwnerOrgan = (coor: IInfo) => {
    if (coor.organRootId !== 0 && coor.owner === 1) {
        return true;
    }
    return false;
}

const isOppOrgan = (coor: IInfo) => {
    if (coor.organRootId !== 0 && coor.owner === 0) {
        return true;
    }
    return false;
}

const isOrgan = (coor: IInfo) => {
    if (coor.organRootId !== 0) {
        return true;
    }
    return false;
}

const isFree = (coor: IInfo) => {
    if (isWall(coor) || isOrgan(coor)) {
        return false;
    }
    return true;
}

const isRootPath = (coor: IInfo, root: IInfo) => {
    if (isWall(coor)) {
        return false;
    }
    if (isOrgan(coor) && coor.organRootId !== root.organRootId) {
        return false;
    }
    return true;
}

const isPath = (coor: IInfo) => {
    if (isWall(coor) || isOrgan(coor) || coor.oppTentacle === 1) {
        return false;
    }
    const {n, e, s, w} = getCoorInfos(coor);
    const infos = [n, e, s, w];
    infos.forEach((i) => {
        if (!!i && !isWall(i) && i.oppTentacle === 1) {
            return false;
        }
    });
    return true;
}

const isFreeProteine = (coor: IInfo) => {
    if (coor.myHarvester === 1) {
        return false;
    }
    if (proteineTypes.includes(coor.type)) {
        return true;
    }
    return false;
}

const canBase = () => {
    if (mySource.A > 0) {
        return true;
    }
    return false;
}

const canHarvester = () => {
    if (mySource.C > 0 && mySource.D > 0) {
        return true;
    }
    return false;
}

const canTentacle = () => {
    if (mySource.B > 0 && mySource.C > 0) {
        return true;
    }
    return false;
}

const canSporer = () => {
    if (mySource.B > 0 && mySource.D > 0) {
        return true;
    }
    return false;
}

const canRoot = () => {
    if (mySource.A > 0 && mySource.B > 0 && mySource.C > 0 && mySource.D > 0) {
        return true;
    }
    return false;
}

const checkSources = (myResource: ISource, resources: (keyof ISource)[]) => {
    for (let i = 0; i < resources.length; i++) {
        const key = resources[i];
        if (myResource[key] === 0) {
            return 0;
        }
    }
    return 1;
}

const getDir = (src: IInfo, dst: IInfo) => {

    if (src.x === dst.x) {
        return src.y > dst.y ? 'N' : 'S';
    }
    return src.x > dst.x ? 'W' : 'E';
}

const printPath = (path: IInfo[]) => {
    const pathMap = path.map(e => [e.x, e.y]);

    console.warn(pathMap);
}

const calculateDistance = (point1: Point, point2: Point): number => {
    const [x1, y1] = point1;
    const [x2, y2] = point2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
}

const countCoorFreeSpace = (coor: IInfo) => {
    if (!isFree(coor)) {
        return 0;
    }

    let count = 1;
    if (coor.x > 0) {
        const coorLeft = map[coor.x - 1][coor.y];
        if (isFree(coorLeft)) {
            count++;
        }
    }
    if (coor.x < width - 1) {
        const coorRight = map[coor.x + 1][coor.y];
        if (isFree(coorRight)) {
            count++;
        }
    }
    if (coor.y > 0) {
        const coorTop = map[coor.x][coor.y - 1];
        if (isFree(coorTop)) {
            count++;
        }
    }
    if (coor.y < height - 1) {
        const coorBottom = map[coor.x][coor.y + 1];
        if (isFree(coorBottom)) {
            count++;
        }
    }
    return count;
}

const checkIsTouched = (organ1: IInfo, organ2: IInfo) => {
    if (organ1.x > 0 && map[organ1.x - 1][organ1.y].organRootId === organ2.organRootId) {
        return true;
    }
    if (organ1.y > 0 && map[organ1.x][organ1.y - 1].organRootId === organ2.organRootId) {
        return true;
    }
    if (organ1.x < width - 1 && map[organ1.x + 1][organ1.y].organRootId === organ2.organRootId) {
        return true;
    }
    if (organ1.y < height - 1 && map[organ1.x][organ1.y + 1].organRootId === organ2.organRootId) {
        return true;
    }
    return false;
}

const checkArrIsTouched = (root1: IInfo, root2: IInfo) => {
    const mapFlat = map.flat();
    const root1Arr = mapFlat.filter(e => e.organRootId === root1.organRootId);
    for (let i = 0; i < root1Arr.length; i++) {
        const organ = root1Arr[i];
        if (checkIsTouched(organ, root2) === true) {
            return true;
        }
    }
    return false;
}

// core path logic =============================================================
const searchPath = (startCoor: IInfo, endCb: (coor: IInfo) => boolean, isPathCb: (coor: IInfo) => boolean) => {
    const startPt: Point = [startCoor.x, startCoor.y];
    const rows = map.length;
    const cols = map[0].length;
    const directions: Point[] = [[-1, 0], [1, 0], [0, -1], [0, 1]]; // 上下左右
    const queue: [Point, Point[]][] = [[startPt, [startPt]]]; // 队列存储当前点及路径
    const visited = new Set<string>();
    visited.add(startPt.toString()); // 记录访问过的点

    while (queue.length > 0) {
        const [current, path] = queue.shift()!;
        const [x, y] = current;

        // 如果到达终点，返回路径
        if (endCb(map[x][y])) {
            return path;
        }

        // 尝试移动到四个方向
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;

            if (
                nx >= 0 &&
                nx < rows &&
                ny >= 0 &&
                ny < cols &&
                isPathCb(map[nx][ny]) &&
                !visited.has([nx, ny].toString())
            ) {
                queue.push([[nx, ny], [...path, [nx, ny]]]);
                visited.add([nx, ny].toString());
            }
        }
    }

    return []; // 无解
}

const getCoorToOwnerOrganPath = (startCoor: IInfo, option: IPathOption) => {
    const endCb = (coor: IInfo) => {
        if (isOwnerOrgan(coor)) {
            return true;
        }
        return false;
    }

    const isPathCb = (coor: IInfo) => {
        if (option.bloqueHarvester && coor.myHarvester === 1) {
            return false;
        }
        if (isFree(coor) || isOwnerOrgan(coor)) {
            return true;
        }
        return false;
    }

    const path = searchPath(startCoor, endCb, isPathCb);
    const result: IInfo[] = [];

    for (let i = 0; i < path.length; i++) {
        const pt = path[i];
        const coor = map[pt[0]][pt[1]];
        result.push(coor);
    }
    return result;
}

const getRootToSpacePath = (myRoot: IInfo, spaceNumber: number) => {
    const endCb = (coor: IInfo) => {
        if (countCoorFreeSpace(coor) === spaceNumber) {
            return true;
        }
        return false;
    }

    const isPathCb = (coor: IInfo) => {
        if (isRootPath(coor, myRoot)) {
            return true;
        }
        return false;
    }

    const path = searchPath(myRoot, endCb, isPathCb);
    const result: IInfo[] = [];

    for (let i = 0; i < path.length; i++) {
        const pt = path[i];
        const coor = map[pt[0]][pt[1]];
        result.push(coor);
    }

    return result; // 无解
}

const getRootToProteinePath = (myRoot: IInfo, typeArr: string[]) => {
    const endCb = (coor: IInfo) => {
        if (typeArr.includes(coor.type) && coor.myHarvester === 0) {
            return true;
        }
        return false;
    }

    const isPathCb = (coor: IInfo) => {
        if (isRootPath(coor, myRoot) && coor.myHarvester === 0) {
            return true;
        }
        return false;
    }

    const path = searchPath(myRoot, endCb, isPathCb);
    const result: IInfo[] = [];

    for (let i = 0; i < path.length; i++) {
        const pt = path[i];
        const coor = map[pt[0]][pt[1]];
        result.push(coor);
    }

    return result; // 无解
}

// end path ===================================================================================

const getCoorInfos = (coor: IInfo) => {
    const x = coor.x;
    const y = coor.y;
    const result: Record<string, IInfo | null> = {
        n: null,
        e: null,
        s: null,
        w: null,
        nn: null,
        ne: null,
        ee: null,
        se: null,
        ss: null,
        sw: null,
        ww: null,
        nw: null,
    }

    if (y > 0) {
        result.n = map[x][y - 1];
    }
    if (y > 1) {
        result.nn = map[x][y - 2];
    }
    if (y < height - 1) {
        result.s = map[x][y + 1];
    }
    if (y < height - 2) {
        result.ss = map[x][y + 2];
    }
    if (x > 0) {
        result.w = map[x - 1][y];
    }
    if (x > 1) {
        result.ww = map[x - 2][y];
    }
    if (x < width - 1) {
        result.e = map[x + 1][y];
    }
    if (x < width - 2) {
        result.ee = map[x + 2][y];
    }
    if (result.n && result.e) {
        result.ne = map[x + 1][y - 1];
    }
    if (result.e && result.s) {
        result.se = map[x + 1][y + 1];
    }
    if (result.s && result.w) {
        result.sw = map[x - 1][y + 1];
    }
    if (result.n && result.w) {
        result.nw = map[x - 1][y - 1];
    }
    return result;
}

const getCoorProteines = (coor: IInfo) => {
    const proteines = new Set<IInfo>();
    const {n, e, s, w, nn, ee, ss, ww, ne, se, sw, nw} = getCoorInfos(coor);
    const infoArr = [
        {
            route: n,
            dst: [nn, nw, ne],
        },
        {
            route: e,
            dst: [ee, se, ne],
        },
        {
            route: s,
            dst: [ss, se, sw],
        },
        {
            route: w,
            dst: [ww, nw, sw],
        },
    ];

    infoArr.forEach(info => {
        if (!!info && isPath(info.route)) {
            info.dst.forEach((c) => {
                if (!!c && isFreeProteine(c)) {
                    proteines.add(c);
                }
            })
        }
    });
    return Array.from(proteines);
}

const isRootDst = (coor: IInfo) => {
    const {n, e, s, w, nn, ne, ee, se, ss, sw, ww, nw} = getCoorInfos(coor);

    const checkSpace = (cArr: IInfo[]) => {
        for (let i = 0; i < cArr.length; i++) {
            const c = cArr[i];
            if (!c || !isFree(c)) {
                return 0;
            }
        }
        return 1;
    }

    const checkNoOpp = (cArr: IInfo[]) => {
        for (let i = 0; i < cArr.length; i++) {
            const c = cArr[i];
            if (c && isOppOrgan(c)) {
                return 0;
            }
        }
        return 1;
    }

    const checkProteine = (cArr: IInfo[]) => {
        let count = 0;
        for (let i = 0; i < cArr.length; i++) {
            const c = cArr[i];
            if (c && c.type === 'A') {
                return 2;
            }
            if (c && isProteine(c)) {
                count++;
            }
        }
        return count;
    }

    if (checkSpace([n, e, s, w]) === 0) {
        return 0;
    }
    if (checkNoOpp([nn, ne, ee, se, ss, sw, ww, nw]) === 0) {
        return 0;
    }
    return checkProteine([nn, ne, ee, se, ss, sw, ww, nw]);
}

const l = (parent: IInfo, child: IInfo, type: string, target?: IInfo) => {
    switch (type) {
        case TOrgan.basic:
        case TOrgan.harvester:
        case TOrgan.tentacle:
        case TOrgan.sporer:
            const dir = target ? getDir(child, target) : 'N';
            console.log(`${TLog.grow} ${parent.organId} ${child.x} ${child.y} ${type} ${dir}`);
            break;
        case TOrgan.root:
            console.log(`${TLog.spore} ${parent.organId} ${child.x} ${child.y}`);
            break;
        default:
            console.log(TLog.wait);
            break;
    }
}

const log = (organP: IInfo, organC: IInfo, organT = TOrgan.basic, target?: IInfo) => {
    const dir = target ? getDir(organC, target) : 'N';

    if (organT === TOrgan.basic) {
        if (!checkSources(mySource, ['A'])) {
            return 0;
        }
        console.log(`${TLog.grow} ${organP.organId} ${organC.x} ${organC.y} ${organT} ${dir} 55`);
        mySource.A--;
    }
    else if (organT === TOrgan.harvester) {
        if (!checkSources(mySource, ['C', 'D'])) {
            return 0;
        }
        console.log(`${TLog.grow} ${organP.organId} ${organC.x} ${organC.y} ${organT} ${dir} 44`);
        mySource.C--;
        mySource.D--;
    }
    else if (organT === TOrgan.tentacle) {
        if (!checkSources(mySource, ['B', 'C'])) {
            return 0;
        }
        console.log(`${TLog.grow} ${organP.organId} ${organC.x} ${organC.y} ${organT} ${dir} 33`);
        mySource.B--;
        mySource.C--;
    }
    else if (organT === TOrgan.sporer) {
        if (!checkSources(mySource, ['B', 'D'])) {
            return 0;
        }
        console.log(`${TLog.grow} ${organP.organId} ${organC.x} ${organC.y} ${organT} ${dir} 22`);
        mySource.B--;
        mySource.D--;
    }
    else if (organT === TOrgan.root) {
        if (!checkSources(mySource, ['A', 'B', 'C', 'D'])) {
            return 0;
        }
        console.log(`${TLog.spore} ${organP.organId} ${organC.x} ${organC.y} 11`);
        mySource.A--;
        mySource.B--;
        mySource.C--;
        mySource.D--;
    }
    return 1;
}

const logAll = (organP: IInfo, organC: IInfo) => {
    let loged = 0;
    const organArr = [TOrgan.basic, TOrgan.tentacle, TOrgan.sporer, TOrgan.harvester];

    for (let i = 0; i < organArr.length; i++) {
        const organType = organArr[i];
        loged = log(organP, organC, organType);
        if (loged) {
            return 1;
        }
    }
    return 0;
}

const initSpaceTarget = (root: IInfo) => {
    let rootToSpacePath: IInfo[] = [];

    for (let i = 4; i > 0; i--) {
        rootToSpacePath = getRootToSpacePath(root, i);
        if (rootToSpacePath.length) {
            break;
        }
    }

    if (!rootToSpacePath.length) {
        return 0;
    }
    const space = rootToSpacePath[rootToSpacePath.length - 1];
    const option: IPathOption = {
        bloqueHarvester: false,
        bloqueTentacle: false,
    }
    const spaceToOrganPath = getCoorToOwnerOrganPath(space, option);

    const organToSpacePath = spaceToOrganPath.reverse();
    const organ = organToSpacePath[0];

    if (organ.organRootId === root.organRootId) {
        map[root.x][root.y].targetType = TOrgan.basic;
        map[root.x][root.y].target = space;
        map[root.x][root.y].targetToOrganPath = spaceToOrganPath;
        map[root.x][root.y].organToTargetPath = organToSpacePath;
        return 1;
    }
    return 0;
}

const initHarvesterTarget = (root: IInfo) => {
    const rootToProteinePath = getRootToProteinePath(root, proteineTypes);

    if (!rootToProteinePath.length) {
        return 0;
    }
    const proteine = rootToProteinePath[rootToProteinePath.length - 1];
    const proteineToOrganPath = getCoorToOwnerOrganPath(proteine, {
        bloqueHarvester: true,
        bloqueTentacle: false,
    });

    const organToProteinePath = proteineToOrganPath.reverse();
    const organ = organToProteinePath[0];

    if (organ.organRootId === root.organRootId) {
        map[root.x][root.y].targetType = TOrgan.harvester;
        map[root.x][root.y].target = proteine;
        map[root.x][root.y].targetToOrganPath = proteineToOrganPath;
        map[root.x][root.y].organToTargetPath = organToProteinePath;
        return 1;
    }
    return 0;
}

const initTentacleTarget = (root: IInfo) => {
    const mapFlat = map.flat();
    const rootOrgans = mapFlat.filter(e => e.organRootId === root.organRootId);

    for (let i = 0; i < rootOrgans.length; i++) {
        const myOrgan = rootOrgans[i];
        const myOrganNearInfos = getCoorInfos(myOrgan);
        const oppOrganArr: IInfo[] = [];

        const {n, e, s, w, nn, ne, ee, se, ss, sw, ww, nw} = myOrganNearInfos;
        if (n && isFree(n)) {
            if (nn && isOppOrgan(nn)) {
                nn.inter = n;
                oppOrganArr.push(nn);
            }
            if (ne && isOppOrgan(ne)) {
                ne.inter = n;
                oppOrganArr.push(ne);
            }
            if (nw && isOppOrgan(nw)) {
                nw.inter = n;
                oppOrganArr.push(nw);
            }
        }
        if (e && isFree(e)) {
            if (ee && isOppOrgan(ee)) {
                ee.inter = e;
                oppOrganArr.push(ee);
            }
            if (ne && isOppOrgan(ne)) {
                ne.inter = e;
                oppOrganArr.push(ne);
            }
            if (se && isOppOrgan(se)) {
                se.inter = e;
                oppOrganArr.push(se);
            }
        }
        if (s && isFree(s)) {
            if (ss && isOppOrgan(ss)) {
                ss.inter = s;
                oppOrganArr.push(ss);
            }
            if (sw && isOppOrgan(sw)) {
                sw.inter = s;
                oppOrganArr.push(sw);
            }
            if (se && isOppOrgan(se)) {
                se.inter = s;
                oppOrganArr.push(se);
            }
        }
        if (w && isFree(w)) {
            if (ww && isOppOrgan(ww)) {
                ww.inter = w;
                oppOrganArr.push(ww);
            }
            if (sw && isOppOrgan(sw)) {
                sw.inter = w;
                oppOrganArr.push(sw);
            }
            if (nw && isOppOrgan(nw)) {
                nw.inter = w;
                oppOrganArr.push(nw);
            }
        }
        if (oppOrganArr.length) {
            const sortDesc = oppOrganArr.sort((a, b) => b.childNumber - a.childNumber);
            const target = sortDesc[0];
            root.target = target;
            root.targetType = TOrgan.tentacle;
            root.targetToOrganPath = [target, target.inter, myOrgan];
            root.organToTargetPath = [myOrgan, target.inter, target];
            return 1;
        }
    }
    return 0;
}

const initSporerTarget = (root: IInfo) => {
    const mapFlat = map.flat();
    const rootOrgans = mapFlat.filter(e => e.organRootId === root.organRootId).sort((a, b) => b.childNumber - a.childNumber);

    for (let i = 0; i < rootOrgans.length; i++) {
        const organ = rootOrgans[i];
        const {n, e, s, w} = getCoorInfos(organ);
        const infos = [n, e, s, w].filter(e => !!e && isFree(e));

        for (let j = 0; j < infos.length; j++) {
            const sporer = infos[j];
            // n
            for (let k = sporer.y - 1; k > 0; k--) {
                const dst = map[sporer.x][k];
                if (!isFree(dst)) {
                    break;
                }
                if (k === sporer.y - 1) {
                    continue;
                }
                if (isRootDst(dst)) {
                    root.target = dst;
                    root.targetType = TOrgan.sporer;
                    root.organToTargetPath = [organ, sporer, dst];
                    root.targetToOrganPath = [dst, sporer, organ];
                    return 1;
                }
            }
            // s
            for (let k = sporer.y + 1; k < height - 1; k++) {
                const dst = map[sporer.x][k];
                if (!isFree(dst)) {
                    break;
                }
                if (k === sporer.y + 1) {
                    continue;
                }
                if (isRootDst(dst)) {
                    root.target = dst;
                    root.targetType = TOrgan.sporer;
                    root.organToTargetPath = [organ, sporer, dst];
                    root.targetToOrganPath = [dst, sporer, organ];
                    return 1;
                }
            }
            // w
            for (let k = sporer.x - 1; k > 0; k--) {
                const dst = map[k][sporer.y];
                if (!isFree(dst)) {
                    break;
                }
                if (k === sporer.x - 1) {
                    continue;
                }
                if (isRootDst(dst)) {
                    root.target = dst;
                    root.targetType = TOrgan.sporer;
                    root.organToTargetPath = [organ, sporer, dst];
                    root.targetToOrganPath = [dst, sporer, organ];
                    return 1;
                }
            }
            // s
            for (let k = sporer.x + 1; k < width - 1; k++) {
                const dst = map[k][sporer.y];
                if (!isFree(dst)) {
                    break;
                }
                if (k === sporer.x + 1) {
                    continue;
                }
                if (isRootDst(dst)) {
                    root.target = dst;
                    root.targetType = TOrgan.sporer;
                    root.organToTargetPath = [organ, sporer, dst];
                    root.targetToOrganPath = [dst, sporer, organ];
                    return 1;
                }
            }
        }
    }
    return 0;
}

const initSporer2Target = (root: IInfo) => {
    const rootBefore = mapBefore[root.x][root.y];
    const targetTypeBefore = rootBefore.targetType;
    const targetBefore = rootBefore.target;
    const organToTargetPathBefore = rootBefore.organToTargetPath;

    if (!targetBefore || targetTypeBefore !== TOrgan.sporer || organToTargetPathBefore.length !== 3) {
        return 0;
    }
    const sporer = organToTargetPathBefore[1];
    const dst = organToTargetPathBefore[2];

    if (sporer.x < dst.x) {
        for (let i = sporer.x + 1; i <= dst.x; i++) {
            if (!isFree(map[i][sporer.y])) {
                return 0;
            }
        }
    } else if (dst.x < sporer.x) {
        for (let i = dst.x; i < sporer.x ; i++) {
            if (!isFree(map[i][sporer.y])) {
                return 0;
            }
        }
    } else if (sporer.y < dst.y) {
        for (let i = sporer.y + 1; i <= dst.y; i++) {
            if (!isFree(map[sporer.x][i])) {
                return 0;
            }
        }
    } else if (dst.y < sporer.y) {
        for (let i = dst.y; i < sporer.y ; i++) {
            if (!isFree(map[sporer.x][i])) {
                return 0;
            }
        }
    }
    root.target = map[targetBefore.x][targetBefore.y];
    root.targetType = TOrgan.root;
    root.organToTargetPath = [map[sporer.x][sporer.y], map[dst.x][dst.y]];
    root.targetToOrganPath = [map[dst.x][dst.y], map[sporer.x][sporer.y]];
    return 1;
}

const initRootTarget = (root: IInfo) => {
    let targeted = 0;

    if (!targeted && mySource.B > 0 && mySource.C > 0) {
        targeted = initTentacleTarget(root);
    }
    if (!targeted && tour > 1) {
        targeted = initSporer2Target(root);
    }
    if (!targeted && mySource.A > 0 && mySource.B > 1 && mySource.C > 1 && mySource.D > 2) {
        targeted = initSporerTarget(root);
    }
    if (!targeted) {
        targeted = initHarvesterTarget(root);
    }
    if (!targeted) {
        targeted = initSpaceTarget(root);
    }
}

const initRootsTarget = (rootArr: IInfo[]) => {
    for (let i = 0; i < rootArr.length; i++) {
        initRootTarget(rootArr[i]);
    }
}

const growTarget = (root: IInfo) => {
    const target = root.target;
    const targetType = root.targetType;
    const targetToOrganPath = root.targetToOrganPath;
    const organToTargetPath = root.organToTargetPath;

    const organParent = organToTargetPath[0];
    const organChild = organToTargetPath[1];

    if (targetType === TOrgan.tentacle) {
        let loged = 0;
        if (organToTargetPath.length === 3) {
            loged = log(organParent, organChild, targetType, target);
        }
        if (!loged) {
            loged = logAll(organParent, organChild);
        }
        if (!loged) {
            console.log(TLog.wait);
        }
    } else if (targetType === TOrgan.root) {
        let loged = 0;
        if (!loged) {
            loged = log(organParent, organChild, targetType);
        }
        if (!loged) {
            console.log(TLog.wait);
        }
    } else if (targetType === TOrgan.sporer) {
        let loged = 0;
        if (organToTargetPath.length === 3) {
            loged = log(organParent, organChild, targetType, target);
        }
        if (!loged) {
            console.log(TLog.wait);
        }
    } else if (targetType === TOrgan.harvester) {
        let loged = 0;
        if (organToTargetPath.length === 3) {
            loged = log(organParent, organChild, targetType, target);
        }
        if (!loged) {
            loged = logAll(organParent, organChild);
        }
        if (!loged) {
            console.log(TLog.wait);
        }
    } else if (targetType === TOrgan.basic) {
        let loged = 0;
        if (!loged) {
            loged = logAll(organParent, organChild);
        }
        if (!loged) {
            console.log(TLog.wait);
        }
    }
}

const initTentacle = (root: IInfo) => {
    const flat = map.flat();
    const organs = flat.filter(e => e.organRootId === root.organRootId);

    for (let i = 0; i < organs.length; i++) {
        const parent = organs[i];
        const {n, e, s, w} = getCoorInfos(parent);
        const parentInfos = [n, e, s, w];
        for (let j = 0; j < parentInfos.length; j++) {
            const child = parentInfos[j];
            if (!child || !isPath(child)) {
                continue;
            }
            const {n: cn, e: ce, s: cs, w: cw} = getCoorInfos(child);
            const childInfos = [cn, ce, cs, cw];
            const oppArr = childInfos.filter(cInfo => !!cInfo && isOppOrgan(cInfo)).sort((a, b) => b.childNumber - a.childNumber);
            if (oppArr.length) {
                l(parent, child, TOrgan.tentacle, oppArr[0]);
                return 1;
            }
            const oppTentacle = childInfos.filter(cInfo => !!cInfo && isFree(cInfo) && cInfo.oppTentacle === 1);
            if (oppTentacle.length) {
                l(parent, child, TOrgan.tentacle, oppTentacle[0]);
                return 1;
            }
        }
    }
    return 0;
}

const initHarvester = (root: IInfo) => {
    const flat = map.flat();
    const organs = flat.filter(e => e.organRootId === root.organRootId);

    organs.forEach((o) => {
        const {n, e, s, w, nn, ee, ss, ww, nw, ne, se, sw} = getCoorInfos(o);
        const infoArr = [
            {
                route: n,
                dst: [nw, nn, ne],
            },
            {
                route: e,
                dst: [ne, ee, se],
            },
            {
                route: s,
                dst: [se, ss, sw],
            },
            {
                route: w,
                dst: [nw, ww, sw],
            }
        ];
        infoArr.forEach(i => {
            if (!!i.route && isPath(i.route)) {
                i.dst.forEach(d => {
                    if (!!d && isFreeProteine(d)) {
                        l(o, i.route, TOrgan.harvester, d);
                        return 1;
                    }
                });
            }
        })
    });
    return 0;
}

const initSporer = (root: IInfo) => {
    const flat = map.flat();
    const organs = flat.filter(e => e.organRootId === root.organRootId);
    const proteineArr: {parent: IInfo, child: IInfo, proteines: IInfo[]}[] = [];
    
    organs.forEach((organ) => {
        const {n, e, s, w} = getCoorInfos(organ);
        const organDirs = [n, e, s, w];
        for (let j = 0; j < organDirs.length; j++) {
            const oDir = organDirs[j];
            if (!oDir || !isPath(oDir)) {
                continue;
            }

            for (let i = oDir.x + 1; !!map[i][oDir.y] && isPath(map[i][oDir.y]); i++) {
                const coor = map[i][oDir.y];
                const oProteines = getCoorProteines(coor);
                if (oProteines.length) {
                    proteineArr.push({
                        parent: organ,
                        child: coor,
                        proteines: oProteines,
                    });
                }
            }
            for (let i = oDir.x - 1; !!map[i][oDir.y] && isPath(map[i][oDir.y]); i--) {
                const coor = map[i][oDir.y];
                const oProteines = getCoorProteines(coor);
                if (oProteines.length) {
                    proteineArr.push({
                        parent: organ,
                        child: coor,
                        proteines: oProteines,
                    });
                }
            }
            for (let i = oDir.y + 1; !!map[oDir.x][i] && isPath(map[oDir.x][i]); i++) {
                const coor = map[oDir.x][i];
                const oProteines = getCoorProteines(coor);
                if (oProteines.length) {
                    proteineArr.push({
                        parent: organ,
                        child: coor,
                        proteines: oProteines,
                    });
                }
            }
            for (let i = oDir.y - 1; !!map[oDir.x][i] && isPath(map[oDir.x][i]); i--) {
                const coor = map[oDir.x][i];
                const oProteines = getCoorProteines(coor);
                if (oProteines.length) {
                    proteineArr.push({
                        parent: organ,
                        child: coor,
                        proteines: oProteines,
                    });
                }
            }
        }

    });
    proteineArr.forEach(p => {
        console.warn(p.parent.x, p.parent.y, 'child: ', p.child.x, p.child.y);
    })
    return 0;
}

const initDst = (root: IInfo) => { // new
    let done = 0;

    if (!done && canTentacle()) {
        done = initTentacle(root);
    }
    // if (!done && canHarvester()) {
    //     done = initHarvester(root);
    // }
    // if (!done && canSporer()) {
    //     done = initSporer(root);
    // }
    if (!done) {
        console.log(TLog.wait);
    }
}

const growRoot = (root: IInfo) => {
    let actioned = 0;

    if (root.target) {
        console.warn('root: ', root.x, root.y, 'target type: ', root.targetType, 'target: ', root.target);
        growTarget(root);
    }
    else {
        console.log(TLog.wait);
    }
}

// Action =======================================================================
// GROW id x y type
// console.log("GROW 1 2 1 BASIC");

// game loop
while (true) {
    const entityCount: number = parseInt(readline());

    tour++;
    mapBefore = map;
    map = [];
    initMapCoor(width, height);

    for (let i = 0; i < entityCount; i++) {
        var inputs: string[] = readline().split(' ');
        const x: number = parseInt(inputs[0]);
        const y: number = parseInt(inputs[1]);
        const type: string = inputs[2]; // WALL, ROOT, BASIC, TENTACLE, HARVESTER, SPORER, A, B, C, D
        const owner: number = parseInt(inputs[3]); // 1 if your organ, 0 if enemy organ, -1 if neither
        const organId: number = parseInt(inputs[4]); // id of this entity if it's an organ, 0 otherwise
        const organDir: string = inputs[5]; // N,E,S,W or X if not an organ
        const organParentId: number = parseInt(inputs[6]);
        const organRootId: number = parseInt(inputs[7]);
        map[x][y].type = type;
        map[x][y].owner = owner;
        map[x][y].organId = organId;
        map[x][y].organDir = organDir;
        map[x][y].organParentId = organParentId;
        map[x][y].organRootId = organRootId;
        map[x][y].childNumber = 0;

        map[x][y].myHarvester = 0; // 0: null, origin rootId
        map[x][y].oppHarvester = 0; // 0 = null, origin rootId
        map[x][y].myTentacle = 0; // 0 = null, origin rootId
        map[x][y].oppTentacle = 0; // 0 = null, origin rootId

        map[x][y].target = null;
        map[x][y].targetType = null;
        map[x][y].inter = null;
        map[x][y].targetToOrganPath = [];
        map[x][y].organToTargetPath = [];

        if (type === TOrgan.root) {
            map[x][y].organParentId = null;
        }
    }

    initMapType(map);
    initMapChilds(map);

    var inputs: string[] = readline().split(' ');
    const myA: number = parseInt(inputs[0]);
    const myB: number = parseInt(inputs[1]);
    const myC: number = parseInt(inputs[2]);
    const myD: number = parseInt(inputs[3]); // your protein stock
    mySource.A = myA;
    mySource.B = myB;
    mySource.C = myC;
    mySource.D = myD;

    var inputs: string[] = readline().split(' ');
    const oppA: number = parseInt(inputs[0]);
    const oppB: number = parseInt(inputs[1]);
    const oppC: number = parseInt(inputs[2]);
    const oppD: number = parseInt(inputs[3]); // opponent's protein stock
    oppSource.A = oppA;
    oppSource.B = oppB;
    oppSource.C = oppC;
    oppSource.D = oppD;
    const requiredActionsCount: number = parseInt(readline()); // your number of organisms, output an action for each one in any order

    // ======================================================================================
    const mapFlat = map.flat();
    myRootArr = mapFlat.filter(e => e.type === 'ROOT' && e.owner === 1);
    oppRootArr = mapFlat.filter(e => e.type === 'ROOT' && e.owner === 0);

    // initRootsTarget(myRootArr);

    for (let i = 0; i < requiredActionsCount; i++) {
        // growRoot(myRootArr[i]);
        initDst(myRootArr[i]);
    }
}