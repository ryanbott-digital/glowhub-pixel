import { Calendar, ListVideo, Grid3X3, BarChart3 } from "lucide-react";

export function MonitorPreview() {
  return (
    <div className="relative flex items-center justify-center py-8">
      {/* Radiant glow background */}
      <div className="absolute inset-0 radiant-glow rounded-2xl animate-pulse-glow" />

      {/* Monitor frame */}
      <div className="relative w-full max-w-2xl aspect-video rounded-xl overflow-hidden border-4 border-secondary bg-secondary/95 shadow-2xl">
        {/* Screen content */}
        <div className="absolute inset-2 rounded-lg bg-background overflow-hidden">
          {/* Mini dashboard mockup */}
          <div className="h-full flex flex-col p-3 gap-2">
            {/* Top bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="w-2 h-2 rounded-full bg-accent" />
                <div className="w-2 h-2 rounded-full bg-glow-green" />
              </div>
              <span className="text-[8px] font-semibold text-muted-foreground">LIVE</span>
            </div>

            {/* Content grid */}
            <div className="flex-1 grid grid-cols-3 gap-2">
              {/* Calendar block */}
              <div className="bg-muted rounded-md p-2 flex flex-col items-center justify-center gap-1">
                <Calendar className="h-4 w-4 text-primary" />
                <div className="w-full space-y-0.5">
                  <div className="h-1 bg-primary/20 rounded" />
                  <div className="h-1 bg-primary/10 rounded w-3/4" />
                </div>
              </div>

              {/* Playlist block */}
              <div className="bg-muted rounded-md p-2 flex flex-col items-center justify-center gap-1">
                <ListVideo className="h-4 w-4 text-accent" />
                <div className="w-full space-y-0.5">
                  <div className="h-1 bg-accent/20 rounded" />
                  <div className="h-1 bg-accent/10 rounded w-2/3" />
                  <div className="h-1 bg-accent/10 rounded w-1/2" />
                </div>
              </div>

              {/* Media grid block */}
              <div className="bg-muted rounded-md p-2 flex flex-col items-center justify-center gap-1">
                <Grid3X3 className="h-4 w-4 text-glow-blue" />
                <div className="grid grid-cols-2 gap-0.5 w-full">
                  <div className="h-2 bg-glow-blue/15 rounded" />
                  <div className="h-2 bg-glow-pink/15 rounded" />
                  <div className="h-2 bg-glow-green/15 rounded" />
                  <div className="h-2 bg-glow-orange/15 rounded" />
                </div>
              </div>
            </div>

            {/* Bottom bar */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                <BarChart3 className="h-3 w-3 text-muted-foreground" />
                <div className="h-1.5 w-8 bg-primary/20 rounded self-center" />
              </div>
              <div className="text-[6px] text-muted-foreground font-medium">GlowHub</div>
            </div>
          </div>
        </div>
      </div>

      {/* Monitor stand */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-3 bg-secondary/80 rounded-b-lg" />
    </div>
  );
}
