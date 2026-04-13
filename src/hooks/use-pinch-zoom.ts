import { useCallback, useEffect, useRef, useState } from "react";

interface UsePinchZoomOptions {
  min: number;
  max: number;
  initial: number;
  step?: number;
  storageKey?: string;
}

export function usePinchZoom({ min, max, initial, step = 5, storageKey }: UsePinchZoomOptions) {
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

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

  // Persist to localStorage
  useEffect(() => {
    if (storageKey) localStorage.setItem(storageKey, String(value));
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
        initialValue.current = value;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current !== null) {
        e.preventDefault();
        const dist = getDistance(e.touches);
        const scale = dist / initialDistance.current;
        const newVal = clamp(Math.round(initialValue.current * scale / step) * step);
        setValue(newVal);
      }
    };

    const onTouchEnd = () => {
      initialDistance.current = null;
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [value, clamp, step]);

  return { value, setValue, containerRef };
}
