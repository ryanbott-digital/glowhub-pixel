import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface DraggableScreenWrapperProps {
  screenId: string;
  disabled?: boolean;
  children: React.ReactNode;
}

export function DraggableScreenWrapper({ screenId, disabled, children }: DraggableScreenWrapperProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: screenId,
    disabled,
  });

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      {!disabled && (
        <button
          {...listeners}
          {...attributes}
          className="absolute top-2 right-2 z-20 p-1 rounded-md bg-black/40 backdrop-blur-sm border border-white/10 text-white/70 hover:text-white hover:bg-black/60 cursor-grab active:cursor-grabbing transition-colors"
          title="Drag to move between groups"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      )}
      {children}
    </div>
  );
}
