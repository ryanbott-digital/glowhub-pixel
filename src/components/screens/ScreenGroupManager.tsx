import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  FolderPlus, MoreHorizontal, Pencil, Trash2, FolderOpen,
  Building2, Store, Monitor, Tv, Coffee, UtensilsCrossed,
  Hotel, Warehouse, School, Hospital, Church, Landmark,
  Home, Theater, ShoppingBag, Briefcase, type LucideIcon,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const GROUP_COLORS: { value: string; label: string; class: string }[] = [
  { value: "gray", label: "Gray", class: "bg-muted-foreground" },
  { value: "red", label: "Red", class: "bg-red-500" },
  { value: "orange", label: "Orange", class: "bg-orange-500" },
  { value: "amber", label: "Amber", class: "bg-amber-500" },
  { value: "green", label: "Green", class: "bg-green-500" },
  { value: "teal", label: "Teal", class: "bg-teal-500" },
  { value: "blue", label: "Blue", class: "bg-blue-500" },
  { value: "purple", label: "Purple", class: "bg-purple-500" },
  { value: "pink", label: "Pink", class: "bg-pink-500" },
];

export const GROUP_ICONS: { value: string; label: string; Icon: LucideIcon }[] = [
  { value: "folder-open", label: "Folder", Icon: FolderOpen },
  { value: "building", label: "Building", Icon: Building2 },
  { value: "store", label: "Store", Icon: Store },
  { value: "monitor", label: "Monitor", Icon: Monitor },
  { value: "tv", label: "TV", Icon: Tv },
  { value: "coffee", label: "Café", Icon: Coffee },
  { value: "restaurant", label: "Restaurant", Icon: UtensilsCrossed },
  { value: "hotel", label: "Hotel", Icon: Hotel },
  { value: "warehouse", label: "Warehouse", Icon: Warehouse },
  { value: "school", label: "School", Icon: School },
  { value: "hospital", label: "Hospital", Icon: Hospital },
  { value: "church", label: "Church", Icon: Church },
  { value: "landmark", label: "Landmark", Icon: Landmark },
  { value: "home", label: "Home", Icon: Home },
  { value: "theater", label: "Theater", Icon: Theater },
  { value: "shopping", label: "Shopping", Icon: ShoppingBag },
  { value: "office", label: "Office", Icon: Briefcase },
];

export function getGroupColorClass(color: string | undefined): string {
  return GROUP_COLORS.find((c) => c.value === color)?.class ?? "bg-muted-foreground";
}

export function getGroupIcon(icon: string | undefined): LucideIcon {
  return GROUP_ICONS.find((i) => i.value === icon)?.Icon ?? FolderOpen;
}

export interface ScreenGroup {
  id: string;
  name: string;
  color: string;
  icon: string;
  user_id: string;
  created_at: string;
}

interface ScreenGroupManagerProps {
  groups: ScreenGroup[];
  userId: string;
  onRefresh: () => void;
}

export function ScreenGroupManager({ groups, userId, onRefresh }: ScreenGroupManagerProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editGroup, setEditGroup] = useState<ScreenGroup | null>(null);
  const [name, setName] = useState("");
  const [selectedColor, setSelectedColor] = useState("gray");
  const [selectedIcon, setSelectedIcon] = useState("folder-open");

  const handleCreate = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("screen_groups").insert({
      user_id: userId,
      name: name.trim(),
      color: selectedColor,
      icon: selectedIcon,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Group "${name.trim()}" created`);
    setName("");
    setSelectedColor("gray");
    setSelectedIcon("folder-open");
    setCreateOpen(false);
    onRefresh();
  };

  const handleRename = async () => {
    if (!editGroup || !name.trim()) return;
    const { error } = await supabase
      .from("screen_groups")
      .update({ name: name.trim(), color: selectedColor, icon: selectedIcon })
      .eq("id", editGroup.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Group updated");
    setEditGroup(null);
    setName("");
    setSelectedColor("gray");
    setSelectedIcon("folder-open");
    onRefresh();
  };

  const handleDelete = async (group: ScreenGroup) => {
    const { error } = await supabase.from("screen_groups").delete().eq("id", group.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Group "${group.name}" deleted — screens moved to ungrouped`);
    onRefresh();
  };

  const colorPicker = (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
      <div className="flex flex-wrap gap-2">
        {GROUP_COLORS.map((c) => (
          <button
            key={c.value}
            type="button"
            onClick={() => setSelectedColor(c.value)}
            className={`h-6 w-6 rounded-full ${c.class} transition-all ${
              selectedColor === c.value
                ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110"
                : "opacity-60 hover:opacity-100"
            }`}
            title={c.label}
          />
        ))}
      </div>
    </div>
  );

  const iconPicker = (
    <div>
      <p className="text-xs font-medium text-muted-foreground mb-2">Icon</p>
      <div className="grid grid-cols-6 gap-1.5">
        {GROUP_ICONS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => setSelectedIcon(item.value)}
            className={`flex items-center justify-center h-9 w-9 rounded-lg transition-all ${
              selectedIcon === item.value
                ? "bg-primary/15 ring-2 ring-primary text-primary"
                : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
            title={item.label}
          >
            <item.Icon className="h-4 w-4" />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setName("");
          setSelectedColor("gray");
          setSelectedIcon("folder-open");
          setCreateOpen(true);
        }}
      >
        <FolderPlus className="h-4 w-4 mr-1" /> New Group
      </Button>

      {/* Create dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="e.g. Lobby, Restaurant, Office"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
            {iconPicker}
            {colorPicker}
            <Button onClick={handleCreate} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editGroup}
        onOpenChange={(open) => {
          if (!open) setEditGroup(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
            {iconPicker}
            {colorPicker}
            <Button onClick={handleRename} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline group pills */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => {
            const GroupIcon = getGroupIcon(group.icon);
            return (
              <div
                key={group.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
              >
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${getGroupColorClass(group.color)}`} />
                <GroupIcon className="h-3 w-3 text-muted-foreground" />
                {group.name}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="ml-1 rounded-full p-0.5 hover:bg-muted">
                      <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        setName(group.name);
                        setSelectedColor(group.color || "gray");
                        setSelectedIcon(group.icon || "folder-open");
                        setEditGroup(group);
                      }}
                    >
                      <Pencil className="h-3 w-3 mr-2" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(group)}
                    >
                      <Trash2 className="h-3 w-3 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
