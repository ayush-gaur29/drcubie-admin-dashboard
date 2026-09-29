import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type = 'info', message = '', duration = 4000) => {
    const id = Date.now() + Math.random().toString(36).substring(2, 5);
    const newToast = { id, type, message };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((toast) => {
          let Icon = Info;
          if (toast.type === 'success') Icon = CheckCircle2;
          if (toast.type === 'error') Icon = AlertCircle;

          return (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              <Icon
                size={18}
                style={{
                  color:
                    toast.type === 'success'
                      ? 'var(--success)'
                      : toast.type === 'error'
                      ? 'var(--danger)'
                      : 'var(--primary)',
                  flexShrink: 0
                }}
              />
              <span style={{ flex: 1, fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 500 }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                className="btn-ghost"
                style={{ padding: '2px', cursor: 'pointer', border: 'none', background: 'transparent' }}
                aria-label="Dismiss"
              >
                <X size={14} color="var(--text-faint)" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
