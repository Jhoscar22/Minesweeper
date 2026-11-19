/**
 * Fisher–Yates shuffle. Returns a shuffled COPY; the input isn't modified.
 * `random` returns a number in [0, 1), like Math.random. Tests pass a predictable one.
 */
export function shuffle<T>(items: readonly T[], random: () => number): T[] {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i--) {
        // + 1 so j can equal i: an element must be able to stay where it is, or the shuffle is biased.
        const j = Math.floor(random() * (i + 1));
        const temp: T = arr[i]!;
        arr[i] = arr[j]!;
        arr[j] = temp;
    }
    return arr;
}
