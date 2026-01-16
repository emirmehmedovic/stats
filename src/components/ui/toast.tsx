'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  message: string;
  type: ToastType;
  action?: {
    label: string;
    onClick: () => void;
  };
  position?: {
    top: number;
    left: number;
    align: 'left';
  };
};

let toastId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

function notify() {
  listeners.forEach(listener => listener([...toasts]));
}

export function showToast(
  message: string,
  type: ToastType = 'info',
  duration = 5000,
  action?: Toast['action'],
  position?: Toast['position']
) {
  const id = (++toastId).toString();
  const toast: Toast = { id, message, type, action, position };
  
  toasts = [...toasts, toast];
  notify();

  if (duration > 0) {
    setTimeout(() => {
      toasts = toasts.filter(t => t.id !== id);
      notify();
    }, duration);
  }

  return id;
}

export function showConfirmToast(
  message: string,
  onConfirm: () => void,
  label = 'Potvrdi',
  anchorEl?: HTMLElement | null
) {
  let position: Toast['position'] | undefined;
  if (anchorEl && typeof window !== 'undefined') {
    const rect = anchorEl.getBoundingClientRect();
    position = {
      top: rect.top + rect.height / 2,
      left: rect.left - 8,
      align: 'left',
    };
  }
  return showToast(message, 'warning', 6000, { label, onClick: onConfirm }, position);
}

export function removeToast(id: string) {
  toasts = toasts.filter(t => t.id !== id);
  notify();
}

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    listeners.add(listener);
    listener(toasts);

    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  const icons = {
    success: CheckCircle,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-orange-50 border-orange-200 text-orange-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const defaultToasts = currentToasts.filter((toast) => !toast.position);
  const anchoredToasts = currentToasts.filter((toast) => toast.position);

  return (
    <>
      {defaultToasts.length > 0 && (
        <div className="fixed top-24 right-8 z-50 space-y-2">
          {defaultToasts.map((toast) => {
            const Icon = icons[toast.type];
            return (
              <div
                key={toast.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[300px] max-w-md ${styles[toast.type]}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <p className="flex-1 text-sm font-medium">{toast.message}</p>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action?.onClick();
                      removeToast(toast.id);
                    }}
                    className="px-2 py-1 text-xs font-semibold rounded-lg bg-white/70 hover:bg-white border border-current"
                  >
                    {toast.action.label}
                  </button>
                )}
                <button
                  onClick={() => removeToast(toast.id)}
                  className="p-1 hover:opacity-70 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
      {anchoredToasts.map((toast) => {
        const Icon = icons[toast.type];
        const position = toast.position!;
        return (
          <div
            key={toast.id}
            className={`fixed z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg min-w-[260px] max-w-sm ${styles[toast.type]}`}
            style={{
              top: `${position.top}px`,
              left: `${position.left}px`,
              transform: 'translate(-100%, -50%)',
            }}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            {toast.action && (
              <button
                onClick={() => {
                  toast.action?.onClick();
                  removeToast(toast.id);
                }}
                className="px-2 py-1 text-xs font-semibold rounded-lg bg-white/70 hover:bg-white border border-current"
              >
                {toast.action.label}
              </button>
            )}
            <button
              onClick={() => removeToast(toast.id)}
              className="p-1 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </>
  );
}
