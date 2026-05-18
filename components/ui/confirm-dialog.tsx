"use client";

import { Modal } from "./modal";
import { Button } from "./button";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  loading?: boolean;
};

export function ConfirmDialog({
  open, onClose, onConfirm, title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm", cancelLabel = "Cancel",
  variant = "danger", loading
}: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} description={message} size="sm">
      <div className="mt-6 flex gap-3">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          className="flex-1"
          variant={variant === "danger" ? "destructive" : "default"}
          onClick={onConfirm}
          disabled={loading}
        >
          {loading ? "Processing..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
