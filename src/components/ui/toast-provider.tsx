'use client';

import { VIBE_ANIMATION_SLIDE_IN_RIGHT } from '@/lib/config/vibe-styles';
import { createContext, useContext, useState, useCallback } from 'react';

import { CheckCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastContextType {
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'success') => {
      const id = Math.random().toString(36).substring(7);
      const newToast: Toast = { id, message, type };

      setToasts(prev => [...prev, newToast]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
      }, 3000);
    },
    []
  );

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="vibe-pos-toast">
        {toasts.map(toast => (
          <div
            key={toast.id}
            role="alert"
            aria-live="assertive"
            className={cn(
              `vibe-toast-item ${VIBE_ANIMATION_SLIDE_IN_RIGHT}`,
              toast.type === 'success'
                ? 'vibe-bg-success-dark'
                : toast.type === 'error'
                  ? 'vibe-bg-error-dark'
                  : 'vibe-bg-info-dark'
            )}
          >
            {toast.type === 'success' && (
              <CheckCircle className="vibe-icon-md" />
            )}
            <span className="vibe-text-medium">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="vibe-ml-2 vibe-hover-opacity-80 vibe-transition-opacity"
            >
              <X className="vibe-icon-sm" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
