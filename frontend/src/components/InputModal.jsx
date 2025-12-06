import React, { useState } from "react";
import { X, Clock } from "lucide-react";

const InputModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  message,
  placeholder = "Enter value...",
  confirmText = "Submit",
}) => {
  const [value, setValue] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.trim()) {
      onSubmit(value);
      setValue("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-highlight border border-white/10 rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-zinc-300 mb-4 leading-relaxed text-sm">{message}</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            className="input-premium w-full mb-6"
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoFocus
          />

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-zinc-300 hover:text-white hover:bg-white/5 rounded-xl transition-all font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 rounded-xl font-medium text-white shadow-lg transition-all active:scale-95 bg-primary hover:bg-primary-hover shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InputModal;
