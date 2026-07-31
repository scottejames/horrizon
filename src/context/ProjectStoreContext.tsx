import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { client } from "../lib/dataClient";
import { toCommitment } from "../lib/guards";
import { appendNarrativeEntry } from "../lib/narrative";
import { generateShortCode } from "../lib/shortCode";
import type { AreaOfResponsibility, Commitment, Project } from "../types";

interface ProjectStoreValue {
  areas: AreaOfResponsibility[];
  projects: Project[];
  /** True once the initial `observeQuery` sync has completed — see useNarrativeMaintenance. */
  projectsReady: boolean;
  addArea: (name: string, commitment: Commitment) => void;
  addProject: (name: string, commitment: Commitment, areaId?: string) => Project;
  projectByCode: (code: string) => Project | undefined;
  /** Reassigns a project to a different area, or to `undefined` for unassigned. */
  moveProjectToArea: (projectId: string, areaId: string | undefined) => void;
  renameProject: (id: string, name: string) => void;
  renameArea: (id: string, name: string) => void;
  /** Deletes only the project record — unlinking its tasks is a separate, composed step (see TaskStoreContext.unlinkTasksFromProject). */
  deleteProject: (id: string) => void;
  /** Deletes the area and unassigns (not deletes) any projects that were in it. */
  deleteArea: (id: string) => void;
  /**
   * Appends a narrative entry (e.g. "Jul 31: wrapped up ...") and adds to the
   * running completed-task tally. Resolves once the backend write completes —
   * see the comment on its implementation for why that matters.
   */
  appendProjectNarrative: (projectId: string, entry: string, completedDelta: number) => Promise<void>;
  /** Replaces the narrative text with a compressed form and stamps the compression time. */
  compressProjectNarrative: (projectId: string, compressedNarrative: string) => Promise<void>;
  /**
   * Synchronously returns the latest project data — unlike `projects`, this
   * reflects writes from the same tick (e.g. an appendProjectNarrative call
   * moments earlier), not just what's landed in React state after a render.
   * Needed by useNarrativeMaintenance so compressDueNarratives can see a
   * narrative entry that purgeStaleCompletedTasks just appended.
   */
  getLatestProjects: () => Project[];
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
  const [projectsReady, setProjectsReady] = useState(false);

  // Kept alongside `projects` state so appendProjectNarrative/compressProjectNarrative
  // can read the true latest value instead of a stale render closure — matters when
  // they're called more than once in quick succession. Deliberately NOT kept in sync
  // via a blanket "runs every render" effect: that would let an unrelated re-render
  // (e.g. one still holding an older `projects` closure while a newer optimistic write
  // is in flight) stomp the ref backward. Instead it's written explicitly, exactly when
  // real data changes — here, and inside appendProjectNarrative/compressProjectNarrative.
  const projectsRef = useRef(projects);

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
      next: ({ items, isSynced }) => {
        const mapped = items.map((item) => ({
          id: item.id,
          shortCode: item.shortCode,
          name: item.name,
          commitment: toCommitment(item.commitment),
          areaId: item.areaId ?? undefined,
          narrative: item.narrative ?? "",
          completedTaskCount: item.completedTaskCount ?? 0,
          narrativeCompressedAt: item.narrativeCompressedAt ?? undefined,
        }));
        projectsRef.current = mapped;
        setProjects(mapped);
        if (isSynced) setProjectsReady(true);
      },
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
    const project: Project = {
      id,
      shortCode,
      name,
      commitment,
      areaId,
      narrative: "",
      completedTaskCount: 0,
    };
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

  function deleteProject(id: string) {
    setProjects((prev) => prev.filter((project) => project.id !== id));
    client.models.Project.delete({ id }).catch(console.error);
  }

  function deleteArea(id: string) {
    const affectedProjects = projects.filter((project) => project.areaId === id);
    setAreas((prev) => prev.filter((area) => area.id !== id));
    setProjects((prev) =>
      prev.map((project) => (project.areaId === id ? { ...project, areaId: undefined } : project)),
    );
    client.models.AreaOfResponsibility.delete({ id }).catch(console.error);
    affectedProjects.forEach((project) => {
      client.models.Project.update({ id: project.id, areaId: null }).catch(console.error);
    });
  }

  // useCallback with stable (empty) deps: this reads/writes projectsRef directly rather
  // than closing over `projects` state, so its identity never needs to change across
  // renders. That stability matters — useNarrativeMaintenance's mount effect depends on
  // this function transitively, and an identity that churned on every render was
  // causing that effect to tear down and refire repeatedly, corrupting the narrative.
  // Returns the backend write's promise (rather than firing-and-forgetting it)
  // so callers that also plan to write this same project moments later — see
  // compressDueNarratives in useNarrativeMaintenance — can await it first.
  // Two independent `Project.update` calls for the same project have no
  // ordering guarantee: whichever reaches DynamoDB last wins, so an append's
  // request completing after a compress's would silently revert the
  // compression despite both having read/written correct local state.
  const appendProjectNarrative = useCallback(
    (projectId: string, entry: string, completedDelta: number): Promise<void> => {
      const current = projectsRef.current.find((project) => project.id === projectId);
      if (!current) return Promise.resolve();
      const narrative = appendNarrativeEntry(current.narrative, entry);
      const completedTaskCount = current.completedTaskCount + completedDelta;
      projectsRef.current = projectsRef.current.map((project) =>
        project.id === projectId ? { ...project, narrative, completedTaskCount } : project,
      );
      setProjects(projectsRef.current);
      return client.models.Project.update({ id: projectId, narrative, completedTaskCount })
        .then(() => undefined)
        .catch(console.error);
    },
    [],
  );

  const compressProjectNarrative = useCallback(
    (projectId: string, compressedNarrative: string): Promise<void> => {
      const narrativeCompressedAt = new Date().toISOString();
      projectsRef.current = projectsRef.current.map((project) =>
        project.id === projectId
          ? { ...project, narrative: compressedNarrative, narrativeCompressedAt }
          : project,
      );
      setProjects(projectsRef.current);
      return client.models.Project.update({
        id: projectId,
        narrative: compressedNarrative,
        narrativeCompressedAt,
      })
        .then(() => undefined)
        .catch(console.error);
    },
    [],
  );

  const getLatestProjects = useCallback(() => projectsRef.current, []);

  return (
    <ProjectStoreContext.Provider
      value={{
        areas,
        projects,
        projectsReady,
        addArea,
        addProject,
        projectByCode,
        moveProjectToArea,
        renameProject,
        renameArea,
        deleteProject,
        deleteArea,
        appendProjectNarrative,
        compressProjectNarrative,
        getLatestProjects,
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
