import { useEffect, useRef } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { HORIZON_LABEL } from "../lib/horizon";

interface ProjectDrawerProps {
  projectId: string | null;
  onClose: () => void;
}

export function ProjectDrawer({ projectId, onClose }: ProjectDrawerProps) {
  const { projects, programs } = useProjectStore();
  const { tasksByProject } = useTaskStore();
  const closeButtonRef = useRef<HTMLButtonElement>(null);

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

  const program = project?.programId ? programs.find((item) => item.id === project.programId) : undefined;
  const linkedTasks = projectId ? tasksByProject(projectId) : [];

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
              <p className="drawer-program">{program ? program.name : "No program"}</p>
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
