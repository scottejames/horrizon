import type { Horizon } from "../types";

export const HORIZON_ORDER: Horizon[] = ["today", "tomorrow", "week", "someday"];

export const HORIZON_LABEL: Record<Horizon, string> = {
  today: "Today",
  tomorrow: "Tomorrow",
  week: "Next Week",
  someday: "Someday",
};

export const HORIZON_INTRO: Record<Horizon, string> = {
  today: "Everything you're committing to today.",
  tomorrow: "Waiting for tomorrow — nothing here moves until then.",
  week: "On the radar for next week.",
  someday:
    "Parked with no date. Someday tasks never schedule themselves — review them and send one to Today, Tomorrow, or Next Week when it's time.",
};
