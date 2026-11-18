export type CellState = "hidden" | "revealed" | "flagged";
export type GameStatus = "ready" | "playing" | "won" | "lost";
export type Position = readonly [x: number, y: number];

export type Cell = {
    readonly isMine: boolean;
    readonly state: CellState;
};

export type Game = {
    readonly width: number;
    readonly height: number;
    readonly mineCount: number;
    readonly cells: readonly (readonly Cell[])[];   // cells[y][x]
    readonly status: GameStatus;
};

function inBounds(width: number, height: number, x: number, y: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
}

// Sets compare arrays by reference, so positions are stored as "x,y" strings.
function key(x: number, y: number): string {
    return `${x},${y}`;
}

export function createGame(width: number, height: number, minePositions: readonly Position[]): Game {
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
        throw new Error(`Invalid board size: ${width}x${height}`);
    }

    const mines = new Set<string>();
    for (const [x, y] of minePositions) {
        if (!inBounds(width, height, x, y)) {
            throw new Error(`Mine out of bounds: ${x},${y}`);
        }
        mines.add(key(x, y));
    }
    if (mines.size !== minePositions.length) {
        throw new Error(`Duplicate mine positions`);
    }

    const cells: Cell[][] = []

    // Initialize the cells
    for (let y = 0; y < height; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < width; x++) {
            row.push({ isMine: mines.has(key(x, y)), state: "hidden" });
        }
        cells.push(row);
    }
    return { width, height, mineCount: mines.size, cells, status: "playing" }
}

export function getCell(game: Game, x: number, y: number): Cell {
    const cell = game.cells[y]?.[x];
    if (cell === undefined) {
        throw new Error(`Cell out of bounds: ${x},${y}`);
    }
    return cell;
}

function setCell(game: Game, x: number, y: number, cell: Cell): Game {
    // Explicit check: .with(-1, …) would silently replace the LAST element.
    if (!inBounds(game.width, game.height, x, y)) {
        throw new Error(`Cell out of bounds: ${x},${y}`);
    }
    const row = game.cells[y]!; // safe: bounds were just checked
    return { ...game, cells: game.cells.with(y, row.with(x, cell)) };
}

export function neighbors(game: Game, x: number, y: number): Position[] {
    const offsets = [-1, 0, 1];
    const result: Position[] = []
    for (const dy of offsets) {
        for (const dx of offsets) {
            if (inBounds(game.width, game.height, x + dx, y + dy) && (dy !== 0 || dx !== 0)) {
                result.push([x + dx, y + dy]);
            }
        }
    }
    return result;
}

export function adjacentMineCount(game: Game, x: number, y: number): number {
    return neighbors(game, x, y).map(p => getCell(game, p[0], p[1])).filter(c => c.isMine).length;
}

function isOver(game: Game): boolean {
    return game.status === "won" || game.status === "lost"
}

/**
 * Reveals the cell at (x, y). A mine loses the game. A cell with no adjacent mines
 * reveals its whole connected region (breadth-first search), stopping at numbered cells.
 */
export function reveal(game: Game, x: number, y: number, random: () => number = Math.random): Game {
    if (isOver(game)) return game;
    
    if (getCell(game, x, y).state !== "hidden") return game;
    
    const gameWithMines = game.status === "ready" ? placeMines(game, x, y, random) : game;
    const cell = getCell(gameWithMines, x, y);

    if (cell.isMine) {
        const next = setCell(gameWithMines, x, y, { ...cell, state: "revealed" });
        return { ...next, status: "lost" };
    } else {
        return withRevealStatus(revealFlood(gameWithMines, [[x, y]]));
    }
}

function revealPositions(game: Game, positions: ReadonlyArray<Position>): Game {
    return updatePositions(game, positions, (c) => (c.state === "hidden" ? { ...c, state: "revealed" } : c));
}

export function toggleFlag(game: Game, x: number, y: number): Game {
    if (isOver(game)) return game;
    const cell = getCell(game, x, y);
    if (cell.state === "revealed") return game;

    return setCell(game, x, y, { ...cell, state: cell.state === "hidden" ? "flagged" : "hidden" });
}

export const flagCount = (game: Game): number =>
    game.cells.flat().filter(c => c.state === "flagged").length;

export const revealedCount = (game: Game): number =>
    game.cells.flat().filter(c => c.state === "revealed").length;

function revealFlood(game: Game, starts: readonly Position[]): Game {
    // Multi-source Breadth-first search: zeros expand to their neighbors; numbered cells are revealed but don't expand.
    const queue: Position[] = [...starts];
    const seen: Set<string> = new Set(starts.map(([x, y]) => key(x, y)));
    for (let i = 0; i < queue.length; i++) {
        // It does not take from the queue, but the index increment is equivalent
        const [currentX, currentY] = queue[i]!;
        if (adjacentMineCount(game, currentX, currentY) === 0) {
            for (const [neighborX, neighborY] of neighbors(game, currentX, currentY)) {
                if (!seen.has(key(neighborX, neighborY)) && getCell(game, neighborX, neighborY).state === "hidden") {
                    seen.add(key(neighborX, neighborY));
                    queue.push([neighborX, neighborY]);
                }
            }
        }
    }
    // Every position enters the queue exactly once, so the queue is the list to reveal.
    return revealPositions(game, queue);
}

/** New game, mines not placed yet. Mines get placed on the first reveal, outside a 3×3 safe zone. */
export function newGame(width: number, height: number, mineCount: number): Game {
    if (!Number.isSafeInteger(mineCount)) throw new Error(`Mine count must be a safe integer`);
    if (mineCount < 0) throw new Error(`Mine count must be a non-negative integer`);
    if (mineCount > width * height - 9) throw new Error(`Mine count exceeds limit allowed by board size`);
    
    return {...createGame(width, height, []), mineCount, status: "ready"};
}

/** Fisher–Yates. Returns a shuffled COPY; the input isn't modified. */
function shuffle<T>(items: readonly T[], random: () => number): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(random() * (i + 1));
        const temp: T = arr[i]!;
        arr[i] = arr[j]!;
        arr[j] = temp;
    }
    return arr;
}

/** Places game.mineCount mines uniformly at random, never in the 3×3 zone around (safeX, safeY). */
function placeMines(game: Game, safeX: number, safeY: number, random: () => number): Game {
    const safeZone: Set<string> = new Set([key(safeX, safeY)]);
    for (const [neighborX, neighborY] of neighbors(game, safeX, safeY)) {
        safeZone.add(key(neighborX, neighborY));
    }
    const candidates: Position[] = []
    for (let y = 0; y < game.height; y++) {
        for (let x = 0; x < game.width; x++) {
            if (!safeZone.has(key(x, y))) candidates.push([x, y]);
        }
    }
    const shuffled = shuffle(candidates, random).slice(0, game.mineCount);
    const result = updatePositions(game, shuffled, (cell) => ({...cell, isMine: true}));
    return {...result, status: "playing"};
}

function neighborsFlagCount(game: Game, x: number, y: number): number {
    return neighbors(game, x, y).map(([nx, ny]) => getCell(game, nx, ny)).filter(c => c.state === "flagged").length
}

/** Clicking a revealed number with exactly that many adjacent flags reveals its other hidden neighbors. */
export function chord(game: Game, x: number, y: number): Game {
    if (isOver(game) || getCell(game, x, y).state !== "revealed") return game;
    if (neighborsFlagCount(game, x, y) !== adjacentMineCount(game, x, y)) return game;
    const targets: Position[] = neighbors(game, x, y).filter(([nx, ny]) => getCell(game, nx, ny).state === "hidden");
    for (const [nx, ny] of targets) {
        if (getCell(game, nx, ny).isMine) {
            return {...revealPositions(game, targets), status: "lost"}
        }
    }
    return withRevealStatus(revealFlood(game, targets));
}

export const minesLeft = (game: Game): number => game.mineCount - flagCount(game);


function withRevealStatus(game: Game): Game {
    const isWon = revealedCount(game) === game.width * game.height - game.mineCount;
    return {...game, status: isWon ? "won" : "playing"}
}

function updatePositions(game: Game, positions: readonly Position[], update: (cell: Cell) => Cell): Game {
    const columnsByRow: Map<number, Set<number>> = new Map();
    const cells: (readonly Cell[])[] = []
    for (const [x, y] of positions) {
        if (columnsByRow.get(y) === undefined) columnsByRow.set(y, new Set());
        columnsByRow.get(y)!.add(x);
    }
    for (const [y, row] of game.cells.entries()) {
        const columns = columnsByRow.get(y);
        if (columns === undefined) cells.push(row);
        else {
            const newRow: Cell[] = [];
            for (const [x, cell] of row.entries()) {
                if (!columns.has(x)) newRow.push(cell);
                else newRow.push(update(cell));
            }
            cells.push(newRow);
        }
    }
    return {...game, cells};
}
