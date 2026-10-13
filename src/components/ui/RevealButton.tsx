"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";

/** Show/hide toggle placed inside a password field. */
export function RevealButton({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="text-ink-3 hover:text-ink"
      aria-label={shown ? "Sembunyikan sandi" : "Tampilkan sandi"}
      aria-pressed={shown}
    >
      {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );
}
