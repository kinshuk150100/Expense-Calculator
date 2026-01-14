'use client';

import { Fragment } from 'react';
import Button from './Button';

interface ConfirmModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Title of the modal */
  title: string;
  /** Message to display */
  message: string;
  /** Label for confirm button */
  confirmLabel?: string;
  /** Label for cancel button */
  cancelLabel?: string;
  /** Variant for confirm button */
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  /** Callback when user confirms */
  onConfirm: () => void;
  /** Callback when user cancels */
  onCancel: () => void;
  /** Whether the confirm action is in progress */
  isLoading?: boolean;
}

/**
 * ConfirmModal Component
 * 
 * A reusable confirmation modal for delete actions and other confirmations
 */
export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Title */}
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

          {/* Message */}
          <p className="text-gray-600">{message}</p>

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4">
            <Button
              variant="secondary"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
            <Button
              variant={confirmVariant}
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </div>
        </div>
      </div>
    </Fragment>
  );
}

