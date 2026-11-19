import { newGame, reveal, chord, getCell, toggleFlag, minesLeft, type Game } from "../core/game";
import { cellView } from "./view";
import "./style.css";

const DIFFICULTIES = {
    beginner: { width: 9, height: 9, mines: 10 },
    intermediate: { width: 16, height: 16, mines: 40 },
    expert: { width: 30, height: 16, mines: 99 },
} as const;
type Difficulty = keyof typeof DIFFICULTIES;

function isDifficulty(value: string): value is Difficulty {
    return Object.hasOwn(DIFFICULTIES, value);
}

const STATUS_TEXT: Record<Game["status"], string> = {
    ready: "Click any cell",
    playing: "Sweeping",
    won: "Cleared!",
    lost: "Boom",
};

function formatCounter(n: number): string {
    return (n < 0 ? "-" : "") + String(Math.abs(n)).padStart(n < 0 ? 2 : 3, "0");
}

export function mount(root: HTMLElement): () => void {
    let difficulty: Difficulty = "beginner";
    let game: Game = newGame(9, 9, 10); // replaced by startNewGame() below

    let buttons: HTMLButtonElement[][] = [];
    let renderedCells: Game["cells"] | null = null;
    let renderedStatus: Game["status"] | null = null;

    let timerId: ReturnType<typeof setInterval> | undefined;
    let startedAt = 0;

    let pressTimer: ReturnType<typeof setTimeout> | undefined;
    let longPressFired = false;
    let lastPointerType = "";

    // Structure, built once
    const container = document.createElement("div");
    container.className = "minesweeper";

    const header = document.createElement("div");
    header.className = "ms-header";
    const counter = document.createElement("div");
    counter.className = "ms-counter";
    const restart = document.createElement("button");
    restart.type = "button";
    restart.className = "ms-restart";
    restart.setAttribute("aria-label", "New game");
    const timer = document.createElement("div");
    timer.className = "ms-timer";
    const difficultySelect = document.createElement("select");
    difficultySelect.className = "ms-difficulty";
    difficultySelect.setAttribute("aria-label", "Difficulty");
    for (const name of Object.keys(DIFFICULTIES)) {
        difficultySelect.add(new Option(name, name));
    }
    header.append(counter, restart, timer, difficultySelect);

    const statusText = document.createElement("p");
    statusText.className = "ms-status";
    const boardWrap = document.createElement("div");
    boardWrap.className = "ms-board-wrap";
    const board = document.createElement("div");
    board.className = "ms-board";
    boardWrap.append(board);

    container.append(header, statusText, boardWrap);
    root.append(container);

    // Timer: UI state, the core has no clock
    function startTimer() {
        stopTimer();
        startedAt = Date.now();
        timerId = setInterval(showTime, 1000);
    }
    function stopTimer() {
        if (timerId !== undefined) clearInterval(timerId);
        timerId = undefined;
    }
    function showTime() {
        const seconds = Math.min(999, Math.floor((Date.now() - startedAt) / 1000));
        timer.textContent = formatCounter(seconds);
    }

    function startNewGame() {
        const { width, height, mines } = DIFFICULTIES[difficulty];
        game = newGame(width, height, mines);
        stopTimer();
        timer.textContent = formatCounter(0);
        buildBoard();
        render();
    }

    function buildBoard() {
        board.replaceChildren();
        board.style.setProperty("--cols", String(game.width));
        buttons = game.cells.map((row, y) =>
            row.map((_, x) => {
                const button = document.createElement("button");
                button.type = "button";
                button.className = "ms-cell";
                button.dataset.x = String(x);
                button.dataset.y = String(y);
                board.append(button);
                return button;
            }),
        );
        renderedCells = null;
        renderedStatus = null;
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
        restart.textContent = game.status === "lost" ? "😵" : game.status === "won" ? "😎" : "🙂";
    }

    function update(next: Game) {
        if (next === game) return;
        const before = game.status;
        game = next;
        if (before === "ready" && next.status !== "ready") startTimer();
        if (next.status === "won" || next.status === "lost") {
            stopTimer();
            showTime(); // show the exact final time
        }
        render();
    }

    // Reads the cell coordinates from the button an event happened on
    function cellFromEvent(event: Event): { x: number; y: number } | null {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".ms-cell");
        if (!button) return null;
        return { x: Number(button.dataset.x), y: Number(button.dataset.y) };
    }

    function onClick(event: MouseEvent) {
        if (longPressFired) { longPressFired = false; return; }
        const pos = cellFromEvent(event);
        if (!pos) return;
        const cell = getCell(game, pos.x, pos.y);
        update(cell.state === "revealed" ? chord(game, pos.x, pos.y) : reveal(game, pos.x, pos.y));
    }

    function onContextMenu(event: MouseEvent) {
        event.preventDefault();
        if (lastPointerType === "touch") return; // touch flags via our long-press; Android also fires contextmenu
        const pos = cellFromEvent(event);
        if (!pos) return;
        update(toggleFlag(game, pos.x, pos.y));
    }

    function onPointerDown(event: PointerEvent) {
        lastPointerType = event.pointerType;
        if (event.pointerType !== "touch") return;
        longPressFired = false;
        const pos = cellFromEvent(event);
        if (!pos) return;
        pressTimer = setTimeout(() => {
            longPressFired = true;
            update(toggleFlag(game, pos.x, pos.y));
        }, 400);
    }

    function cancelPress() {
        clearTimeout(pressTimer);
    }

    function onDifficultyChange() {
        const value = difficultySelect.value; // string
        if (!isDifficulty(value)) return;
        difficulty = value;                   // narrowed to Difficulty by the type predicate
        startNewGame();
    }

    board.addEventListener("click", onClick);
    board.addEventListener("contextmenu", onContextMenu);
    board.addEventListener("pointerdown", onPointerDown);
    board.addEventListener("pointerup", cancelPress);
    board.addEventListener("pointercancel", cancelPress);
    board.addEventListener("pointerleave", cancelPress);
    restart.addEventListener("click", startNewGame);
    difficultySelect.addEventListener("change", onDifficultyChange);

    startNewGame();

    return () => {
        stopTimer();
        cancelPress();
        board.removeEventListener("click", onClick);
        board.removeEventListener("contextmenu", onContextMenu);
        board.removeEventListener("pointerdown", onPointerDown);
        board.removeEventListener("pointerup", cancelPress);
        board.removeEventListener("pointercancel", cancelPress);
        board.removeEventListener("pointerleave", cancelPress);
        restart.removeEventListener("click", startNewGame);
        difficultySelect.removeEventListener("change", onDifficultyChange);
        container.remove();
    };
}
