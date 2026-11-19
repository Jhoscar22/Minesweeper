# Minesweeper

The classic game, rebuilt from scratch in TypeScript with no framework. The game rules are pure functions with no DOM, and a thin UI layer draws them, so the game can be embedded anywhere with a single `mount()` call.

- **Real rules:** the first click is always safe (mines are placed after it, never in the 3×3 around it), flood-fill reveal, chording, flags, win and loss
- **Three difficulty levels:** Beginner 9×9 / 10, Intermediate 16×16 / 40, Expert 30×16 / 99
- **Mouse and touch:** right-click or long-press to flag; click a number to chord
- **Tested:** the rules and the cell display have unit tests, including a decision table for every cell state

## Run it

Requires [Node.js](https://nodejs.org) (current LTS).

```bash
npm ci          # install exact dependency versions from package-lock.json
npm run dev     # start the dev server, then open the URL it prints
npm test        # run the tests (watch mode)
npm run build   # type-check and build static files into dist/
```

To try it on your phone, run `npm run dev -- --host` and open the "Network" URL on a device on the same Wi-Fi.

## Project structure

```
src/
  main.ts            entry point: mounts the game into #app
  core/              the rules: pure TypeScript, no DOM
    types.ts         the data model (Game, Cell, Position…). Start here
    game.ts          public API: newGame, reveal, chord, toggleFlag, queries
    board.ts         grid helpers: getCell, neighbors, updatePositions…
    shuffle.ts       Fisher–Yates shuffle with injectable randomness
    game.test.ts     tests for the rules
  ui/                everything the player sees
    mount.ts         builds the page and wires everything together
    view.ts          what each cell shows (pure, tested)
    input.ts         clicks, right-clicks and long-presses → "primary" / "flag"
    stopwatch.ts     the timer
    difficulty.ts    difficulty presets
    format.ts        header text: counters, status, restart face
    dom.ts           small helper for creating elements
    style.css        the pastel theme (CSS custom properties)
docs/
  ARCHITECTURE.md    how the pieces fit together, and why
  DECISIONS.md       the design decisions, with the alternatives considered
```

## Where to start reading

1. `src/core/types.ts`: what a game *is*
2. `src/core/game.ts`: what you can *do* with it (read the numbered sections in order)
3. `src/ui/mount.ts`: how it gets on screen
4. `docs/ARCHITECTURE.md`: the big picture

## Embedding

```ts
import { mount } from "./ui/mount";

const unmount = mount(document.querySelector("#somewhere")!);
// later, when the game should go away:
unmount(); // removes the DOM, listeners and timer
```

All styles live under `.minesweeper`, so they don't leak into the host page.
