import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { client } from "../lib/dataClient";
import { generateShortCode } from "../lib/shortCode";
import type { AreaOfResponsibility, Project } from "../types";

interface ProjectStoreValue {
  areas: AreaOfResponsibility[];
  projects: Project[];
  addArea: (name: string) => void;
  addProject: (name: string, areaId?: string) => Project;
  projectByCode: (code: string) => Project | undefined;
  /** Reassigns a project to a different area, or to `undefined` for unassigned. */
  moveProjectToArea: (projectId: string, areaId: string | undefined) => void;
}

const ProjectStoreContext = createContext<ProjectStoreValue | null>(null);

/**
 * Areas of Responsibility and Projects are organizational structure, kept in
 * one context because they change for the same reason (organizing todos) and
 * an Area has no independent behavior of its own — see CODING_GUIDELINES.md
 * #4 on splitting contexts by reason-to-change, not just by entity.
 */
export function ProjectStoreProvider({ children }: { children: ReactNode }) {
  const [areas, setAreas] = useState<AreaOfResponsibility[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const sub = client.models.AreaOfResponsibility.observeQuery().subscribe({
      next: ({ items }) => setAreas(items.map((item) => ({ id: item.id, name: item.name }))),
    });
    return () => sub.unsubscribe();
  }, []);

  useEffect(() => {
    const sub = client.models.Project.observeQuery().subscribe({
      next: ({ items }) =>
        setProjects(
          items.map((item) => ({
            id: item.id,
            shortCode: item.shortCode,
            name: item.name,
            areaId: item.areaId ?? undefined,
          })),
        ),
    });
    return () => sub.unsubscribe();
  }, []);

  function addArea(name: string) {
    const id = crypto.randomUUID();
    setAreas((prev) => [...prev, { id, name }]);
    client.models.AreaOfResponsibility.create({ id, name }).catch(console.error);
  }

  function addProject(name: string, areaId?: string): Project {
    const id = crypto.randomUUID();
    const shortCode = generateShortCode(
      name,
      projects.map((project) => project.shortCode),
    );
    const project: Project = { id, shortCode, name, areaId };
    setProjects((prev) => [...prev, project]);
    client.models.Project.create({ id, shortCode, name, areaId }).catch(console.error);
    return project;
  }

  function projectByCode(code: string) {
    return projects.find((project) => project.shortCode.toUpperCase() === code.toUpperCase());
  }

  function moveProjectToArea(projectId: string, areaId: string | undefined) {
    setProjects((prev) =>
      prev.map((project) => (project.id === projectId ? { ...project, areaId } : project)),
    );
    client.models.Project.update({ id: projectId, areaId: areaId ?? null }).catch(console.error);
  }

  return (
    <ProjectStoreContext.Provider
      value={{ areas, projects, addArea, addProject, projectByCode, moveProjectToArea }}
    >
      {children}
    </ProjectStoreContext.Provider>
  );
}

export function useProjectStore(): ProjectStoreValue {
  const ctx = useContext(ProjectStoreContext);
  if (!ctx) throw new Error("useProjectStore must be used within a ProjectStoreProvider");
  return ctx;
}
