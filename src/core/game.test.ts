import { describe, it, expect } from "vitest";
import { createGame, getCell, neighbors, reveal, toggleFlag, adjacentMineCount, revealedCount, newGame, chord, minesLeft } from "./game";

describe("neighbors", () => {
    const game = createGame(3, 3, []);

    it("returns 3 positions for a corner", () => {
        expect(neighbors(game, 0, 0)).toHaveLength(3);
    });

    it("returns 8 positions for the center", () => {
        expect(neighbors(game, 1, 1)).toHaveLength(8);
    });
});

describe("reveal", () => {
    it("loses the game when revealing a mine", () => {
        const game = createGame(3, 3, [[1, 1]]);
        expect(reveal(game, 1, 1).status).toBe("lost");
    });

    it("does not modify the original game", () => {
        const game = createGame(3, 3, [[1, 1]]);
        reveal(game, 0, 0);
        expect(getCell(game, 0, 0).state).toBe("hidden");
        expect(game.status).toBe("playing");
    });

    it("revealing a flagged cell does nothing", () => {
        const game = createGame(3, 3, [[1, 1]]);
        const toggled = toggleFlag(game, 0, 0);
        expect(reveal(toggled, 0, 0)).toBe(toggled);
    });

    it("reveals the whole connected region of zeros", () => {
        const game = createGame(4, 4, [[3, 3]]);
        const revealed = reveal(game, 0, 0);
        expect(revealedCount(revealed)).toBe(15);
        expect(getCell(revealed, 3, 3).state).toBe("hidden");
    });

    it("stops at numbered cells and doesn't cross a wall of mines", () => {
        const game = createGame(5, 3, [[2, 0], [2, 1], [2, 2]]);
        const revealed = reveal(game, 0, 0);
        expect(revealedCount(revealed)).toBe(6);
        for (let y = 0; y < 3; y++) {
            expect(getCell(revealed, 1, y).state).toBe("revealed");
            expect(getCell(revealed, 3, y).state).toBe("hidden");
        }
    });

    it("revealing a numbered cell reveals only that cell", () => {
        const game = createGame(5, 3, [[2, 0], [2, 1], [2, 2]]);
        const revealed = reveal(game, 3, 0);
        expect(revealedCount(revealed)).toBe(1);
    });

    it("flood reveal leaves flags unaffected", () => {
        const game = createGame(4, 4, [[3, 3]]);
        const toggled = toggleFlag(game, 3, 0);
        const revealed = reveal(toggled, 0, 0);
        expect(revealedCount(revealed)).toBe(14);
        expect(getCell(revealed, 3, 0).state).toBe("flagged")
        expect(getCell(revealed, 3, 3).state).toBe("hidden")
    });

    it("reveals all board if there are no mines", () => {
        const game = createGame(4, 4, []);
        const revealed = reveal(game, 0, 0);
        expect(revealedCount(revealed)).toBe(16);
    })

    it("revealing a safe cell (zero) keeps the game playing (if at least one cell remains hidden)", () => {
        const game = createGame(4, 4, [[2, 2], [2, 3], [3, 2]]);
        const revealed = reveal(game, 0, 0);
        expect(revealed.status).toBe("playing");
    });

    it("revealing a safe cell (number) keeps the game playing (if at least one cell remains hidden)", () => {
        const game = createGame(4, 4, [[3, 3]]);
        const revealed = reveal(game, 2, 2);
        expect(revealed.status).toBe("playing");
    });

    it("revealing a mine loses the game", () => {
        const game = createGame(4, 4, [[3, 3]]);
        const revealed = reveal(game, 3, 3);
        expect(revealed.status).toBe("lost");
    });

    it("revealing the last safe cell wins the game", () => {
        const game = createGame(4, 4, [[2, 2], [2, 3], [3, 2]]);
        const firstReveal = reveal(game, 0, 0);
        const secondReveal = reveal(firstReveal, 3, 3);
        expect(secondReveal.status).toBe("won");
    });
});

describe("toggleFlag", () => {
    it("flagging twice returns the cell to hidden", () => {
        const game = createGame(3, 3, []);
        const twice = toggleFlag(toggleFlag(game, 0, 0), 0, 0);
        expect(getCell(twice, 0, 0).state).toBe("hidden");
    });
});

describe("adjacentMineCount", () => {
    it("counts two mines in the same column (regression: key bug)", () => {
        const game = createGame(3, 3, [[1, 0], [1, 2]]);
        expect(game.mineCount).toBe(2);
        expect(adjacentMineCount(game, 0, 1)).toBe(2);
    });

    it("returns 0 when no neighbor is a mine", () => {
        const game = createGame(3, 3, [[0, 0]]);
        expect(adjacentMineCount(game, 2, 2)).toBe(0);
    });
});

describe("createGame", () => {
    it("rejects duplicate mines", () => {
        expect(() => createGame(3, 3, [[1, 1], [1, 1]])).toThrow("Duplicate");
    });

    it("rejects mines outside the board", () => {
        expect(() => createGame(3, 3, [[3, 0]])).toThrow("out of bounds");
    });
});

describe("after losing", () => {
    it("ignores further moves", () => {
        const lost = reveal(createGame(3, 3, [[1, 1]]), 1, 1);
        expect(reveal(lost, 0, 0)).toBe(lost);
        expect(toggleFlag(lost, 0, 0)).toBe(lost);
    });
});

function sequence(...values: number[]): () => number {
    let i = 0;
    return () => values[i++ % values.length]!;
}

describe("newGame", () => {
    it("starts in 'ready' with no mines on the board", () => {
        const game = newGame(4, 4, 3);
        expect(game.mineCount).toBe(3);
        const cellsFlat = game.cells.flat();
        expect(cellsFlat.filter(c => c.isMine === true).length).toBe(0);
    });
    it("rejects a mineCount larger than width * height - 9", () => {
        expect(() => newGame(4, 4, 10)).toThrow("Mine count exceeds limit allowed by board size");
    });
});

describe("first click", () => {
    it("places exactly mineCount mines", () => {
        const game = newGame(4, 4, 3);
        expect(game.mineCount).toBe(3);
        const revealed = reveal(game, 0, 0);
        const cellsFlat = revealed.cells.flat();
        expect(cellsFlat.filter(c => c.isMine === true).length).toBe(3);
    });
    it("never places a mine in the 3x3 safe zone (repeat 100 times with Math.random)", () => {
        for (let i = 0; i < 100; i++) {
            const game = newGame(10, 10, 40);
            const x = Math.floor(Math.random() * 10);
            const y = Math.floor(Math.random() * 10);
            const revealed = reveal(game, x, y);
            expect(getCell(revealed, x, y).isMine).toBe(false);
            expect(adjacentMineCount(revealed, x, y)).toBe(0);
        }
    });
    it("works in a corner, where the safe zone has only 4 cells", () => {
        const game = newGame(10, 10, 40);
        const firstReveal = reveal(game, 9, 0);
        expect(getCell(firstReveal, 9, 0).isMine).toBe(false);
        expect(adjacentMineCount(firstReveal, 9, 0)).toBe(0);
        const secondReveal = reveal(game, 0, 9);
        expect(getCell(secondReveal, 0, 9).isMine).toBe(false);
        expect(adjacentMineCount(secondReveal, 0, 9)).toBe(0);
    }); // Might happen in test prior, but this case is here for certainty
    it("is deterministic: the same random sequence gives the same board", () => {
        const game = newGame(10, 10, 40);
        const minePlacementOne = reveal(game, 4, 5, sequence(0.1, 0.7, 0.3, 0.9));
        const minePlacementTwo = reveal(game, 4, 5, sequence(0.1, 0.7, 0.3, 0.9));
        expect(minePlacementOne.cells).toEqual(minePlacementTwo.cells);
    });
    it("retains flagged placed prior", () => {
        const game = newGame(10, 10, 40);
        const flagged = toggleFlag(game, 0, 0);
        const revealed = reveal(flagged, 9, 9);
        expect(getCell(revealed, 0, 0).state).toBe("flagged");
    });
});

describe("chord", () => {
    it("reveals the hidden neighbors when the flag count matches the number", () => {
        const game = createGame(5, 5, [[2, 1], [2, 2], [2, 3]]);
        const revealed = reveal(game, 1, 2); // Will show 3
        const f1 = toggleFlag(revealed, 2, 1);
        const f2 = toggleFlag(f1, 2, 2);
        const flagged = toggleFlag(f2, 2, 3);
        const chorded = chord(flagged, 1, 2);
        expect(revealedCount(chorded)).toBe(10);
    });
    it("does nothing (returns the same object) when flags are missing", () => {
        const game = createGame(5, 5, [[2, 1], [2, 2], [4, 0]]);
        const revealed = reveal(game, 1, 2); // Will show 2
        const chorded = chord(revealed, 1, 2);
        expect(revealedCount(chorded)).toBe(1);
        expect(chorded).toBe(revealed);
    });
    it("does nothing on a hidden cell", () => {
        const game = createGame(5, 5, [[0, 0], [2, 2], [4, 0]]);
        const chorded = chord(game, 1, 1);
        expect(revealedCount(chorded)).toBe(0);
        expect(chorded).toBe(game);
    });
    it("loses the game when a flag is misplaced", () => {
        const game = createGame(5, 5, [[2, 1], [2, 2], [0, 3]]);
        const revealed = reveal(game, 1, 2); // Will show 3
        const f1 = toggleFlag(revealed, 2, 1);
        const f2 = toggleFlag(f1, 2, 2);
        const flagged = toggleFlag(f2, 2, 3);
        const chorded = chord(flagged, 1, 2);
        expect(chorded.status).toBe("lost");
    });
    it("cascades: a revealed zero neighbor starts a flood fill", () => {
        const game = createGame(5, 5, [[2, 1], [2, 2]]);
        const revealed = reveal(game, 1, 2); // Will show 2
        const f1 = toggleFlag(revealed, 2, 1);
        const flagged = toggleFlag(f1, 2, 2);
        const chorded = chord(flagged, 1, 2);
        expect(revealedCount(chorded)).toBe(22);
        expect(getCell(chorded, 2, 0).state).toBe("hidden");
        expect(getCell(chorded, 2, 1).state).toBe("flagged");
        expect(getCell(chorded, 2, 2).state).toBe("flagged");
    });
});

describe("minesLeft", () => {
    it("equals mineCount minus the flags placed", () => {
        const game = createGame(5, 5, [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]);
        const f1 = toggleFlag(game, 4, 0);
        const f2 = toggleFlag(f1, 4, 1);
        const f3 = toggleFlag(f2, 0, 1);
        const flagged = toggleFlag(f3, 0, 2);
        expect(minesLeft(flagged)).toBe(1);
    });
    it("can be negative when there are more flags than mines", () => {
        const game = createGame(5, 5, [[0, 0], [0, 1], [0, 2]]);
        const f1 = toggleFlag(game, 4, 0);
        const f2 = toggleFlag(f1, 4, 1);
        const f3 = toggleFlag(f2, 0, 1);
        const flagged = toggleFlag(f3, 0, 2);
        expect(minesLeft(flagged)).toBe(-1);
    });
});
