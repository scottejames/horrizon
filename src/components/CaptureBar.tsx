import { useState, type KeyboardEvent } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { HORIZON_LABEL } from "../lib/horizon";
import { parseQuickAdd } from "../lib/parseQuickAdd";
import type { Commitment, Horizon } from "../types";

interface CaptureBarProps {
  activeCommitment: Commitment;
  onAdded: (horizon: Horizon) => void;
}

export function CaptureBar({ activeCommitment, onAdded }: CaptureBarProps) {
  const [value, setValue] = useState("");
  const { addTask } = useTaskStore();
  const { projectByCode, addProject } = useProjectStore();

  const parsed = parseQuickAdd(value);
  const matchedProject = parsed.project ? projectByCode(parsed.project) : undefined;
  // Resolution order: an explicit @work/@personal in the text wins; failing
  // that, a task linked to an existing project inherits that project's
  // commitment; otherwise it falls back to whichever tab is active. See
  // design/design-principles.md's "Personal/Work is a second, independent
  // filter" entry.
  const resolvedCommitment = parsed.commitment ?? matchedProject?.commitment ?? activeCommitment;

  function handleAdd() {
    if (!parsed.description) return;

    let projectId: string | undefined;
    if (parsed.project) {
      projectId = matchedProject
        ? matchedProject.id
        : addProject(parsed.project, resolvedCommitment).id;
    }

    addTask({
      description: parsed.description,
      priority: parsed.priority ?? "med",
      horizon: parsed.horizon,
      commitment: resolvedCommitment,
      projectId,
    });
    setValue("");
    onAdded(parsed.horizon);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handleAdd();
  }

  return (
    <section className="capture">
      <label className="capture-label" htmlFor="quickAdd">
        Add to your list
      </label>
      <div className="capture-row">
        <input
          id="quickAdd"
          className="capture-input"
          type="text"
          autoComplete="off"
          placeholder="Call tile supplier !high #KIT tomorrow @work"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="capture-submit"
          disabled={!parsed.description}
          onClick={handleAdd}
        >
          Add
        </button>
      </div>
      <p className="capture-hint">
        <b>!high !med !low</b> priority &middot; <b>#code</b> project &middot;{" "}
        <b>today / tomorrow / next week / someday</b> schedule &middot; <b>@personal / @work</b>{" "}
        &mdash; type any mix, parsed live below
      </p>
      <div className="parse-preview">
        {!value.trim() ? (
          <span className="parse-empty">Nothing to parse yet — start typing above.</span>
        ) : (
          <>
            <span className="parse-chip pc-desc">
              <span className="lbl">task</span> {parsed.description || "…"}
            </span>
            {parsed.priority && (
              <span className="parse-chip pc-priority">
                <span className="lbl">priority</span> {parsed.priority}
              </span>
            )}
            {parsed.project && (
              <span className="parse-chip pc-project">
                <span className="lbl">{matchedProject ? "project" : "project (new)"}</span> #
                {parsed.project}
              </span>
            )}
            <span className={`parse-chip pc-${parsed.horizon}`}>
              <span className="lbl">schedule</span> {HORIZON_LABEL[parsed.horizon]}
            </span>
            <span className="parse-chip pc-commitment">
              <span className="lbl">{parsed.commitment ? "commitment" : "commitment (default)"}</span>{" "}
              {resolvedCommitment}
            </span>
          </>
        )}
      </div>
    </section>
  );
}
