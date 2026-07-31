/**
 * Deterministic, template-based narrative generation — not a real LLM call.
 * "Natural language summary" here means readable template sentences built
 * from task descriptions, not an actual generated summary; see
 * design/design-principles.md for why (a real AI-backed version would need
 * a new Lambda + secret, which is a bigger lift than this feature needs
 * for a first pass — see TODO.md for that as a possible future upgrade).
 */

function formatList(items: string[]): string {
  const quoted = items.map((item) => `"${item}"`);
  if (quoted.length === 1) return quoted[0];
  if (quoted.length === 2) return `${quoted[0]} and ${quoted[1]}`;
  return `${quoted.slice(0, -1).join(", ")}, and ${quoted[quoted.length - 1]}`;
}

/** Builds one narrative-entry line for a batch of task descriptions completed together. */
export function describeCompletedBatch(descriptions: string[], now: Date = new Date()): string {
  if (descriptions.length === 0) return "";
  const dateLabel = now.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${dateLabel}: wrapped up ${formatList(descriptions)}.`;
}

/** Appends a new entry as its own line; a no-op if there's nothing new to add. */
export function appendNarrativeEntry(existing: string, entry: string): string {
  if (!entry) return existing;
  return existing ? `${existing}\n${entry}` : entry;
}

/**
 * Collapses all but the most recent entry into a single running-total
 * sentence. A narrative with 0 or 1 entries has nothing meaningful to
 * compress yet, so it's returned unchanged.
 */
export function compressNarrative(existing: string, totalCompletedCount: number): string {
  const trimmed = existing.trim();
  if (!trimmed) return trimmed;
  const lines = trimmed.split("\n").filter(Boolean);
  if (lines.length <= 1) return trimmed;
  const mostRecent = lines[lines.length - 1];
  const tally = `${totalCompletedCount} task${totalCompletedCount === 1 ? "" : "s"} completed so far.`;
  return `${tally} Most recently — ${mostRecent}`;
}
