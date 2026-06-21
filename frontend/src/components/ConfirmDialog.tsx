import React from "react";
import { AlertTriangle, X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  type?: "danger" | "warning" | "info";
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  type = "warning",
}) => {
  const colors = {
    danger: "text-[var(--color-ios-red)]",
    warning: "text-[var(--color-ios-orange)]",
    info: "text-[var(--color-ios-blue)]",
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="glass-strong p-6 rounded-3xl max-w-md w-full border border-[var(--color-separator)]/30 shadow-elevated animate-scale-in">
        <div className="flex items-start gap-4 mb-4">
          <div className={`${colors[type]}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--color-text)] mb-2">
              {title}
            </h3>
            <p className="text-sm text-[var(--color-secondary-text)]">
              {message}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 glass rounded-2xl text-[var(--color-text)] text-sm font-semibold hover:shadow-card transition-all border border-[var(--color-separator)]/30"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 px-4 py-2.5 rounded-2xl text-white text-sm font-semibold hover:shadow-card transition-all ${
              type === "danger"
                ? "bg-[var(--color-ios-red)] hover:bg-[var(--color-ios-red)]/90"
                : type === "warning"
                ? "bg-[var(--color-ios-orange)] hover:bg-[var(--color-ios-orange)]/90"
                : "bg-[var(--color-ios-blue)] hover:bg-[var(--color-ios-blue)]/90"
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
