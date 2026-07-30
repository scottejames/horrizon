export type Priority = "high" | "med" | "low";
export type Horizon = "today" | "tomorrow" | "week" | "someday";
export type TaskState = "open" | "done" | "deferred";

export interface Task {
  id: string;
  description: string;
  priority: Priority;
  horizon: Horizon;
  state: TaskState;
  deferredFrom?: Horizon;
  projectId?: string;
}

export interface Project {
  id: string;
  shortCode: string;
  name: string;
  areaId?: string;
}

export interface AreaOfResponsibility {
  id: string;
  name: string;
}
