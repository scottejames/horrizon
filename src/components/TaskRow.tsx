import { useRef } from "react";
import { useConfirm } from "../context/ConfirmContext";
import { useInlineRename } from "../hooks/useInlineRename";
import {
  HORIZON_LABEL,
  HORIZON_ORDER,
  HORIZON_SHORT_LABEL,
  isDeferral,
  isDoHorizon,
} from "../lib/horizon";
import type { Horizon, Priority, Project, Task } from "../types";

function rescheduleLabel(from: Horizon, to: Horizon): string {
  return `${isDeferral(from, to) ? "Defer to" : "Schedule for"} ${HORIZON_LABEL[to]}`;
}

interface TaskRowProps {
  task: Task;
  project?: Project;
  onToggleDone: () => void;
  onMove: (target: Horizon) => void;
  onRename: (description: string) => void;
  onChangePriority: (priority: Priority) => void;
  onDelete: () => void;
  onOpenProject: (projectId: string) => void;
  onOpenNotes: () => void;
}

const PRIORITY_ORDER: Priority[] = ["high", "med", "low"];
const PRIORITY_LABEL: Record<Priority, string> = { high: "High", med: "Med", low: "Low" };

export function TaskRow({
  task,
  project,
  onToggleDone,
  onMove,
  onRename,
  onChangePriority,
  onDelete,
  onOpenProject,
  onOpenNotes,
}: TaskRowProps) {
  const priorityDetailsRef = useRef<HTMLDetailsElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const rename = useInlineRename(task.description, onRename, renameInputRef);
  const requestConfirm = useConfirm();
  const noteCount = task.notes.length;
  const hasDetail = noteCount > 0 || task.breakdown !== "";
  const noteSuffix = noteCount > 0 ? ` (${noteCount} note${noteCount === 1 ? "" : "s"})` : "";
  const rescheduleTargets = HORIZON_ORDER.filter((horizon) => horizon !== task.horizon);

  function handleChangePriority(priority: Priority) {
    onChangePriority(priority);
    if (priorityDetailsRef.current) priorityDetailsRef.current.open = false;
  }

  function handleDelete() {
    requestConfirm(`Delete "${task.description}"? This can't be undone.`, onDelete);
  }

  return (
    <li className="task" data-state={task.state}>
      <button
        type="button"
        className="task-check"
        aria-label={task.state === "done" ? "Mark not done" : "Mark done"}
        aria-pressed={task.state === "done"}
        onClick={onToggleDone}
      />
      <details className="priority-menu" ref={priorityDetailsRef}>
        <summary
          className={`signal signal--${task.priority}`}
          aria-label={`Priority: ${PRIORITY_LABEL[task.priority]}. Click to change.`}
        >
          <span></span>
          <span></span>
          <span></span>
        </summary>
        <div className="priority-menu-list defer-menu">
          {PRIORITY_ORDER.map((priority) => (
            <button
              key={priority}
              type="button"
              className={priority === task.priority ? "is-current" : undefined}
              onClick={() => handleChangePriority(priority)}
            >
              <span className={`signal signal--${priority}`} aria-hidden="true">
                <span></span>
                <span></span>
                <span></span>
              </span>
              {PRIORITY_LABEL[priority]}
            </button>
          ))}
        </div>
      </details>
      {rename.isEditing ? (
        <input
          ref={renameInputRef}
          className="task-desc-input"
          value={rename.draft}
          onChange={(event) => rename.setDraft(event.target.value)}
          onKeyDown={rename.handleKeyDown}
          onBlur={rename.commit}
        />
      ) : (
        <>
          <span className="task-desc">{task.description}</span>
          <button
            type="button"
            className="rename-btn"
            aria-label={`Rename task: ${task.description}`}
            onClick={rename.startEditing}
          >
            ✎
          </button>
          <button
            type="button"
            className="delete-btn"
            aria-label={`Delete task: ${task.description}`}
            onClick={handleDelete}
          >
            🗑
          </button>
        </>
      )}
      {/* Breakdowns and notes are for work in the Do window. A Plan task
          keeps (and shows) any it already has, but doesn't invite new ones. */}
      {(isDoHorizon(task.horizon) || hasDetail) && (
        <button
          type="button"
          className={`notes-btn${hasDetail ? " has-notes" : ""}`}
          aria-label={`Breakdown and progress for ${task.description}${noteSuffix}`}
          title="Breakdown and progress"
          onClick={onOpenNotes}
        >
          📝{noteCount > 0 && <span className="notes-count">{noteCount}</span>}
        </button>
      )}
      {task.state === "deferred" && task.deferredFrom && (
        <span className="deferred-tag">↩ deferred from {HORIZON_LABEL[task.deferredFrom]}</span>
      )}
      {project && (
        <button
          type="button"
          className="chip-project"
          onClick={() => onOpenProject(project.id)}
        >
          #{project.shortCode}
        </button>
      )}
      <div className="task-actions">
        {rescheduleTargets.map((target) => (
          <button
            key={target}
            type="button"
            className={`reschedule-btn rb-${target}`}
            title={rescheduleLabel(task.horizon, target)}
            aria-label={rescheduleLabel(task.horizon, target)}
            onClick={() => onMove(target)}
          >
            {HORIZON_SHORT_LABEL[target]}
          </button>
        ))}
      </div>
    </li>
  );
}
