import { describe, expect, it } from "vitest";
import type { Project, Task } from "../types";
import { DEFAULT_TASK_FILTER, filterTasks, isFilterActive, sortTasks } from "./taskListView";

function task(overrides: Partial<Task>): Task {
  return {
    id: crypto.randomUUID(),
    description: "Untitled",
    priority: "med",
    horizon: "today",
    state: "open",
    commitment: "personal",
    ...overrides,
  };
}

function project(overrides: Partial<Project>): Project {
  return {
    id: crypto.randomUUID(),
    shortCode: "AAA",
    name: "Untitled project",
    commitment: "personal",
    narrative: "",
    completedTaskCount: 0,
    ...overrides,
  };
}

describe("isFilterActive", () => {
  it("is false for the default filter", () => {
    expect(isFilterActive(DEFAULT_TASK_FILTER)).toBe(false);
  });

  it("is true when search text is set", () => {
    expect(isFilterActive({ ...DEFAULT_TASK_FILTER, search: "call" })).toBe(true);
  });

  it("is true when priority is narrowed", () => {
    expect(isFilterActive({ ...DEFAULT_TASK_FILTER, priority: "high" })).toBe(true);
  });

  it("is true when project is narrowed", () => {
    expect(isFilterActive({ ...DEFAULT_TASK_FILTER, projectId: "unassigned" })).toBe(true);
  });
});

describe("filterTasks", () => {
  const tasks = [
    task({ id: "1", description: "Call tile supplier", priority: "high", projectId: "p1" }),
    task({ id: "2", description: "Order mulch", priority: "low", projectId: "p1" }),
    task({ id: "3", description: "Buy stamps", priority: "med" }),
  ];

  it("returns everything for the default filter", () => {
    expect(filterTasks(tasks, DEFAULT_TASK_FILTER)).toHaveLength(3);
  });

  it("matches search text case-insensitively against the description", () => {
    const result = filterTasks(tasks, { ...DEFAULT_TASK_FILTER, search: "MULCH" });
    expect(result.map((t) => t.id)).toEqual(["2"]);
  });

  it("filters by priority", () => {
    const result = filterTasks(tasks, { ...DEFAULT_TASK_FILTER, priority: "high" });
    expect(result.map((t) => t.id)).toEqual(["1"]);
  });

  it("filters by project id", () => {
    const result = filterTasks(tasks, { ...DEFAULT_TASK_FILTER, projectId: "p1" });
    expect(result.map((t) => t.id)).toEqual(["1", "2"]);
  });

  it("filters to unassigned tasks", () => {
    const result = filterTasks(tasks, { ...DEFAULT_TASK_FILTER, projectId: "unassigned" });
    expect(result.map((t) => t.id)).toEqual(["3"]);
  });

  it("combines multiple filters", () => {
    const result = filterTasks(tasks, { ...DEFAULT_TASK_FILTER, projectId: "p1", priority: "low" });
    expect(result.map((t) => t.id)).toEqual(["2"]);
  });
});

describe("sortTasks", () => {
  const projectsById = new Map<string, Project>([
    ["p1", project({ id: "p1", shortCode: "ZED" })],
    ["p2", project({ id: "p2", shortCode: "ABC" })],
  ]);

  it("always keeps open before deferred before done, regardless of mode", () => {
    const tasks = [
      task({ id: "done", description: "z", state: "done" }),
      task({ id: "open", description: "a", state: "open" }),
      task({ id: "deferred", description: "m", state: "deferred" }),
    ];
    const result = sortTasks(tasks, "alpha", projectsById);
    expect(result.map((t) => t.id)).toEqual(["open", "deferred", "done"]);
  });

  it("sorts by priority within a state group by default", () => {
    const tasks = [
      task({ id: "low", priority: "low" }),
      task({ id: "high", priority: "high" }),
      task({ id: "med", priority: "med" }),
    ];
    const result = sortTasks(tasks, "priority", projectsById);
    expect(result.map((t) => t.id)).toEqual(["high", "med", "low"]);
  });

  it("sorts alphabetically by description", () => {
    const tasks = [
      task({ id: "b", description: "Buy stamps" }),
      task({ id: "a", description: "Ask about invoice" }),
    ];
    const result = sortTasks(tasks, "alpha", projectsById);
    expect(result.map((t) => t.id)).toEqual(["a", "b"]);
  });

  it("sorts by project short code, with unassigned tasks last", () => {
    const tasks = [
      task({ id: "none", description: "No project" }),
      task({ id: "zed", projectId: "p1" }),
      task({ id: "abc", projectId: "p2" }),
    ];
    const result = sortTasks(tasks, "project", projectsById);
    expect(result.map((t) => t.id)).toEqual(["abc", "zed", "none"]);
  });

  it("falls back to priority as the tiebreaker within the same project", () => {
    const tasks = [
      task({ id: "low", priority: "low", projectId: "p1" }),
      task({ id: "high", priority: "high", projectId: "p1" }),
    ];
    const result = sortTasks(tasks, "project", projectsById);
    expect(result.map((t) => t.id)).toEqual(["high", "low"]);
  });
});
