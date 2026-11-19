import { describe, it, expect } from "vitest";
import { cellView } from "./view";

import { createGame, reveal, type Game, type GameStatus, type CellState } from "../core/game";

function oneCellGame(status: GameStatus, state: CellState, isMine: boolean): Game {
  return { width: 1, height: 1, mineCount: isMine ? 1 : 0, status, cells: [[{ isMine, state }]] };
}

describe("cellView decision table", () => {
    it.each<[string, GameStatus, CellState, boolean, string]>([
        ["hidden cell during play", "playing", "hidden", false, ""],
        ["hidden mine during play does not leak", "playing", "hidden", true, ""],
        ["flag during play", "playing", "flagged", true, "🚩"],
        ["hidden mine after losing", "lost", "hidden", true, "💣"],
        ["hidden safe cell after losing", "lost", "hidden", false, ""],
        ["correct flag after losing", "lost", "flagged", true, "🚩"],
        ["wrong flag after losing", "lost", "flagged", false, "❌"],
        ["exploded mine", "lost", "revealed", true, "💣"],
        ["remaining mine after winning", "won", "hidden", true, "🚩"],
    ])("%s", (_, status, state, isMine, text) => {
        expect(cellView(oneCellGame(status, state, isMine), 0, 0).text).toBe(text);
    });
    it("shows the adjacent mine count on a revealed cell", () => {
        const game = reveal(createGame(2, 1, [[1, 0]]), 0, 0);
        expect(cellView(game, 0, 0).text).toBe("1");
    });
    it("shows as empty on a revealed cell with no neighbor mines", () => {
        const game = reveal(createGame(3, 4, [[1, 3]]), 1, 1);
        expect(cellView(game, 0, 0).text).toBe("");
    });
    it("does not leak hidden mines: a hidden mine looks exactly like a hidden safe cell", () => {
        const game = createGame(3, 3, [[1, 1]]);
        expect(cellView(game, 1, 1)).toEqual(cellView(game, 0, 0));
    });
})
