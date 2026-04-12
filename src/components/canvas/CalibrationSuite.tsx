import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ScanLine, Ruler, Palette, Zap, Monitor, Heart,
} from "lucide-react";

interface Screen {
  id: string;
  name: string;
  status: string;
}

interface SyncGroupMember {
  id: string;
  screen_id: string;
  position: number;
  bezel_compensation?: number;
  color_r?: number;
  color_g?: number;
  color_b?: number;
  brightness_offset?: number;
}

interface SyncGroup {
  id: string;
  name: string;
  orientation: "horizontal" | "vertical";
  screens: SyncGroupMember[];
}

interface CalibrationSuiteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: SyncGroup;
  screens: Screen[];
  onRefresh: () => void;
}

export function CalibrationSuite({ open, onOpenChange, group, screens, onRefresh }: CalibrationSuiteProps) {
  const [calibrating, setCalibrating] = useState(false);
  const [flashActive, setFlashActive] = useState(false);

  const getScreen = (screenId: string) => screens.find(s => s.id === screenId);

  // ── PULSE PATTERN: broadcast calibration scanline ──
  const handleStartPulse = useCallback(() => {
    setCalibrating(true);
    const channelName = `calibration-${group.id}`;
    const startTime = Date.now();

    const interval = setInterval(() => {
      supabase.channel(channelName).send({
        type: "broadcast",
        event: "calibration-pulse",
        payload: {
          active: true,
          startTime,
          t: Date.now() - startTime,
        },
      });
    }, 16); // ~60fps

    // Stop after 10 seconds
    setTimeout(() => {
      clearInterval(interval);
      supabase.channel(channelName).send({
        type: "broadcast",
        event: "calibration-pulse",
        payload: { active: false },
      });
      setCalibrating(false);
      toast.success("Pulse calibration complete");
    }, 10_000);
  }, [group.id]);

  // ── BEZEL COMPENSATION: update per-screen offset ──
  const handleBezelChange = useCallback(async (memberId: string, value: number) => {
    await supabase.from("sync_group_screens").update({ bezel_compensation: value }).eq("id", memberId);
    // Broadcast live update for ghosting preview
    supabase.channel(`calibration-${group.id}`).send({
      type: "broadcast",
      event: "bezel-update",
      payload: { memberId, bezel_compensation: value },
    });
  }, [group.id]);

  // ── COLOR MATCHING: update per-screen RGB/brightness ──
  const handleColorChange = useCallback(async (memberId: string, field: "color_r" | "color_g" | "color_b" | "brightness_offset", value: number) => {
    await supabase.from("sync_group_screens").update({ [field]: value } as any).eq("id", memberId);
    supabase.channel(`calibration-${group.id}`).send({
      type: "broadcast",
      event: "color-update",
      payload: { memberId, [channel]: value },
    });
  }, [group.id]);

  // ── FLASH TEST: all screens flash white for 1 frame ──
  const handleFlashTest = useCallback(() => {
    setFlashActive(true);
    supabase.channel(`calibration-${group.id}`).send({
      type: "broadcast",
      event: "flash-test",
      payload: { flash: true, duration: 16.6 },
    });
    setTimeout(() => setFlashActive(false), 500);
    toast.success("Sync flash triggered on all screens");
  }, [group.id]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ScanLine className="h-5 w-5 text-primary" />
            Glow Calibration Suite — {group.name}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="pulse" className="mt-2">
          <TabsList className="grid w-full grid-cols-4 glass">
            <TabsTrigger value="pulse" className="text-xs gap-1.5">
              <ScanLine className="h-3.5 w-3.5" /> Pulse
            </TabsTrigger>
            <TabsTrigger value="bezel" className="text-xs gap-1.5">
              <Ruler className="h-3.5 w-3.5" /> Bezel
            </TabsTrigger>
            <TabsTrigger value="color" className="text-xs gap-1.5">
              <Palette className="h-3.5 w-3.5" /> Color
            </TabsTrigger>
            <TabsTrigger value="flash" className="text-xs gap-1.5">
              <Zap className="h-3.5 w-3.5" /> Flash
            </TabsTrigger>
          </TabsList>

          {/* ── PULSE PATTERN ── */}
          <TabsContent value="pulse" className="space-y-4 mt-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <ScanLine className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Scanline Pulse Test</h3>
                  <p className="text-xs text-muted-foreground">
                    A neon teal scanline sweeps across all screens simultaneously for 10 seconds.
                    Watch for alignment — the line should cross screen bezels seamlessly.
                  </p>
                </div>
              </div>

              {/* Visual preview */}
              <div className="relative h-20 rounded-lg overflow-hidden border border-primary/20 bg-background">
                <div
                  className="absolute top-0 bottom-0 w-0.5 bg-primary"
                  style={{
                    animation: calibrating ? "calibrationScan 2s linear infinite" : "none",
                    boxShadow: "0 0 15px hsl(var(--primary)), 0 0 30px hsl(var(--primary))",
                    opacity: calibrating ? 1 : 0.3,
                  }}
                />
                {/* Screen dividers */}
                {group.screens.length > 1 && group.screens.slice(1).map((_, idx) => (
                  <div
                    key={idx}
                    className="absolute top-0 bottom-0 border-l border-dashed border-muted-foreground/20"
                    style={{ left: `${((idx + 1) / group.screens.length) * 100}%` }}
                  />
                ))}
                {/* Scanline overlay */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, hsla(180, 100%, 32%, 0.03) 3px, hsla(180, 100%, 32%, 0.03) 4px)",
                  }}
                />
              </div>

              <Button
                onClick={handleStartPulse}
                disabled={calibrating}
                className="w-full bg-gradient-to-r from-primary to-glow-blue text-primary-foreground font-semibold tracking-wider rounded-xl"
              >
                {calibrating ? (
                  <><Heart className="h-4 w-4 mr-2 animate-pulse" /> Pulsing…</>
                ) : (
                  <><ScanLine className="h-4 w-4 mr-2" /> Start Pulse Calibration</>
                )}
              </Button>
            </div>
          </TabsContent>

          {/* ── BEZEL COMPENSATION ── */}
          <TabsContent value="bezel" className="space-y-4 mt-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Ruler className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Bezel Gap Compensation</h3>
                  <p className="text-xs text-muted-foreground">
                    Adjust the pixel offset to account for the physical bezels between your TVs.
                    A ghost overlay shows where content would be without bezels.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {group.screens.map((member) => {
                  const screen = getScreen(member.screen_id);
                  return (
                    <div key={member.id} className="glass rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{screen?.name || "Unknown"}</span>
                        <span className="text-[10px] text-muted-foreground tracking-wider uppercase ml-auto">
                          Position {member.position + 1}
                        </span>
                      </div>
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Bezel offset</span>
                          <span className="text-xs font-mono text-primary">{member.bezel_compensation || 0}px</span>
                        </div>
                        <Slider
                          defaultValue={[member.bezel_compensation || 0]}
                          min={0}
                          max={100}
                          step={1}
                          onValueCommit={([v]) => handleBezelChange(member.id, v)}
                          className="w-full"
                        />
                      </div>

                      {/* Ghosting preview */}
                      {(member.bezel_compensation || 0) > 0 && (
                        <div className="relative h-8 rounded bg-muted/30 overflow-hidden">
                          <div
                            className="absolute inset-y-0 bg-primary/10 border-r-2 border-dashed border-primary/40"
                            style={{ width: `${member.bezel_compensation || 0}px`, maxWidth: "100%" }}
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-[9px] text-muted-foreground tracking-wider">
                            GHOST ZONE · {member.bezel_compensation || 0}px hidden content
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── COLOR MATCHING ── */}
          <TabsContent value="color" className="space-y-4 mt-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Color &amp; Brightness Matching</h3>
                  <p className="text-xs text-muted-foreground">
                    Fine-tune RGB and brightness per screen to compensate for differences between TV brands.
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                {group.screens.map((member) => {
                  const screen = getScreen(member.screen_id);
                  return (
                    <div key={member.id} className="glass rounded-lg p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium text-foreground">{screen?.name || "Unknown"}</span>
                      </div>

                      {/* Color preview swatch */}
                      <div
                        className="h-6 rounded-md border border-border/30"
                        style={{
                          background: `rgb(${128 + (member.color_r || 0)}, ${128 + (member.color_g || 0)}, ${128 + (member.color_b || 0)})`,
                          filter: `brightness(${100 + (member.brightness_offset || 0)}%)`,
                        }}
                      />

                      {/* Red */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-red-400">Red</span>
                          <span className="text-xs font-mono text-muted-foreground">{member.color_r || 0}</span>
                        </div>
                        <Slider
                          defaultValue={[member.color_r || 0]}
                          min={-100}
                          max={100}
                          step={1}
                          onValueCommit={([v]) => handleColorChange(member.id, "color_r", v)}
                          className="w-full"
                        />
                      </div>
                      {/* Green */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-emerald-400">Green</span>
                          <span className="text-xs font-mono text-muted-foreground">{member.color_g || 0}</span>
                        </div>
                        <Slider
                          defaultValue={[member.color_g || 0]}
                          min={-100}
                          max={100}
                          step={1}
                          onValueCommit={([v]) => handleColorChange(member.id, "color_g", v)}
                          className="w-full"
                        />
                      </div>
                      {/* Blue */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-blue-400">Blue</span>
                          <span className="text-xs font-mono text-muted-foreground">{member.color_b || 0}</span>
                        </div>
                        <Slider
                          defaultValue={[member.color_b || 0]}
                          min={-100}
                          max={100}
                          step={1}
                          onValueCommit={([v]) => handleColorChange(member.id, "color_b", v)}
                          className="w-full"
                        />
                      </div>
                      {/* Brightness */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-amber-400">Brightness</span>
                          <span className="text-xs font-mono text-muted-foreground">{member.brightness_offset || 0}</span>
                        </div>
                        <Slider
                          defaultValue={[member.brightness_offset || 0]}
                          min={-50}
                          max={50}
                          step={1}
                          onValueCommit={([v]) => handleColorChange(member.id, "brightness_offset", v)}
                          className="w-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ── FLASH TEST ── */}
          <TabsContent value="flash" className="space-y-4 mt-4">
            <div className="glass rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Flash Sync Test</h3>
                  <p className="text-xs text-muted-foreground">
                    All screens flash white for exactly 1 frame (16.6ms at 60Hz) simultaneously.
                    Use this to verify zero-latency sync across your display wall.
                  </p>
                </div>
              </div>

              {/* Status indicators */}
              <div className="grid grid-cols-2 gap-3">
                {group.screens.map((member) => {
                  const screen = getScreen(member.screen_id);
                  return (
                    <div key={member.id} className="glass rounded-lg p-3 flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${screen?.status === "online" ? "bg-emerald-400" : "bg-red-400"}`} />
                      <span className="text-xs text-foreground truncate">{screen?.name || "Unknown"}</span>
                      <span className="text-[9px] text-muted-foreground ml-auto uppercase tracking-wider">
                        {screen?.status === "online" ? "READY" : "OFFLINE"}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Button
                onClick={handleFlashTest}
                disabled={flashActive}
                className="w-full bg-gradient-to-r from-primary to-glow-blue text-primary-foreground font-semibold tracking-wider rounded-xl h-12 text-base"
              >
                {flashActive ? (
                  <><Zap className="h-5 w-5 mr-2 animate-pulse" /> Flashing…</>
                ) : (
                  <><Zap className="h-5 w-5 mr-2" /> Test Sync</>
                )}
              </Button>

              <p className="text-[10px] text-muted-foreground text-center tracking-wider">
                If any screen flashes out of sync, check your network latency or re-run the Pulse calibration.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {/* Calibration animations */}
        <style>{`
          @keyframes calibrationScan {
            0% { left: 0%; }
            100% { left: 100%; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}
