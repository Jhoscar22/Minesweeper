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
    if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1 ) {
        throw new Error(`Invalid board size: ${width}x${height}`);
    }

    const mines = new Set<string>();
    for (const [x, y] of minePositions) {
        if (!inBounds(width, height, x, y)) {
            throw new Error(`Mine out of bounds: ${x},${y}`);
        }
        mines.add(key(x,y));
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
    return {width, height, mineCount: mines.size, cells, status: "ready"}
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
    const indexAddition = [-1, 0, 1];
    const result: Position[] = []
    for (const dy of indexAddition) {
        for (const dx of indexAddition) {
            if (inBounds(game.width, game.height, x+dx, y+dy) && (dy !== 0 || dx !== 0)) {
                result.push([x+dx, y+dy]);
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

export function reveal(game: Game, x: number, y: number): Game {
    if (isOver(game)) return game;
    const cell = getCell(game, x, y);
    if (cell.state !== "hidden") return game;

    const next = setCell(game, x, y, {...cell, state: "revealed"});
    return {...next, status: cell.isMine ? "lost" : "playing"};
}

export function toggleFlag(game: Game, x: number, y: number): Game{
    if (isOver(game)) return game;
    const cell = getCell(game, x, y);
    if (cell.state === "revealed") return game;

    return setCell(game, x, y, {...cell, state: cell.state === "hidden" ? "flagged" : "hidden"});
}

export const flagCount = (game: Game): number =>
  game.cells.flat().filter(c => c.state === "flagged").length;

export const revealedCount = (game: Game): number =>
  game.cells.flat().filter(c => c.state === "revealed").length;
