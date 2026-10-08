import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TaskStoreProvider } from "../context/TaskStoreContext";
import { TaskDrawer } from "./TaskDrawer";

const { updateMock } = vi.hoisted(() => ({
  updateMock: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/dataClient", () => ({
  client: {
    models: {
      Task: {
        observeQuery: () => ({
          subscribe: (handlers: { next: (result: unknown) => void }) => {
            handlers.next({
              isSynced: true,
              items: [
                {
                  id: "task-1",
                  description: "Get the boiler serviced",
                  priority: "med",
                  horizon: "today",
                  state: "open",
                  commitment: "personal",
                  // Stored as a JSON string, the way an a.json() field comes back.
                  notes: JSON.stringify([
                    { at: "2026-10-06T09:00:00.000Z", text: "Rang three engineers" },
                    { at: "2026-10-07T09:00:00.000Z", text: "Booked for Friday" },
                  ]),
                },
                {
                  id: "task-2",
                  description: "Redo the bathroom",
                  priority: "low",
                  horizon: "someday",
                  state: "open",
                  commitment: "personal",
                  notes: JSON.stringify([
                    { at: "2026-10-01T09:00:00.000Z", text: "Got two quotes" },
                  ]),
                },
              ],
            });
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

function renderDrawer(taskId = "task-1") {
  return render(
    <TaskStoreProvider>
      <TaskDrawer taskId={taskId} onClose={vi.fn()} />
    </TaskStoreProvider>,
  );
}

describe("TaskDrawer", () => {
  beforeEach(() => updateMock.mockClear());

  it("shows the task's existing progress notes, newest first", () => {
    renderDrawer();

    expect(screen.getByRole("heading", { name: "Get the boiler serviced" })).toBeInTheDocument();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((item) => item.querySelector("p")?.textContent)).toEqual([
      "Booked for Friday",
      "Rang three engineers",
    ]);
  });

  it("appends a new note optimistically and saves the whole log as JSON", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByRole("textbox", { name: "Progress note" }), "Engineer came{Enter}");

    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("Engineer came");
    expect(screen.getByRole("textbox", { name: "Progress note" })).toHaveValue("");

    expect(updateMock).toHaveBeenCalledTimes(1);
    const { id, notes } = updateMock.mock.calls[0][0];
    expect(id).toBe("task-1");
    expect(JSON.parse(notes).map((note: { text: string }) => note.text)).toEqual([
      "Rang three engineers",
      "Booked for Friday",
      "Engineer came",
    ]);
  });

  it("won't add a blank note", async () => {
    const user = userEvent.setup();
    renderDrawer();

    await user.type(screen.getByRole("textbox", { name: "Progress note" }), "   {Enter}");

    expect(screen.getByRole("button", { name: "Add" })).toBeDisabled();
    expect(updateMock).not.toHaveBeenCalled();
  });

  it("keeps a Someday task's notes visible but read-only, and offers to move it into Do", async () => {
    const user = userEvent.setup();
    renderDrawer("task-2");

    expect(screen.getByText("Got two quotes")).toBeInTheDocument();
    expect(screen.queryByRole("textbox", { name: "Progress note" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Move to Today" }));

    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({ id: "task-2", horizon: "today" }),
    );
    expect(screen.getByRole("textbox", { name: "Progress note" })).toBeInTheDocument();
    expect(screen.getByText("Got two quotes")).toBeInTheDocument();
  });
});
