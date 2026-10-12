"use client"; // Error boundaries must be Client Components

import { useEffect } from "react";

// Replaces the root layout when it fails, so it cannot rely on globals.css
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="id">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          fontFamily: "Georgia, serif",
          background: "#f4f1ea",
          color: "#1c1b18",
          textAlign: "center",
          padding: 16,
        }}
      >
        <title>Terjadi kesalahan - Expense Tracker</title>
        <h1 style={{ fontSize: 20, margin: 0 }}>Terjadi kesalahan</h1>
        <p style={{ margin: 0, opacity: 0.75 }}>Aplikasi gagal dimuat. Silakan coba lagi.</p>
        <button
          type="button"
          onClick={() => retry()}
          style={{
            padding: "8px 16px",
            borderRadius: 4,
            border: "none",
            fontSize: 14,
            background: "#1c1b18",
            color: "#fbfaf7",
            cursor: "pointer",
          }}
        >
          Coba Lagi
        </button>
      </body>
    </html>
  );
}
