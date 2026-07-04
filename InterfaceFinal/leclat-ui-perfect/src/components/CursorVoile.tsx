import { useEffect, useState } from "react";

// Curseur lumineux (desktop only) — un halo doux qui suit la souris.
export const CursorVoile = () => {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(pointer: coarse)").matches) return; // skip mobile/touch
    const move = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  if (!pos) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed z-[60] mix-blend-screen transition-transform duration-500 ease-out"
      style={{
        left: pos.x - 120,
        top: pos.y - 120,
        width: 240,
        height: 240,
        background: "radial-gradient(circle, hsl(36 38% 54% / 0.18), transparent 60%)",
      }}
    />
  );
};
