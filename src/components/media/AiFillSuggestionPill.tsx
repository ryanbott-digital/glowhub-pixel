import { Sparkles } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  onClick: (e: React.MouseEvent) => void;
}

export function AiFillSuggestionPill({ onClick }: Props) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick(e);
            }}
            className="absolute top-1.5 left-1/2 -translate-x-1/2 sm:top-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full glass border border-primary/40 bg-primary/15 backdrop-blur-md text-[10px] font-semibold text-primary hover:bg-primary/25 hover:border-primary/60 hover:scale-105 transition-all shadow-[0_0_12px_hsl(var(--primary)/0.3)]"
          >
            <Sparkles className="h-3 w-3" />
            <span>Fill with AI</span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-xs">
          This image will letterbox on 16:9 screens. Let AI extend the background so it fills edge-to-edge.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
