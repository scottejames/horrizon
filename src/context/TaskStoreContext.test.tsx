import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskStoreProvider, useTaskStore } from "./TaskStoreContext";

const { createMock, updateMock, deleteMock } = vi.hoisted(() => ({
  createMock: vi.fn().mockResolvedValue({}),
  updateMock: vi.fn().mockResolvedValue({}),
  deleteMock: vi.fn().mockResolvedValue({}),
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
        delete: deleteMock,
      },
    },
  },
}));

function TestHarness() {
  const { tasksByHorizon, addTask, moveTask, updateDescription, deleteTask, unlinkTasksFromProject } =
    useTaskStore();
  const today = tasksByHorizon("today", "personal");
  const tomorrow = tasksByHorizon("tomorrow", "personal");

  return (
    <div>
      <button
        onClick={() =>
          addTask({
            description: "Buy stamps",
            priority: "med",
            horizon: "today",
            commitment: "personal",
          })
        }
      >
        add task
      </button>
      <button
        onClick={() =>
          addTask({
            description: "Pick up paint",
            priority: "med",
            horizon: "today",
            commitment: "personal",
            projectId: "proj-1",
          })
        }
      >
        add linked task
      </button>
      <button onClick={() => unlinkTasksFromProject("proj-1")}>unlink proj-1</button>
      <ul aria-label="today">
        {today.map((task) => (
          <li key={task.id}>
            {task.description}
            <span data-testid={`project-of-${task.id}`}>{task.projectId ?? "none"}</span>
            <button onClick={() => moveTask(task.id, "tomorrow")}>defer {task.id}</button>
            <button onClick={() => updateDescription(task.id, "Buy stamps and envelopes")}>
              rename {task.id}
            </button>
            <button onClick={() => deleteTask(task.id)}>delete {task.id}</button>
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
    deleteMock.mockClear();
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
      expect.objectContaining({
        description: "Buy stamps",
        horizon: "today",
        state: "open",
        commitment: "personal",
      }),
    );
  });

  it("keeps a work task out of the personal view", async () => {
    function MixedHarness() {
      const { tasksByHorizon, addTask } = useTaskStore();
      const personal = tasksByHorizon("today", "personal");
      const work = tasksByHorizon("today", "work");
      return (
        <div>
          <button
            onClick={() =>
              addTask({
                description: "Ship the report",
                priority: "med",
                horizon: "today",
                commitment: "work",
              })
            }
          >
            add work task
          </button>
          <ul aria-label="personal-today">
            {personal.map((task) => (
              <li key={task.id}>{task.description}</li>
            ))}
          </ul>
          <ul aria-label="work-today">
            {work.map((task) => (
              <li key={task.id}>{task.description}</li>
            ))}
          </ul>
        </div>
      );
    }

    const user = userEvent.setup();
    render(
      <TaskStoreProvider>
        <MixedHarness />
      </TaskStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add work task" }));

    expect(await screen.findByText("Ship the report")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "personal-today" })).not.toHaveTextContent(
      "Ship the report",
    );
  });

  it("renames a task's description optimistically and fires the network write", async () => {
    const user = userEvent.setup();
    render(
      <TaskStoreProvider>
        <TestHarness />
      </TaskStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add task" }));
    const renameButton = await screen.findByRole("button", { name: /^rename / });
    await user.click(renameButton);

    expect(await screen.findByText("Buy stamps and envelopes")).toBeInTheDocument();
    expect(screen.queryByText("Buy stamps")).not.toBeInTheDocument();
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ description: "Buy stamps and envelopes" }),
    );
  });

  it("deletes a task optimistically and fires the network delete", async () => {
    const user = userEvent.setup();
    render(
      <TaskStoreProvider>
        <TestHarness />
      </TaskStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add task" }));
    expect(await screen.findByText("Buy stamps")).toBeInTheDocument();

    const deleteButton = screen.getByRole("button", { name: /^delete / });
    await user.click(deleteButton);

    expect(screen.queryByText("Buy stamps")).not.toBeInTheDocument();
    expect(deleteMock).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });

  it("unlinks tasks from a deleted project without otherwise touching them", async () => {
    const user = userEvent.setup();
    render(
      <TaskStoreProvider>
        <TestHarness />
      </TaskStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add linked task" }));
    const row = (await screen.findByText("Pick up paint")).closest("li")!;
    expect(row.querySelector('[data-testid^="project-of-"]')).toHaveTextContent("proj-1");

    await user.click(screen.getByRole("button", { name: "unlink proj-1" }));

    expect(screen.getByText("Pick up paint")).toBeInTheDocument();
    const updatedRow = screen.getByText("Pick up paint").closest("li")!;
    expect(updatedRow.querySelector('[data-testid^="project-of-"]')).toHaveTextContent("none");
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ projectId: null }));
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
