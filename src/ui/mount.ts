// Puts a playable Minesweeper inside `root`. This file wires the pieces together:
//   core/game.ts  the rules (data in, data out)
//   view.ts       what each cell shows
//   input.ts      which cell was clicked, tapped or long-pressed
//   stopwatch.ts  the timer
// Read it in order: state → structure → game flow → rendering → wiring.

import { chord, getCell, minesLeft, newGame, reveal, toggleFlag, type Game } from "../core/game";
import { DIFFICULTIES, isDifficulty, type Difficulty } from "./difficulty";
import { el } from "./dom";
import { RESTART_FACE, STATUS_TEXT, formatCounter } from "./format";
import { attachCellInput } from "./input";
import { createStopwatch } from "./stopwatch";
import { cellView } from "./view";
import "./style.css";

/** Renders the game into `root`. Returns a cleanup function that removes it and stops everything it started. */
export function mount(root: HTMLElement): () => void {
    // ─── State ("useState" / "useRef" in React terms) ──────────────────────
    let difficulty: Difficulty = "beginner";
    let game: Game = newGame(9, 9, 10); // replaced by startNewGame() at the end

    let buttons: HTMLButtonElement[][] = [];
    // What's on screen right now: the render cache. Its "dependencies" are cells AND status.
    let renderedCells: Game["cells"] | null = null;
    let renderedStatus: Game["status"] | null = null;

    // ─── Structure, built once ─────────────────────────────────────────────
    const container = el("div", "minesweeper");
    const header = el("div", "ms-header");
    const counter = el("div", "ms-counter");
    const restart = el("button", "ms-restart", { type: "button", "aria-label": "New game" });
    const timer = el("div", "ms-timer");
    const difficultySelect = el("select", "ms-difficulty", { "aria-label": "Difficulty" });
    for (const name of Object.keys(DIFFICULTIES)) {
        difficultySelect.add(new Option(name, name));
    }
    header.append(counter, restart, timer, difficultySelect);

    const statusText = el("p", "ms-status");
    const boardWrap = el("div", "ms-board-wrap");
    const board = el("div", "ms-board");
    boardWrap.append(board);

    container.append(header, statusText, boardWrap);
    root.append(container);

    const stopwatch = createStopwatch((seconds) => {
        timer.textContent = formatCounter(seconds);
    });

    // ─── Game flow ─────────────────────────────────────────────────────────

    function startNewGame() {
        const { width, height, mines } = DIFFICULTIES[difficulty];
        game = newGame(width, height, mines);
        stopwatch.reset();
        buildBoard();
        render();
    }

    /** The only place `game` changes. Every move goes through here. */
    function update(next: Game) {
        if (next === game) return; // moves return the same object when nothing changed
        const before = game.status;
        game = next;
        if (before === "ready" && next.status !== "ready") stopwatch.start();
        if (next.status === "won" || next.status === "lost") {
            stopwatch.stop();
            timer.textContent = formatCounter(stopwatch.elapsed()); // exact final time
        }
        render();
    }

    function onPrimary(x: number, y: number) {
        const cell = getCell(game, x, y);
        update(cell.state === "revealed" ? chord(game, x, y) : reveal(game, x, y));
    }

    function onFlag(x: number, y: number) {
        update(toggleFlag(game, x, y));
    }

    function onDifficultyChange() {
        const value = difficultySelect.value; // a string
        if (!isDifficulty(value)) return;
        difficulty = value; // narrowed to Difficulty by the type predicate
        startNewGame();
    }

    // ─── Rendering ─────────────────────────────────────────────────────────

    /** Creates one button per cell. Only runs when a new game starts. */
    function buildBoard() {
        board.replaceChildren();
        board.style.setProperty("--cols", String(game.width));
        buttons = game.cells.map((row, y) =>
            row.map((_, x) => {
                const button = el("button", "ms-cell", { type: "button" });
                button.dataset.x = String(x);
                button.dataset.y = String(y);
                board.append(button);
                return button;
            }),
        );
        renderedCells = null;
        renderedStatus = null;
    }

    /** Updates only the cells that changed, unless the status changed (then the whole board). */
    function render() {
        const fullRender = renderedStatus !== game.status;
        for (const [y, row] of game.cells.entries()) {
            if (!fullRender && renderedCells?.[y] === row) continue;
            for (const [x, cell] of row.entries()) {
                if (!fullRender && renderedCells?.[y]?.[x] === cell) continue;
                renderCell(x, y);
            }
        }
        renderedCells = game.cells;
        renderedStatus = game.status;

        statusText.textContent = STATUS_TEXT[game.status];
        counter.textContent = formatCounter(minesLeft(game));
        restart.textContent = RESTART_FACE[game.status];
    }

    function renderCell(x: number, y: number) {
        const view = cellView(game, x, y);
        const button = getButton(x, y);
        button.textContent = view.text;
        button.className = view.className;
        button.setAttribute("aria-label", view.label);
    }

    function getButton(x: number, y: number): HTMLButtonElement {
        const button = buttons[y]?.[x];
        if (button === undefined) throw new Error(`No button at ${x},${y}`);
        return button;
    }

    // ─── Wiring and cleanup ────────────────────────────────────────────────

    const detachInput = attachCellInput(board, { onPrimary, onFlag });
    restart.addEventListener("click", startNewGame);
    difficultySelect.addEventListener("change", onDifficultyChange);

    startNewGame();

    // "useEffect cleanup": undo everything mount did
    return () => {
        stopwatch.stop();
        detachInput();
        restart.removeEventListener("click", startNewGame);
        difficultySelect.removeEventListener("change", onDifficultyChange);
        container.remove();
    };
}
