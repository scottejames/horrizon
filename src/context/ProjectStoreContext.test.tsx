import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ProjectStoreProvider, useProjectStore } from "./ProjectStoreContext";

const {
  areaCreateMock,
  areaUpdateMock,
  areaDeleteMock,
  projectCreateMock,
  projectUpdateMock,
  projectDeleteMock,
} = vi.hoisted(() => ({
  areaCreateMock: vi.fn().mockResolvedValue({}),
  areaUpdateMock: vi.fn().mockResolvedValue({}),
  areaDeleteMock: vi.fn().mockResolvedValue({}),
  projectCreateMock: vi.fn().mockResolvedValue({}),
  projectUpdateMock: vi.fn().mockResolvedValue({}),
  projectDeleteMock: vi.fn().mockResolvedValue({}),
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
        update: areaUpdateMock,
        delete: areaDeleteMock,
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
        delete: projectDeleteMock,
      },
    },
  },
}));

function TestHarness() {
  const {
    areas,
    projects,
    addArea,
    addProject,
    moveProjectToArea,
    renameProject,
    renameArea,
    deleteProject,
    deleteArea,
  } = useProjectStore();
  const home = areas.find((area) => area.name === "Home");
  const unassigned = projects.filter((project) => !project.areaId);
  const inHome = home ? projects.filter((project) => project.areaId === home.id) : [];

  return (
    <div>
      <button onClick={() => addArea("Home", "personal")}>add area</button>
      <button onClick={() => addProject("Kitchen Remodel", "personal")}>add project</button>
      {home && (
        <>
          <button onClick={() => renameArea(home.id, "Household")}>rename area</button>
          <button onClick={() => deleteArea(home.id)}>delete area</button>
        </>
      )}
      <ul aria-label="areas">{areas.map((area) => <li key={area.id}>{area.name}</li>)}</ul>
      <ul aria-label="unassigned">
        {unassigned.map((project) => (
          <li key={project.id}>
            {project.name}
            {home && (
              <button onClick={() => moveProjectToArea(project.id, home.id)}>
                move {project.id} to Home
              </button>
            )}
            <button onClick={() => renameProject(project.id, "Kitchen Remodel Phase 2")}>
              rename {project.id}
            </button>
            <button onClick={() => deleteProject(project.id)}>delete {project.id}</button>
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
    areaUpdateMock.mockClear();
    areaDeleteMock.mockClear();
    projectCreateMock.mockClear();
    projectUpdateMock.mockClear();
    projectDeleteMock.mockClear();
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

  it("renames a project optimistically and fires the network write", async () => {
    const user = userEvent.setup();
    render(
      <ProjectStoreProvider>
        <TestHarness />
      </ProjectStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add project" }));
    const renameButton = await screen.findByRole("button", { name: /^rename / });
    await user.click(renameButton);

    expect(await screen.findByText("Kitchen Remodel Phase 2")).toBeInTheDocument();
    expect(projectUpdateMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Kitchen Remodel Phase 2" }),
    );
  });

  it("renames an area optimistically and fires the network write", async () => {
    const user = userEvent.setup();
    render(
      <ProjectStoreProvider>
        <TestHarness />
      </ProjectStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add area" }));
    await user.click(await screen.findByRole("button", { name: "rename area" }));

    expect(await screen.findByText("Household")).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "areas" })).not.toHaveTextContent("Home");
    expect(areaUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ name: "Household" }));
  });

  it("deletes a project optimistically and fires the network delete", async () => {
    const user = userEvent.setup();
    render(
      <ProjectStoreProvider>
        <TestHarness />
      </ProjectStoreProvider>,
    );

    await user.click(screen.getByRole("button", { name: "add project" }));
    expect(await screen.findByText("Kitchen Remodel")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /^delete / }));

    expect(screen.queryByText("Kitchen Remodel")).not.toBeInTheDocument();
    expect(projectDeleteMock).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
  });

  it("deletes an area and moves its projects to Unassigned, leaving them otherwise alone", async () => {
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

    await user.click(screen.getByRole("button", { name: "delete area" }));

    expect(screen.getByRole("list", { name: "areas" })).not.toHaveTextContent("Home");
    expect(screen.getByRole("list", { name: "unassigned" })).toHaveTextContent("Kitchen Remodel");
    expect(areaDeleteMock).toHaveBeenCalledWith(expect.objectContaining({ id: expect.any(String) }));
    expect(projectUpdateMock).toHaveBeenCalledWith(expect.objectContaining({ areaId: null }));
  });
});
