import { useRef } from "react";
import { useConfirm } from "../context/ConfirmContext";
import { useInlineRename } from "../hooks/useInlineRename";
import { HORIZON_LABEL, HORIZON_ORDER } from "../lib/horizon";
import type { Horizon, Project, Task } from "../types";

interface TaskRowProps {
  task: Task;
  project?: Project;
  onToggleDone: () => void;
  onMove: (target: Horizon) => void;
  onRename: (description: string) => void;
  onDelete: () => void;
  onOpenProject: (projectId: string) => void;
}

export function TaskRow({
  task,
  project,
  onToggleDone,
  onMove,
  onRename,
  onDelete,
  onOpenProject,
}: TaskRowProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const rename = useInlineRename(task.description, onRename, renameInputRef);
  const requestConfirm = useConfirm();
  const isSomeday = task.horizon === "someday";
  const targets = isSomeday
    ? (["today", "tomorrow", "week"] as Horizon[])
    : HORIZON_ORDER.filter((horizon) => horizon !== task.horizon);

  function handleMove(target: Horizon) {
    onMove(target);
    if (detailsRef.current) detailsRef.current.open = false;
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
      <span className={`signal signal--${task.priority}`} title={`${task.priority} priority`}>
        <span></span>
        <span></span>
        <span></span>
      </span>
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
        <details className="defer" ref={detailsRef}>
          <summary>{isSomeday ? "Schedule ▾" : "Defer ▾"}</summary>
          <div className="defer-menu">
            {targets.map((target) => (
              <button key={target} type="button" onClick={() => handleMove(target)}>
                {HORIZON_LABEL[target]}
              </button>
            ))}
          </div>
        </details>
      </div>
    </li>
  );
}
