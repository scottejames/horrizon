import type { Horizon, Priority } from "../types";

export interface ParsedQuickAdd {
  description: string;
  priority: Priority | null;
  project: string | null;
  horizon: Horizon;
}

const SCHEDULE_PATTERNS: [RegExp, Horizon][] = [
  [/\bnext\s*week\b/i, "week"],
  [/\btomorrow\b/i, "tomorrow"],
  [/\bsomeday\b/i, "someday"],
  [/\btoday\b/i, "today"],
];

const PRIORITY_PATTERNS: [RegExp, Priority][] = [
  [/!high\b|!h\b/i, "high"],
  [/!med(ium)?\b|!m\b/i, "med"],
  [/!low\b|!l\b/i, "low"],
];

const PROJECT_PATTERN = /#([A-Za-z0-9]+)/;

/**
 * Extracts priority (`!high`/`!med`/`!low`), project (`#code`), and schedule
 * (today/tomorrow/next week/someday) from a single free-text entry — see
 * design/design-principles.md's "Quick-add is one free-text field" decision.
 * Defaults to today's horizon when no schedule keyword is present, matching
 * the app's core premise: things you want to do today.
 */
export function parseQuickAdd(raw: string): ParsedQuickAdd {
  let text = raw;
  let horizon: Horizon = "today";
  let priority: Priority | null = null;
  let project: string | null = null;

  for (const [pattern, value] of SCHEDULE_PATTERNS) {
    if (pattern.test(text)) {
      horizon = value;
      text = text.replace(pattern, " ");
      break;
    }
  }

  for (const [pattern, value] of PRIORITY_PATTERNS) {
    if (pattern.test(text)) {
      priority = value;
      text = text.replace(pattern, " ");
      break;
    }
  }

  const projectMatch = text.match(PROJECT_PATTERN);
  if (projectMatch) {
    project = projectMatch[1].toUpperCase();
    text = text.replace(projectMatch[0], " ");
  }

  const description = text.replace(/\s+/g, " ").trim();

  return { description, priority, project, horizon };
}
