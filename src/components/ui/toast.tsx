"use client";

import { useToastStore, ToastItem } from "@/store/useToastStore";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle,
  WarningCircle,
  XCircle,
  Info,
  Warning,
  X,
} from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none"
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastCard key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" weight="fill" />,
    error: <XCircle className="w-5 h-5 text-rose-500 shrink-0" weight="fill" />,
    conflict: <WarningCircle className="w-5 h-5 text-amber-500 shrink-0" weight="fill" />,
    warning: <Warning className="w-5 h-5 text-amber-500 shrink-0" weight="fill" />,
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" weight="fill" />,
  };

  const borders = {
    success: "border-emerald-500/20 bg-emerald-50/90 dark:bg-emerald-950/40 dark:border-emerald-500/30",
    error: "border-rose-500/20 bg-rose-50/90 dark:bg-rose-950/40 dark:border-rose-500/30",
    conflict: "border-amber-500/25 bg-amber-50/95 dark:bg-amber-950/40 dark:border-amber-500/30",
    warning: "border-amber-500/20 bg-amber-50/90 dark:bg-amber-950/40 dark:border-amber-500/30",
    info: "border-blue-500/20 bg-blue-50/90 dark:bg-blue-950/40 dark:border-blue-500/30",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "pointer-events-auto p-4 rounded-xl border shadow-lg backdrop-blur-md flex items-start gap-3",
        borders[toast.type]
      )}
      role="alert"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5 leading-relaxed">
            {toast.message}
          </p>
        )}
      </div>
      <button
        onClick={() => onDismiss(toast.id)}
        className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
        aria-label="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

