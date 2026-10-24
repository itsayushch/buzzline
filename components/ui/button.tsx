import React from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-amber-500 hover:bg-amber-600 text-white shadow-xs hover:shadow-sm font-semibold active:scale-[0.98]",
  secondary:
    "bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium active:scale-[0.98]",
  outline:
    "border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium active:scale-[0.98]",
  ghost:
    "hover:bg-slate-100 text-slate-600 font-medium active:scale-[0.98]",
  danger:
    "bg-rose-600 hover:bg-rose-700 text-white shadow-xs font-semibold active:scale-[0.98]",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
  md: "px-4 py-2 text-sm rounded-xl gap-2",
  lg: "px-5 py-2.5 text-base rounded-xl gap-2.5",
  icon: "h-9 w-9 p-0 rounded-xl justify-center items-center",
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:pointer-events-none select-none",
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
