import { getCell, adjacentMineCount, type Game } from "../core/game";

export type CellView = { text: string; className: string; label: string };
export function cellView(game: Game, x: number, y: number): CellView {
    const cell = getCell(game, x, y);

    const view = { text: "", className: "ms-cell", label: "hidden" };

    if (cell.state === "revealed") {
        view.className += " ms-revealed";
        if (cell.isMine) {
            view.text = "💣";
            view.className += " ms-exploded";
            view.label = "exploded bomb";
        } else {
            const adjacentMines = adjacentMineCount(game, x, y);
            if (adjacentMines > 0) {
                view.text = String(adjacentMines);
                view.label = String(adjacentMines);
            } else {
                view.label = "empty";
            }
        }
    } else if (cell.state === "flagged") {
        if (game.status === "lost" && !cell.isMine) {
            view.text = "❌";
            view.label = "false flag";
        } else {
            view.text = "🚩";
            view.label = "flagged";
        }
    } else if (cell.isMine) { // Remaining state is "hidden"
        if (game.status === "lost") {
            view.text = "💣";
            view.label = "bomb";
        } else if (game.status === "won") {
            view.text = "🚩";
            view.label = "flagged";
        }
    }


    return view;
}
