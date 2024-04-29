// Cell type enum
export const CellType = {
    SAFE: 0,
    MINE: 1,
};

// Cell state enum
export const CellState = {
    HIDDEN: 0,
    REVEALED: 1,
    FLAGGED: 2,
};

class CellClass {
    constructor(type) {
        this.type = type;
        this.state = CellState.HIDDEN;
        this.degree = 0;
    }

    isSafe() {
        return this.type === CellType.SAFE;
    }

    isMine() {
        return this.type === CellType.MINE;
    }

    isHidden() {
        return this.state === CellState.HIDDEN;
    }

    isRevealed() {
        return this.state === CellState.REVEALED;
    }

    isFlagged() {
        return this.state === CellState.FLAGGED;
    }

    reveal() {
        this.state = CellState.REVEALED;
    }

    toggleFlag() {
        if (this.state === CellState.HIDDEN) {
            this.state = CellState.FLAGGED;
        } else if (this.state === CellState.FLAGGED) {
            this.state = CellState.HIDDEN;
        }
    }

    getDegree() {
        return this.degree;
    }

    setDegree(degree) {
        this.degree = degree;
    }
}

class GridClass {
    constructor(width, height, mines) {
        this.width = width;
        this.height = height;
        this.mines = mines;
        this.cells = [];
        this.revealedCells = 0;
        this.flaggedMines = 0;
        this.gameOver = false;
        this.generateGrid();
    }

    generateGrid() {
        // Initialize grid with safe cells
        for (let i = 0; i < this.height; i++) {
            this.cells.push([]);
            for (let j = 0; j < this.width; j++) {
                this.cells[i].push(new CellClass(CellType.SAFE));
            }
        }

        // Place mines
        let minesPlaced = 0;
        while (minesPlaced < this.mines) {
            const x = Math.floor(Math.random() * this.width);
            const y = Math.floor(Math.random() * this.height);
            if (this.cells[y][x].type === CellType.SAFE) {
                this.cells[y][x].type = CellType.MINE;
                minesPlaced++;
            }
        }

        // Calculate degrees
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                this.cells[y][x].setDegree(this.getDegree(x, y));
            }
        }
    }

    getNeighbors(x, y) {
        // Declare array to store neighbors
        const neighbors = [];
        // Iterate through all possible neighbors in a 3x3 grid
        for (let x_delta = -1; x_delta <= 1; x_delta++) {
            for (let y_delta = -1; y_delta <= 1; y_delta++) {
                // Skip the current cell and out-of-bounds cells
                if (
                    x_delta === 0 && y_delta === 0
                    || x + x_delta < 0 || x + x_delta >= this.width
                    || y + y_delta < 0 || y + y_delta >= this.height
                ) {
                    continue;
                }
                // Add valid neighbor to array
                neighbors.push(this.cells[y + y_delta][x + x_delta]);
            }
        }
        return neighbors;
    }

    getDegree(x, y) {
        const neighbors = this.getNeighbors(x, y);
        return neighbors.reduce((sum, cell) => sum + cell.isMine(), 0);
    }

    primaryInteraction(x, y) {
        // If the cell is revealed and empty do nothing
        if (this.cells[y][x].isRevealed() && this.cells[y][x].getDegree() === 0) {
            return;
        }
        // If the cell is a mine, game over
        if (this.cells[y][x].isMine()) {
            this.gameOver = true;
            return;
        }
        // If the cell is flagged, do nothing
        if (this.cells[y][x].isFlagged()) {
            return;
        }

        // If the cell has been revealed and the degree equals the number of flagged neighbors, reveal all hidden neighbors
        const flaggedNeighbors = this.getNeighbors(x, y).filter(cell => cell.isFlagged()).length;
        if (this.cells[y][x].isRevealed() && this.cells[y][x].getDegree() === flaggedNeighbors) {
            this.getNeighbors(x, y).forEach(cell => {
                if (cell.isHidden()) {
                    // Reveal the cell, if it is a mine, game over
                    cell.reveal();
                    this.revealedCells++;
                    if (cell.isMine()) {
                        this.gameOver = true;
                    }
                }
            });
            return;
        }

        // Reveal the cell and recursively reveal neighbors until degree > 0
        this.cells[y][x].reveal();
        this.revealedCells++;
        if (this.cells[y][x].isMine()) {
            this.gameOver = true;
            return;
        } else {
            if (this.cells[y][x].getDegree() === 0) {
                const neighbors = this.getNeighbors(x, y);
                neighbors.forEach(cell => {
                    if (cell.isHidden()) {
                        this.primaryInteraction(cell.x, cell.y);
                    }
                });
            }
        }

        // Check for win condition
        if (this.revealedCells === this.width * this.height - this.mines) {
            this.gameOver = true;
        }

    }

    secondaryInteraction(x, y) {
        // If the cell is revealed, do nothing
        if (this.cells[y][x].isRevealed()) {
            return;
        }

        // Toggle flag
        this.cells[y][x].toggleFlag();
        if (this.cells[y][x].isFlagged()) {
            this.flaggedMines++;
        } else {
            this.flaggedMines--;
        }
    }
}

export default GridClass;