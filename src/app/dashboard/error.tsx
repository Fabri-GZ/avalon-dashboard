"use client";

import { useEffect } from "react";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[dashboard/error.tsx] crash", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div style={{ padding: 32, fontFamily: "monospace", maxWidth: 720, margin: "40px auto" }}>
      <h2 style={{ fontSize: 20, marginBottom: 12 }}>Error en el dashboard</h2>
      <p style={{ marginBottom: 8 }}>
        <strong>Mensaje:</strong> {error.message || "(oculto en producción)"}
      </p>
      <p style={{ marginBottom: 16, fontSize: 12, opacity: 0.7 }}>
        <strong>Digest:</strong> {error.digest ?? "(none)"}
      </p>
      <button
        onClick={reset}
        style={{
          padding: "8px 16px",
          background: "var(--primary, #6366f1)",
          color: "white",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
        }}
      >
        Reintentar
      </button>
      <p style={{ marginTop: 24, fontSize: 11, opacity: 0.5 }}>
        Si esto persiste, copia el Digest y busca en Vercel → Logs.
      </p>
    </div>
  );
}
