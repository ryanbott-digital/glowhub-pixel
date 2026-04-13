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
  const [isPinching, setIsPinching] = useState(false);
  const pinchFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialDistance = useRef<number | null>(null);
  const initialValue = useRef(value);
  const rafId = useRef<number | null>(null);
  const latestValue = useRef(value);
  const velocityRef = useRef(0);
  const lastScaleRef = useRef(1);
  const lastTimeRef = useRef(0);
  const inertiaRafRef = useRef<number | null>(null);

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

    const cancelInertia = () => {
      if (inertiaRafRef.current !== null) {
        cancelAnimationFrame(inertiaRafRef.current);
        inertiaRafRef.current = null;
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        cancelInertia();
        if (pinchFadeTimer.current) clearTimeout(pinchFadeTimer.current);
        setIsPinching(true);
        initialDistance.current = getDistance(e.touches);
        initialValue.current = latestValue.current;
        lastScaleRef.current = 1;
        lastTimeRef.current = performance.now();
        velocityRef.current = 0;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && initialDistance.current !== null) {
        e.preventDefault();
        const dist = getDistance(e.touches);
        const scale = dist / initialDistance.current;
        const now = performance.now();
        const dt = now - lastTimeRef.current;

        // Track velocity as scale-change per ms
        if (dt > 0) {
          velocityRef.current = (scale - lastScaleRef.current) / dt;
        }
        lastScaleRef.current = scale;
        lastTimeRef.current = now;

        const raw = initialValue.current * scale;
        const snapped = step > 1 ? Math.round(raw / step) * step : Math.round(raw);
        const clamped = clamp(snapped);

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
      // Fade out indicator after a delay
      pinchFadeTimer.current = setTimeout(() => setIsPinching(false), 800);

      // Apply inertia if there's meaningful velocity
      const v = velocityRef.current;
      if (Math.abs(v) < 0.0005) return;

      let velocity = v * 1000; // convert to scale-per-second
      let lastFrame = performance.now();
      const baseValue = latestValue.current;
      let accumulated = 0;
      const friction = 0.92;

      const tick = () => {
        const now = performance.now();
        const dt = (now - lastFrame) / 1000;
        lastFrame = now;

        velocity *= friction;
        accumulated += velocity * dt;

        if (Math.abs(velocity) < 0.05) return;

        const raw = baseValue * (1 + accumulated);
        const snapped = step > 1 ? Math.round(raw / step) * step : Math.round(raw);
        const clamped = clamp(snapped);

        if (clamped !== latestValue.current) {
          latestValue.current = clamped;
          setValue(clamped);
        }

        // Stop if we hit bounds
        if (clamped <= min || clamped >= max) return;

        inertiaRafRef.current = requestAnimationFrame(tick);
      };

      inertiaRafRef.current = requestAnimationFrame(tick);
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      if (rafId.current !== null) cancelAnimationFrame(rafId.current);
      cancelInertia();
    };
  }, [clamp, step, min, max]);

  return { value, setValue, containerRef };
}
