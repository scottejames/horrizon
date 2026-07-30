import { useState } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { AreaSection } from "./AreaSection";
import { InlineAddForm } from "./InlineAddForm";

interface SidebarProps {
  onOpenProject: (projectId: string) => void;
  onOpenSomeday: () => void;
}

export function Sidebar({ onOpenProject, onOpenSomeday }: SidebarProps) {
  const { areas, projects, addArea, addProject, moveProjectToArea } = useProjectStore();
  const { tasks } = useTaskStore();
  const [addingArea, setAddingArea] = useState(false);
  const [addingProject, setAddingProject] = useState(false);

  function openTaskCount(projectId: string): number {
    return tasks.filter((task) => task.projectId === projectId && task.state !== "done").length;
  }

  const somedayCount = tasks.filter((task) => task.horizon === "someday").length;
  const unassignedProjects = projects.filter((project) => !project.areaId);

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
            addArea(name);
            setAddingArea(false);
          }}
        />
      )}

      {areas.length === 0 && projects.length === 0 && (
        <p className="sidebar-empty">
          Nothing set up yet — group projects by the head space they belong to (Home, Health,
          Work…) and drag projects between them.
        </p>
      )}

      {areas.map((area) => (
        <AreaSection
          key={area.id}
          areaId={area.id}
          title={area.name}
          projects={projects.filter((project) => project.areaId === area.id)}
          allAreas={areas}
          openTaskCount={openTaskCount}
          onOpenProject={onOpenProject}
          onMoveProject={moveProjectToArea}
        />
      ))}

      <AreaSection
        areaId={undefined}
        title="Unassigned"
        projects={unassignedProjects}
        allAreas={areas}
        openTaskCount={openTaskCount}
        onOpenProject={onOpenProject}
        onMoveProject={moveProjectToArea}
      />

      {addingProject ? (
        <InlineAddForm
          placeholder="New project"
          buttonLabel="Add"
          onSubmit={(name) => {
            addProject(name);
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
