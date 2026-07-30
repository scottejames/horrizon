import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectStoreProvider, useProjectStore } from "./ProjectStoreContext";

const { areaCreateMock, projectCreateMock, projectUpdateMock } = vi.hoisted(() => ({
  areaCreateMock: vi.fn().mockResolvedValue({}),
  projectCreateMock: vi.fn().mockResolvedValue({}),
  projectUpdateMock: vi.fn().mockResolvedValue({}),
}));

vi.mock("../lib/dataClient", () => ({
  client: {
    models: {
      AreaOfResponsibility: {
        observeQuery: () => ({
          subscribe: (handlers: { next: (result: { items: unknown[] }) => void }) => {
            handlers.next({ items: [] });
            return { unsubscribe: vi.fn() };
          },
        }),
        create: areaCreateMock,
      },
      Project: {
        observeQuery: () => ({
          subscribe: (handlers: { next: (result: { items: unknown[] }) => void }) => {
            handlers.next({ items: [] });
            return { unsubscribe: vi.fn() };
          },
        }),
        create: projectCreateMock,
        update: projectUpdateMock,
      },
    },
  },
}));

function TestHarness() {
  const { areas, projects, addArea, addProject, moveProjectToArea } = useProjectStore();
  const home = areas.find((area) => area.name === "Home");
  const unassigned = projects.filter((project) => !project.areaId);
  const inHome = home ? projects.filter((project) => project.areaId === home.id) : [];

  return (
    <div>
      <button onClick={() => addArea("Home", "personal")}>add area</button>
      <button onClick={() => addProject("Kitchen Remodel", "personal")}>add project</button>
      <ul aria-label="unassigned">
        {unassigned.map((project) => (
          <li key={project.id}>
            {project.name}
            {home && (
              <button onClick={() => moveProjectToArea(project.id, home.id)}>
                move {project.id} to Home
              </button>
            )}
          </li>
        ))}
      </ul>
      <ul aria-label="home-area">
        {inHome.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
}

describe("ProjectStoreContext", () => {
  beforeEach(() => {
    areaCreateMock.mockClear();
    projectCreateMock.mockClear();
    projectUpdateMock.mockClear();
  });

  it("throws when used outside a provider", () => {
    function Bare() {
      useProjectStore();
      return null;
    }
    expect(() => render(<Bare />)).toThrow(/useProjectStore must be used within a ProjectStoreProvider/);
  });

  it("adds a project unassigned by default, and an area, both optimistically", async () => {
    const user = userEvent.setup();
    render(
      <ProjectStoreProvider>
        <TestHarness />
      </ProjectStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add project" }));
    expect(await screen.findByText("Kitchen Remodel")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "unassigned" })).toHaveTextContent("Kitchen Remodel");
    expect(projectCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Kitchen Remodel", commitment: "personal", areaId: undefined }),
    );

    await user.click(screen.getByRole("button", { name: "add area" }));
    expect(areaCreateMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Home", commitment: "personal" }),
    );
  });

  it("moves a project into an area on demand", async () => {
    const user = userEvent.setup();
    render(
      <ProjectStoreProvider>
        <TestHarness />
      </ProjectStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add area" }));
    await user.click(screen.getByRole("button", { name: "add project" }));

    const moveButton = await screen.findByRole("button", { name: /^move .* to Home/ });
    await user.click(moveButton);

    expect(screen.getByRole("list", { name: "home-area" })).toHaveTextContent("Kitchen Remodel");
    expect(screen.getByRole("list", { name: "unassigned" })).not.toHaveTextContent(
      "Kitchen Remodel",
    );
    expect(projectUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ areaId: expect.any(String) }),
    );
  });
});
