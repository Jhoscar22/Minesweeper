// The difficulty presets. Adding one here adds it to the type and the <select> automatically.

export const DIFFICULTIES = {
    beginner: { width: 9, height: 9, mines: 10 },
    intermediate: { width: 16, height: 16, mines: 40 },
    expert: { width: 30, height: 16, mines: 99 },
} as const;

/** "beginner" | "intermediate" | "expert", built from the object's keys. */
export type Difficulty = keyof typeof DIFFICULTIES;

/**
 * Type predicate: if this returns true, TypeScript treats `value` as a Difficulty.
 * Object.hasOwn checks only the object's own keys ("toString" in DIFFICULTIES would be true).
 */
export function isDifficulty(value: string): value is Difficulty {
    return Object.hasOwn(DIFFICULTIES, value);
}
