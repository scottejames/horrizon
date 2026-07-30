import type { Horizon, Priority, TaskState } from "../types";

/**
 * `priority`/`horizon`/`state` are plain strings in the schema (see
 * amplify/data/resource.ts), so a value read back from the API is untrusted
 * the same way `localStorage` or a URL param is (CODING_GUIDELINES.md #8) —
 * fall back to a safe default rather than letting an unexpected value flow
 * into the UI.
 */
export function toPriority(value: string): Priority {
  return value === "high" || value === "med" || value === "low" ? value : "med";
}

export function toHorizon(value: string): Horizon {
  return value === "today" || value === "tomorrow" || value === "week" || value === "someday"
    ? value
    : "today";
}

export function toTaskState(value: string): TaskState {
  return value === "open" || value === "done" || value === "deferred" ? value : "open";
}
