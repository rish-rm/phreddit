import { useEffect, useState } from "react";

// Accessible replacement for window.confirm, with an optional note field
// (used for moderation resolution notes).
export default function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  danger = false,
  showNote = false,
  noteLabel = "Optional note",
  onConfirm,
  onCancel
}) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    function onKeyDown(event) {
      if (event.key === "Escape") onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h3>{title}</h3>
        {body && <p>{body}</p>}
        {showNote && (
          <label className="dialog-note">
            {noteLabel}
            <textarea
              value={note}
              maxLength={300}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
        )}
        <div className="action-row">
          <button
            type="button"
            className={danger ? "danger" : ""}
            onClick={() => onConfirm(note.trim())}
          >
            {confirmLabel}
          </button>
          <button type="button" onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
