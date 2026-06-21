import React from "react";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

interface CustomAlertProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
}

const CustomAlert: React.FC<CustomAlertProps> = ({ message, type = "info", onClose }) => {
  const icons = {
    success: <CheckCircle size={24} className="text-[var(--color-ios-green)]" />,
    error: <AlertCircle size={24} className="text-[var(--color-ios-red)]" />,
    info: <Info size={24} className="text-[var(--color-ios-blue)]" />,
  };

  const colors = {
    success: "border-[var(--color-ios-green)]/30 bg-[var(--color-ios-green)]/10",
    error: "border-[var(--color-ios-red)]/30 bg-[var(--color-ios-red)]/10",
    info: "border-[var(--color-ios-blue)]/30 bg-[var(--color-ios-blue)]/10",
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-slide-down">
      <div className={`backdrop-blur-[60px] saturate-[180%] border-2 ${colors[type]} rounded-2xl p-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)] min-w-[300px] max-w-[500px]`}>
        <div className="flex items-center gap-3">
          {icons[type]}
          <p className="flex-1 text-sm font-medium text-[var(--color-text)]">{message}</p>
          <button
            onClick={onClose}
            className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomAlert;
