import { useState } from "react";
import { CaptureBar } from "./components/CaptureBar";
import { HorizonTabs } from "./components/HorizonTabs";
import { ProjectDrawer } from "./components/ProjectDrawer";
import { Sidebar } from "./components/Sidebar";
import { TaskList } from "./components/TaskList";
import { Toast } from "./components/Toast";
import { useTaskStore } from "./context/TaskStoreContext";
import { useAuth } from "./hooks/useAuth";
import { HORIZON_LABEL, HORIZON_ORDER } from "./lib/horizon";
import type { Horizon } from "./types";

const TODAY_LABEL = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function App() {
  const [activeHorizon, setActiveHorizon] = useState<Horizon>("today");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const { tasks } = useTaskStore();
  const { signOut } = useAuth();

  const counts = HORIZON_ORDER.reduce(
    (acc, horizon) => {
      acc[horizon] = tasks.filter((task) => task.horizon === horizon && task.state !== "done").length;
      return acc;
    },
    {} as Record<Horizon, number>,
  );

  function handleAdded(horizon: Horizon) {
    setActiveHorizon(horizon);
    setToastMessage(`Added to ${HORIZON_LABEL[horizon]}`);
  }

  function handleMoved(target: Horizon, wasSomeday: boolean) {
    setToastMessage(`${wasSomeday ? "Scheduled for" : "Deferred to"} ${HORIZON_LABEL[target]}`);
  }

  return (
    <div className="app">
      <header className="appbar">
        <div className="brand">
          <span className="brand-mark">Horizon</span>
          <span className="brand-tag">today's list, tomorrow's plan</span>
        </div>
        <div className="appbar-right">
          <time className="today-date">{TODAY_LABEL}</time>
          <button type="button" className="sign-out" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="shell">
        <Sidebar
          onOpenProject={setOpenProjectId}
          onOpenSomeday={() => setActiveHorizon("someday")}
        />
        <main>
          <CaptureBar onAdded={handleAdded} />
          <HorizonTabs active={activeHorizon} counts={counts} onChange={setActiveHorizon} />
          <TaskList horizon={activeHorizon} onOpenProject={setOpenProjectId} onMoved={handleMoved} />
        </main>
      </div>

      <ProjectDrawer projectId={openProjectId} onClose={() => setOpenProjectId(null)} />
      <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
    </div>
  );
}
