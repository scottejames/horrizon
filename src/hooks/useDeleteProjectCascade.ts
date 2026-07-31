import { useProjectStore } from "../context/ProjectStoreContext";
import { useTaskStore } from "../context/TaskStoreContext";

/**
 * Deleting a project unlinks its tasks (never deletes them) — see
 * design/design-principles.md's "Deletion cascades sideways, never
 * downward" entry. Shared by every place a project can be deleted from
 * (the project drawer, the sidebar tree row) so the cascade order isn't
 * duplicated at each call site.
 */
export function useDeleteProjectCascade(): (projectId: string) => void {
  const { deleteProject } = useProjectStore();
  const { unlinkTasksFromProject } = useTaskStore();

  return function deleteProjectCascade(projectId: string) {
    unlinkTasksFromProject(projectId);
    deleteProject(projectId);
  };
}
