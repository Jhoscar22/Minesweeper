import { describe, it, expect } from "vitest";
import { createGame, getCell, neighbors, reveal, toggleFlag, adjacentMineCount, revealedCount } from "./game";

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
    expect(game.status).toBe("ready");
  });

  it("revealing a flagged cell does nothing", ()=> {
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
