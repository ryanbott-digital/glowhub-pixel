import { useCallback, useEffect, useRef, useState } from "react";

interface UsePinchZoomOptions {
  min: number;
  max: number;
  initial: number;
  step?: number;
}

export function usePinchZoom({ min, max, initial, step = 5 }: UsePinchZoomOptions) {
  const [value, setValue] = useState(initial);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef<number | null>(null);
  const initialValue = useRef(initial);

  const clamp = useCallback((v: number) => Math.min(max, Math.max(min, v)), [min, max]);

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
        e.preventDefault(); // prevent scroll during pinch
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
