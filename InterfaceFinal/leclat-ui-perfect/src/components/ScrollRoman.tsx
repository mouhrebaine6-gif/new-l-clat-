import { useEffect, useState } from "react";
import { toRoman } from "@/lib/porteur";

export const ScrollRoman = () => {
  const [percent, setPercent] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0;
      setPercent(p);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // 0..10 → I..X
  const step = Math.max(1, Math.min(10, Math.round((percent / 100) * 10) || 1));

  return (
    <div className="fixed right-3 top-1/2 -translate-y-1/2 z-30 hidden md:flex flex-col items-center gap-2 pointer-events-none">
      <span className="font-mono-eclat text-[8px] tracking-rituel uppercase text-voile-dim/50">
        scroll
      </span>
      <div className="relative h-40 w-px bg-border">
        <div
          className="absolute top-0 left-0 right-0 bg-laiton"
          style={{ height: `${percent}%`, transition: "height 200ms" }}
        />
      </div>
      <span className="font-serif-rituel italic text-laiton text-base">{toRoman(step)}</span>
    </div>
  );
};
