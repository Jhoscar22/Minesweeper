// Turns raw mouse and touch events on the board into two intents:
//   onPrimary(x, y): left click or tap
//   onFlag(x, y):    right-click, or long-press on touch screens
// mount.ts decides what each intent does to the game.

export type CellInputHandlers = {
    onPrimary(x: number, y: number): void;
    onFlag(x: number, y: number): void;
};

const LONG_PRESS_MS = 400;

/** Uses one listener per event type on the board (event delegation). Returns a cleanup function. */
export function attachCellInput(board: HTMLElement, handlers: CellInputHandlers): () => void {
    let pressTimer: ReturnType<typeof setTimeout> | undefined;
    let longPressFired = false;
    let lastPointerType = "";

    // Reads the cell coordinates from the button the event happened on
    function cellFromEvent(event: Event): { x: number; y: number } | null {
        const button = (event.target as HTMLElement).closest<HTMLButtonElement>(".ms-cell");
        if (!button) return null;
        return { x: Number(button.dataset.x), y: Number(button.dataset.y) };
    }

    function onClick(event: MouseEvent) {
        if (longPressFired) {
            longPressFired = false; // the tap that ended a long-press isn't a click
            return;
        }
        const pos = cellFromEvent(event);
        if (pos) handlers.onPrimary(pos.x, pos.y);
    }

    function onContextMenu(event: MouseEvent) {
        event.preventDefault(); // no browser menu
        // Touch flags through the long-press timer. Android also fires contextmenu on long-press,
        // so handling both would flag and immediately unflag.
        if (lastPointerType === "touch") return;
        const pos = cellFromEvent(event);
        if (pos) handlers.onFlag(pos.x, pos.y);
    }

    function onPointerDown(event: PointerEvent) {
        lastPointerType = event.pointerType;
        if (event.pointerType !== "touch") return;
        longPressFired = false;
        const pos = cellFromEvent(event);
        if (!pos) return;
        pressTimer = setTimeout(() => {
            longPressFired = true;
            handlers.onFlag(pos.x, pos.y);
        }, LONG_PRESS_MS);
    }

    function cancelPress() {
        clearTimeout(pressTimer);
    }

    board.addEventListener("click", onClick);
    board.addEventListener("contextmenu", onContextMenu);
    board.addEventListener("pointerdown", onPointerDown);
    board.addEventListener("pointerup", cancelPress);
    board.addEventListener("pointercancel", cancelPress);
    board.addEventListener("pointerleave", cancelPress);

    return () => {
        cancelPress();
        board.removeEventListener("click", onClick);
        board.removeEventListener("contextmenu", onContextMenu);
        board.removeEventListener("pointerdown", onPointerDown);
        board.removeEventListener("pointerup", cancelPress);
        board.removeEventListener("pointercancel", cancelPress);
        board.removeEventListener("pointerleave", cancelPress);
    };
}
