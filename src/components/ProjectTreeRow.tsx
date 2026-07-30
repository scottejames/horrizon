import type { DragEvent } from "react";
import type { Project } from "../types";

interface ProjectTreeRowProps {
  project: Project;
  openTaskCount: number;
  onOpenProject: (projectId: string) => void;
}

/**
 * A single draggable project row, used both inside an Area and in
 * Unassigned. Reassigning a project's area happens by dragging the row onto
 * another area, or via the "Move to area" control in its ProjectDrawer —
 * not here, since a per-row control left almost no width for the project
 * name in the sidebar's narrow column.
 */
export function ProjectTreeRow({ project, openTaskCount, onOpenProject }: ProjectTreeRowProps) {
  function handleDragStart(event: DragEvent<HTMLLIElement>) {
    event.dataTransfer.setData("text/plain", project.id);
    event.dataTransfer.effectAllowed = "move";
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
    </li>
  );
}
