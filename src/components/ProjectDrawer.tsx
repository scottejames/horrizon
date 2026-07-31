import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { useConfirm } from "../context/ConfirmContext";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { useAuth } from "../hooks/useAuth";
import { useDeleteProjectCascade } from "../hooks/useDeleteProjectCascade";
import { useInlineRename } from "../hooks/useInlineRename";
import type { useNarrativeMaintenance } from "../hooks/useNarrativeMaintenance";
import { HORIZON_LABEL } from "../lib/horizon";
import { parseQuickAdd } from "../lib/parseQuickAdd";
import type { Project } from "../types";

interface ProjectDrawerProps {
  projectId: string | null;
  onClose: () => void;
  /** App.tsx has already checked isDebugEligible; re-checked here too rather than trusted blindly. */
  debugEnabled: boolean;
  narrativeMaintenance: ReturnType<typeof useNarrativeMaintenance>;
}

interface ProjectTitleProps {
  project: Project;
  linkedTaskCount: number;
  onRename: (name: string) => void;
  onDelete: () => void;
}

/**
 * Split out so it can be remounted (via `key={project.id}` below) whenever
 * the drawer switches to a different project — otherwise this component's
 * own rename-editing state would persist across the switch, since the
 * drawer itself is one long-lived instance reused for whichever project is
 * open.
 */
function ProjectTitle({ project, linkedTaskCount, onRename, onDelete }: ProjectTitleProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const rename = useInlineRename(project.name, onRename, inputRef);
  const requestConfirm = useConfirm();

  if (rename.isEditing) {
    return (
      <input
        ref={inputRef}
        className="drawer-title-input"
        value={rename.draft}
        onChange={(event) => rename.setDraft(event.target.value)}
        onKeyDown={rename.handleKeyDown}
        onBlur={rename.commit}
      />
    );
  }

  function handleDelete() {
    const message =
      linkedTaskCount > 0
        ? `Delete "${project.name}"? ${linkedTaskCount} task${linkedTaskCount === 1 ? "" : "s"} will be unlinked from this project, but otherwise left alone.`
        : `Delete "${project.name}"? There's nothing linked to it.`;
    requestConfirm(message, onDelete);
  }

  return (
    <div className="drawer-title-row">
      <h2 id="drawerTitle">{project.name}</h2>
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
    </div>
  );
}

interface ProjectRapidCaptureProps {
  project: Project;
}

/**
 * A quick-add scoped to one project: stays open and refocuses after each
 * add so a run of tasks can be brain-dumped in quick succession, and — the
 * one deliberate difference from the main CaptureBar — defaults to Someday
 * rather than Today when no schedule keyword is typed, since that's the
 * common case for "everything this project might need eventually." Any
 * `#code` typed here is ignored; the task is always linked to this project.
 */
function ProjectRapidCapture({ project }: ProjectRapidCaptureProps) {
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const { addTask } = useTaskStore();

  const parsed = parseQuickAdd(value);
  const horizon = parsed.horizonExplicit ? parsed.horizon : "someday";
  const commitment = parsed.commitment ?? project.commitment;

  function handleAdd() {
    if (!parsed.description) return;
    addTask({
      description: parsed.description,
      priority: parsed.priority ?? "med",
      horizon,
      commitment,
      projectId: project.id,
    });
    setValue("");
    inputRef.current?.focus();
  }

  function handleKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") handleAdd();
  }

  return (
    <div className="drawer-rapid-add">
      <div className="capture-row">
        <input
          ref={inputRef}
          className="capture-input"
          type="text"
          autoComplete="off"
          placeholder="Add another task… (defaults to Someday)"
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
        Defaults to <b>Someday</b> unless you type <b>today / tomorrow / next week</b> &middot;{" "}
        <b>!high !med !low</b> priority &middot; always linked to #{project.shortCode}
      </p>
    </div>
  );
}

export function ProjectDrawer({
  projectId,
  onClose,
  debugEnabled,
  narrativeMaintenance,
}: ProjectDrawerProps) {
  const { projects, areas, moveProjectToArea, renameProject } = useProjectStore();
  const { tasksByProject } = useTaskStore();
  const deleteProjectCascade = useDeleteProjectCascade();
  const { isDebugEligible } = useAuth();
  const showDebugControls = debugEnabled && isDebugEligible;
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

  function handleDeleteProject() {
    if (!project) return;
    deleteProjectCascade(project.id);
    onClose();
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
              <ProjectTitle
                key={project.id}
                project={project}
                linkedTaskCount={linkedTasks.length}
                onRename={(name) => renameProject(project.id, name)}
                onDelete={handleDeleteProject}
              />
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
            <div className="drawer-narrative">
              <h3 className="drawer-section-title">Progress</h3>
              {project.narrative ? (
                project.narrative.split("\n").map((line, index) => <p key={index}>{line}</p>)
              ) : (
                <p className="drawer-narrative-empty">
                  No progress recorded yet — this fills in as tasks in this project are completed.
                </p>
              )}
            </div>
            {showDebugControls && (
              <div className="drawer-debug">
                <h3 className="drawer-section-title">Debug</h3>
                <div className="drawer-debug-actions">
                  <button
                    type="button"
                    onClick={() => narrativeMaintenance.purgeStaleCompletedTasks(true, project.id)}
                  >
                    Remove completed tasks now
                  </button>
                  <button
                    type="button"
                    onClick={() => narrativeMaintenance.compressDueNarratives(true, project.id)}
                  >
                    Compress narrative (simulate end of day)
                  </button>
                </div>
              </div>
            )}
            <ProjectRapidCapture key={project.id} project={project} />
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
