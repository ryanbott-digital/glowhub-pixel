import { useCallback, useEffect, useRef, useState } from "react";

interface UsePinchZoomOptions {
  min: number;
  max: number;
  initial: number;
  step?: number;
  storageKey?: string;
}

export function usePinchZoom({ min, max, initial, step = 1, storageKey }: UsePinchZoomOptions) {
  const [value, setValue] = useState(() => {
    if (storageKey) {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = Number(stored);
        if (!isNaN(parsed) && parsed >= min && parsed <= max) return parsed;
      }
    }
    return initial;
  });
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef<number | null>(null);
  const initialValue = useRef(value);
  const rafId = useRef<number | null>(null);
  const latestValue = useRef(value);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

  // Keep ref in sync with state
  useEffect(() => {
    latestValue.current = value;
  }, [value]);

  // Persist to localStorage (debounced)
  useEffect(() => {
    if (!storageKey) return;
    const id = setTimeout(() => localStorage.setItem(storageKey, String(value)), 200);
    return () => clearTimeout(id);
  }, [value, storageKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const getDistance = (touches: TouchList) => {
      if (touches.length < 2) return 0;
      const dx = touches[1].clientX - touches[0].clientX;
      const dy = touches[1].clientY - touches[0].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        initialDistance.current = getDistance(e.touches);
        initialValue.current = latestValue.current;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current !== null) {
        e.preventDefault();
        const dist = getDistance(e.touches);
        const scale = dist / initialDistance.current;
        const raw = initialValue.current * scale;
        const snapped = step > 1 ? Math.round(raw / step) * step : Math.round(raw);
        const clamped = clamp(snapped);

        // Only update via rAF to avoid layout thrashing
        if (clamped !== latestValue.current) {
          if (rafId.current !== null) cancelAnimationFrame(rafId.current);
          rafId.current = requestAnimationFrame(() => {
            latestValue.current = clamped;
            setValue(clamped);
            rafId.current = null;
          });
        }
      }
    };

    const onTouchEnd = () => {
      initialDistance.current = null;
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
        rafId.current = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    };
  }, [clamp, step]);

  return { value, setValue, containerRef };
}
