import type { Commitment } from "../types";

interface CommitmentToggleProps {
  value: Commitment;
  onChange: (value: Commitment) => void;
}

/**
 * Deliberately neutral (ink/border tones only, no new hue) — color is
 * already fully spent on the time-horizon scale, and this is a second,
 * independent filter, not a third color dimension. See
 * design/design-principles.md's "Personal/Work is a second, independent
 * filter" entry.
 */
export function CommitmentToggle({ value, onChange }: CommitmentToggleProps) {
  return (
    <div className="commitment-toggle" role="group" aria-label="Show personal or work commitments">
      <button
        type="button"
        className={`commitment-option${value === "personal" ? " active" : ""}`}
        aria-pressed={value === "personal"}
        onClick={() => onChange("personal")}
      >
        Personal
      </button>
      <button
        type="button"
        className={`commitment-option${value === "work" ? " active" : ""}`}
        aria-pressed={value === "work"}
        onClick={() => onChange("work")}
      >
        Work
      </button>
    </div>
  );
}
