import { describe, it, expect } from "vitest";
import { createGame, getCell, neighbors, reveal, toggleFlag, adjacentMineCount } from "./game";

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
