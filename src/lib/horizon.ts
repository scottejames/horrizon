import type { Horizon } from "../types";

export const HORIZON_ORDER: Horizon[] = ["today", "tomorrow", "someday"];

/**
 * The "Do" window: the only horizons where a task is worked on — given
 * progress notes or broken down. Everything beyond it is "Plan": captured
 * and organised by project, but not scheduled or worked. See
 * design-principles.md's "Plan vs Do" entry.
 */
export const DO_HORIZONS: Horizon[] = ["today", "tomorrow"];

export function isDoHorizon(horizon: Horizon): boolean {
  return DO_HORIZONS.includes(horizon);
}

/**
 * True when moving from `from` to `to` pushes a task later (a Defer).
 * Moving earlier is a Schedule — pulling something forward isn't
 * procrastinating, so it mustn't pick up a "deferred from" tag.
 */
export function isDeferral(from: Horizon, to: Horizon): boolean {
  return HORIZON_ORDER.indexOf(to) > HORIZON_ORDER.indexOf(from);
}

export const HORIZON_LABEL: Record<Horizon, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  someday: "Someday",
};

/**
 * Compact labels for the one-click reschedule buttons on a task row — see
 * design-principles.md. Today/Tomorrow abbreviate down to letters
 * that still visibly derive from the full word; Someday doesn't survive
 * that the same way ("Sd" reads as a typo, not a word), so it stays
 * spelled out. It only ever appears once per row (a task's own horizon is
 * never one of its reschedule targets), so the extra width is cheap.
 */
export const HORIZON_SHORT_LABEL: Record<Horizon, string> = {
  today: "Tdy",
  tomorrow: "Tmrw",
  someday: "Someday",
};

export const HORIZON_INTRO: Record<Horizon, string> = {
  today: "Everything you're committing to today.",
  tomorrow: "Lined up for tomorrow. These don't move to Today on their own yet — bring them over when the day comes.",
  someday:
    "Your plan: everything you're not doing yet, grouped by project. It can be as cluttered as it needs to be. When you're ready to work on something, send it to Today or Tomorrow.",
};
