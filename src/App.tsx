import { useEffect, useState } from "react";
import { CaptureBar } from "./components/CaptureBar";
import { CommitmentToggle } from "./components/CommitmentToggle";
import { HorizonTabs } from "./components/HorizonTabs";
import { Logo } from "./components/Logo";
import { ProjectDrawer } from "./components/ProjectDrawer";
import { Sidebar } from "./components/Sidebar";
import { TaskList } from "./components/TaskList";
import { Toast } from "./components/Toast";
import { useTaskStore } from "./context/TaskStoreContext";
import { useAuth } from "./hooks/useAuth";
import { useNarrativeMaintenance } from "./hooks/useNarrativeMaintenance";
import { HORIZON_LABEL, HORIZON_ORDER } from "./lib/horizon";
import type { Commitment, Horizon } from "./types";

const TODAY_LABEL = new Date().toLocaleDateString(undefined, {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

export default function App() {
  const [activeHorizon, setActiveHorizon] = useState<Horizon>("today");
  const [activeCommitment, setActiveCommitment] = useState<Commitment>("personal");
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const { tasks } = useTaskStore();
  const { signOut, isDebugEligible } = useAuth();
  const narrativeMaintenance = useNarrativeMaintenance();

  // Debug mode has to be explicitly entered even for the one eligible
  // account (see design-principles.md) — Ctrl+Alt+Shift+D toggles it,
  // deliberately avoiding Ctrl+Shift+D since Chrome already binds that to
  // "bookmark all tabs".
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.altKey && event.shiftKey && event.key.toLowerCase() === "d") {
        if (!isDebugEligible) return;
        event.preventDefault();
        setDebugMode((value) => !value);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDebugEligible]);

  const counts = HORIZON_ORDER.reduce(
    (acc, horizon) => {
      acc[horizon] = tasks.filter(
        (task) =>
          task.horizon === horizon && task.state !== "done" && task.commitment === activeCommitment,
      ).length;
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
          <Logo />
          <span className="brand-mark">Horizon</span>
          <span className="brand-tag">today's list, tomorrow's plan</span>
        </div>
        <div className="appbar-right">
          <CommitmentToggle value={activeCommitment} onChange={setActiveCommitment} />
          <time className="today-date">{TODAY_LABEL}</time>
          <button type="button" className="sign-out" onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>

      <div className="shell">
        <Sidebar
          activeCommitment={activeCommitment}
          onOpenProject={setOpenProjectId}
          onOpenSomeday={() => setActiveHorizon("someday")}
        />
        <main>
          <CaptureBar activeCommitment={activeCommitment} onAdded={handleAdded} />
          <HorizonTabs active={activeHorizon} counts={counts} onChange={setActiveHorizon} />
          <TaskList
            horizon={activeHorizon}
            commitment={activeCommitment}
            onOpenProject={setOpenProjectId}
            onMoved={handleMoved}
          />
        </main>
      </div>

      <ProjectDrawer
        projectId={openProjectId}
        onClose={() => setOpenProjectId(null)}
        debugEnabled={debugMode && isDebugEligible}
        narrativeMaintenance={narrativeMaintenance}
      />
      <Toast message={toastMessage} onDone={() => setToastMessage(null)} />
    </div>
  );
}
