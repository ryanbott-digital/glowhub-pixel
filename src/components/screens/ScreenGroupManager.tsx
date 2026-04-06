import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FolderPlus, MoreHorizontal, Pencil, Trash2, FolderOpen, Palette } from "lucide-react";
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

export function getGroupColorClass(color: string | undefined): string {
  return GROUP_COLORS.find((c) => c.value === color)?.class ?? "bg-muted-foreground";
}

export interface ScreenGroup {
  id: string;
  name: string;
  color: string;
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

  const handleCreate = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("screen_groups").insert({
      user_id: userId,
      name: name.trim(),
      color: selectedColor,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Group "${name.trim()}" created`);
    setName("");
    setSelectedColor("gray");
    setCreateOpen(false);
    onRefresh();
  };

  const handleRename = async () => {
    if (!editGroup || !name.trim()) return;
    const { error } = await supabase
      .from("screen_groups")
      .update({ name: name.trim(), color: selectedColor })
      .eq("id", editGroup.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Group updated");
    setEditGroup(null);
    setName("");
    setSelectedColor("gray");
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
  );

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setName("");
          setSelectedColor("gray");
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
            {colorPicker}
            <Button onClick={handleCreate} className="w-full">
              Create
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
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
            {colorPicker}
            <Button onClick={handleRename} className="w-full">
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Inline group pills for quick management */}
      {groups.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
            >
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${getGroupColorClass(group.color)}`} />
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
          ))}
        </div>
      )}
    </>
  );
}
