import { useEffect } from "react";
import type { RefObject } from "react";

export function useZrPageEffects(rootRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const canHover = window.matchMedia("(hover: hover)").matches;

    const revealElements = Array.from(root.querySelectorAll<HTMLElement>("[data-zr-reveal]"));
    let revealObserver: IntersectionObserver | null = null;

    if (!prefersReducedMotion && "IntersectionObserver" in window) {
      revealObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              revealObserver?.unobserve(entry.target);
            }
          });
        },
        {
          threshold: 0.12,
          rootMargin: "0px 0px -48px 0px",
        },
      );
      revealElements.forEach((element) => revealObserver?.observe(element));
    } else {
      revealElements.forEach((element) => element.classList.add("is-visible"));
    }

    let spotlightFrame = 0;
    let spotlightX = 50;
    let spotlightY = 28;

    const flushSpotlight = () => {
      spotlightFrame = 0;
      root.style.setProperty("--spotlight-x", `${spotlightX.toFixed(2)}%`);
      root.style.setProperty("--spotlight-y", `${spotlightY.toFixed(2)}%`);
    };

    const onWindowPointerMove = (event: PointerEvent) => {
      spotlightX = (event.clientX / window.innerWidth) * 100;
      spotlightY = (event.clientY / window.innerHeight) * 100;
      if (!spotlightFrame) {
        spotlightFrame = window.requestAnimationFrame(flushSpotlight);
      }
    };

    let activeTilt: HTMLElement | null = null;
    let tiltFrame = 0;
    let tiltX = 0;
    let tiltY = 0;

    const resetTilt = (element: HTMLElement | null) => {
      if (!element) return;
      element.style.transform = "";
      element.style.willChange = "";
      element.style.setProperty("--zr-glow-opacity", "0");
    };

    const flushTilt = () => {
      tiltFrame = 0;
      if (!activeTilt) return;

      const bounds = activeTilt.getBoundingClientRect();
      if (bounds.width <= 0 || bounds.height <= 0) return;

      const x = Math.min(1, Math.max(0, (tiltX - bounds.left) / bounds.width));
      const y = Math.min(1, Math.max(0, (tiltY - bounds.top) / bounds.height));
      const rotateY = (x - 0.5) * 7;
      const rotateX = (0.5 - y) * 6;

      activeTilt.style.transform =
        `perspective(900px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg) translateY(-3px)`;
      activeTilt.style.setProperty("--zr-glow-x", `${Math.round(x * 100)}%`);
      activeTilt.style.setProperty("--zr-glow-y", `${Math.round(y * 100)}%`);
      activeTilt.style.setProperty("--zr-glow-opacity", "1");
    };

    const onRootPointerMove = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      const candidate = target?.closest<HTMLElement>("[data-zr-tilt]") ?? null;

      if (candidate !== activeTilt) {
        resetTilt(activeTilt);
        activeTilt = candidate;
        if (activeTilt) {
          activeTilt.style.willChange = "transform";
        }
      }

      if (!activeTilt) return;
      tiltX = event.clientX;
      tiltY = event.clientY;
      if (!tiltFrame) {
        tiltFrame = window.requestAnimationFrame(flushTilt);
      }
    };

    const onRootPointerLeave = () => {
      if (tiltFrame) {
        window.cancelAnimationFrame(tiltFrame);
        tiltFrame = 0;
      }
      resetTilt(activeTilt);
      activeTilt = null;
    };

    if (!prefersReducedMotion && canHover) {
      window.addEventListener("pointermove", onWindowPointerMove, { passive: true });
      root.addEventListener("pointermove", onRootPointerMove, { passive: true });
      root.addEventListener("pointerleave", onRootPointerLeave, { passive: true });
    }

    return () => {
      revealObserver?.disconnect();

      if (spotlightFrame) {
        window.cancelAnimationFrame(spotlightFrame);
      }
      window.removeEventListener("pointermove", onWindowPointerMove);

      if (tiltFrame) {
        window.cancelAnimationFrame(tiltFrame);
      }
      root.removeEventListener("pointermove", onRootPointerMove);
      root.removeEventListener("pointerleave", onRootPointerLeave);
      resetTilt(activeTilt);
    };
  }, [rootRef]);
}
