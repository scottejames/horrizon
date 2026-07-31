import { useRef, useState, type DragEvent } from "react";
import { useConfirm } from "../context/ConfirmContext";
import { useInlineRename } from "../hooks/useInlineRename";
import type { Project } from "../types";
import { ProjectTreeRow } from "./ProjectTreeRow";

interface AreaSectionProps {
  /** `undefined` marks the always-present "Unassigned" bucket — not renameable or deletable. */
  areaId: string | undefined;
  title: string;
  projects: Project[];
  openTaskCount: (projectId: string) => number;
  onOpenProject: (projectId: string) => void;
  onMoveProject: (projectId: string, areaId: string | undefined) => void;
  onRenameArea: (areaId: string, name: string) => void;
  onDeleteArea: (areaId: string) => void;
}

/**
 * One collapsible node in the Areas of Responsibility tree, and a drop
 * target for reassigning a project by dragging it here. The accessible
 * equivalent (for keyboard/touch) is the "Move to area" control in the
 * project's own drawer, not a per-row control — see ProjectTreeRow.
 */
export function AreaSection({
  areaId,
  title,
  projects,
  openTaskCount,
  onOpenProject,
  onMoveProject,
  onRenameArea,
  onDeleteArea,
}: AreaSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const rename = useInlineRename(
    title,
    (next) => {
      if (areaId) onRenameArea(areaId, next);
    },
    renameInputRef,
  );
  const requestConfirm = useConfirm();

  function handleDelete() {
    if (!areaId) return;
    const message =
      projects.length > 0
        ? `Delete "${title}"? ${projects.length} project${projects.length === 1 ? "" : "s"} will move to Unassigned. Tasks in them won't be affected.`
        : `Delete "${title}"? There's nothing linked to it.`;
    requestConfirm(message, () => onDeleteArea(areaId));
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(true);
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragOver(false);
    const projectId = event.dataTransfer.getData("text/plain");
    if (projectId) onMoveProject(projectId, areaId);
  }

  return (
    <div
      className={`tree-area${dragOver ? " drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      <div className="tree-area-header">
        {rename.isEditing ? (
          <div className="tree-area-edit-row">
            <span className={`disclosure${collapsed ? "" : " open"}`} aria-hidden="true">
              ▸
            </span>
            <input
              ref={renameInputRef}
              className="tree-area-input"
              value={rename.draft}
              onChange={(event) => rename.setDraft(event.target.value)}
              onKeyDown={rename.handleKeyDown}
              onBlur={rename.commit}
            />
          </div>
        ) : (
          <>
            <button
              type="button"
              className="tree-area-toggle"
              aria-expanded={!collapsed}
              onClick={() => setCollapsed((value) => !value)}
            >
              <span className={`disclosure${collapsed ? "" : " open"}`} aria-hidden="true">
                ▸
              </span>
              <span className="tree-area-name">{title}</span>
              <span className="project-count">{projects.length}</span>
            </button>
            {areaId && (
              <>
                <button
                  type="button"
                  className="rename-btn"
                  aria-label={`Rename area: ${title}`}
                  onClick={rename.startEditing}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className="delete-btn"
                  aria-label={`Delete area: ${title}`}
                  onClick={handleDelete}
                >
                  🗑
                </button>
              </>
            )}
          </>
        )}
      </div>
      {!collapsed && (
        <ul className="tree-project-list">
          {projects.length === 0 ? (
            <li className="tree-empty">Drag a project here</li>
          ) : (
            projects.map((project) => (
              <ProjectTreeRow
                key={project.id}
                project={project}
                openTaskCount={openTaskCount(project.id)}
                onOpenProject={onOpenProject}
              />
            ))
          )}
        </ul>
      )}
    </div>
  );
}
