import { useEffect, useState, useCallback } from "react";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastData {
  id: string;
  message: string;
  type: ToastType;
}

const typeStyles: Record<ToastType, string> = {
  success: "bg-emerald-50 border-emerald-200 text-emerald-800",
  error: "bg-red-50 border-red-200 text-red-800",
  info: "bg-blue-50 border-blue-200 text-blue-800",
  warning: "bg-amber-50 border-amber-200 text-amber-800",
};

const typeIcons: Record<ToastType, string> = {
  success: "✓",
  error: "✕",
  info: "ℹ",
  warning: "⚠",
};

// Singleton store for toasts
let toastListeners: Array<(toasts: ToastData[]) => void> = [];
let toastsQueue: ToastData[] = [];
let toastCounter = 0;

export function showToast(message: string, type: ToastType = "info") {
  const id = `toast-${++toastCounter}`;
  toastsQueue = [...toastsQueue, { id, message, type }];
  toastListeners.forEach((fn) => fn(toastsQueue));

  // Auto-dismiss after 4 seconds
  setTimeout(() => {
    toastsQueue = toastsQueue.filter((t) => t.id !== id);
    toastListeners.forEach((fn) => fn(toastsQueue));
  }, 4000);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    toastListeners.push(setToasts);
    return () => {
      toastListeners = toastListeners.filter((fn) => fn !== setToasts);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    toastsQueue = toastsQueue.filter((t) => t.id !== id);
    toastListeners.forEach((fn) => fn(toastsQueue));
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg transition-all animate-in slide-in-from-right ${typeStyles[toast.type]}`}
        >
          <span className="text-lg font-bold">{typeIcons[toast.type]}</span>
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="ml-2 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
