import { useEffect, useRef, type ReactNode } from "react";

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Id of the element (usually the heading) that names this drawer. */
  labelledBy: string;
  closeLabel: string;
  /** Extra class for drawer-specific styling on top of the shared `.drawer` chrome. */
  className?: string;
  children: ReactNode;
}

/**
 * The slide-in panel shared by the project and task drawers: scrim, close
 * button, Escape to close, and focus moved to the close button on open.
 * Always rendered (just translated off-screen when closed) so the slide
 * transition has something to animate.
 */
export function Drawer({
  isOpen,
  onClose,
  labelledBy,
  closeLabel,
  className,
  children,
}: DrawerProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen) closeButtonRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && isOpen) onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      <div
        className={`drawer-scrim${isOpen ? " open" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`drawer${className ? ` ${className}` : ""}${isOpen ? " open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-hidden={!isOpen}
        aria-labelledby={labelledBy}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="drawer-close"
          aria-label={closeLabel}
          onClick={onClose}
        >
          &times;
        </button>
        {children}
      </aside>
    </>
  );
}
