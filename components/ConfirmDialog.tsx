"use client";

import Modal from "@/components/Modal";
import Button from "@/components/Button";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  loading = false,
  onClose,
  onConfirm,
}: Props) {
  return (
    <Modal open={open} title={title} onClose={onClose}>
      <p className="confirm-message">{message}</p>
      <div className="form-actions">
        <Button variant="secondary" onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          loading={loading}
          onClick={onConfirm}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
