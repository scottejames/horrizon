import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { client } from "../lib/dataClient";
import { toCommitment } from "../lib/guards";
import { generateShortCode } from "../lib/shortCode";
import type { AreaOfResponsibility, Commitment, Project } from "../types";

interface ProjectStoreValue {
  areas: AreaOfResponsibility[];
  projects: Project[];
  addArea: (name: string, commitment: Commitment) => void;
  addProject: (name: string, commitment: Commitment, areaId?: string) => Project;
  projectByCode: (code: string) => Project | undefined;
  /** Reassigns a project to a different area, or to `undefined` for unassigned. */
  moveProjectToArea: (projectId: string, areaId: string | undefined) => void;
  renameProject: (id: string, name: string) => void;
  renameArea: (id: string, name: string) => void;
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
      next: ({ items }) =>
        setAreas(
          items.map((item) => ({
            id: item.id,
            name: item.name,
            commitment: toCommitment(item.commitment),
          })),
        ),
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
            commitment: toCommitment(item.commitment),
            areaId: item.areaId ?? undefined,
          })),
        ),
    });
    return () => sub.unsubscribe();
  }, []);

  function addArea(name: string, commitment: Commitment) {
    const id = crypto.randomUUID();
    setAreas((prev) => [...prev, { id, name, commitment }]);
    client.models.AreaOfResponsibility.create({ id, name, commitment }).catch(console.error);
  }

  function addProject(name: string, commitment: Commitment, areaId?: string): Project {
    const id = crypto.randomUUID();
    const shortCode = generateShortCode(
      name,
      projects.map((project) => project.shortCode),
    );
    const project: Project = { id, shortCode, name, commitment, areaId };
    setProjects((prev) => [...prev, project]);
    client.models.Project.create({ id, shortCode, name, commitment, areaId }).catch(console.error);
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

  function renameProject(id: string, name: string) {
    setProjects((prev) => prev.map((project) => (project.id === id ? { ...project, name } : project)));
    client.models.Project.update({ id, name }).catch(console.error);
  }

  function renameArea(id: string, name: string) {
    setAreas((prev) => prev.map((area) => (area.id === id ? { ...area, name } : area)));
    client.models.AreaOfResponsibility.update({ id, name }).catch(console.error);
  }

  return (
    <ProjectStoreContext.Provider
      value={{
        areas,
        projects,
        addArea,
        addProject,
        projectByCode,
        moveProjectToArea,
        renameProject,
        renameArea,
      }}
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
