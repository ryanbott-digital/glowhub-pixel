import { useRef, useState, useCallback, type ReactNode } from "react";
import { Trash2 } from "lucide-react";

interface SwipeToDeleteProps {
  children: ReactNode;
  onDelete: () => void;
  threshold?: number;
  className?: string;
  style?: React.CSSProperties;
}

const SWIPE_THRESHOLD = 80;

export function SwipeToDelete({
  children,
  onDelete,
  threshold = SWIPE_THRESHOLD,
  className = "",
  style,
}: SwipeToDeleteProps) {
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const locked = useRef(false); // lock direction once determined

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    locked.current = false;
    setSwiping(false);
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (startX.current === null || startY.current === null) return;
    const dx = e.touches[0].clientX - startX.current;
    const dy = e.touches[0].clientY - startY.current;

    // Determine direction lock on first significant move
    if (!locked.current && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      locked.current = true;
      if (Math.abs(dy) > Math.abs(dx)) {
        // vertical scroll — abort swipe
        startX.current = null;
        return;
      }
      setSwiping(true);
    }

    if (!swiping && !locked.current) return;

    // Only allow left swipe (negative dx)
    const clampedX = Math.min(0, Math.max(-threshold * 1.3, dx));
    setOffsetX(clampedX);
  }, [swiping, threshold]);

  const onTouchEnd = useCallback(() => {
    if (Math.abs(offsetX) >= threshold) {
      setConfirmed(true);
      setOffsetX(-threshold);
      // Delay delete slightly for visual feedback
      setTimeout(() => {
        onDelete();
        setOffsetX(0);
        setConfirmed(false);
        setSwiping(false);
      }, 300);
    } else {
      setOffsetX(0);
      setSwiping(false);
    }
    startX.current = null;
    startY.current = null;
  }, [offsetX, threshold, onDelete]);

  const progress = Math.min(1, Math.abs(offsetX) / threshold);

  return (
    <div className={`relative overflow-hidden ${className}`} style={style}>
      {/* Delete background revealed on swipe */}
      <div
        className="absolute inset-y-0 right-0 flex items-center justify-center transition-colors rounded-r-xl"
        style={{
          width: Math.abs(offsetX) || 0,
          background: confirmed
            ? "hsl(var(--destructive))"
            : `rgba(239, 68, 68, ${0.15 + progress * 0.55})`,
        }}
      >
        <Trash2
          className="h-4 w-4 text-white transition-transform"
          style={{
            opacity: progress,
            transform: `scale(${0.6 + progress * 0.4})`,
          }}
        />
      </div>

      {/* Sliding content */}
      <div
        className="relative z-[1] w-full h-full"
        style={{
          transform: `translateX(${offsetX}px)`,
          transition: swiping ? "none" : "transform 0.25s ease-out",
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
