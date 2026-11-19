import { describe, it, expect } from "vitest";
import { formatCounter } from "./format";

describe("formatCounter", () => {
    it.each<[number, string]>([
        [0, "000"],
        [7, "007"],
        [42, "042"],
        [999, "999"],
        [-1, "-01"],
        [-12, "-12"],
    ])("%i → %s", (n, expected) => {
        expect(formatCounter(n)).toBe(expected);
    });
});
