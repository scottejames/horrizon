interface LogoProps {
  size?: number;
}

/**
 * Four concentric rings, one per horizon (Someday outermost/furthest,
 * Today innermost/nearest) — the same colors as the horizon tabs, dots,
 * and chips elsewhere in the app, read as a single mark: a day rippling
 * outward into the future. Uses `var(--*)` rather than hex so it follows
 * the live theme (including the in-app dark/light toggle), unlike the
 * static favicon which only has the OS-level `prefers-color-scheme` to go
 * on.
 */
export function Logo({ size = 32 }: LogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      role="img"
      aria-label="Horizon"
    >
      <circle cx="20" cy="20" r="20" fill="var(--someday)" />
      <circle cx="20" cy="20" r="15" fill="var(--week)" />
      <circle cx="20" cy="20" r="10" fill="var(--tomorrow)" />
      <circle cx="20" cy="20" r="5" fill="var(--accent)" />
    </svg>
  );
}
