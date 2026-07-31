import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";

interface ConfirmRequest {
  message: string;
  onConfirm: () => void;
}

type RequestConfirm = (message: string, onConfirm: () => void) => void;

const ConfirmContext = createContext<RequestConfirm | null>(null);

/**
 * A single global Yes/No confirmation modal, requested via `useConfirm()`
 * from anywhere (delete actions on Tasks, Projects, Areas) rather than each
 * call site owning its own dialog markup. Yes is the default: it's
 * autofocused on open, and Enter confirms regardless of which element in
 * the dialog currently has focus — see design/design-principles.md's
 * "Deletion is confirmed, and Yes really is the default" entry for why
 * that's a deliberate choice here, not a usual "make Cancel the safe
 * default" pattern.
 */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState<ConfirmRequest | null>(null);
  const yesRef = useRef<HTMLButtonElement>(null);

  function requestConfirm(message: string, onConfirm: () => void) {
    setPending({ message, onConfirm });
  }

  function confirm() {
    pending?.onConfirm();
    setPending(null);
  }

  function cancel() {
    setPending(null);
  }

  useEffect(() => {
    if (pending) yesRef.current?.focus();
  }, [pending]);

  useEffect(() => {
    if (!pending) return;
    const current = pending;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setPending(null);
      } else if (event.key === "Enter") {
        event.preventDefault();
        current.onConfirm();
        setPending(null);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [pending]);

  return (
    <ConfirmContext.Provider value={requestConfirm}>
      {children}
      <div
        className={`confirm-scrim${pending ? " open" : ""}`}
        onClick={cancel}
        aria-hidden="true"
      />
      {pending && (
        <div
          className="confirm-dialog"
          role="alertdialog"
          aria-modal="true"
          aria-describedby="confirmMessage"
        >
          <p id="confirmMessage">{pending.message}</p>
          <div className="confirm-actions">
            <button type="button" className="confirm-no" onClick={cancel}>
              No
            </button>
            <button type="button" className="confirm-yes" ref={yesRef} onClick={confirm}>
              Yes
            </button>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm(): RequestConfirm {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm must be used within a ConfirmProvider");
  return ctx;
}
