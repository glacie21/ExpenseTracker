import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      rightIcon,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          <input
            id={inputId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? messageId : undefined}
            className={`h-10 w-full rounded-lg border bg-surface px-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:outline-none focus:border-accent focus:ring-3 focus:ring-accent/15 ${rightIcon ? "pr-10" : ""} ${
              error ? "border-neg" : "border-rule hover:border-ink-3"
            } ${className}`}
            {...props}
          />
          {rightIcon && <div className="absolute right-3 flex items-center">{rightIcon}</div>}
        </div>
        {error ? (
          <p id={messageId} className="text-xs text-neg">
            {error}
          </p>
        ) : helperText ? (
          <p id={messageId} className="text-xs text-ink-3">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
