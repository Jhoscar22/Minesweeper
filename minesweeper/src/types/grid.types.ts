export enum CellType {
    SAFE,
    MINE,
}

export enum CellState {
    HIDDEN,
    REVEALED,
    FLAGGED,
}

export interface ICell {
    type: CellType;
    state: CellState;
    degree: number;
    isSafe: () => boolean;
    isMine: () => boolean;
    isHidden: () => boolean;
    isRevealed: () => boolean;
    isFlagged: () => boolean;
    reveal: () => void;
    toggleFlag: () => void;
    getDegree: () => number;
}

export interface IGrid {
    cells: ICell[][];
    initializeGrid: () => void;
    revealCell: (x: number, y: number) => void;
    toggleFlag: (x: number, y: number) => void;
    revealedCells: number;
    flaggedCells: number;
    gameOver: boolean;
}
