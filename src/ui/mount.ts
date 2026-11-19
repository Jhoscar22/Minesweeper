import { newGame, reveal, chord, getCell, type Game, toggleFlag } from "../core/game";
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

    function getButton(x: number, y: number): HTMLButtonElement {
        const button = buttons[y]?.[x];
        if (button === undefined) throw new Error(`No button at ${x},${y}`);
        return button;
    }

    function renderCell(x: number, y: number) {
        const view = cellView(game, x, y);
        const button = getButton(x, y);
        button.textContent = view.text;
        button.className = view.className;
        button.setAttribute("aria-label", view.label);
    }

    function render() {
        const fullRender = renderedStatus !== game.status;
        statusText.textContent = game.status;
        for (const [y, row] of game.cells.entries()) {
            if (!fullRender && renderedCells?.[y] === row) continue;
            for (const [x, cell] of row.entries()) {
                if (!fullRender && renderedCells?.[y]?.[x] === cell) continue;
                renderCell(x, y);
            }
        }
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
        const cell = getCell(game, x, y);
        update(cell.state === "revealed" ? chord(game, x, y) : reveal(game, x, y));
    }

    function onContextMenu(event: PointerEvent) {
        event.preventDefault();
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".ms-cell");
        if (!button) return;
        const x = Number(button.dataset.x);
        const y = Number(button.dataset.y);
        update(toggleFlag(game, x, y));
    }

    board.addEventListener("click", onClick);
    board.addEventListener("contextmenu", onContextMenu);
    buildBoard();
    render();

    // "useEffect cleanup": undo everything mount did
    return () => {
        board.removeEventListener("click", onClick);
        board.removeEventListener("contextmenu", onContextMenu);
        container.remove();
    };
}
