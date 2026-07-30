const STOPWORDS = new Set(["the", "a", "an", "of", "and", "for", "to", "in", "on"]);

/**
 * Auto-generates a project short code from its name — initials of up to the
 * first four significant words, or the first few letters for a single-word
 * name, then a numeric suffix if that collides with an existing code.
 */
export function generateShortCode(name: string, existingCodes: readonly string[]): string {
  const words = name
    .split(/\s+/)
    .map((word) => word.replace(/[^A-Za-z0-9]/g, ""))
    .filter((word) => word.length > 0 && !STOPWORDS.has(word.toLowerCase()));

  let base: string;
  if (words.length === 0) {
    base = "PRJ";
  } else if (words.length === 1) {
    base = words[0].slice(0, 4).toUpperCase();
  } else {
    base = words
      .slice(0, 4)
      .map((word) => word[0])
      .join("")
      .toUpperCase();
  }
  if (base.length < 2) base = base.padEnd(3, "X");

  const existing = new Set(existingCodes.map((code) => code.toUpperCase()));
  if (!existing.has(base)) return base;

  let suffix = 2;
  while (existing.has(`${base}${suffix}`)) suffix += 1;
  return `${base}${suffix}`;
}
