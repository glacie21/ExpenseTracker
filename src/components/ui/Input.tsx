import React from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      containerClassName = "",
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const messageId = `${inputId}-message`;

    return (
      <div className={`flex flex-col gap-1.5 ${containerClassName}`}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink-2">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <div className="absolute left-3 flex items-center pointer-events-none text-ink-3">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || helperText ? messageId : undefined}
            className={`h-10 w-full rounded-sm border bg-surface px-3 text-sm text-ink placeholder:text-ink-3 transition-colors focus:outline-none focus:border-ink ${
              leftIcon ? "pl-9" : ""
            } ${rightIcon ? "pr-10" : ""} ${
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
