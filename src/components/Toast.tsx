import { useEffect, useRef } from "react";

interface ToastProps {
  message: string | null;
  onDone: () => void;
}

/**
 * Visibility is driven entirely by CSS animation (see `.toast` in
 * index.css), not JS-toggled state — there's nothing here for an effect to
 * set. `onDone` is read through a ref, updated in its own effect rather than
 * during render, so the dismiss timer isn't tied to a fresh closure every
 * time App re-renders (which happens on every task-list change).
 */
export function Toast({ message, onDone }: ToastProps) {
  const onDoneRef = useRef(onDone);
  useEffect(() => {
    onDoneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => onDoneRef.current(), 2000);
    return () => clearTimeout(timer);
  }, [message]);

  if (!message) return null;
  return (
    <div className="toast" key={message}>
      {message}
    </div>
  );
}
