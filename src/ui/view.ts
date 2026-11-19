// What each cell shows, derived from the game state. Pure: no DOM, tested in view.test.ts.
// The core stores the truth; this decides how it looks. Every case is a row of the
// decision table in docs/ARCHITECTURE.md.

import { getCell, adjacentMineCount, type Game } from "../core/game";

export type CellView = { text: string; className: string; label: string };

export function cellView(game: Game, x: number, y: number): CellView {
    const cell = getCell(game, x, y);
    const view = { text: "", className: "ms-cell ms-hidden", label: "hidden" };

    if (cell.state === "revealed") {
        view.className = "ms-cell ms-revealed";
        if (cell.isMine) {
            view.text = "💣";
            view.className += " ms-exploded";
            view.label = "exploded mine";
        } else {
            const adjacentMines = adjacentMineCount(game, x, y);
            if (adjacentMines > 0) {
                view.text = String(adjacentMines);
                view.className += ` ms-n${adjacentMines}`;
                view.label = String(adjacentMines);
            } else {
                view.label = "empty";
            }
        }
    } else if (cell.state === "flagged") {
        view.className += " ms-flagged";
        if (game.status === "lost" && !cell.isMine) {
            view.text = "❌";
            view.label = "wrong flag";
        } else {
            view.text = "🚩";
            view.label = "flagged";
        }
    } else if (cell.isMine) {
        // Hidden mine. During play it must look like any hidden cell: the view must not leak mines.
        if (game.status === "lost") {
            view.text = "💣";
            view.label = "mine";
        } else if (game.status === "won") {
            view.text = "🚩";
            view.label = "flagged";
        }
    }

    return view;
}
