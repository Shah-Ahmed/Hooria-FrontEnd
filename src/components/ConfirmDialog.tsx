"use client";

// Our own "Are you sure?" window. It replaces the browser's window.confirm(),
// which shows the page address ("localhost:3000 says ...") and cannot be styled.

import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !busy) onCancel();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <>
      <div className="modal-backdrop fade show" />
      <div
        className="modal fade show d-block"
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmTitle"
        onClick={() => !busy && onCancel()}
      >
        <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h6" id="confirmTitle">{title}</h2>
            </div>
            <div className="modal-body">{message}</div>
            <div className="modal-footer">
              <button className="btn btn-outline-light" onClick={onCancel} disabled={busy}>
                Cancel
              </button>
              <button
                className={`btn ${danger ? "btn-danger" : "btn-primary"}`}
                onClick={onConfirm}
                disabled={busy}
              >
                {busy ? "Please wait..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
