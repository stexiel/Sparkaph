import { useState, useCallback } from "react";
import type { ToastProps } from "../types/toast";
import { API_URL, APPS_URL, WS_URL } from '../config';
export const useToast = () => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = useCallback(
    (type: ToastProps["type"], message: string, duration?: number) => {
      const id = Math.random().toString(36).substring(7);
      const newToast: ToastProps = {
        id,
        type,
        message,
        duration,
        onClose: removeToast,
      };
      setToasts((prev) => [...prev, newToast]);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const success = useCallback(
    (message: string, duration?: number) => {
      addToast("success", message, duration);
    },
    [addToast],
  );

  const error = useCallback(
    (message: string, duration?: number) => {
      addToast("error", message, duration);
    },
    [addToast],
  );

  const info = useCallback(
    (message: string, duration?: number) => {
      addToast("info", message, duration);
    },
    [addToast],
  );

  const warning = useCallback(
    (message: string, duration?: number) => {
      addToast("warning", message, duration);
    },
    [addToast],
  );

  return {
    toasts,
    success,
    error,
    info,
    warning,
    removeToast,
  };
};
