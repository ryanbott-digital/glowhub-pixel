import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Calendar } from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

interface Playlist {
  id: string;
  title: string;
}

interface ScheduleEntry {
  id: string;
  screen_id: string;
  playlist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface WeeklyScheduleGridProps {
  screenId: string;
  playlists: Playlist[];
}

export function WeeklyScheduleGrid({ screenId, playlists }: WeeklyScheduleGridProps) {
  const [schedules, setSchedules] = useState<ScheduleEntry[]>([]);
  const [adding, setAdding] = useState(false);
  const [newEntry, setNewEntry] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
    playlist_id: "",
  });

  const fetchSchedules = useCallback(async () => {
    const { data } = await supabase
      .from("screen_schedules")
      .select("*")
      .eq("screen_id", screenId)
      .order("day_of_week")
      .order("start_time");
    if (data) setSchedules(data);
  }, [screenId]);

  useEffect(() => {
    fetchSchedules();
  }, [fetchSchedules]);

  const addSchedule = async () => {
    if (!newEntry.playlist_id) {
      toast.error("Select a playlist");
      return;
    }
    const { error } = await supabase.from("screen_schedules").insert({
      screen_id: screenId,
      playlist_id: newEntry.playlist_id,
      day_of_week: newEntry.day_of_week,
      start_time: newEntry.start_time,
      end_time: newEntry.end_time,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Schedule added");
    setAdding(false);
    setNewEntry({ day_of_week: 1, start_time: "09:00", end_time: "17:00", playlist_id: "" });
    fetchSchedules();
  };

  const removeSchedule = async (id: string) => {
    await supabase.from("screen_schedules").delete().eq("id", id);
    fetchSchedules();
  };

  const getPlaylistTitle = (id: string) =>
    playlists.find((p) => p.id === id)?.title || "Unknown";

  // Group by day
  const byDay = DAYS.map((_, dayIdx) =>
    schedules.filter((s) => s.day_of_week === dayIdx)
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-primary" />
          Weekly Schedule
        </h3>
        <Button variant="outline" size="sm" onClick={() => setAdding(!adding)}>
          <Plus className="h-3 w-3 mr-1" /> Add Slot
        </Button>
      </div>

      {adding && (
        <div className="grid grid-cols-2 gap-2 p-3 rounded-lg bg-muted">
          <Select
            value={newEntry.day_of_week.toString()}
            onValueChange={(v) => setNewEntry((e) => ({ ...e, day_of_week: parseInt(v) }))}
          >
            <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
            <SelectContent>
              {DAYS.map((d, i) => (
                <SelectItem key={i} value={i.toString()}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newEntry.playlist_id}
            onValueChange={(v) => setNewEntry((e) => ({ ...e, playlist_id: v }))}
          >
            <SelectTrigger><SelectValue placeholder="Playlist" /></SelectTrigger>
            <SelectContent>
              {playlists.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newEntry.start_time}
            onValueChange={(v) => setNewEntry((e) => ({ ...e, start_time: v }))}
          >
            <SelectTrigger><SelectValue placeholder="Start" /></SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={newEntry.end_time}
            onValueChange={(v) => setNewEntry((e) => ({ ...e, end_time: v }))}
          >
            <SelectTrigger><SelectValue placeholder="End" /></SelectTrigger>
            <SelectContent>
              {HOURS.map((h) => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="col-span-2 flex gap-2">
            <Button size="sm" onClick={addSchedule} className="flex-1">Save</Button>
            <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Compact weekly grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[320px] grid grid-cols-7 gap-1">
          {DAYS.map((day, dayIdx) => (
            <div key={dayIdx} className="space-y-1">
              <div className="text-xs font-semibold text-center text-muted-foreground py-1">
                {day}
              </div>
              {byDay[dayIdx].length > 0 ? (
                byDay[dayIdx].map((entry) => (
                  <div
                    key={entry.id}
                    className="group relative bg-primary/10 border border-primary/20 rounded p-1.5 text-xs"
                  >
                    <div className="font-medium text-foreground truncate">
                      {getPlaylistTitle(entry.playlist_id)}
                    </div>
                    <div className="text-muted-foreground">
                      {entry.start_time.slice(0, 5)}–{entry.end_time.slice(0, 5)}
                    </div>
                    <button
                      onClick={() => removeSchedule(entry.id)}
                      className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="h-10 rounded bg-muted/50 border border-dashed border-muted-foreground/20" />
              )}
            </div>
          ))}
        </div>
      </div>

      {schedules.length === 0 && !adding && (
        <p className="text-xs text-muted-foreground text-center">No schedule set — screen uses manual playlist</p>
      )}
    </div>
  );
}
