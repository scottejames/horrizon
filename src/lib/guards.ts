import type { Commitment, Horizon, Priority, TaskNote, TaskState } from "../types";

/**
 * `priority`/`horizon`/`state`/`commitment` are plain strings in the schema
 * (see amplify/data/resource.ts), so a value read back from the API is
 * untrusted the same way `localStorage` or a URL param is
 * (CODING_GUIDELINES.md #8) — fall back to a safe default rather than
 * letting an unexpected value flow into the UI. `toCommitment` also covers
 * rows written before this field existed, which have no value at all.
 */
export function toPriority(value: string): Priority {
  return value === "high" || value === "med" || value === "low" ? value : "med";
}

export function toHorizon(value: string): Horizon {
  // "week" was a horizon until 2026-10-08; it's planning now, so it reads as Someday.
  if (value === "week") return "someday";
  return value === "today" || value === "tomorrow" || value === "someday" ? value : "today";
}

/**
 * The backend write that moves a row off the retired "week" horizon, or
 * `null` if it needs none. Reading already maps "week" to Someday (see
 * `toHorizon`); this makes the stored row match, so the legacy value
 * doesn't linger forever. A "deferred from Next Week" tag has no
 * equivalent any more and is dropped — the task itself is untouched.
 */
export function legacyHorizonFix(row: {
  horizon: string;
  deferredFrom?: string | null;
}): { horizon?: Horizon; deferredFrom?: null } | null {
  const fix: { horizon?: Horizon; deferredFrom?: null } = {};
  if (row.horizon === "week") fix.horizon = "someday";
  if (row.deferredFrom === "week") fix.deferredFrom = null;
  return Object.keys(fix).length > 0 ? fix : null;
}

export function toTaskState(value: string): TaskState {
  return value === "open" || value === "done" || value === "deferred" ? value : "open";
}

export function toCommitment(value: string | null | undefined): Commitment {
  return value === "work" ? "work" : "personal";
}

/**
 * `Task.notes` is an `a.json()` field: it's written as a JSON string and,
 * depending on the client path, read back as either that string or an
 * already-parsed value. Anything that isn't a well-formed `{ at, text }`
 * entry is dropped rather than shown, and rows written before the field
 * existed come back as `null`.
 */
export function toTaskNotes(value: unknown): TaskNote[] {
  let parsed = value;
  if (typeof value === "string") {
    try {
      parsed = JSON.parse(value);
    } catch {
      // Unparseable notes are treated as no notes rather than breaking the task list.
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (entry): entry is TaskNote =>
      typeof entry === "object" &&
      entry !== null &&
      typeof entry.at === "string" &&
      typeof entry.text === "string",
  );
}
