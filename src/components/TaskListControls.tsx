import type { Priority, Project } from "../types";
import type { TaskListFilter, TaskSortMode } from "../lib/taskListView";

interface TaskListControlsProps {
  filter: TaskListFilter;
  onFilterChange: (filter: TaskListFilter) => void;
  sort: TaskSortMode;
  onSortChange: (sort: TaskSortMode) => void;
  projects: Project[];
}

const PRIORITY_OPTIONS: { value: Priority | "all"; label: string }[] = [
  { value: "all", label: "Any priority" },
  { value: "high", label: "High priority" },
  { value: "med", label: "Med priority" },
  { value: "low", label: "Low priority" },
];

const SORT_OPTIONS: { value: TaskSortMode; label: string }[] = [
  { value: "priority", label: "Sort: Priority" },
  { value: "alpha", label: "Sort: Alphabetical" },
  { value: "project", label: "Sort: Project" },
];

export function TaskListControls({
  filter,
  onFilterChange,
  sort,
  onSortChange,
  projects,
}: TaskListControlsProps) {
  return (
    <div className="list-controls">
      <input
        type="search"
        className="list-search"
        placeholder="Search tasks…"
        aria-label="Search tasks"
        value={filter.search}
        onChange={(event) => onFilterChange({ ...filter, search: event.target.value })}
      />
      <select
        className="list-filter"
        aria-label="Filter by priority"
        value={filter.priority}
        onChange={(event) =>
          onFilterChange({ ...filter, priority: event.target.value as Priority | "all" })
        }
      >
        {PRIORITY_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <select
        className="list-filter"
        aria-label="Filter by project"
        value={filter.projectId}
        onChange={(event) => onFilterChange({ ...filter, projectId: event.target.value })}
      >
        <option value="all">Any project</option>
        <option value="unassigned">No project</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            #{project.shortCode} {project.name}
          </option>
        ))}
      </select>
      <select
        className="list-filter"
        aria-label="Sort tasks"
        value={sort}
        onChange={(event) => onSortChange(event.target.value as TaskSortMode)}
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
