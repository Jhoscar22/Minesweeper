// Display text for the header: pure functions and lookup tables, tested in format.test.ts.

import type { GameStatus } from "../core/game";

export const STATUS_TEXT: Record<GameStatus, string> = {
    ready: "Click any cell",
    playing: "Sweeping",
    won: "Cleared!",
    lost: "Boom",
};

export const RESTART_FACE: Record<GameStatus, string> = {
    ready: "🙂",
    playing: "🙂",
    won: "😎",
    lost: "😵",
};

/** Three characters, like the classic counters: 7 → "007", -1 → "-01". */
export function formatCounter(n: number): string {
    return (n < 0 ? "-" : "") + String(Math.abs(n)).padStart(n < 0 ? 2 : 3, "0");
}
