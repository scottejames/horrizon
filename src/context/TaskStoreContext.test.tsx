import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskStoreProvider, useTaskStore } from "./TaskStoreContext";

const { createMock, updateMock } = vi.hoisted(() => ({
  createMock: vi.fn().mockResolvedValue({}),
  updateMock: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/dataClient", () => ({
  client: {
    models: {
      Task: {
        observeQuery: () => ({
          subscribe: (handlers: { next: (result: { items: unknown[] }) => void }) => {
            handlers.next({ items: [] });
            return { unsubscribe: vi.fn() };
          },
        }),
        create: createMock,
        update: updateMock,
      },
    },
  },
}));

function TestHarness() {
  const { tasksByHorizon, addTask, moveTask } = useTaskStore();
  const today = tasksByHorizon("today");
  const tomorrow = tasksByHorizon("tomorrow");

  return (
    <div>
      <button onClick={() => addTask({ description: "Buy stamps", priority: "med", horizon: "today" })}>
        add task
      </button>
      <ul aria-label="today">
        {today.map((task) => (
          <li key={task.id}>
            {task.description}
            <button onClick={() => moveTask(task.id, "tomorrow")}>defer {task.id}</button>
          </li>
        ))}
      </ul>
      <ul aria-label="tomorrow">
        {tomorrow.map((task) => (
          <li key={task.id}>
            {task.description}
            {task.deferredFrom ? ` (deferred from ${task.deferredFrom})` : ""}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe("TaskStoreContext", () => {
  beforeEach(() => {
    createMock.mockClear();
    updateMock.mockClear();
  });

  it("throws when used outside a provider", () => {
    // The house convention (CODING_GUIDELINES.md #4): every useX() hook
    // throws a specific error rather than silently returning null.
    function Bare() {
      useTaskStore();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/useTaskStore must be used within a TaskStoreProvider/);
  });

  it("adds a task optimistically and fires the network write", async () => {
    const user = userEvent.setup();
    render(
      <TaskStoreProvider>
        <TestHarness />
      </TaskStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add task" }));

    expect(await screen.findByText("Buy stamps")).toBeInTheDocument();
    expect(createMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Buy stamps", horizon: "today", state: "open" }),
    );
  });

  it("moves a task to another horizon and tags it as deferred from its origin", async () => {
    const user = userEvent.setup();
    render(
      <TaskStoreProvider>
        <TestHarness />
      </TaskStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add task" }));
    const deferButton = await screen.findByRole("button", { name: /^defer / });
    await user.click(deferButton);

    const tomorrowList = screen.getByRole("list", { name: "tomorrow" });
    expect(tomorrowList).toHaveTextContent("Buy stamps (deferred from today)");
    expect(screen.queryByRole("list", { name: "today" })).not.toHaveTextContent("Buy stamps");
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ horizon: "tomorrow", state: "deferred", deferredFrom: "today" }),
    );
  });
});
