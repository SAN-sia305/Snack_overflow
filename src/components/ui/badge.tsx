import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "stocked"
    | "running_low"
    | "gone"
    | "admin"
    | "member"
    | "new";
  dot?: boolean;
}

export function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default:
      "bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-transparent",
    secondary:
      "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-200 border-transparent",
    outline:
      "border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 bg-transparent",
    stocked:
      "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800/50",
    running_low:
      "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50",
    gone:
      "bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800/50",
    admin:
      "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/50",
    member:
      "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/50",
    new:
      "bg-amber-500 text-white font-semibold shadow-sm shadow-amber-500/20 border-transparent",
  };

  const dots = {
    stocked: "bg-emerald-500",
    running_low: "bg-amber-500",
    gone: "bg-rose-500",
    default: "bg-orange-500",
    secondary: "bg-neutral-500",
    outline: "bg-neutral-400",
    admin: "bg-purple-500",
    member: "bg-blue-500",
    new: "bg-amber-300",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border transition-colors select-none",
        variants[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", dots[variant] || "bg-current")}
          aria-hidden="true"
        />
      )}
      {children}
    </div>
  );
}

