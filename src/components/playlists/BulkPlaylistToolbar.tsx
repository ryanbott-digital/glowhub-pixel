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
    <div className="flex items-center gap-2 flex-wrap animate-fade-in">
      <Button
        variant="outline"
        size="sm"
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="text-xs"
      >
        <CheckSquare className="h-3.5 w-3.5 mr-1" />
        {allSelected ? "Deselect All" : "Select All"}
      </Button>
      <span className="text-sm text-muted-foreground">
        {selectedCount} selected
      </span>
      <div className="flex-1" />
      <Button
        variant="outline"
        size="sm"
        disabled={selectedCount === 0}
        onClick={onBulkSend}
        className="text-xs"
      >
        <Send className="h-3.5 w-3.5 mr-1" />
        Send to Screen
      </Button>
      <Button
        variant="destructive"
        size="sm"
        disabled={selectedCount === 0}
        onClick={onBulkDelete}
        className="text-xs"
      >
        <Trash2 className="h-3.5 w-3.5 mr-1" />
        Delete
      </Button>
      <Button variant="ghost" size="sm" onClick={onExit} className="text-xs">
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
