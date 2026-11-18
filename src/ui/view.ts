import { getCell, adjacentMineCount, type Game } from "../core/game";

export type CellView = { text: string; className: string; label: string };
export function cellView(game: Game, x: number, y: number): CellView {
    const cell = getCell(game, x, y);

    const view = {text: "", className: "ms-cell", label: "cell"};
    
    /*
    hidden → ""
    flagged → 🚩
    revealed → the number, or "" if it’s 0
    lost, and a hidden mine → 💣
    the mine you clicked → 💣 in red
    lost, and a flag on a cell that isn’t a mine → ❌
    */

    if (cell.isMine && game.status === "lost") {
        view.text = "💣";
        view.label = "bomb";
        if (cell.state === "revealed") view.className += " ms-exploded";
    }

    if (cell.state === "flagged") {
        view.text = (!cell.isMine && game.status === "lost") ? "❌" : "🚩"
    }

    const adjacenMines = adjacentMineCount(game, x, y);
    if (cell.state === "revealed" && adjacenMines > 0) {
        view.text = String(adjacenMines);
        view.label = String(adjacenMines);
    }

    return view;
}
