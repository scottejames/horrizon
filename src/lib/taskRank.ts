import type { Priority, Task } from "../types";

/** Lower sorts first. Shared by TaskStoreContext's default ordering and the horizon-list sort/filter controls. */
export function priorityRank(priority: Priority): number {
  return priority === "high" ? 0 : priority === "med" ? 1 : 2;
}

/** Lower sorts first: open before deferred before done. */
export function stateRank(state: Task["state"]): number {
  return state === "done" ? 2 : state === "deferred" ? 1 : 0;
}
