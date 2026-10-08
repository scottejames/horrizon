import { useMemo, useState } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { HORIZON_INTRO, isDeferral, isDoHorizon } from "../lib/horizon";
import { DEFAULT_TASK_FILTER, filterTasks, groupByProject, sortTasks } from "../lib/taskListView";
import type { TaskListFilter, TaskSortMode } from "../lib/taskListView";
import type { Commitment, Horizon, Task } from "../types";
import { TaskListControls } from "./TaskListControls";
import { TaskRow } from "./TaskRow";

interface TaskListProps {
  horizon: Horizon;
  commitment: Commitment;
  onOpenProject: (projectId: string) => void;
  onOpenTaskNotes: (taskId: string) => void;
  onMoved: (target: Horizon, deferred: boolean) => void;
}

export function TaskList({
  horizon,
  commitment,
  onOpenProject,
  onOpenTaskNotes,
  onMoved,
}: TaskListProps) {
  const { tasksByHorizon, toggleDone, updateDescription, updatePriority, deleteTask, moveTask } =
    useTaskStore();
  const { projects } = useProjectStore();
  const [filter, setFilter] = useState<TaskListFilter>(DEFAULT_TASK_FILTER);
  const [sort, setSort] = useState<TaskSortMode>("priority");

  const tasks = tasksByHorizon(horizon, commitment);
  const projectsInView = useMemo(
    () => projects.filter((project) => project.commitment === commitment),
    [projects, commitment],
  );
  const projectsById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const visibleTasks = useMemo(
    () => sortTasks(filterTasks(tasks, filter), sort, projectsById),
    [tasks, filter, sort, projectsById],
  );

  function handleMove(task: Task, target: Horizon) {
    moveTask(task.id, target);
    onMoved(target, isDeferral(task.horizon, target));
  }

  // In a Plan group the heading already names the project, so rows don't repeat it.
  function renderRow(task: Task, showProject: boolean) {
    return (
      <TaskRow
        key={task.id}
        task={task}
        project={showProject && task.projectId ? projectsById.get(task.projectId) : undefined}
        onToggleDone={() => toggleDone(task.id)}
        onMove={(target) => handleMove(task, target)}
        onRename={(description) => updateDescription(task.id, description)}
        onChangePriority={(priority) => updatePriority(task.id, priority)}
        onDelete={() => deleteTask(task.id)}
        onOpenProject={onOpenProject}
        onOpenNotes={() => onOpenTaskNotes(task.id)}
      />
    );
  }

  return (
    <>
      <p className="panel-intro">{HORIZON_INTRO[horizon]}</p>
      {tasks.length > 0 && (
        <TaskListControls
          filter={filter}
          onFilterChange={setFilter}
          sort={sort}
          onSortChange={setSort}
          projects={projectsInView}
        />
      )}
      {tasks.length === 0 ? (
        <p className="panel-empty">Nothing here yet.</p>
      ) : visibleTasks.length === 0 ? (
        <p className="panel-empty">
          No tasks match your filters.{" "}
          <button type="button" className="link-btn" onClick={() => setFilter(DEFAULT_TASK_FILTER)}>
            Clear filters
          </button>
        </p>
      ) : isDoHorizon(horizon) ? (
        <ul className="task-list task-list--do">
          {visibleTasks.map((task) => renderRow(task, true))}
        </ul>
      ) : (
        groupByProject(visibleTasks, projectsById).map(({ project, tasks: groupTasks }) => (
          <section
            key={project?.id ?? "unassigned"}
            className="plan-group"
            aria-label={project ? project.name : "No project"}
          >
            <h3 className="plan-group-title">
              {project ? (
                <button
                  type="button"
                  className="plan-group-link"
                  onClick={() => onOpenProject(project.id)}
                >
                  <span className="chip-project">#{project.shortCode}</span>
                  {project.name}
                </button>
              ) : (
                "No project"
              )}
              <span className="count">{groupTasks.length}</span>
            </h3>
            <ul className="task-list">{groupTasks.map((task) => renderRow(task, false))}</ul>
          </section>
        ))
      )}
    </>
  );
}
