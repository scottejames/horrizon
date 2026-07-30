import type { KeyboardEvent } from "react";
import { HORIZON_LABEL, HORIZON_ORDER } from "../lib/horizon";
import type { Horizon } from "../types";

interface HorizonTabsProps {
  active: Horizon;
  counts: Record<Horizon, number>;
  onChange: (horizon: Horizon) => void;
}

export function HorizonTabs({ active, counts, onChange }: HorizonTabsProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
    const index = HORIZON_ORDER.indexOf(active);
    const step = event.key === "ArrowRight" ? 1 : -1;
    const next = HORIZON_ORDER[(index + step + HORIZON_ORDER.length) % HORIZON_ORDER.length];
    onChange(next);
  }

  return (
    <nav
      className="horizon-tabs"
      role="tablist"
      aria-label="Schedule horizon"
      onKeyDown={handleKeyDown}
    >
      {HORIZON_ORDER.map((horizon) => (
        <button
          key={horizon}
          type="button"
          role="tab"
          aria-selected={horizon === active}
          data-horizon={horizon}
          className={`tab${horizon === active ? " active" : ""}`}
          onClick={() => onChange(horizon)}
        >
          {HORIZON_LABEL[horizon]} <span className="count">{counts[horizon]}</span>
        </button>
      ))}
    </nav>
  );
}
