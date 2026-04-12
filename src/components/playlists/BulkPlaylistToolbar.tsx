import { Button } from "@/components/ui/button";
import { Trash2, Send, X, CheckSquare } from "lucide-react";

interface BulkPlaylistToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: () => void;
  onBulkSend: () => void;
  onExit: () => void;
}

export function BulkPlaylistToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkSend,
  onExit,
}: BulkPlaylistToolbarProps) {
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="rounded-xl glass border-primary/20 px-3 py-2.5 space-y-2 animate-fade-in">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-foreground">
          {selectedCount} selected
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={allSelected ? onDeselectAll : onSelectAll}
            className="h-8 text-xs"
          >
            <CheckSquare className="h-3.5 w-3.5 mr-1" />
            {allSelected ? "None" : "All"}
          </Button>
          <Button variant="ghost" size="sm" onClick={onExit} className="h-8 text-xs">
            <X className="h-3.5 w-3.5 mr-1" /> Cancel
          </Button>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          disabled={selectedCount === 0}
          onClick={onBulkSend}
          className="h-10 sm:h-8 text-xs flex-1 min-w-[120px]"
        >
          <Send className="h-3.5 w-3.5 mr-1.5" />
          Send to Screen
        </Button>
        <Button
          variant="destructive"
          size="sm"
          disabled={selectedCount === 0}
          onClick={onBulkDelete}
          className="h-10 sm:h-8 text-xs"
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Delete
        </Button>
      </div>
    </div>
  );
}
