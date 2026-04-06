import { useDroppable } from "@dnd-kit/core";
import { cn } from "@/lib/utils";

interface DroppableGroupZoneProps {
  groupId: string;
  children: React.ReactNode;
  isOver?: boolean;
  label?: string;
  className?: string;
}

export function DroppableGroupZone({ groupId, children, className }: DroppableGroupZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id: groupId });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl transition-all duration-200 min-h-[80px]",
        isOver && "ring-2 ring-primary/50 bg-primary/5",
        className
      )}
    >
      {children}
    </div>
  );
}
