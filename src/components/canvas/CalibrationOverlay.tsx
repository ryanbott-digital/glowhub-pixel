import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CalibrationOverlayProps {
  screenId: string;
  syncGroupId: string | null;
}

/**
 * Renders calibration effects on the player:
 * - Pulse scanline synchronized via Realtime
 * - Flash test (white frame for 16.6ms)
 * - Bezel ghosting overlay
 * - Color correction filter
 */
export function CalibrationOverlay({ screenId, syncGroupId }: CalibrationOverlayProps) {
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseTime, setPulseTime] = useState(0);
  const [flashActive, setFlashActive] = useState(false);
  const [bezelCompensation, setBezelCompensation] = useState(0);
  const [colorCorrection, setColorCorrection] = useState({ r: 0, g: 0, b: 0, brightness: 0 });
  const flashTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const animFrameRef = useRef<number>();

  useEffect(() => {
    if (!syncGroupId) return;

    const channelName = `calibration-${syncGroupId}`;
    const channel = supabase
      .channel(channelName)
      .on("broadcast", { event: "calibration-pulse" }, ({ payload }) => {
        if (payload.active) {
          setPulseActive(true);
          setPulseTime(payload.t || 0);
        } else {
          setPulseActive(false);
        }
      })
      .on("broadcast", { event: "flash-test" }, () => {
        setFlashActive(true);
        clearTimeout(flashTimerRef.current);
        // 1 frame at 60Hz = 16.6ms
        flashTimerRef.current = setTimeout(() => setFlashActive(false), 16.6);
      })
      .on("broadcast", { event: "bezel-update" }, ({ payload }) => {
        setBezelCompensation(payload.bezel_compensation || 0);
      })
      .on("broadcast", { event: "color-update" }, ({ payload }) => {
        setColorCorrection(prev => ({
          ...prev,
          r: payload.color_r ?? prev.r,
          g: payload.color_g ?? prev.g,
          b: payload.color_b ?? prev.b,
          brightness: payload.brightness_offset ?? prev.brightness,
        }));
      })
      .subscribe();

    // Load initial calibration values
    const loadCalibration = async () => {
      const { data } = await supabase
        .from("sync_group_screens")
        .select("bezel_compensation, color_r, color_g, color_b, brightness_offset")
        .eq("screen_id", screenId)
        .eq("sync_group_id", syncGroupId)
        .maybeSingle();
      if (data) {
        setBezelCompensation(data.bezel_compensation || 0);
        setColorCorrection({
          r: data.color_r || 0,
          g: data.color_g || 0,
          b: data.color_b || 0,
          brightness: data.brightness_offset || 0,
        });
      }
    };
    loadCalibration();

    return () => {
      supabase.removeChannel(channel);
      clearTimeout(flashTimerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [syncGroupId, screenId]);

  // Animated scanline position based on broadcast time
  const [scanlineX, setScanlineX] = useState(0);
  useEffect(() => {
    if (!pulseActive) return;
    const animate = () => {
      // Scanline sweeps at 500px/sec, wrapping at screen width
      const elapsed = (Date.now() % 2000) / 2000; // 2-second cycle
      setScanlineX(elapsed * 100);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [pulseActive]);

  // Build CSS filter for color correction
  const hasColorCorrection = colorCorrection.r !== 0 || colorCorrection.g !== 0 || colorCorrection.b !== 0 || colorCorrection.brightness !== 0;

  return (
    <>
      {/* Flash test overlay */}
      {flashActive && (
        <div
          className="fixed inset-0 z-[9999] pointer-events-none"
          style={{ background: "white" }}
        />
      )}

      {/* Pulse scanline overlay */}
      {pulseActive && (
        <div className="fixed inset-0 z-[9998] pointer-events-none">
          {/* Scanline */}
          <div
            className="absolute top-0 bottom-0 w-0.5"
            style={{
              left: `${scanlineX}%`,
              background: "hsl(180, 100%, 50%)",
              boxShadow: "0 0 20px hsl(180, 100%, 50%), 0 0 40px hsl(180, 100%, 50%), 0 0 80px hsl(180, 100%, 40%)",
            }}
          />
          {/* Horizontal scanlines for CRT effect */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, hsla(180, 100%, 50%, 0.3) 2px, hsla(180, 100%, 50%, 0.3) 3px)",
            }}
          />
          {/* Calibration label */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
            <span className="text-xs font-mono tracking-widest text-cyan-400 uppercase">
              ● CALIBRATING
            </span>
          </div>
        </div>
      )}

      {/* Bezel compensation ghosting overlay */}
      {bezelCompensation > 0 && (
        <div
          className="fixed top-0 bottom-0 left-0 z-[9997] pointer-events-none"
          style={{
            width: `${bezelCompensation}px`,
            background: "repeating-linear-gradient(45deg, hsla(180, 100%, 50%, 0.05), hsla(180, 100%, 50%, 0.05) 4px, transparent 4px, transparent 8px)",
            borderRight: "1px dashed hsla(180, 100%, 50%, 0.3)",
          }}
        />
      )}

      {/* Color correction filter overlay */}
      {hasColorCorrection && (
        <div
          className="fixed inset-0 z-[9996] pointer-events-none mix-blend-color"
          style={{
            background: `rgba(${Math.max(0, colorCorrection.r * 1.28 + 128)}, ${Math.max(0, colorCorrection.g * 1.28 + 128)}, ${Math.max(0, colorCorrection.b * 1.28 + 128)}, 0.05)`,
            filter: colorCorrection.brightness !== 0
              ? `brightness(${100 + colorCorrection.brightness}%)`
              : undefined,
          }}
        />
      )}
    </>
  );
}
