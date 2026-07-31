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
  /** ISO datetime set when state becomes 'done'; cleared if un-done. Drives the 24h purge. */
  completedAt?: string;
}

export interface Project {
  id: string;
  shortCode: string;
  name: string;
  commitment: Commitment;
  areaId?: string;
  /** Rolling natural-language progress summary — see design/design-principles.md. */
  narrative: string;
  /** Cumulative count of tasks ever purged as completed, survives compression. */
  completedTaskCount: number;
  /** ISO datetime of the last narrative compression; drives the 24h compression cycle. */
  narrativeCompressedAt?: string;
}

export interface AreaOfResponsibility {
  id: string;
  name: string;
  commitment: Commitment;
}
