'use client';

import { useState, useCallback, useEffect } from 'react';
import { IGrid, ICell, CellType, CellState } from '@/types/grid.types';

const useGrid = (width: number, height: number, mines: number): IGrid => {
    const [cells, setCells] = useState<ICell[][]>([]);
    const [revealedCells, setRevealedCells] = useState(0);
    const [flaggedCells, setFlaggedCells] = useState(0);
    const [gameOver, setGameOver] = useState(false);

    const initializeGrid = useCallback(() => {
        console.log("initializeGrid");
        // Generate random mine positions
        const minePositions = new Set<number>();
        while (minePositions.size < mines) {
            minePositions.add(Math.floor(Math.random() * width * height));
        }
        // Create a matrix of height x width filled randomly with 0s on safe cells and 1s on mines
        const matrix = new Array(height).fill(null).map(() => new Array(width).fill(false));
        minePositions.forEach((position) => {
            const x = position % width;
            const y = Math.floor(position / width);
            matrix[y][x] = true;
        });
        // Create a new cells array
        const newCells = new Array(height).fill(null).map((_, y) => new Array(width).fill(null).map((_, x) => {
            let degree = 0;

            // Check all cells in a 3x3 area around the given cell (x, y)
            for (let i = Math.max(0, x - 1); i <= Math.min(x + 1, width - 1); i++) {
                for (let j = Math.max(0, y - 1); j <= Math.min(y + 1, height - 1); j++) {
                    // Don't count the cell itself
                    if (i === x && j === y) continue;
                    // Count if the cell contains a mine
                    if (matrix[j][i]) {
                        degree++;
                    }
                }
            }

            return createCell(matrix[y][x], degree);
        }));
        setCells(newCells);
    }, [width, height, mines]);

    const revealCell = useCallback((x: number, y: number) => {
        // If the cell is revealed and empty do nothing
        console.log("cells:");
        console.log(cells);
        if (cells[y][x].isRevealed() && cells[y][x].getDegree() === 0) {
            console.log("isRevealed");
            return;
        }

        // If the cell is flagged, do nothing
        if (cells[y][x].isFlagged()) {
            console.log("isFlagged");
            return;
        }

        // If the cell has been revealed and the degree equals the number of flagged neighbors, reveal all hidden neighbors
        const neighbors: ICell[] = []
        
        for (let x_delta = -1; x_delta <= 1; x_delta++) {
            for (let y_delta = -1; y_delta <= 1; y_delta++) {
                // Skip the current cell and out-of-bounds cells
                if (
                    x_delta === 0 && y_delta === 0
                    || x + x_delta < 0 || x + x_delta >= width
                    || y + y_delta < 0 || y + y_delta >= height
                ) {
                    continue;
                }
                // Add valid neighbor to array
                neighbors.push(cells[y + y_delta][x + x_delta]);
            }
        }

        console.log("neighbors:");
        console.log(neighbors);

        const flaggedNeighbors = neighbors.filter(cell => cell.isFlagged()).length;
        console.log(`flaggedNeighbors: ${flaggedNeighbors}`)

        if (cells[y][x].isRevealed() && cells[y][x].getDegree() === flaggedNeighbors) {
            neighbors.forEach(cell => {
                if (cell.isHidden()) {
                    // Reveal the cell, if it is a mine, game over
                    cell.reveal();
                    setRevealedCells((prev) => prev + 1);
                    if (cell.isMine()) {
                        setGameOver(true);
                    }
                }
            });
            return;
        } else if (!cells[y][x].isRevealed()) {
            // Reveal the cell, if it is a mine, game over
            cells[y][x].reveal();
            if (cells[y][x].isMine()) {
                setGameOver(true);
            }
            setRevealedCells((prev) => prev + 1);
        }
        console.log(cells);
    }, [cells]);

    const toggleFlag = useCallback((x: number, y: number) => {
        // If the cell is revealed, do nothing
        if (cells[y][x].isRevealed()) {
            return;
        }

        // Toggle flag
        cells[y][x].toggleFlag();
        if (cells[y][x].isFlagged()) {
            setFlaggedCells((prev) => prev + 1);
        } else {
            setFlaggedCells((prev) => prev - 1);
        }
    }, [cells, flaggedCells]);

    useEffect(() => {
        console.log("I fire once");
        initializeGrid();
    }, [initializeGrid]);

    return { cells, initializeGrid, revealCell, toggleFlag, revealedCells, flaggedCells, gameOver};
};

function createCell(mine: boolean, degree: number): ICell {
    // Create a single cell
    return {
        type: mine ? CellType.MINE : CellType.SAFE,
        state: CellState.HIDDEN,
        degree: degree,
        // Implement the methods as needed
        isSafe: function() { return this.type === CellType.SAFE; },
        isMine: function() { return this.type === CellType.MINE; },
        isHidden: function() { return this.state === CellState.HIDDEN; },
        isRevealed: function() { return this.state === CellState.REVEALED; },
        isFlagged: function() { return this.state === CellState.FLAGGED; },
        reveal: function() { this.state = CellState.REVEALED; },
        toggleFlag: function() { this.state = this.state === CellState.FLAGGED ? CellState.HIDDEN : CellState.FLAGGED; },
        getDegree: function() { return this.degree; },
    };
}

export default useGrid;
