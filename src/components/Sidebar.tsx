import { useState } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import type { Commitment } from "../types";
import { AreaSection } from "./AreaSection";
import { InlineAddForm } from "./InlineAddForm";

interface SidebarProps {
  activeCommitment: Commitment;
  onOpenProject: (projectId: string) => void;
  onOpenSomeday: () => void;
}

export function Sidebar({ activeCommitment, onOpenProject, onOpenSomeday }: SidebarProps) {
  const { areas, projects, addArea, addProject, moveProjectToArea, renameArea } = useProjectStore();
  const { tasks } = useTaskStore();
  const [addingArea, setAddingArea] = useState(false);
  const [addingProject, setAddingProject] = useState(false);

  const visibleAreas = areas.filter((area) => area.commitment === activeCommitment);
  const visibleProjects = projects.filter((project) => project.commitment === activeCommitment);

  function openTaskCount(projectId: string): number {
    return tasks.filter((task) => task.projectId === projectId && task.state !== "done").length;
  }

  const somedayCount = tasks.filter(
    (task) => task.horizon === "someday" && task.commitment === activeCommitment,
  ).length;
  const unassignedProjects = visibleProjects.filter((project) => !project.areaId);

  return (
    <aside className="sidebar">
      <div className="tree-header">
        <h2 className="sidebar-title">Areas of Responsibility</h2>
        <button
          type="button"
          className="tree-add-toggle"
          aria-label="Add an area of responsibility"
          onClick={() => setAddingArea((value) => !value)}
        >
          +
        </button>
      </div>

      {addingArea && (
        <InlineAddForm
          placeholder="e.g. Home, Health, Work"
          onSubmit={(name) => {
            addArea(name, activeCommitment);
            setAddingArea(false);
          }}
        />
      )}

      {visibleAreas.length === 0 && visibleProjects.length === 0 && (
        <p className="sidebar-empty">
          Nothing {activeCommitment} set up yet — group projects by the head space they belong to
          (Home, Health, Work…) and drag projects between them.
        </p>
      )}

      {visibleAreas.map((area) => (
        <AreaSection
          key={area.id}
          areaId={area.id}
          title={area.name}
          projects={visibleProjects.filter((project) => project.areaId === area.id)}
          openTaskCount={openTaskCount}
          onOpenProject={onOpenProject}
          onMoveProject={moveProjectToArea}
          onRenameArea={renameArea}
        />
      ))}

      <AreaSection
        areaId={undefined}
        title="Unassigned"
        projects={unassignedProjects}
        openTaskCount={openTaskCount}
        onOpenProject={onOpenProject}
        onMoveProject={moveProjectToArea}
        onRenameArea={renameArea}
      />

      {addingProject ? (
        <InlineAddForm
          placeholder="New project"
          buttonLabel="Add"
          onSubmit={(name) => {
            addProject(name, activeCommitment);
            setAddingProject(false);
          }}
        />
      ) : (
        <button type="button" className="tree-add-project" onClick={() => setAddingProject(true)}>
          + Add project
        </button>
      )}

      <div className="sidebar-footer">
        <button type="button" className="someday-link" onClick={onOpenSomeday}>
          <span>
            <strong>{somedayCount} in Someday</strong>
            <span className="hint">parked — review to schedule</span>
          </span>
          <span aria-hidden="true">&rarr;</span>
        </button>
      </div>
    </aside>
  );
}
