import { useCallback, useEffect, useRef } from "react";
import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";
import { compressNarrative, describeCompletedBatch } from "../lib/narrative";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const SWEEP_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Drives both halves of the "completed tasks fade into a project's
 * narrative" behavior described in design/design-principles.md:
 *
 * - `purgeStaleCompletedTasks` deletes completed tasks (project-linked or
 *   not) once `completedAt` is 24h old, folding project-linked ones into
 *   that project's narrative first — a task's description would otherwise
 *   be lost forever the moment it's purged.
 * - `compressDueNarratives` collapses a project's narrative into a single
 *   running-total sentence once a day, so it doesn't grow without bound.
 *
 * Both run automatically (checked every 5 minutes while the app is open —
 * see the "client-side only" caveat in architecture-overview.md) and are
 * also exposed with a `force` flag for the debug view's manual triggers,
 * which is the whole reason these are plain callbacks return from a hook
 * rather than being buried inside a bare `useEffect`.
 */
export function useNarrativeMaintenance() {
  const { tasks, tasksReady, deleteTasks } = useTaskStore();
  const { projectsReady, appendProjectNarrative, compressProjectNarrative, getLatestProjects } =
    useProjectStore();

  // Read via a ref, not the value captured at callback-creation time, so the
  // callback's identity can stay stable (see the useCallback deps below)
  // without acting on stale data. The assignment happens in an effect, not
  // directly during render — eslint's react-hooks/refs rule (rightly)
  // disallows mutating a ref while rendering. Projects are read through
  // getLatestProjects() instead of an equivalent local ref here, because a
  // ref synced via this same kind of effect only updates after a render
  // commits — too late to see a narrative entry that purgeStaleCompletedTasks
  // appended moments earlier in the same tick (see getLatestProjects' doc).
  const tasksRef = useRef(tasks);
  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  // Returns a promise resolving once every appendProjectNarrative write this
  // pass triggered has completed — see compressDueNarratives' call site below
  // for why the automatic sweep needs to wait on that before compressing.
  const purgeStaleCompletedTasks = useCallback(
    (force: boolean, projectId?: string): Promise<void> => {
      const now = Date.now();
      const candidates = tasksRef.current.filter((task) => {
        if (task.state !== "done") return false;
        if (projectId !== undefined && task.projectId !== projectId) return false;
        if (force) return true;
        if (!task.completedAt) return false;
        return now - new Date(task.completedAt).getTime() >= ONE_DAY_MS;
      });
      if (candidates.length === 0) return Promise.resolve();

      const descriptionsByProject = new Map<string, string[]>();
      candidates.forEach((task) => {
        if (!task.projectId) return;
        const descriptions = descriptionsByProject.get(task.projectId) ?? [];
        descriptions.push(task.description);
        descriptionsByProject.set(task.projectId, descriptions);
      });
      const appends = Array.from(descriptionsByProject.entries()).map(([pid, descriptions]) =>
        appendProjectNarrative(pid, describeCompletedBatch(descriptions), descriptions.length),
      );

      deleteTasks(candidates.map((task) => task.id));

      return Promise.all(appends).then(() => undefined);
    },
    [appendProjectNarrative, deleteTasks],
  );

  const compressDueNarratives = useCallback(
    (force: boolean, projectId?: string) => {
      const now = Date.now();
      getLatestProjects().forEach((project) => {
        if (projectId !== undefined && project.id !== projectId) return;
        if (!project.narrative) return;
        const lastCompressed = project.narrativeCompressedAt
          ? new Date(project.narrativeCompressedAt).getTime()
          : 0;
        if (!force && now - lastCompressed < ONE_DAY_MS) return;
        const compressed = compressNarrative(project.narrative, project.completedTaskCount);
        if (compressed !== project.narrative) {
          compressProjectNarrative(project.id, compressed);
        }
      });
    },
    [compressProjectNarrative, getLatestProjects],
  );

  // Run once real data is in hand — not on every subsequent tasks/projects
  // change. `isSynced` (surfaced as tasksReady/projectsReady) tells us the
  // initial `observeQuery` sync has actually landed, so this can't fire
  // against still-empty data. Deliberately NOT re-triggered on every later
  // data change: each observeQuery emission is its own async round trip, and
  // re-running the sweep for every one of them let two overlapping purge
  // passes each work off a different partial view of "what's a candidate,"
  // corrupting the narrative (see design-principles.md). The interval below,
  // plus the debug view's manual triggers, cover ongoing checks instead.
  useEffect(() => {
    if (!tasksReady || !projectsReady) return;
    // Await the purge's own narrative-append writes before compressing: two
    // independent `Project.update` calls for the same project racing to
    // DynamoDB in either order would let the append's completing second
    // silently revert a compression that had already landed (see
    // appendProjectNarrative's comment in ProjectStoreContext).
    purgeStaleCompletedTasks(false).then(() => compressDueNarratives(false));
  }, [tasksReady, projectsReady, purgeStaleCompletedTasks, compressDueNarratives]);

  // A long-period fallback so a project's narrative still gets swept even if
  // the app sits open with no task/project activity for hours.
  useEffect(() => {
    const interval = setInterval(() => {
      purgeStaleCompletedTasks(false).then(() => compressDueNarratives(false));
    }, SWEEP_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [purgeStaleCompletedTasks, compressDueNarratives]);

  return { purgeStaleCompletedTasks, compressDueNarratives };
}
