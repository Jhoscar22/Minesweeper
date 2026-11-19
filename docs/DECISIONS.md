# Design decisions

Each entry: what was decided, why, and what was considered instead.

## Project

**Rewritten from scratch; the old version is on the `legacy` branch.** The old Next.js code mutated state in place and only re-rendered by accident. It was small enough that a rewrite cost little and made every line understood.

**Vite + TypeScript, no framework.** The output is a static folder that runs anywhere, and `mount()` lets any future portfolio (React, Astro, plain HTML) embed it. *Considered:* Next.js again (ties the game to one framework and a server).

**`core/` and `ui/` are separate.** The rules are testable without a browser and reusable by any UI.

## Data model

**Plain objects and functions, not classes.** Spreading a class instance (`{ ...cell }`) drops its methods, so classes and immutable updates don't mix. Plain data is also JSON-ready. *Considered:* a mutable `Game` class (fine in Java-style OOP, which the Asteroids project uses instead).

**Immutable, enforced with `readonly` at every level.** Makes "did anything change?" a reference comparison, and makes the "input wasn't modified" test a one-liner.

**2D array, `cells[y][x]`.** Easier to reason about, and an out-of-bounds read returns `undefined` instead of silently landing on the wrong row (a flat array's left neighbor of `x = 0` is the previous row's last cell). *Considered:* a flat array with `y * width + x` (one number per cell makes Sets easier).

**Positions in Sets are `"x,y"` strings.** Sets compare arrays by reference, so `set.has([1, 2])` is always false for a new array.

**`mineCount` is stored even though it can be counted.** Before the first click there are no mines on the board, but the game still needs to know how many to place. It's configuration, not derived data.

**No `adjacent` count stored in cells.** It's computed on demand from neighbors (8 checks), so there's nothing to keep in sync.

**One `state` field (`hidden | revealed | flagged`), not two booleans.** Two booleans would allow "revealed and flagged", a state that can't exist.

**`ready` is an explicit status.** *Considered:* inferring "not started" from the board having no mines. That works, but hides a state inside a calculation.

## Rules

**Flood fill is an iterative breadth-first search** with a queue and a `seen` set. Cells are marked when queued, not when processed, so each enters the queue once. The queue is read with an index instead of `shift()` (which is O(n)), and at the end it's exactly the list of cells to reveal. *Considered:* recursion (call stack limit on large regions).

**Mines are placed on the first reveal, never in the 3×3 around it.** The first click is always a 0 and opens a random island. Sampling only from allowed cells gives the same distribution as regenerating the board until the click is safe, without the retries.

**Fisher–Yates shuffle with injected randomness.** O(n), unbiased (`j` ranges over `0..i` inclusive), and tests control the result. *Considered:* picking random cells and retrying on collisions (slow on dense boards).

**Winning counts revealed cells, never flags.** Otherwise a player could cycle through flag layouts until the game said "won".

**Moves return the same object when nothing changes.** The UI uses that to skip redraws.

## UI

**Cells are created once per game and updated in place.** *Considered:* rebuilding the board's HTML on every change (simpler, but destroys keyboard focus and loses the chance to skip unchanged cells).

**The display is derived in a pure function (`cellView`).** Testable without a browser; the core's state stays accurate (see ARCHITECTURE.md).

**State classes (`ms-hidden`, `ms-revealed`) instead of a `data-state` attribute.** More conventional. Each render replaces the whole `className`, so a cell can never end up with two states.

**Event delegation:** one listener per event type on the board, not one per cell.

**Touch flags through our own long-press timer and ignores `contextmenu`.** Android also fires `contextmenu` on long-press, which would flag and immediately unflag.

**The timer is UI state.** Time is a side effect; the core stays pure.

**`textContent`, never `innerHTML`.** No chance of injecting HTML.

**Theme colors are CSS custom properties under `.minesweeper`.** Switching themes later means changing variables, not rules, and a host page can override them.

## Deferred

- Keyboard navigation (arrow keys between cells): Later list.
- Theme selector, stats in `localStorage`, win animation: M6.
