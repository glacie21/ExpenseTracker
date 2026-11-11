import React from "react";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "danger" | "neutral";
}

const VARIANT_STYLES = {
  success: "bg-pos-soft text-pos",
  danger: "bg-neg-soft text-neg",
  neutral: "bg-sunken text-ink-2",
};

/** A small rounded label, e.g. a transaction type. */
export function Badge({ variant = "neutral", children, className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-tight ${VARIANT_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
