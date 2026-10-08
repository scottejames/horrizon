import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { TaskStoreProvider, useTaskStore } from "./TaskStoreContext";

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn().mockResolvedValue({}) }));

const legacyRow = {
  id: "t-week",
  description: "Plan the garden",
  priority: "med",
  horizon: "week",
  state: "open",
  commitment: "personal",
  notes: null,
};

vi.mock("../lib/dataClient", () => ({
  client: {
    models: {
      Task: {
        observeQuery: () => ({
          subscribe: (handlers: { next: (result: unknown) => void }) => {
            // Two emissions before the fix lands, as observeQuery does while syncing.
            handlers.next({ items: [legacyRow], isSynced: false });
            handlers.next({ items: [legacyRow], isSynced: true });
            return { unsubscribe: vi.fn() };
          },
        }),
        create: vi.fn(),
        update: updateMock,
        delete: vi.fn(),
      },
    },
  },
}));

function SomedayList() {
  const { tasksByHorizon } = useTaskStore();
  return (
    <ul aria-label="someday">
      {tasksByHorizon("someday", "personal").map((task) => (
        <li key={task.id}>{task.description}</li>
      ))}
    </ul>
  );
}

describe("legacy Next Week tasks", () => {
  it("show up in Someday and are migrated with exactly one write", () => {
    render(
      <TaskStoreProvider>
        <SomedayList />
      </TaskStoreProvider>,
    );

    expect(screen.getByRole("list", { name: "someday" })).toHaveTextContent("Plan the garden");
    expect(updateMock).toHaveBeenCalledTimes(1);
    expect(updateMock).toHaveBeenCalledWith({ id: "t-week", horizon: "someday" });
  });
});
