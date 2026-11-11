import React from "react";

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  name: string;
  size?: "sm" | "lg";
}

const SIZE_STYLES = {
  sm: "w-8 h-8 text-xs",
  lg: "w-12 h-12 text-base",
};

function initials(fullName: string): string {
  if (!fullName) return "?";
  const parts = fullName.trim().split(" ");
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** The user's initials in a round tile. */
export function Avatar({ name, size = "sm", className = "", ...props }: AvatarProps) {
  return (
    <div
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-accent-soft font-display font-semibold text-accent select-none ${SIZE_STYLES[size]} ${className}`}
      {...props}
    >
      <span>{initials(name)}</span>
    </div>
  );
}
