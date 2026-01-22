import { PropsWithChildren, useEffect, useRef } from "react";

type SpotlightHeroProps = PropsWithChildren<{
  className?: string;
}>;

/**
 * Signature moment: a subtle, token-driven “spotlight” field that follows the pointer.
 * Uses CSS vars (no hard-coded colors) and respects reduced-motion.
 */
export function SpotlightHero({ className, children }: SpotlightHeroProps) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    const onMove = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty("--spotlight-x", `${Math.max(0, Math.min(100, x))}%`);
      el.style.setProperty("--spotlight-y", `${Math.max(0, Math.min(100, y))}%`);
    };

    el.addEventListener("pointermove", onMove, { passive: true });
    return () => el.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
