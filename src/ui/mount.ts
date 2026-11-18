import { newGame, reveal, chord, getCell, type Game } from "../core/game";
import { cellView } from "./view";
import "./style.css";

export function mount(root: HTMLElement): () => void {
    // "useState"
    let game = newGame(9, 9, 10);

    // "useRef": things that survive between renders
    let buttons: HTMLButtonElement[][] = [];
    let renderedCells: Game["cells"] | null = null;
    let renderedStatus: Game["status"] | null = null;

    // "JSX": the structure, built once
    const container = document.createElement("div");
    container.className = "minesweeper";
    const statusText = document.createElement("p");
    const board = document.createElement("div");
    board.className = "ms-board";
    container.append(statusText, board);
    root.append(container);

    // creates one button per cell
    function buildBoard() {
        board.replaceChildren(); // removes the previous buttons
        board.style.setProperty("--cols", String(game.width));
        buttons = game.cells.map((row, y) => {
            return row.map((_, x) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "ms-cell";
                button.dataset.x = String(x);
                button.dataset.y = String(y);
                board.append(button);
                return button;
            })
        });
        renderedCells = null; // forces a full render
    }

    function render() {
        // TODO 1: statusText.textContent according to game.status
        // TODO 2: if the status changed → full render (the memo trap)
        // TODO 3: for each row y: if renderedCells?.[y] === row → skip the row
        //         for each cell x: if it's the same object → skip it
        //         otherwise: const view = cellView(game, x, y), then update buttons[y][x]
        renderedCells = game.cells;
        renderedStatus = game.status;
    }

    function update(next: Game) {
        if (next === game) return;
        game = next;
        render();
    }

    function onClick(event: MouseEvent) {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".ms-cell");
        if (!button) return;
        const x = Number(button.dataset.x);
        const y = Number(button.dataset.y);
        // TODO 4: hidden → update(reveal(...)); revealed → update(chord(...))
    }

    board.addEventListener("click", onClick);
    buildBoard();
    render();

    // "useEffect cleanup": undo everything mount did
    return () => {
        board.removeEventListener("click", onClick);
        container.remove();
    };
}
