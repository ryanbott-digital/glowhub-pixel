import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableGroupZoneProps {
  groupId: string; // "ungrouped" or actual group id
  children: React.ReactNode;
  isOver?: boolean;
  label?: string;
}

export function DroppableGroupZone({ groupId, children }: DroppableGroupZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-all duration-200 min-h-[80px]",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
    >
      {children}
    </div>
  );
}
