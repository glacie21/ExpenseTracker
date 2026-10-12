import React from "react";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "primary" | "secondary" | "success" | "warning" | "danger" | "neutral";
  size?: "sm" | "md";
}

export function Badge({
  variant = "neutral",
  size = "sm",
  children,
  className = "",
  ...props
}: BadgeProps) {
  const variantStyles = {
    primary: "bg-accent-soft text-accent",
    secondary: "bg-sunken text-ink-2",
    success: "bg-pos-soft text-pos",
    warning: "bg-warn-soft text-warn",
    danger: "bg-neg-soft text-neg",
    neutral: "bg-sunken text-ink-2",
  };

  const sizeStyles = {
    sm: "px-1.5 py-0.5 text-[11px]",
    md: "px-2 py-0.5 text-xs",
  };

  return (
    <span
      className={`inline-flex items-center rounded-sm font-medium leading-tight ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
