import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { FolderPlus, MoreHorizontal, Pencil, Trash2, FolderOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ScreenGroup {
  id: string;
  name: string;
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

  const handleCreate = async () => {
    if (!name.trim()) return;
    const { error } = await supabase.from("screen_groups").insert({
      user_id: userId,
      name: name.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Group "${name.trim()}" created`);
    setName("");
    setCreateOpen(false);
    onRefresh();
  };

  const handleRename = async () => {
    if (!editGroup || !name.trim()) return;
    const { error } = await supabase
      .from("screen_groups")
      .update({ name: name.trim() })
      .eq("id", editGroup.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Group renamed");
    setEditGroup(null);
    setName("");
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

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setName("");
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
            <DialogTitle>Rename Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleRename()}
            />
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
              className="flex items-center gap-1 rounded-full border border-border bg-muted/50 px-3 py-1 text-xs font-medium text-foreground"
            >
              <FolderOpen className="h-3 w-3 text-muted-foreground" />
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
                      setEditGroup(group);
                    }}
                  >
                    <Pencil className="h-3 w-3 mr-2" /> Rename
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
