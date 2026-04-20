import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mediaId: string;
  mediaName: string;
  originalUrl: string;
  onComplete: () => void;
}

export function AiFillModal({ open, onOpenChange, mediaId, mediaName, originalUrl, onComplete }: Props) {
  const [generating, setGenerating] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-fill-media", {
        body: { media_id: mediaId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      // Build public URL for the new file
      const { data: pub } = supabase.storage.from("signage-content").getPublicUrl(data.storage_path);
      setResultUrl(pub.publicUrl);
      toast.success("AI Fill complete — added to your library");
      onComplete();
    } catch (e: any) {
      toast.error(e?.message || "AI Fill failed");
    } finally {
      setGenerating(false);
    }
  };

  const handleClose = () => {
    setResultUrl(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass border-white/[0.06] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5 text-primary" />
            Fill the screen with AI
          </DialogTitle>
          <DialogDescription>
            "{mediaName}" doesn't match a 16:9 screen. Let AI extend the artwork so it fills edge-to-edge with no cropping and no letterbox.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Now (Fit)</p>
            <div className="aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center border border-white/[0.06]">
              <img src={originalUrl} alt="Original" className="max-w-full max-h-full object-contain" />
            </div>
            <p className="text-[11px] text-muted-foreground">Letterboxed on a 16:9 screen.</p>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> AI Filled (16:9)
            </p>
            <div className="aspect-video bg-muted/40 rounded-lg overflow-hidden flex items-center justify-center border border-primary/30">
              {generating ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-xs">Extending artwork…</p>
                  <p className="text-[10px] opacity-70">Usually 5–15 seconds</p>
                </div>
              ) : resultUrl ? (
                <img src={resultUrl} alt="AI filled" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center text-muted-foreground p-4">
                  <Sparkles className="h-6 w-6 mx-auto mb-1.5 opacity-50" />
                  <p className="text-xs">Click Generate to preview</p>
                </div>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Edge-to-edge, no bars.</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={generating}>
            {resultUrl ? "Done" : "Cancel"}
          </Button>
          {!resultUrl && (
            <Button onClick={handleGenerate} disabled={generating} className="gap-2">
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate AI Fill
                </>
              )}
            </Button>
          )}
          {resultUrl && (
            <Button onClick={handleClose} className="gap-2">
              <Check className="h-4 w-4" /> View in Library
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
