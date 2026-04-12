import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CalendarClock, Plus, Trash2, ChevronLeft, ChevronRight, Monitor, Image, Film, Moon, Zap,
  Copy, Layers, AlertTriangle, GripVertical, Search, X, RefreshCw
} from "lucide-react";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isWithinInterval, addMonths, subMonths, subDays } from "date-fns";

/* ──────── Types ──────── */
interface Screen {
  id: string;
  name: string;
  status: string;
}

interface MediaItem {
  id: string;
  name: string;
  type: string;
  storage_path: string;
}

interface PlaylistItem {
  id: string;
  title: string;
}

interface ScheduleBlock {
  id: string;
  screen_id: string;
  media_id: string | null;
  playlist_id: string | null;
  start_at: string;
  end_at: string;
  block_type: "content" | "blackout" | "hype_override";
  recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly";
  recurrence_end: string | null;
  color_code: string;
  priority: number;
  label: string;
  user_id: string;
}

type ViewMode = "day" | "week" | "month";

/* ──────── Color map ──────── */
const COLOR_MAP: Record<string, { bg: string; border: string; text: string; glow: string }> = {
  teal:    { bg: "bg-[#00A3A3]/20",  border: "border-[#00A3A3]/60",  text: "text-[#00E5CC]",   glow: "shadow-[0_0_12px_rgba(0,163,163,0.4)]" },
  magenta: { bg: "bg-[#FF00FF]/15",  border: "border-[#FF00FF]/50",  text: "text-[#FF66FF]",   glow: "shadow-[0_0_12px_rgba(255,0,255,0.3)]" },
  amber:   { bg: "bg-[#FFB020]/15",  border: "border-[#FFB020]/50",  text: "text-[#FFD060]",   glow: "shadow-[0_0_12px_rgba(255,176,32,0.3)]" },
  red:     { bg: "bg-[#FF003C]/15",  border: "border-[#FF003C]/50",  text: "text-[#FF4466]",   glow: "shadow-[0_0_12px_rgba(255,0,60,0.3)]" },
  blue:    { bg: "bg-[#3B82F6]/15",  border: "border-[#3B82F6]/50",  text: "text-[#60A5FA]",   glow: "shadow-[0_0_12px_rgba(59,130,246,0.3)]" },
  dark:    { bg: "bg-[#1E293B]/60",  border: "border-[#475569]/40",  text: "text-[#94A3B8]",   glow: "" },
};

const BLOCK_TYPE_COLORS: Record<string, string> = {
  content: "teal",
  blackout: "dark",
  hype_override: "magenta",
};

const CONTENT_TYPE_COLORS: Record<string, string> = {
  video: "teal",
  image: "blue",
  special: "magenta",
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour

/* ──────── Helpers ──────── */
function getBlockStyle(block: ScheduleBlock, dayStart: Date) {
  const start = new Date(block.start_at);
  const end = new Date(block.end_at);
  const dayBegin = new Date(dayStart);
  dayBegin.setHours(0, 0, 0, 0);

  const startMinutes = Math.max(0, (start.getTime() - dayBegin.getTime()) / 60000);
  const endMinutes = Math.min(1440, (end.getTime() - dayBegin.getTime()) / 60000);
  const top = (startMinutes / 60) * HOUR_HEIGHT;
  const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_HEIGHT, 20);

  return { top, height };
}

function blocksOverlap(a: ScheduleBlock, b: ScheduleBlock): boolean {
  return new Date(a.start_at) < new Date(b.end_at) && new Date(a.end_at) > new Date(b.start_at);
}

function expandRecurrence(block: ScheduleBlock, rangeStart: Date, rangeEnd: Date): ScheduleBlock[] {
  if (block.recurrence === "none") {
    const s = new Date(block.start_at);
    const e = new Date(block.end_at);
    if (e < rangeStart || s > rangeEnd) return [];
    return [block];
  }

  const results: ScheduleBlock[] = [];
  const origStart = new Date(block.start_at);
  const origEnd = new Date(block.end_at);
  const duration = origEnd.getTime() - origStart.getTime();
  const recEnd = block.recurrence_end ? new Date(block.recurrence_end) : rangeEnd;

  let cursor = new Date(origStart);
  let safety = 0;
  while (cursor <= recEnd && cursor <= rangeEnd && safety < 400) {
    safety++;
    const cursorEnd = new Date(cursor.getTime() + duration);
    if (cursorEnd >= rangeStart) {
      const day = cursor.getDay();
      const isWeekday = day >= 1 && day <= 5;

      if (
        block.recurrence === "daily" ||
        (block.recurrence === "weekdays" && isWeekday) ||
        (block.recurrence === "weekly" && day === origStart.getDay()) ||
        (block.recurrence === "monthly" && cursor.getDate() === origStart.getDate())
      ) {
        results.push({
          ...block,
          start_at: cursor.toISOString(),
          end_at: cursorEnd.toISOString(),
        });
      }
    }
    cursor = addDays(cursor, 1);
    cursor.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
  }
  return results;
}

/* ══════════════════════════════════════════════════════════════ */
/*                       SCHEDULE PAGE                          */
/* ══════════════════════════════════════════════════════════════ */
export default function Schedule() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState<string>("");
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [focusDate, setFocusDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [editBlock, setEditBlock] = useState<ScheduleBlock | null>(null);
  const [mediaSearch, setMediaSearch] = useState("");
  const [pendingSlot, setPendingSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newBlock, setNewBlock] = useState({
    block_type: "content" as "content" | "blackout" | "hype_override",
    start_time: "09:00",
    end_time: "17:00",
    recurrence: "none" as string,
    label: "",
    color_code: "teal",
    priority: 0,
    media_id: "" as string,
    playlist_id: "" as string,
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ── Fetch screens ── */
  useEffect(() => {
    if (!user) return;
    supabase
      .from("screens")
      .select("id, name, status")
      .eq("user_id", user.id)
      .order("name")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setScreens(data);
          setSelectedScreenId(data[0].id);
        }
        setLoading(false);
      });
  }, [user]);

  /* ── Fetch media & playlists ── */
  useEffect(() => {
    if (!user) return;
    supabase.from("media").select("id, name, type, storage_path").eq("user_id", user.id).order("name").then(({ data }) => {
      if (data) setMedia(data);
    });
    supabase.from("playlists").select("id, title").eq("user_id", user.id).order("title").then(({ data }) => {
      if (data) setPlaylists(data);
    });
  }, [user]);

  /* ── Fetch blocks ── */
  const fetchBlocks = useCallback(async () => {
    if (!selectedScreenId) return;
    const { data, error } = await supabase
      .from("schedule_blocks")
      .select("*")
      .eq("screen_id", selectedScreenId)
      .order("start_at");

    if (data) setBlocks(data as unknown as ScheduleBlock[]);
    if (error) toast.error("Failed to load schedule");
  }, [selectedScreenId]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  /* ── Date range ── */
  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (viewMode === "day") {
      const start = new Date(focusDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setHours(23, 59, 59, 999);
      return { rangeStart: start, rangeEnd: end, days: [start] };
    }
    if (viewMode === "week") {
      const start = startOfWeek(focusDate, { weekStartsOn: 1 });
      const end = addDays(start, 6);
      end.setHours(23, 59, 59, 999);
      const days = eachDayOfInterval({ start, end });
      return { rangeStart: start, rangeEnd: end, days };
    }
    // month
    const start = startOfMonth(focusDate);
    const end = endOfMonth(focusDate);
    const days = eachDayOfInterval({ start, end });
    return { rangeStart: start, rangeEnd: end, days };
  }, [viewMode, focusDate]);

  /* ── Expanded blocks ── */
  const expandedBlocks = useMemo(() => {
    return blocks.flatMap((b) => expandRecurrence(b, rangeStart, rangeEnd));
  }, [blocks, rangeStart, rangeEnd]);

  /* ── Overlap detection ── */
  const overlappingPairs = useMemo(() => {
    const pairs: [string, string][] = [];
    for (let i = 0; i < expandedBlocks.length; i++) {
      for (let j = i + 1; j < expandedBlocks.length; j++) {
        if (expandedBlocks[i].screen_id === expandedBlocks[j].screen_id &&
            blocksOverlap(expandedBlocks[i], expandedBlocks[j])) {
          pairs.push([expandedBlocks[i].id, expandedBlocks[j].id]);
        }
      }
    }
    return pairs;
  }, [expandedBlocks]);

  const isOverlapping = useCallback((blockId: string) => {
    return overlappingPairs.some(([a, b]) => a === blockId || b === blockId);
  }, [overlappingPairs]);

  /* ── Navigation ── */
  const navigate = (dir: number) => {
    if (viewMode === "day") setFocusDate((d) => addDays(d, dir));
    else if (viewMode === "week") setFocusDate((d) => addDays(d, dir * 7));
    else setFocusDate((d) => dir > 0 ? addMonths(d, 1) : subMonths(d, 1));
  };

  /* ── Create block ── */
  const handleCreateBlock = async () => {
    if (!user || !selectedScreenId || !pendingSlot) return;

    const dayDate = pendingSlot.day;
    const startDate = new Date(dayDate);
    startDate.setHours(parseInt(newBlock.start_time.split(":")[0]), parseInt(newBlock.start_time.split(":")[1] || "0"), 0, 0);
    const endDate = new Date(dayDate);
    endDate.setHours(parseInt(newBlock.end_time.split(":")[0]), parseInt(newBlock.end_time.split(":")[1] || "0"), 0, 0);

    if (endDate <= startDate) {
      toast.error("End time must be after start time");
      return;
    }

    const payload = {
      screen_id: selectedScreenId,
      media_id: newBlock.media_id || null,
      playlist_id: newBlock.playlist_id || null,
      start_at: startDate.toISOString(),
      end_at: endDate.toISOString(),
      block_type: newBlock.block_type,
      recurrence: newBlock.recurrence,
      color_code: newBlock.block_type === "blackout" ? "dark" : newBlock.block_type === "hype_override" ? "magenta" : newBlock.color_code,
      priority: newBlock.block_type === "hype_override" ? 999 : newBlock.priority,
      label: newBlock.label || (newBlock.block_type === "blackout" ? "Blackout" : ""),
      user_id: user.id,
    };

    const { error } = await supabase.from("schedule_blocks").insert(payload as any);
    if (error) {
      toast.error("Failed to create block");
      return;
    }
    toast.success("Schedule block created");
    setShowCreateDialog(false);
    setPendingSlot(null);
    setNewBlock({ block_type: "content", start_time: "09:00", end_time: "17:00", recurrence: "none", label: "", color_code: "teal", priority: 0, media_id: "", playlist_id: "" });
    fetchBlocks();
  };

  /* ── Delete block ── */
  const handleDeleteBlock = async (blockId: string) => {
    const { error } = await supabase.from("schedule_blocks").delete().eq("id", blockId);
    if (error) toast.error("Failed to delete");
    else { toast.success("Block deleted"); fetchBlocks(); setEditBlock(null); }
  };

  /* ── Click on timeline slot ── */
  const handleSlotClick = (day: Date, hour: number) => {
    setPendingSlot({ day, hour });
    setNewBlock((prev) => ({
      ...prev,
      start_time: `${hour.toString().padStart(2, "0")}:00`,
      end_time: `${Math.min(hour + 1, 23).toString().padStart(2, "0")}:00`,
    }));
    setShowCreateDialog(true);
  };

  /* ── Scroll to 8am on mount ── */
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, [viewMode]);

  /* ── Media name lookup ── */
  const getMediaName = (id: string | null) => media.find((m) => m.id === id)?.name ?? "";
  const getMediaType = (id: string | null) => media.find((m) => m.id === id)?.type ?? "";
  const getPlaylistName = (id: string | null) => playlists.find((p) => p.id === id)?.title ?? "";

  /* ══════════════════ RENDER ══════════════════ */
  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <SEOHead title="Schedule — Glow" description="Advanced multi-day scheduling engine" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-[#1E293B]/60">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-[#00E5CC]" />
          <h1 className="text-lg font-bold">Schedule Engine</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Screen picker */}
          <Select value={selectedScreenId} onValueChange={setSelectedScreenId}>
            <SelectTrigger className="w-[180px] bg-[#0F1A2E] border-[#1E293B]">
              <Monitor className="h-3.5 w-3.5 mr-1.5 text-[#00E5CC]" />
              <SelectValue placeholder="Select screen" />
            </SelectTrigger>
            <SelectContent>
              {screens.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* View toggle */}
          <div className="flex rounded-lg border border-[#1E293B] bg-[#0F1A2E] overflow-hidden">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-all ${
                  viewMode === mode
                    ? "bg-[#00A3A3]/20 text-[#00E5CC] shadow-[inset_0_0_10px_rgba(0,163,163,0.15)]"
                    : "text-[#64748B] hover:text-[#94A3B8]"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Nav arrows */}
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              onClick={() => setFocusDate(new Date())}
              className="text-xs font-medium px-2 py-1 rounded hover:bg-[#1E293B]/50 text-[#94A3B8] transition-colors"
            >
              Today
            </button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <span className="text-sm font-medium text-[#94A3B8]">
            {viewMode === "day" && format(focusDate, "EEEE, MMM d, yyyy")}
            {viewMode === "week" && `${format(rangeStart, "MMM d")} — ${format(rangeEnd, "MMM d, yyyy")}`}
            {viewMode === "month" && format(focusDate, "MMMM yyyy")}
          </span>
        </div>
      </div>

      {/* ── Legend ── */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-[#1E293B]/40 text-xs">
        <span className="flex items-center gap-1.5"><Film className="h-3 w-3 text-[#00E5CC]" /> Video</span>
        <span className="flex items-center gap-1.5"><Image className="h-3 w-3 text-[#60A5FA]" /> Image</span>
        <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-[#FF66FF]" /> Hype Override</span>
        <span className="flex items-center gap-1.5"><Moon className="h-3 w-3 text-[#94A3B8]" /> Blackout</span>
        {overlappingPairs.length > 0 && (
          <span className="flex items-center gap-1.5 text-[#FF4466]"><AlertTriangle className="h-3 w-3" /> {overlappingPairs.length} conflict{overlappingPairs.length > 1 ? "s" : ""}</span>
        )}
      </div>

      {/* ── Timeline ── */}
      {viewMode === "month" ? (
        /* ── Month view (calendar grid) ── */
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-[#64748B] pb-2">{d}</div>
            ))}
            {/* Pad start */}
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const dayBlocks = expandedBlocks.filter((b) => {
                const s = new Date(b.start_at);
                return isSameDay(s, day);
              });
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-[80px] rounded-lg border p-1.5 cursor-pointer transition-all hover:border-[#00A3A3]/40 ${
                    isSameDay(day, new Date()) ? "border-[#00A3A3]/50 bg-[#00A3A3]/5" : "border-[#1E293B]/50 bg-[#0B1120]/50"
                  }`}
                  onClick={() => { setFocusDate(day); setViewMode("day"); }}
                >
                  <span className={`text-xs font-medium ${isSameDay(day, new Date()) ? "text-[#00E5CC]" : "text-[#94A3B8]"}`}>
                    {format(day, "d")}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayBlocks.slice(0, 3).map((b, i) => {
                      const colors = COLOR_MAP[b.color_code] || COLOR_MAP.teal;
                      return (
                        <div
                          key={`${b.id}-${i}`}
                          className={`rounded px-1 py-0.5 text-[10px] truncate ${colors.bg} ${colors.text} ${colors.border} border`}
                        >
                          {b.label || (b.block_type === "blackout" ? "⬤" : "▶")}
                        </div>
                      );
                    })}
                    {dayBlocks.length > 3 && (
                      <span className="text-[10px] text-[#64748B]">+{dayBlocks.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Day / Week view (timeline) ── */
        <div className="flex-1 overflow-hidden flex">
          {/* Time axis */}
          <div className="w-14 shrink-0 border-r border-[#1E293B]/40">
            <div className="h-8" /> {/* header spacer */}
            <div ref={scrollRef} className="overflow-auto" style={{ height: "calc(100vh - 200px)" }}>
              {HOURS.map((h) => (
                <div key={h} className="flex items-start justify-end pr-2 text-[10px] text-[#475569] font-mono" style={{ height: HOUR_HEIGHT }}>
                  {`${h.toString().padStart(2, "0")}:00`}
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ minWidth: viewMode === "day" ? "100%" : `${days.length * 180}px` }}>
              {days.map((day) => {
                const dayBlocks = expandedBlocks.filter((b) => {
                  const s = new Date(b.start_at);
                  return isSameDay(s, day);
                });

                return (
                  <div key={day.toISOString()} className="flex-1 min-w-[160px] border-r border-[#1E293B]/30">
                    {/* Day header */}
                    <div className={`h-8 flex items-center justify-center text-xs font-medium border-b border-[#1E293B]/40 ${
                      isSameDay(day, new Date()) ? "text-[#00E5CC] bg-[#00A3A3]/5" : "text-[#94A3B8]"
                    }`}>
                      {format(day, viewMode === "day" ? "EEEE, MMM d" : "EEE d")}
                    </div>

                    {/* Hour grid + blocks */}
                    <div className="relative overflow-auto" style={{ height: "calc(100vh - 200px)" }}>
                      {/* Hour lines */}
                      {HOURS.map((h) => (
                        <div
                          key={h}
                          className="border-b border-[#1E293B]/20 cursor-pointer hover:bg-[#00A3A3]/[0.03] transition-colors"
                          style={{ height: HOUR_HEIGHT }}
                          onClick={() => handleSlotClick(day, h)}
                        />
                      ))}

                      {/* Schedule blocks */}
                      {dayBlocks.map((block, idx) => {
                        const { top, height } = getBlockStyle(block, day);
                        const colors = COLOR_MAP[block.color_code] || COLOR_MAP.teal;
                        const hasOverlap = isOverlapping(block.id);
                        const mediaType = block.media_id ? getMediaType(block.media_id) : "";
                        const isVideo = mediaType === "video";

                        return (
                          <div
                            key={`${block.id}-${idx}`}
                            className={`absolute left-1 right-1 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] hover:z-20 ${colors.bg} ${colors.border} ${colors.glow} ${
                              hasOverlap ? "ring-1 ring-[#FF003C]/50" : ""
                            } ${block.block_type === "blackout" ? "opacity-70" : ""}`}
                            style={{ top, height, minHeight: 24, zIndex: 10 + block.priority }}
                            onClick={(e) => { e.stopPropagation(); setEditBlock(block); }}
                          >
                            <div className="px-2 py-1 overflow-hidden h-full flex flex-col">
                              <div className="flex items-center gap-1">
                                {block.block_type === "blackout" && <Moon className="h-3 w-3 shrink-0" />}
                                {block.block_type === "hype_override" && <Zap className="h-3 w-3 shrink-0 animate-pulse" />}
                                {block.block_type === "content" && isVideo && <Film className="h-3 w-3 shrink-0" />}
                                {block.block_type === "content" && !isVideo && <Image className="h-3 w-3 shrink-0" />}
                                <span className={`text-[10px] font-semibold truncate ${colors.text}`}>
                                  {block.label || getMediaName(block.media_id) || getPlaylistName(block.playlist_id) || block.block_type}
                                </span>
                              </div>
                              {height > 36 && (
                                <span className="text-[9px] text-[#64748B] mt-0.5">
                                  {format(new Date(block.start_at), "HH:mm")} – {format(new Date(block.end_at), "HH:mm")}
                                </span>
                              )}
                              {height > 52 && block.recurrence !== "none" && (
                                <Badge variant="outline" className="text-[8px] px-1 py-0 mt-0.5 w-fit border-[#475569]/40 text-[#64748B]">
                                  ↻ {block.recurrence}
                                </Badge>
                              )}
                              {hasOverlap && height > 44 && (
                                <span className="text-[8px] text-[#FF4466] flex items-center gap-0.5 mt-0.5">
                                  <AlertTriangle className="h-2.5 w-2.5" /> Overlap
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Current time line */}
                      {isSameDay(day, new Date()) && (
                        <div
                          className="absolute left-0 right-0 h-0.5 bg-[#00E5CC] z-30 pointer-events-none"
                          style={{ top: ((new Date().getHours() * 60 + new Date().getMinutes()) / 60) * HOUR_HEIGHT }}
                        >
                          <div className="absolute -left-1 -top-1 w-2.5 h-2.5 rounded-full bg-[#00E5CC] shadow-[0_0_8px_rgba(0,229,204,0.6)]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CREATE DIALOG ══════════ */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="bg-[#0F1A2E] border-[#1E293B] max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-[#00E5CC]" />
              New Schedule Block
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Block type */}
            <div>
              <Label className="text-xs text-[#94A3B8]">Block Type</Label>
              <div className="flex gap-2 mt-1.5">
                {([
                  { value: "content", label: "Content", icon: Film, color: "text-[#00E5CC]" },
                  { value: "blackout", label: "Blackout", icon: Moon, color: "text-[#94A3B8]" },
                  { value: "hype_override", label: "Hype Override", icon: Zap, color: "text-[#FF66FF]" },
                ] as const).map(({ value, label, icon: Icon, color }) => (
                  <button
                    key={value}
                    onClick={() => setNewBlock((p) => ({ ...p, block_type: value }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      newBlock.block_type === value
                        ? `border-[#00A3A3]/50 bg-[#00A3A3]/10 ${color}`
                        : "border-[#1E293B] text-[#64748B] hover:border-[#475569]"
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Time range */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#94A3B8]">Start Time</Label>
                <Input
                  type="time"
                  value={newBlock.start_time}
                  onChange={(e) => setNewBlock((p) => ({ ...p, start_time: e.target.value }))}
                  className="bg-[#0B1120] border-[#1E293B] mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-[#94A3B8]">End Time</Label>
                <Input
                  type="time"
                  value={newBlock.end_time}
                  onChange={(e) => setNewBlock((p) => ({ ...p, end_time: e.target.value }))}
                  className="bg-[#0B1120] border-[#1E293B] mt-1"
                />
              </div>
            </div>

            {/* Label */}
            <div>
              <Label className="text-xs text-[#94A3B8]">Label (optional)</Label>
              <Input
                value={newBlock.label}
                onChange={(e) => setNewBlock((p) => ({ ...p, label: e.target.value }))}
                placeholder="e.g. Morning Promo, After Hours"
                className="bg-[#0B1120] border-[#1E293B] mt-1"
              />
            </div>

            {/* Content selector (only for content type) */}
            {newBlock.block_type === "content" && (
              <div>
                <Label className="text-xs text-[#94A3B8]">Content</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Select value={newBlock.media_id || "none"} onValueChange={(v) => setNewBlock((p) => ({ ...p, media_id: v === "none" ? "" : v, playlist_id: "" }))}>
                    <SelectTrigger className="bg-[#0B1120] border-[#1E293B]">
                      <SelectValue placeholder="Select media" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No media</SelectItem>
                      {media.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          {m.type === "video" ? "🎬" : "🖼"} {m.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={newBlock.playlist_id || "none"} onValueChange={(v) => setNewBlock((p) => ({ ...p, playlist_id: v === "none" ? "" : v, media_id: "" }))}>
                    <SelectTrigger className="bg-[#0B1120] border-[#1E293B]">
                      <SelectValue placeholder="Or playlist" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No playlist</SelectItem>
                      {playlists.map((p) => (
                        <SelectItem key={p.id} value={p.id}>📋 {p.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Color selector */}
                <div className="mt-3">
                  <Label className="text-xs text-[#94A3B8]">Neon Color</Label>
                  <div className="flex gap-2 mt-1.5">
                    {(["teal", "magenta", "amber", "blue", "red"] as const).map((c) => {
                      const colors = COLOR_MAP[c];
                      return (
                        <button
                          key={c}
                          onClick={() => setNewBlock((p) => ({ ...p, color_code: c }))}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${colors.bg} ${
                            newBlock.color_code === c ? `${colors.border} ${colors.glow} scale-110` : "border-transparent"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Recurrence */}
            <div>
              <Label className="text-xs text-[#94A3B8]">Repeat</Label>
              <Select value={newBlock.recurrence} onValueChange={(v) => setNewBlock((p) => ({ ...p, recurrence: v }))}>
                <SelectTrigger className="bg-[#0B1120] border-[#1E293B] mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekdays">Weekdays (Mon–Fri)</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            {newBlock.block_type !== "hype_override" && (
              <div>
                <Label className="text-xs text-[#94A3B8]">Priority (higher wins on overlap)</Label>
                <Input
                  type="number"
                  value={newBlock.priority}
                  onChange={(e) => setNewBlock((p) => ({ ...p, priority: parseInt(e.target.value) || 0 }))}
                  className="bg-[#0B1120] border-[#1E293B] mt-1 w-24"
                  min={0}
                  max={100}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateBlock}
              className="bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] font-semibold hover:shadow-[0_0_20px_rgba(0,163,163,0.35)]"
            >
              Create Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ EDIT / DETAIL DIALOG ══════════ */}
      <Dialog open={!!editBlock} onOpenChange={() => setEditBlock(null)}>
        <DialogContent className="bg-[#0F1A2E] border-[#1E293B] max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editBlock?.block_type === "blackout" && <Moon className="h-4 w-4 text-[#94A3B8]" />}
              {editBlock?.block_type === "hype_override" && <Zap className="h-4 w-4 text-[#FF66FF]" />}
              {editBlock?.block_type === "content" && <Film className="h-4 w-4 text-[#00E5CC]" />}
              {editBlock?.label || editBlock?.block_type || "Block Details"}
            </DialogTitle>
          </DialogHeader>

          {editBlock && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#64748B] text-xs">Start</span>
                  <p className="text-[#E2E8F0]">{format(new Date(editBlock.start_at), "MMM d, HH:mm")}</p>
                </div>
                <div>
                  <span className="text-[#64748B] text-xs">End</span>
                  <p className="text-[#E2E8F0]">{format(new Date(editBlock.end_at), "MMM d, HH:mm")}</p>
                </div>
              </div>

              <Separator className="bg-[#1E293B]" />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#64748B] text-xs">Type</span>
                  <p className="text-[#E2E8F0] capitalize">{editBlock.block_type.replace("_", " ")}</p>
                </div>
                <div>
                  <span className="text-[#64748B] text-xs">Recurrence</span>
                  <p className="text-[#E2E8F0] capitalize">{editBlock.recurrence}</p>
                </div>
              </div>

              {editBlock.media_id && (
                <div>
                  <span className="text-[#64748B] text-xs">Media</span>
                  <p className="text-[#E2E8F0]">{getMediaName(editBlock.media_id)}</p>
                </div>
              )}
              {editBlock.playlist_id && (
                <div>
                  <span className="text-[#64748B] text-xs">Playlist</span>
                  <p className="text-[#E2E8F0]">{getPlaylistName(editBlock.playlist_id)}</p>
                </div>
              )}

              {isOverlapping(editBlock.id) && (
                <div className="rounded-lg border border-[#FF003C]/30 bg-[#FF003C]/10 p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#FF4466] shrink-0" />
                  <span className="text-xs text-[#FF4466]">
                    This block overlaps with another. The higher-priority block will take precedence.
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditBlock(null)}>Close</Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => editBlock && handleDeleteBlock(editBlock.id)}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
