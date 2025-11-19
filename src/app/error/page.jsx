"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function ErrorContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("message") || "Ha ocurrido un error";

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#2b2b2b]">
      <div className="bg-black p-8 rounded-xl border border-red-500/20">
        <h1 className="text-2xl font-bold text-red-500 mb-4">Error</h1>
        <p className="text-white">{error}</p>
        <button
          onClick={() => window.location.href = "/login"}
          className="mt-4 bg-[#A047FF] hover:bg-[#8c3de6] text-white px-6 py-2 rounded-lg"
        >
          Volver al login
        </button>
      </div>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <ErrorContent />
    </Suspense>
  );
}