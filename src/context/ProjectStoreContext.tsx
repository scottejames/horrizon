import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { client } from "../lib/dataClient";
import { generateShortCode } from "../lib/shortCode";
import type { Program, Project } from "../types";

interface ProjectStoreValue {
  programs: Program[];
  projects: Project[];
  addProgram: (name: string) => void;
  addProject: (name: string, programId?: string) => Project;
  projectByCode: (code: string) => Project | undefined;
}

const ProjectStoreContext = createContext<ProjectStoreValue | null>(null);

/**
 * Programs and Projects are organizational structure, kept in one context
 * because they change for the same reason (organizing todos) and a Program
 * has no independent behavior of its own — see CODING_GUIDELINES.md #4 on
 * splitting contexts by reason-to-change, not just by entity.
 */
export function ProjectStoreProvider({ children }: { children: ReactNode }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const sub = client.models.Program.observeQuery().subscribe({
      next: ({ items }) => setPrograms(items.map((item) => ({ id: item.id, name: item.name }))),
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
            programId: item.programId ?? undefined,
          })),
        ),
    });
    return () => sub.unsubscribe();
  }, []);

  function addProgram(name: string) {
    const id = crypto.randomUUID();
    setPrograms((prev) => [...prev, { id, name }]);
    client.models.Program.create({ id, name }).catch(console.error);
  }

  function addProject(name: string, programId?: string): Project {
    const id = crypto.randomUUID();
    const shortCode = generateShortCode(
      name,
      projects.map((project) => project.shortCode),
    );
    const project: Project = { id, shortCode, name, programId };
    setProjects((prev) => [...prev, project]);
    client.models.Project.create({ id, shortCode, name, programId }).catch(console.error);
    return project;
  }

  function projectByCode(code: string) {
    return projects.find((project) => project.shortCode.toUpperCase() === code.toUpperCase());
  }

  return (
    <ProjectStoreContext.Provider
      value={{ programs, projects, addProgram, addProject, projectByCode }}
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
