import type { Horizon } from "../types";

export const HORIZON_ORDER: Horizon[] = ["today", "tomorrow", "week", "someday"];

export const HORIZON_LABEL: Record<Horizon, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  week: "Next Week",
  someday: "Someday",
};

/**
 * Compact labels for the one-click reschedule buttons on a task row — see
 * design-principles.md. Today/Tomorrow/Week abbreviate down to letters
 * that still visibly derive from the full word; Someday doesn't survive
 * that the same way ("Sd" reads as a typo, not a word), so it stays
 * spelled out. It only ever appears once per row (a task's own horizon is
 * never one of its reschedule targets), so the extra width is cheap.
 */
export const HORIZON_SHORT_LABEL: Record<Horizon, string> = {
  today: "Tdy",
  tomorrow: "Tmrw",
  week: "Wk",
  someday: "Someday",
};

export const HORIZON_INTRO: Record<Horizon, string> = {
  today: "Everything you're committing to today.",
  tomorrow: "Waiting for tomorrow — nothing here moves until then.",
  week: "On the radar for next week.",
  someday:
    "Parked with no date. Someday tasks never schedule themselves — review them and send one to Today, Tomorrow, or Next Week when it's time.",
};
