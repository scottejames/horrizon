import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { client } from "../lib/dataClient";
import { toCommitment, toHorizon, toPriority, toTaskState } from "../lib/guards";
import type { Commitment, Horizon, Priority, Task } from "../types";

export interface AddTaskInput {
  description: string;
  priority: Priority;
  horizon: Horizon;
  commitment: Commitment;
  projectId?: string;
}

interface TaskStoreValue {
  tasks: Task[];
  /** True once the initial `observeQuery` sync has completed — see useNarrativeMaintenance. */
  tasksReady: boolean;
  tasksByHorizon: (horizon: Horizon, commitment: Commitment) => Task[];
  tasksByProject: (projectId: string) => Task[];
  addTask: (input: AddTaskInput) => void;
  toggleDone: (id: string) => void;
  updateDescription: (id: string, description: string) => void;
  deleteTask: (id: string) => void;
  /** Bulk delete, used by the narrative-maintenance purge. */
  deleteTasks: (ids: string[]) => void;
  /** Unlinks every task from a project that's being deleted; the tasks themselves are untouched. */
  unlinkTasksFromProject: (projectId: string) => void;
  /**
   * Moves a task to another horizon. Coming from `someday` this is a
   * one-way "Schedule" action (state becomes `open`); from anywhere else
   * it's a "Defer" (state becomes `deferred`, tagged with where it came
   * from) — see design/design-principles.md.
   */
  moveTask: (id: string, target: Horizon) => void;
}

const TaskStoreContext = createContext<TaskStoreValue | null>(null);

function priorityRank(priority: Priority): number {
  return priority === "high" ? 0 : priority === "med" ? 1 : 2;
}
function stateRank(state: Task["state"]): number {
  return state === "done" ? 2 : state === "deferred" ? 1 : 0;
}

export function TaskStoreProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksReady, setTasksReady] = useState(false);

  useEffect(() => {
    const sub = client.models.Task.observeQuery().subscribe({
      next: ({ items, isSynced }) => {
        setTasks(
          items.map((item) => ({
            id: item.id,
            description: item.description,
            priority: toPriority(item.priority),
            horizon: toHorizon(item.horizon),
            state: toTaskState(item.state),
            commitment: toCommitment(item.commitment),
            deferredFrom: item.deferredFrom ? toHorizon(item.deferredFrom) : undefined,
            projectId: item.projectId ?? undefined,
            completedAt: item.completedAt ?? undefined,
          })),
        );
        if (isSynced) setTasksReady(true);
      },
    });
    return () => sub.unsubscribe();
  }, []);

  function tasksByHorizon(horizon: Horizon, commitment: Commitment): Task[] {
    return tasks
      .filter((task) => task.horizon === horizon && task.commitment === commitment)
      .slice()
      .sort((a, b) => {
        const stateDiff = stateRank(a.state) - stateRank(b.state);
        if (stateDiff !== 0) return stateDiff;
        return priorityRank(a.priority) - priorityRank(b.priority);
      });
  }

  function tasksByProject(projectId: string): Task[] {
    return tasks.filter((task) => task.projectId === projectId);
  }

  function addTask(input: AddTaskInput) {
    const id = crypto.randomUUID();
    const task: Task = { id, state: "open", ...input };
    setTasks((prev) => [...prev, task]);
    client.models.Task.create({
      id,
      description: input.description,
      priority: input.priority,
      horizon: input.horizon,
      state: "open",
      commitment: input.commitment,
      projectId: input.projectId,
    }).catch(console.error);
  }

  function toggleDone(id: string) {
    const current = tasks.find((task) => task.id === id);
    if (!current) return;
    const nextState = current.state === "done" ? "open" : "done";
    const completedAt = nextState === "done" ? new Date().toISOString() : undefined;
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, state: nextState, completedAt } : task)),
    );
    client.models.Task.update({ id, state: nextState, completedAt: completedAt ?? null }).catch(
      console.error,
    );
  }

  function updateDescription(id: string, description: string) {
    setTasks((prev) => prev.map((task) => (task.id === id ? { ...task, description } : task)));
    client.models.Task.update({ id, description }).catch(console.error);
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    client.models.Task.delete({ id }).catch(console.error);
  }

  // useCallback with stable (empty) deps: only closes over setTasks (stable by React's
  // guarantee) and the module-level client, so its identity never needs to change. See
  // the matching comment on appendProjectNarrative in ProjectStoreContext for why this
  // stability matters to useNarrativeMaintenance's mount effect.
  const deleteTasks = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    setTasks((prev) => prev.filter((task) => !idSet.has(task.id)));
    ids.forEach((id) => {
      client.models.Task.delete({ id }).catch(console.error);
    });
  }, []);

  function unlinkTasksFromProject(projectId: string) {
    const affected = tasks.filter((task) => task.projectId === projectId);
    setTasks((prev) =>
      prev.map((task) => (task.projectId === projectId ? { ...task, projectId: undefined } : task)),
    );
    affected.forEach((task) => {
      client.models.Task.update({ id: task.id, projectId: null }).catch(console.error);
    });
  }

  function moveTask(id: string, target: Horizon) {
    const current = tasks.find((task) => task.id === id);
    if (!current) return;
    const fromSomeday = current.horizon === "someday";
    const nextState = fromSomeday ? "open" : "deferred";
    const deferredFrom = fromSomeday ? undefined : current.horizon;

    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? { ...task, horizon: target, state: nextState, deferredFrom, completedAt: undefined }
          : task,
      ),
    );
    client.models.Task.update({
      id,
      horizon: target,
      state: nextState,
      deferredFrom: deferredFrom ?? null,
      completedAt: null,
    }).catch(console.error);
  }

  return (
    <TaskStoreContext.Provider
      value={{
        tasks,
        tasksReady,
        tasksByHorizon,
        tasksByProject,
        addTask,
        toggleDone,
        updateDescription,
        deleteTask,
        deleteTasks,
        unlinkTasksFromProject,
        moveTask,
      }}
    >
      {children}
    </TaskStoreContext.Provider>
  );
}

export function useTaskStore(): TaskStoreValue {
  const ctx = useContext(TaskStoreContext);
  if (!ctx) throw new Error("useTaskStore must be used within a TaskStoreProvider");
  return ctx;
}
