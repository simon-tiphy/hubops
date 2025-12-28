import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check } from "lucide-react";
import { clsx } from "clsx";

const CustomSelect = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon: Icon,
  className,
  buttonClassName,
  optionsClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
  };

  const handleMouseEnter = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const handleMouseLeave = () => {
    closeTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // 150ms grace period to cross the gap
  };

  return (
    <div
      ref={containerRef}
      className={clsx("relative w-full min-w-[140px]", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx(
          "w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-all duration-200",
          !buttonClassName && "bg-white/5 border hover:bg-white/10",
          isOpen
            ? "border-primary ring-1 ring-primary/50 text-white"
            : !buttonClassName &&
                "border-white/10 text-zinc-300 hover:text-white",
          buttonClassName
        )}
        type="button"
      >
        <div className="flex items-center gap-2 truncate">
          {Icon && <Icon size={16} className="text-zinc-500" />}
          <span className={!value ? "text-zinc-500" : ""}>
            {value || placeholder}
          </span>
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={14} className="text-zinc-500" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={clsx(
              "absolute z-100 w-full mt-2 bg-surface border border-white/10 rounded-xl shadow-2xl overflow-hidden py-1 max-h-60 overflow-y-auto custom-scrollbar",
              optionsClassName
            )}
          >
            {options.map((option) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                className={clsx(
                  "flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors",
                  value === option
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                )}
              >
                {option}
                {value === option && (
                  <Check size={14} className="text-primary" />
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomSelect;
