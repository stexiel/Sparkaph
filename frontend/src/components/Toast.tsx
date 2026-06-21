import React, { useEffect } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";
import type { ToastProps } from "../types/toast";
import { API_URL, APPS_URL, WS_URL } from '../config';
export type { ToastProps };

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  message,
  duration = 3000,
  onClose,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onClose]);

  const icons = {
    success: <CheckCircle size={20} />,
    error: <AlertCircle size={20} />,
    info: <Info size={20} />,
    warning: <AlertTriangle size={20} />,
  };

  const colors = {
    success: "from-[var(--color-ios-green)] to-[var(--color-ios-teal)]",
    error: "from-[var(--color-ios-red)] to-[var(--color-ios-pink)]",
    info: "from-[var(--color-ios-blue)] to-[var(--color-ios-indigo)]",
    warning: "from-[var(--color-ios-orange)] to-[var(--color-ios-yellow)]",
  };

  return (
    <div className="glass-strong rounded-2xl p-4 shadow-elevated flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in">
      <div
        className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors[type]} flex items-center justify-center text-white flex-shrink-0`}
      >
        {icons[type]}
      </div>
      <p className="flex-1 text-sm font-medium text-[var(--color-text)]">
        {message}
      </p>
      <button
        onClick={() => onClose(id)}
        className="text-[var(--color-tertiary-text)] hover:text-[var(--color-text)] transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
};

export default Toast;
