// The data model. Every game is a plain, immutable object: functions in this
// folder never change a Game, they return a new one.

export type CellState = "hidden" | "revealed" | "flagged";

/** "ready" means the first click hasn't happened yet, so no mines are placed. */
export type GameStatus = "ready" | "playing" | "won" | "lost";

export type Position = readonly [x: number, y: number];

export type Cell = {
    readonly isMine: boolean;
    readonly state: CellState;
};

export type Game = {
    readonly width: number;
    readonly height: number;
    readonly mineCount: number; // configuration: how many mines this game has
    readonly cells: readonly (readonly Cell[])[]; // cells[y][x]
    readonly status: GameStatus;
};
