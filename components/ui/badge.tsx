import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant =
  | "available"
  | "busy"
  | "full"
  | "waiting"
  | "called"
  | "pending"
  | "confirmed"
  | "neutral"
  | "primary";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  pulse?: boolean;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, { container: string; dot: string }> = {
  available: {
    container: "bg-emerald-50 text-emerald-800 border-emerald-200",
    dot: "bg-emerald-500",
  },
  busy: {
    container: "bg-amber-50 text-amber-800 border-amber-200",
    dot: "bg-amber-500",
  },
  full: {
    container: "bg-rose-50 text-rose-800 border-rose-200",
    dot: "bg-rose-500",
  },
  waiting: {
    container: "bg-amber-50 text-amber-900 border-amber-300",
    dot: "bg-amber-500",
  },
  called: {
    container: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
  },
  pending: {
    container: "bg-amber-50 text-amber-900 border-amber-300",
    dot: "bg-amber-500",
  },
  confirmed: {
    container: "bg-emerald-50 text-emerald-800 border-emerald-300",
    dot: "bg-emerald-500",
  },
  neutral: {
    container: "bg-slate-100 text-slate-700 border-slate-200",
    dot: "bg-slate-400",
  },
  primary: {
    container: "bg-amber-50 text-amber-900 border-amber-200",
    dot: "bg-amber-500",
  },
};

export function Badge({
  variant = "neutral",
  pulse = false,
  className,
  children,
  ...props
}: BadgeProps) {
  const styles = variantStyles[variant] || variantStyles.neutral;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide border transition-colors",
        styles.container,
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full shrink-0",
          styles.dot,
          pulse && "animate-pulse"
        )}
      />
      {children}
    </span>
  );
}
