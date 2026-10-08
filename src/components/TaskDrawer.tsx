import { useState, type FormEvent } from "react";
import { useTaskStore } from "../context/TaskStoreContext";
import { HORIZON_LABEL } from "../lib/horizon";
import type { Task } from "../types";
import { Drawer } from "./Drawer";

interface TaskDrawerProps {
  taskId: string | null;
  onClose: () => void;
}

function formatNoteTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface ProgressNoteInputProps {
  task: Task;
}

/**
 * Split out so it can be remounted (via `key={task.id}`) when the drawer
 * switches task — otherwise a half-typed note would carry over onto the
 * next task opened.
 */
function ProgressNoteInput({ task }: ProgressNoteInputProps) {
  const [value, setValue] = useState("");
  const { addTaskNote } = useTaskStore();
  const text = value.trim();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text) return;
    addTaskNote(task.id, text);
    setValue("");
  }

  return (
    <form className="drawer-rapid-add" onSubmit={handleSubmit}>
      <div className="capture-row">
        <input
          className="capture-input"
          type="text"
          autoComplete="off"
          aria-label="Progress note"
          placeholder="What's happened on this?"
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
        <button type="submit" className="capture-submit" disabled={!text}>
          Add
        </button>
      </div>
    </form>
  );
}

export function TaskDrawer({ taskId, onClose }: TaskDrawerProps) {
  const { tasks } = useTaskStore();
  const task = taskId ? tasks.find((item) => item.id === taskId) : undefined;
  // Closes itself if the task disappears underneath it (deleted, or purged
  // 24h after completion) rather than showing an empty panel.
  const isOpen = Boolean(taskId && task);

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      labelledBy="taskDrawerTitle"
      closeLabel="Close task notes"
    >
      {task && (
        <>
          <div className="drawer-header">
            <div className="drawer-task-horizon">
              <span className={`horizon-dot h-${task.horizon}`} />
              {HORIZON_LABEL[task.horizon]}
            </div>
            <h2 id="taskDrawerTitle" className="drawer-task-title">
              {task.description}
            </h2>
          </div>
          <ProgressNoteInput key={task.id} task={task} />
          <div className="drawer-narrative drawer-notes">
            <h3 className="drawer-section-title">Progress</h3>
            {task.notes.length === 0 ? (
              <p className="drawer-narrative-empty">
                No progress notes yet. Add one above whenever something moves.
              </p>
            ) : (
              <ol className="task-notes" reversed>
                {/* Newest first, so the latest progress sits right under the input. */}
                {task.notes
                  .map((note, index) => ({ note, index }))
                  .reverse()
                  .map(({ note, index }) => (
                    <li key={index}>
                      <time dateTime={note.at}>{formatNoteTime(note.at)}</time>
                      <p>{note.text}</p>
                    </li>
                  ))}
              </ol>
            )}
          </div>
        </>
      )}
    </Drawer>
  );
}
