"use client";
import { useEffect, useState } from "react";

export default function Loader() {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm z-50">
      <div className="relative">
        {/* Círculo exterior pulsante */}
        <div className="absolute inset-0 rounded-full bg-[#a047ff]/20 animate-ping" />
        
        {/* Círculo intermedio giratorio */}
        <div className="relative w-24 h-24 rounded-full border-4 border-[#a047ff]/20">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-[#a047ff] animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[#a047ff]/60 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
        </div>
      </div>
    </div>
  );
}