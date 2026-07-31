import { useRef, type DragEvent } from "react";
import { useConfirm } from "../context/ConfirmContext";
import { useInlineRename } from "../hooks/useInlineRename";
import type { Project } from "../types";

interface ProjectTreeRowProps {
  project: Project;
  openTaskCount: number;
  linkedTaskCount: number;
  onOpenProject: (projectId: string) => void;
  onRename: (name: string) => void;
  onDelete: () => void;
}

/**
 * A single draggable project row, used both inside an Area and in
 * Unassigned. Reassigning a project's area happens by dragging the row onto
 * another area, or via the "Move to area" control in its ProjectDrawer —
 * not a per-row control, since that left almost no width for the project
 * name in the sidebar's narrow column (see design-principles.md).
 *
 * Rename and delete *are* on this row (2026-07-31 experiment) but only
 * reveal on hover/focus, for the same width reason — see this file's entry
 * in design-principles.md before copying the always-visible pattern used
 * on TaskRow/ProjectDrawer.
 */
export function ProjectTreeRow({
  project,
  openTaskCount,
  linkedTaskCount,
  onOpenProject,
  onRename,
  onDelete,
}: ProjectTreeRowProps) {
  const renameInputRef = useRef<HTMLInputElement>(null);
  const rename = useInlineRename(project.name, onRename, renameInputRef);
  const requestConfirm = useConfirm();

  function handleDragStart(event: DragEvent<HTMLLIElement>) {
    event.dataTransfer.setData("text/plain", project.id);
    event.dataTransfer.effectAllowed = "move";
  }

  function handleDelete() {
    const message =
      linkedTaskCount > 0
        ? `Delete "${project.name}"? ${linkedTaskCount} task${linkedTaskCount === 1 ? "" : "s"} will be unlinked from this project, but otherwise left alone.`
        : `Delete "${project.name}"? There's nothing linked to it.`;
    requestConfirm(message, onDelete);
  }

  if (rename.isEditing) {
    return (
      <li className="tree-project">
        <span className="tree-drag-handle" aria-hidden="true">
          ⠿
        </span>
        <input
          ref={renameInputRef}
          className="tree-project-input"
          value={rename.draft}
          onChange={(event) => rename.setDraft(event.target.value)}
          onKeyDown={rename.handleKeyDown}
          onBlur={rename.commit}
        />
      </li>
    );
  }

  return (
    <li className="tree-project" draggable onDragStart={handleDragStart}>
      <span className="tree-drag-handle" aria-hidden="true">
        ⠿
      </span>
      <button
        type="button"
        className="tree-project-open"
        title={project.name}
        onClick={() => onOpenProject(project.id)}
      >
        <span className="project-code">#{project.shortCode}</span>
        <span className="project-name">{project.name}</span>
      </button>
      <span className="project-count">{openTaskCount}</span>
      <button
        type="button"
        className="rename-btn"
        aria-label={`Rename project: ${project.name}`}
        onClick={rename.startEditing}
      >
        ✎
      </button>
      <button
        type="button"
        className="delete-btn"
        aria-label={`Delete project: ${project.name}`}
        onClick={handleDelete}
      >
        🗑
      </button>
    </li>
  );
}
