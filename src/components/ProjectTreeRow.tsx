import { useRef, type DragEvent } from "react";
import type { AreaOfResponsibility, Project } from "../types";

interface ProjectTreeRowProps {
  project: Project;
  areas: AreaOfResponsibility[];
  openTaskCount: number;
  onOpenProject: (projectId: string) => void;
  onMove: (areaId: string | undefined) => void;
}

/** A single draggable project row, used both inside an Area and in Unassigned. */
export function ProjectTreeRow({
  project,
  areas,
  openTaskCount,
  onOpenProject,
  onMove,
}: ProjectTreeRowProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const moveTargets = areas.filter((area) => area.id !== project.areaId);
  const canUnassign = project.areaId !== undefined;

  function handleMove(areaId: string | undefined) {
    onMove(areaId);
    if (detailsRef.current) detailsRef.current.open = false;
  }

  function handleDragStart(event: DragEvent<HTMLLIElement>) {
    event.dataTransfer.setData("text/plain", project.id);
    event.dataTransfer.effectAllowed = "move";
  }

  return (
    <li className="tree-project" draggable onDragStart={handleDragStart}>
      <span className="tree-drag-handle" aria-hidden="true">
        ⠿
      </span>
      <button type="button" className="tree-project-open" onClick={() => onOpenProject(project.id)}>
        <span className="project-code">#{project.shortCode}</span>
        <span className="project-name">{project.name}</span>
      </button>
      <span className="project-count">{openTaskCount}</span>
      <details className="project-move" ref={detailsRef}>
        <summary aria-label={`Move ${project.name} to another area`}>Move ▾</summary>
        <div className="project-move-menu">
          {moveTargets.map((area) => (
            <button key={area.id} type="button" onClick={() => handleMove(area.id)}>
              {area.name}
            </button>
          ))}
          {canUnassign && (
            <button type="button" onClick={() => handleMove(undefined)}>
              No area
            </button>
          )}
          {moveTargets.length === 0 && !canUnassign && (
            <span className="project-move-empty">No other areas yet</span>
          )}
        </div>
      </details>
    </li>
  );
}
