// Grid helpers: reading cells, finding neighbors and building new boards.
// They know about the grid, not about the rules of Minesweeper.

import type { Cell, Game, Position } from "./types";

export function inBounds(width: number, height: number, x: number, y: number): boolean {
    return x >= 0 && x < width && y >= 0 && y < height;
}

// Sets compare arrays by reference, so positions are stored as "x,y" strings.
export function key(x: number, y: number): string {
    return `${x},${y}`;
}

export function getCell(game: Game, x: number, y: number): Cell {
    const cell = game.cells[y]?.[x];
    if (cell === undefined) {
        throw new Error(`Cell out of bounds: ${x},${y}`);
    }
    return cell;
}

/** The up to 8 positions around (x, y) that are inside the board. */
export function neighbors(game: Game, x: number, y: number): Position[] {
    const offsets = [-1, 0, 1];
    const result: Position[] = [];
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
    return neighbors(game, x, y).filter(([nx, ny]) => getCell(game, nx, ny).isMine).length;
}

export function adjacentFlagCount(game: Game, x: number, y: number): number {
    return neighbors(game, x, y).filter(([nx, ny]) => getCell(game, nx, ny).state === "flagged").length;
}

/** Returns a new game with one cell replaced. Every other row and cell is shared, not copied. */
export function setCell(game: Game, x: number, y: number, cell: Cell): Game {
    // Explicit check: .with(-1, …) would silently replace the LAST element.
    if (!inBounds(game.width, game.height, x, y)) {
        throw new Error(`Cell out of bounds: ${x},${y}`);
    }
    const row = game.cells[y]!; // safe: bounds were just checked
    return { ...game, cells: game.cells.with(y, row.with(x, cell)) };
}

/**
 * Applies `update` to every cell in `positions` and returns a new game.
 * Each changed row is copied once; rows without changes are shared as-is.
 */
export function updatePositions(game: Game, positions: readonly Position[], update: (cell: Cell) => Cell): Game {
    const columnsByRow: Map<number, Set<number>> = new Map();
    for (const [x, y] of positions) {
        if (columnsByRow.get(y) === undefined) columnsByRow.set(y, new Set());
        columnsByRow.get(y)!.add(x);
    }

    const cells: (readonly Cell[])[] = [];
    for (const [y, row] of game.cells.entries()) {
        const columns = columnsByRow.get(y);
        if (columns === undefined) {
            cells.push(row);
            continue;
        }
        const newRow: Cell[] = [];
        for (const [x, cell] of row.entries()) {
            newRow.push(columns.has(x) ? update(cell) : cell);
        }
        cells.push(newRow);
    }
    return { ...game, cells };
}
