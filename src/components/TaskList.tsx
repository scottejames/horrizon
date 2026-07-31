import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { HORIZON_INTRO } from "../lib/horizon";
import type { Commitment, Horizon, Task } from "../types";
import { TaskRow } from "./TaskRow";

interface TaskListProps {
  horizon: Horizon;
  commitment: Commitment;
  onOpenProject: (projectId: string) => void;
  onMoved: (target: Horizon, wasSomeday: boolean) => void;
}

export function TaskList({ horizon, commitment, onOpenProject, onMoved }: TaskListProps) {
  const { tasksByHorizon, toggleDone, updateDescription, deleteTask, moveTask } = useTaskStore();
  const { projects } = useProjectStore();
  const tasks = tasksByHorizon(horizon, commitment);

  function handleMove(task: Task, target: Horizon) {
    const wasSomeday = task.horizon === "someday";
    moveTask(task.id, target);
    onMoved(target, wasSomeday);
  }

  return (
    <>
      <p className="panel-intro">{HORIZON_INTRO[horizon]}</p>
      {tasks.length === 0 ? (
        <p className="panel-empty">Nothing here yet.</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              project={projects.find((project) => project.id === task.projectId)}
              onToggleDone={() => toggleDone(task.id)}
              onMove={(target) => handleMove(task, target)}
              onRename={(description) => updateDescription(task.id, description)}
              onDelete={() => deleteTask(task.id)}
              onOpenProject={onOpenProject}
            />
          ))}
        </ul>
      )}
    </>
  );
}
