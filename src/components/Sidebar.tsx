import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { InlineAddForm } from "./InlineAddForm";

interface SidebarProps {
  onOpenProject: (projectId: string) => void;
  onOpenSomeday: () => void;
}

export function Sidebar({ onOpenProject, onOpenSomeday }: SidebarProps) {
  const { programs, projects, addProgram, addProject } = useProjectStore();
  const { tasks } = useTaskStore();

  function openCount(projectId: string): number {
    return tasks.filter((task) => task.projectId === projectId && task.state !== "done").length;
  }

  const somedayCount = tasks.filter((task) => task.horizon === "someday").length;
  const unassignedProjects = projects.filter((project) => !project.programId);

  return (
    <aside className="sidebar">
      <h2 className="sidebar-title">Programs &amp; Projects</h2>

      {programs.length === 0 && projects.length === 0 && (
        <p className="sidebar-empty">Nothing set up yet — add a program or project below.</p>
      )}

      {programs.map((program) => {
        const programProjects = projects.filter((project) => project.programId === program.id);
        return (
          <div className="program" key={program.id}>
            <h3 className="program-name">{program.name}</h3>
            {programProjects.map((project) => (
              <button
                key={project.id}
                type="button"
                className="project-row"
                onClick={() => onOpenProject(project.id)}
              >
                <span className="project-code">#{project.shortCode}</span>
                <span className="project-name">{project.name}</span>
                <span className="project-count">{openCount(project.id)}</span>
              </button>
            ))}
            <InlineAddForm
              placeholder={`New project in ${program.name}`}
              onSubmit={(name) => addProject(name, program.id)}
            />
          </div>
        );
      })}

      {unassignedProjects.length > 0 && (
        <div className="program">
          <h3 className="program-name">No program</h3>
          {unassignedProjects.map((project) => (
            <button
              key={project.id}
              type="button"
              className="project-row"
              onClick={() => onOpenProject(project.id)}
            >
              <span className="project-code">#{project.shortCode}</span>
              <span className="project-name">{project.name}</span>
              <span className="project-count">{openCount(project.id)}</span>
            </button>
          ))}
        </div>
      )}

      <InlineAddForm placeholder="New program" onSubmit={addProgram} />
      <InlineAddForm placeholder="New project (no program)" onSubmit={(name) => addProject(name)} />

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
