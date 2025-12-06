import React, { createContext, useContext, useState, useCallback } from "react";
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from "lucide-react";

const ToastContext = createContext();

export const useToast = () => useContext(ToastContext);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`
                            pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg backdrop-blur-md border animate-in slide-in-from-right-full fade-in duration-300
                            ${
                              toast.type === "success"
                                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                                : ""
                            }
                            ${
                              toast.type === "error"
                                ? "bg-red-500/10 border-red-500/20 text-red-400"
                                : ""
                            }
                            ${
                              toast.type === "warning"
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                : ""
                            }
                            ${
                              toast.type === "info"
                                ? "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                : ""
                            }
                        `}
          >
            {toast.type === "success" && <CheckCircle className="w-5 h-5" />}
            {toast.type === "error" && <AlertCircle className="w-5 h-5" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5" />}
            {toast.type === "info" && <Info className="w-5 h-5" />}

            <span className="text-sm font-medium">{toast.message}</span>

            <button
              onClick={() => removeToast(toast.id)}
              className="ml-2 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
