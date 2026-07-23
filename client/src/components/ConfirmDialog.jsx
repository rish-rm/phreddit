import { useEffect, useId, useRef, useState } from "react";

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
  const dialogRef = useRef(null);
  const cancelRef = useRef(onCancel);
  const titleId = useId();

  useEffect(() => {
    cancelRef.current = onCancel;
  }, [onCancel]);

  useEffect(() => {
    if (open) setNote("");
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = dialog?.querySelectorAll(
      "button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), a[href]"
    );
    focusable?.[0]?.focus();

    function onKeyDown(event) {
      if (event.key === "Escape") {
        cancelRef.current();
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocused?.focus?.();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="dialog-backdrop" onClick={onCancel}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 id={titleId}>{title}</h3>
        {body && <p>{body}</p>}
        {showNote && (
          <label className="dialog-note">
            {noteLabel}
            <textarea
              value={note}
              maxLength={400}
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
