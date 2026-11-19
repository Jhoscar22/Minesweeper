// The rules of Minesweeper, and the core's public API.
// The UI imports from this file only. Read it top to bottom:
//   1. creating games   2. player moves   3. queries   4. internal steps

import { adjacentFlagCount, adjacentMineCount, getCell, inBounds, key, neighbors, setCell, updatePositions } from "./board";
import { shuffle } from "./shuffle";
import type { Cell, Game, Position } from "./types";

export type { Cell, CellState, Game, GameStatus, Position } from "./types";
export { adjacentMineCount, getCell, neighbors } from "./board";

// ─── 1. Creating games ──────────────────────────────────────────────────────

/** New game, mines not placed yet. Mines get placed on the first reveal, outside a 3×3 safe zone. */
export function newGame(width: number, height: number, mineCount: number): Game {
    if (!Number.isSafeInteger(mineCount)) throw new Error("Mine count must be a safe integer");
    if (mineCount < 0) throw new Error("Mine count must be a non-negative integer");
    if (mineCount > width * height - 9) throw new Error("Mine count exceeds limit allowed by board size");

    return { ...createGame(width, height, []), mineCount, status: "ready" };
}

/** A game with mines at fixed positions. Used by tests, where randomness would get in the way. */
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
        throw new Error("Duplicate mine positions");
    }

    const cells: Cell[][] = [];
    for (let y = 0; y < height; y++) {
        const row: Cell[] = [];
        for (let x = 0; x < width; x++) {
            row.push({ isMine: mines.has(key(x, y)), state: "hidden" });
        }
        cells.push(row);
    }
    return { width, height, mineCount: mines.size, cells, status: "playing" };
}

// ─── 2. Player moves ────────────────────────────────────────────────────────
// Each move returns the SAME object when nothing changes, so the UI can skip redrawing.

/**
 * Reveals the cell at (x, y). A mine loses the game. A cell with no adjacent mines
 * reveals its whole connected region (breadth-first search), stopping at numbered cells.
 * On the first reveal, mines are placed first, using `random`.
 */
export function reveal(game: Game, x: number, y: number, random: () => number = Math.random): Game {
    if (isOver(game)) return game;
    if (getCell(game, x, y).state !== "hidden") return game;

    const gameWithMines = game.status === "ready" ? placeMines(game, x, y, random) : game;
    const cell = getCell(gameWithMines, x, y);

    if (cell.isMine) {
        const exploded = setCell(gameWithMines, x, y, { ...cell, state: "revealed" });
        return { ...exploded, status: "lost" };
    }
    return withRevealStatus(revealFlood(gameWithMines, [[x, y]]));
}

/** Clicking a revealed number with exactly that many adjacent flags reveals its other hidden neighbors. */
export function chord(game: Game, x: number, y: number): Game {
    if (isOver(game) || getCell(game, x, y).state !== "revealed") return game;
    if (adjacentFlagCount(game, x, y) !== adjacentMineCount(game, x, y)) return game;

    const targets = neighbors(game, x, y).filter(([nx, ny]) => getCell(game, nx, ny).state === "hidden");
    if (targets.some(([nx, ny]) => getCell(game, nx, ny).isMine)) {
        return { ...revealPositions(game, targets), status: "lost" }; // a flag was misplaced
    }
    return withRevealStatus(revealFlood(game, targets));
}

export function toggleFlag(game: Game, x: number, y: number): Game {
    if (isOver(game)) return game;
    const cell = getCell(game, x, y);
    if (cell.state === "revealed") return game;

    return setCell(game, x, y, { ...cell, state: cell.state === "hidden" ? "flagged" : "hidden" });
}

// ─── 3. Queries ─────────────────────────────────────────────────────────────

export function flagCount(game: Game): number {
    return game.cells.flat().filter((c) => c.state === "flagged").length;
}

export function revealedCount(game: Game): number {
    return game.cells.flat().filter((c) => c.state === "revealed").length;
}

/** Can be negative when the player places more flags than there are mines. */
export function minesLeft(game: Game): number {
    return game.mineCount - flagCount(game);
}

// ─── 4. Internal steps ──────────────────────────────────────────────────────

function isOver(game: Game): boolean {
    return game.status === "won" || game.status === "lost";
}

/** Places game.mineCount mines uniformly at random, never in the 3×3 zone around (safeX, safeY). */
function placeMines(game: Game, safeX: number, safeY: number, random: () => number): Game {
    const safeZone = new Set([key(safeX, safeY)]);
    for (const [nx, ny] of neighbors(game, safeX, safeY)) {
        safeZone.add(key(nx, ny));
    }

    const candidates: Position[] = [];
    for (let y = 0; y < game.height; y++) {
        for (let x = 0; x < game.width; x++) {
            if (!safeZone.has(key(x, y))) candidates.push([x, y]);
        }
    }

    const mines = shuffle(candidates, random).slice(0, game.mineCount);
    const withMines = updatePositions(game, mines, (cell) => ({ ...cell, isMine: true }));
    return { ...withMines, status: "playing" };
}

/** Multi-source breadth-first search: zeros expand to their neighbors; numbered cells are revealed but don't expand. */
function revealFlood(game: Game, starts: readonly Position[]): Game {
    const queue: Position[] = [...starts];
    const seen = new Set(starts.map(([x, y]) => key(x, y)));

    // i points to the front of the queue; nothing is removed.
    for (let i = 0; i < queue.length; i++) {
        const [currentX, currentY] = queue[i]!;
        if (adjacentMineCount(game, currentX, currentY) !== 0) continue;

        for (const [neighborX, neighborY] of neighbors(game, currentX, currentY)) {
            const neighborKey = key(neighborX, neighborY);
            if (!seen.has(neighborKey) && getCell(game, neighborX, neighborY).state === "hidden") {
                seen.add(neighborKey);
                queue.push([neighborX, neighborY]);
            }
        }
    }
    // Every position enters the queue exactly once, so the queue is the list to reveal.
    return revealPositions(game, queue);
}

function revealPositions(game: Game, positions: readonly Position[]): Game {
    return updatePositions(game, positions, (c) => (c.state === "hidden" ? { ...c, state: "revealed" } : c));
}

/** "won" when every safe cell is revealed. Flags don't count, so guessing flag layouts can't win. */
function withRevealStatus(game: Game): Game {
    const isWon = revealedCount(game) === game.width * game.height - game.mineCount;
    return { ...game, status: isWon ? "won" : "playing" };
}
