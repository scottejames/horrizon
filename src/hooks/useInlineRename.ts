import { useEffect, useState, type KeyboardEvent, type RefObject } from "react";

/**
 * Shared "click a pencil, the label becomes a text box, Enter saves"
 * behavior for Task descriptions, Project names, and Area names — the
 * interaction is identical in all three; only the surrounding markup
 * differs per caller.
 *
 * The input's ref is supplied by the caller (not returned from here):
 * eslint's `react-hooks/refs` rule treats an entire returned object as
 * ref-tainted the moment any one field is a ref, and then flags every
 * other field read during render — even unrelated ones like `.draft`.
 * Keeping the ref out of this hook's return value avoids that.
 */
export function useInlineRename(
  value: string,
  onCommit: (next: string) => void,
  inputRef: RefObject<HTMLInputElement | null>,
) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, inputRef]);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function commit() {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) onCommit(trimmed);
    setIsEditing(false);
  }

  function cancel() {
    setIsEditing(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  }

  return { isEditing, draft, setDraft, startEditing, commit, handleKeyDown };
}
