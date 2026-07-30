import { useState, type FormEvent } from "react";

interface InlineAddFormProps {
  placeholder: string;
  buttonLabel?: string;
  onSubmit: (value: string) => void;
}

export function InlineAddForm({ placeholder, buttonLabel = "Add", onSubmit }: InlineAddFormProps) {
  const [value, setValue] = useState("");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue("");
  }

  return (
    <form className="inline-add" onSubmit={handleSubmit}>
      <input
        type="text"
        className="inline-add-input"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <button type="submit" className="inline-add-submit">
        {buttonLabel}
      </button>
    </form>
  );
}
