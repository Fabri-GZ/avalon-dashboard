"use client";

export default function Loader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background/70 backdrop-blur-sm z-50">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
        
        <div className="relative w-24 h-24 rounded-full border-4 border-primary/20">
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-primary/60 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1s" }} />
        </div>
      </div>
    </div>
  );
}