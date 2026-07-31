import { priorityRank, stateRank } from "./taskRank";
import type { Priority, Project, Task } from "../types";

export type TaskSortMode = "priority" | "alpha" | "project";

export interface TaskListFilter {
  search: string;
  priority: Priority | "all";
  /** A project id, `"all"`, or `"unassigned"` for tasks with no project. */
  projectId: string;
}

export const DEFAULT_TASK_FILTER: TaskListFilter = {
  search: "",
  priority: "all",
  projectId: "all",
};

export function isFilterActive(filter: TaskListFilter): boolean {
  return filter.search.trim() !== "" || filter.priority !== "all" || filter.projectId !== "all";
}

export function filterTasks(tasks: Task[], filter: TaskListFilter): Task[] {
  const search = filter.search.trim().toLowerCase();
  return tasks.filter((task) => {
    if (search && !task.description.toLowerCase().includes(search)) return false;
    if (filter.priority !== "all" && task.priority !== filter.priority) return false;
    if (filter.projectId === "unassigned" && task.projectId) return false;
    if (
      filter.projectId !== "all" &&
      filter.projectId !== "unassigned" &&
      task.projectId !== filter.projectId
    ) {
      return false;
    }
    return true;
  });
}

/**
 * Re-sorts a list that's already grouped open-before-deferred-before-done
 * (see TaskStoreContext.tasksByHorizon) — that grouping is always the
 * primary key here too, so a "done" task never jumps back above open ones
 * just because a different sort mode was chosen. `mode` only controls the
 * secondary ordering within each state group.
 */
export function sortTasks(
  tasks: Task[],
  mode: TaskSortMode,
  projectsById: Map<string, Project>,
): Task[] {
  return tasks.slice().sort((a, b) => {
    const stateDiff = stateRank(a.state) - stateRank(b.state);
    if (stateDiff !== 0) return stateDiff;

    if (mode === "alpha") {
      return a.description.localeCompare(b.description);
    }

    if (mode === "project") {
      const aCode = a.projectId ? projectsById.get(a.projectId)?.shortCode : undefined;
      const bCode = b.projectId ? projectsById.get(b.projectId)?.shortCode : undefined;
      if (!aCode && !bCode) return priorityRank(a.priority) - priorityRank(b.priority);
      if (!aCode) return 1;
      if (!bCode) return -1;
      return aCode.localeCompare(bCode) || priorityRank(a.priority) - priorityRank(b.priority);
    }

    return priorityRank(a.priority) - priorityRank(b.priority);
  });
}
