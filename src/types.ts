export type Priority = "high" | "med" | "low";
export type Horizon = "today" | "tomorrow" | "week" | "someday";
export type TaskState = "open" | "done" | "deferred";
export type Commitment = "personal" | "work";

export interface Task {
  id: string;
  description: string;
  priority: Priority;
  horizon: Horizon;
  state: TaskState;
  commitment: Commitment;
  deferredFrom?: Horizon;
  projectId?: string;
}

export interface Project {
  id: string;
  shortCode: string;
  name: string;
  commitment: Commitment;
  areaId?: string;
}

export interface AreaOfResponsibility {
  id: string;
  name: string;
  commitment: Commitment;
}
