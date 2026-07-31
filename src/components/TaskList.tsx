import { useMemo, useState } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { HORIZON_INTRO } from "../lib/horizon";
import { DEFAULT_TASK_FILTER, filterTasks, sortTasks } from "../lib/taskListView";
import type { TaskListFilter, TaskSortMode } from "../lib/taskListView";
import type { Commitment, Horizon, Task } from "../types";
import { TaskListControls } from "./TaskListControls";
import { TaskRow } from "./TaskRow";

interface TaskListProps {
  horizon: Horizon;
  commitment: Commitment;
  onOpenProject: (projectId: string) => void;
  onMoved: (target: Horizon, wasSomeday: boolean) => void;
}

export function TaskList({ horizon, commitment, onOpenProject, onMoved }: TaskListProps) {
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
    const wasSomeday = task.horizon === "someday";
    moveTask(task.id, target);
    onMoved(target, wasSomeday);
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
      ) : (
        <ul className="task-list">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              project={projects.find((project) => project.id === task.projectId)}
              onToggleDone={() => toggleDone(task.id)}
              onMove={(target) => handleMove(task, target)}
              onRename={(description) => updateDescription(task.id, description)}
              onChangePriority={(priority) => updatePriority(task.id, priority)}
              onDelete={() => deleteTask(task.id)}
              onOpenProject={onOpenProject}
            />
          ))}
        </ul>
      )}
    </>
  );
}
