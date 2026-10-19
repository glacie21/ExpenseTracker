import React from "react";
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from "lucide-react";

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "error";
  title?: string;
  onClose?: () => void;
}

export function Alert({
  variant = "info",
  title,
  children,
  onClose,
  className = "",
  ...props
}: AlertProps) {
  // A tinted panel and icon mark the kind; the body text stays in ink
  const variantStyles = {
    info: "border-accent bg-accent-soft",
    success: "border-pos bg-pos-soft",
    warning: "border-warn bg-warn-soft",
    error: "border-neg bg-neg-soft",
  };

  const icons = {
    info: <Info className="w-4 h-4 text-accent shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-pos shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-warn shrink-0" />,
    error: <AlertCircle className="w-4 h-4 text-neg shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={`relative flex items-start gap-3 rounded-xl px-4 py-3 text-sm text-ink ${variantStyles[variant]} ${className}`}
      {...props}
    >
      <div className="mt-0.5">{icons[variant]}</div>
      <div className="flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="leading-relaxed text-ink-2">{children}</div>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-0.5 text-ink-3 hover:text-ink"
          aria-label="Tutup pesan"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
