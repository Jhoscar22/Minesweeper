// The game timer. It lives in the UI because time is a side effect: the core has no clock.

export type Stopwatch = {
    start(): void;
    stop(): void;
    reset(): void;
    /** Whole seconds since start(), capped at 999. 0 if it never started. */
    elapsed(): number;
};

/** Calls `onTick` with the elapsed seconds once per second while running. */
export function createStopwatch(onTick: (seconds: number) => void): Stopwatch {
    let timerId: ReturnType<typeof setInterval> | undefined;
    let startedAt: number | null = null;

    // Computed from the start time instead of counting ticks:
    // browsers slow down setInterval in background tabs, so a tick count would fall behind.
    function elapsed(): number {
        if (startedAt === null) return 0;
        return Math.min(999, Math.floor((Date.now() - startedAt) / 1000));
    }

    function stop() {
        if (timerId !== undefined) clearInterval(timerId);
        timerId = undefined;
    }

    function start() {
        stop(); // never two intervals at once
        startedAt = Date.now();
        onTick(0);
        timerId = setInterval(() => onTick(elapsed()), 1000);
    }

    function reset() {
        stop();
        startedAt = null;
        onTick(0);
    }

    return { start, stop, reset, elapsed };
}
