import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Layers, X } from "lucide-react";
import {
  isOverlayGranted,
  requestOverlayPermission,
  markOverlayPrompted,
  hasOverlayBeenPrompted,
} from "@/lib/overlay-permission";

interface Props {
  /** Only render when running natively (Player gates this). */
  enabled: boolean;
}

/**
 * One-time prompt asking the user to grant 'Display over other apps'
 * so Glow stays on top of Samsung volume bars, system pop-ups, and
 * 'Update' notifications. Deep-links into the OEM settings screen.
 */
export function OverlayPermissionPrompt({ enabled }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    (async () => {
      // Give the player a moment to settle before interrupting
      await new Promise((r) => setTimeout(r, 4000));
      if (cancelled) return;
      if (hasOverlayBeenPrompted()) return;
      const granted = await isOverlayGranted();
      if (cancelled) return;
      if (!granted) setOpen(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const handleEnable = async () => {
    markOverlayPrompted();
    setOpen(false);
    await requestOverlayPermission();
  };

  const handleDismiss = () => {
    markOverlayPrompted();
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-md p-6"
        >
          <motion.div
            initial={{ scale: 0.92, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.92, y: 20 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
            className="relative w-full max-w-md rounded-3xl border border-border/40 bg-card/90 p-8 shadow-2xl"
            style={{ backdropFilter: "blur(24px)" }}
          >
            <button
              onClick={handleDismiss}
              className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Layers className="h-7 w-7" />
            </div>

            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Stay on top, always
            </h2>
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              Grant <span className="font-medium text-foreground">Display over other apps</span> so
              Glow keeps playing above system pop-ups, volume bars, and update notifications.
              You'll only need to do this once.
            </p>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleEnable}
                className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Open settings
              </button>
              <button
                onClick={handleDismiss}
                className="w-full rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted"
              >
                Maybe later
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
