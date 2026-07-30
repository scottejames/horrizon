import { useEffect, useRef } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { HORIZON_LABEL } from "../lib/horizon";

interface ProjectDrawerProps {
  projectId: string | null;
  onClose: () => void;
}

export function ProjectDrawer({ projectId, onClose }: ProjectDrawerProps) {
  const { projects, areas, moveProjectToArea } = useProjectStore();
  const { tasksByProject } = useTaskStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const moveDetailsRef = useRef<HTMLDetailsElement>(null);

  const project = projectId ? projects.find((item) => item.id === projectId) : undefined;
  const isOpen = Boolean(projectId && project);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const area = project?.areaId ? areas.find((item) => item.id === project.areaId) : undefined;
  const linkedTasks = projectId ? tasksByProject(projectId) : [];
  // Only offer areas that share the project's own commitment — an area is
  // never a valid move target across personal/work, since that's exactly
  // the inconsistency (a work project pointing at a personal area) that
  // dragging within the sidebar tree can't produce either, because the
  // tree only ever shows one commitment's areas and projects at a time.
  const moveTargets = areas.filter(
    (candidate) => candidate.id !== project?.areaId && candidate.commitment === project?.commitment,
  );

  function handleMove(areaId: string | undefined) {
    if (project) moveProjectToArea(project.id, areaId);
    if (moveDetailsRef.current) moveDetailsRef.current.open = false;
  }

  return (
    <>
      <div
        className={`drawer-scrim${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`project-drawer${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-labelledby="drawerTitle"
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="drawer-close"
          aria-label="Close project view"
          onClick={onClose}
        >
          &times;
        </button>
        {project && (
          <>
            <div className="drawer-header">
              <span className="drawer-code">#{project.shortCode}</span>
              <h2 id="drawerTitle">{project.name}</h2>
              <details className="project-move drawer-move" ref={moveDetailsRef}>
                <summary>{area ? area.name : "No area"} <span aria-hidden="true">▾</span></summary>
                <div className="project-move-menu">
                  {moveTargets.map((candidate) => (
                    <button key={candidate.id} type="button" onClick={() => handleMove(candidate.id)}>
                      {candidate.name}
                    </button>
                  ))}
                  {project.areaId && (
                    <button type="button" onClick={() => handleMove(undefined)}>
                      No area
                    </button>
                  )}
                  {moveTargets.length === 0 && !project.areaId && (
                    <span className="project-move-empty">No areas yet</span>
                  )}
                </div>
              </details>
            </div>
            <ul className="drawer-list">
              {linkedTasks.length === 0 ? (
                <li className="drawer-empty">No todos linked to #{project.shortCode} yet.</li>
              ) : (
                linkedTasks.map((task) => (
                  <li
                    key={task.id}
                    className={`drawer-item${task.state === "done" ? " is-done" : ""}`}
                  >
                    <span className={`horizon-dot h-${task.horizon}`} />
                    <span className="d-desc">{task.description}</span>
                    <span className="d-horizon">{HORIZON_LABEL[task.horizon]}</span>
                  </li>
                ))
              )}
            </ul>
          </>
        )}
      </aside>
    </>
  );
}
