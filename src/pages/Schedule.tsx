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
import {
  CalendarClock, Plus, Trash2, ChevronLeft, ChevronRight, Monitor, Image, Film, Moon, Zap,
  Copy, AlertTriangle, RefreshCw, Eye, GripHorizontal
} from "lucide-react";
import { format, addDays, startOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from "date-fns";
import { hapticLight, hapticMedium, hapticSuccess, hapticWarning } from "@/lib/haptics";

/* ──────── Types ──────── */
interface Screen { id: string; name: string; status: string; }
interface MediaItem { id: string; name: string; type: string; storage_path: string; }
interface PlaylistItem { id: string; title: string; }
interface ScheduleBlock {
  id: string; screen_id: string; media_id: string | null; playlist_id: string | null;
  start_at: string; end_at: string;
  block_type: "content" | "blackout" | "hype_override";
  recurrence: "none" | "daily" | "weekdays" | "weekly" | "monthly";
  recurrence_end: string | null; color_code: string; priority: number; label: string; user_id: string;
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

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 80; // taller for better UX
const HALF_HOUR_HEIGHT = HOUR_HEIGHT / 2;
const SNAP_MINUTES = 15;
const SNAP_PX = (SNAP_MINUTES / 60) * HOUR_HEIGHT;

/* ──────── Helpers ──────── */
function getBlockStyle(block: ScheduleBlock, dayStart: Date) {
  const start = new Date(block.start_at);
  const end = new Date(block.end_at);
  const dayBegin = new Date(dayStart); dayBegin.setHours(0, 0, 0, 0);
  const startMin = Math.max(0, (start.getTime() - dayBegin.getTime()) / 60000);
  const endMin = Math.min(1440, (end.getTime() - dayBegin.getTime()) / 60000);
  return { top: (startMin / 60) * HOUR_HEIGHT, height: Math.max(((endMin - startMin) / 60) * HOUR_HEIGHT, 24) };
}

function blocksOverlap(a: ScheduleBlock, b: ScheduleBlock): boolean {
  return new Date(a.start_at) < new Date(b.end_at) && new Date(a.end_at) > new Date(b.start_at);
}

function expandRecurrence(block: ScheduleBlock, rangeStart: Date, rangeEnd: Date): ScheduleBlock[] {
  if (block.recurrence === "none") {
    const s = new Date(block.start_at); const e = new Date(block.end_at);
    if (e < rangeStart || s > rangeEnd) return [];
    return [block];
  }
  const results: ScheduleBlock[] = [];
  const origStart = new Date(block.start_at); const origEnd = new Date(block.end_at);
  const duration = origEnd.getTime() - origStart.getTime();
  const recEnd = block.recurrence_end ? new Date(block.recurrence_end) : rangeEnd;
  let cursor = new Date(origStart); let safety = 0;
  while (cursor <= recEnd && cursor <= rangeEnd && safety < 400) {
    safety++;
    const cursorEnd = new Date(cursor.getTime() + duration);
    if (cursorEnd >= rangeStart) {
      const day = cursor.getDay(); const isWeekday = day >= 1 && day <= 5;
      if (block.recurrence === "daily" || (block.recurrence === "weekdays" && isWeekday) ||
          (block.recurrence === "weekly" && day === origStart.getDay()) ||
          (block.recurrence === "monthly" && cursor.getDate() === origStart.getDate())) {
        results.push({ ...block, start_at: cursor.toISOString(), end_at: cursorEnd.toISOString() });
      }
    }
    cursor = addDays(cursor, 1);
    cursor.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
  }
  return results;
}

function snapToGrid(px: number): number {
  return Math.round(px / SNAP_PX) * SNAP_PX;
}

function pxToTime(px: number, dayStart: Date): Date {
  const minutes = (px / HOUR_HEIGHT) * 60;
  const d = new Date(dayStart); d.setHours(0, 0, 0, 0);
  d.setMinutes(Math.round(minutes / SNAP_MINUTES) * SNAP_MINUTES);
  return d;
}

function getStorageUrl(path: string): string {
  const url = import.meta.env.VITE_SUPABASE_URL;
  return `${url}/storage/v1/object/public/media/${path}`;
}

/* ══════════════════════════════════════════════════════════════ */
/*                       SCHEDULE PAGE                          */
/* ══════════════════════════════════════════════════════════════ */
export default function Schedule() {
  const { user } = useAuth();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [focusDate, setFocusDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [editBlock, setEditBlock] = useState<ScheduleBlock | null>(null);
  const [pendingSlot, setPendingSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copyingTomorrow, setCopyingTomorrow] = useState(false);
  const [currentTimeTop, setCurrentTimeTop] = useState(0);
  const [newBlock, setNewBlock] = useState({
    block_type: "content" as "content" | "blackout" | "hype_override",
    start_time: "09:00", end_time: "17:00", recurrence: "none" as string,
    label: "", color_code: "teal", priority: 0, media_id: "" as string, playlist_id: "" as string,
  });
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const resizingRef = useRef<{ blockId: string; startY: number; originalEndAt: string; originalHeight: number } | null>(null);

  /* ── Real-time current time indicator ── */
  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTimeTop(((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT);
    };
    update();
    const id = setInterval(update, 15000);
    return () => clearInterval(id);
  }, []);

  /* ── Fetch screens ── */
  useEffect(() => {
    if (!user) return;
    supabase.from("screens").select("id, name, status").eq("user_id", user.id).order("name")
      .then(({ data }) => {
        if (data?.length) { setScreens(data); setSelectedScreenId(data[0].id); }
        setLoading(false);
      });
  }, [user]);

  /* ── Fetch media & playlists ── */
  useEffect(() => {
    if (!user) return;
    supabase.from("media").select("id, name, type, storage_path").eq("user_id", user.id).order("name").then(({ data }) => { if (data) setMedia(data); });
    supabase.from("playlists").select("id, title").eq("user_id", user.id).order("title").then(({ data }) => { if (data) setPlaylists(data); });
  }, [user]);

  /* ── Fetch blocks ── */
  const fetchBlocks = useCallback(async () => {
    if (!selectedScreenId) return;
    const { data, error } = await supabase.from("schedule_blocks").select("*").eq("screen_id", selectedScreenId).order("start_at");
    if (data) setBlocks(data as unknown as ScheduleBlock[]);
    if (error) toast.error("Failed to load schedule");
  }, [selectedScreenId]);

  useEffect(() => { fetchBlocks(); }, [fetchBlocks]);

  /* ── Realtime subscription ── */
  useEffect(() => {
    if (!selectedScreenId) return;
    const channel = supabase
      .channel(`schedule-${selectedScreenId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'schedule_blocks', filter: `screen_id=eq.${selectedScreenId}` },
        () => { fetchBlocks(); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedScreenId, fetchBlocks]);

  /* ── Date range ── */
  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (viewMode === "day") {
      const start = new Date(focusDate); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setHours(23, 59, 59, 999);
      return { rangeStart: start, rangeEnd: end, days: [start] };
    }
    if (viewMode === "week") {
      const start = startOfWeek(focusDate, { weekStartsOn: 1 });
      const end = addDays(start, 6); end.setHours(23, 59, 59, 999);
      return { rangeStart: start, rangeEnd: end, days: eachDayOfInterval({ start, end }) };
    }
    const start = startOfMonth(focusDate); const end = endOfMonth(focusDate);
    return { rangeStart: start, rangeEnd: end, days: eachDayOfInterval({ start, end }) };
  }, [viewMode, focusDate]);

  const expandedBlocks = useMemo(() => blocks.flatMap((b) => expandRecurrence(b, rangeStart, rangeEnd)), [blocks, rangeStart, rangeEnd]);

  const overlappingPairs = useMemo(() => {
    const pairs: [string, string][] = [];
    for (let i = 0; i < expandedBlocks.length; i++)
      for (let j = i + 1; j < expandedBlocks.length; j++)
        if (expandedBlocks[i].screen_id === expandedBlocks[j].screen_id && blocksOverlap(expandedBlocks[i], expandedBlocks[j]))
          pairs.push([expandedBlocks[i].id, expandedBlocks[j].id]);
    return pairs;
  }, [expandedBlocks]);

  const isOverlapping = useCallback((blockId: string) => overlappingPairs.some(([a, b]) => a === blockId || b === blockId), [overlappingPairs]);

  /* ── Navigation ── */
  const nav = (dir: number) => {
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
    if (endDate <= startDate) { toast.error("End time must be after start time"); return; }

    const { error } = await supabase.from("schedule_blocks").insert({
      screen_id: selectedScreenId, media_id: newBlock.media_id || null, playlist_id: newBlock.playlist_id || null,
      start_at: startDate.toISOString(), end_at: endDate.toISOString(), block_type: newBlock.block_type,
      recurrence: newBlock.recurrence,
      color_code: newBlock.block_type === "blackout" ? "dark" : newBlock.block_type === "hype_override" ? "magenta" : newBlock.color_code,
      priority: newBlock.block_type === "hype_override" ? 999 : newBlock.priority,
      label: newBlock.label || (newBlock.block_type === "blackout" ? "Blackout" : ""), user_id: user.id,
    } as any);
    if (error) { toast.error("Failed to create block"); return; }
    hapticSuccess();
    toast.success("Schedule block created");
    setShowCreateDialog(false); setPendingSlot(null);
    setNewBlock({ block_type: "content", start_time: "09:00", end_time: "17:00", recurrence: "none", label: "", color_code: "teal", priority: 0, media_id: "", playlist_id: "" });
    fetchBlocks();
  };

  /* ── Delete block ── */
  const handleDeleteBlock = async (blockId: string) => {
    const { error } = await supabase.from("schedule_blocks").delete().eq("id", blockId);
    if (error) toast.error("Failed to delete");
    else { hapticWarning(); toast.success("Block deleted"); fetchBlocks(); setEditBlock(null); }
  };

  /* ── Resize block (drag bottom edge) ── */
  const handleResizeStart = (e: React.MouseEvent | React.TouchEvent, block: ScheduleBlock, currentHeight: number) => {
    e.stopPropagation(); e.preventDefault();
    hapticMedium();
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    resizingRef.current = { blockId: block.id, startY, originalEndAt: block.end_at, originalHeight: currentHeight };

    const onMove = (ev: MouseEvent | TouchEvent) => {
      if (!resizingRef.current) return;
      const currentY = 'touches' in ev ? ev.touches[0].clientY : (ev as MouseEvent).clientY;
      const delta = currentY - resizingRef.current.startY;
      const newHeight = Math.max(SNAP_PX, snapToGrid(resizingRef.current.originalHeight + delta));
      const handle = document.getElementById(`resize-block-${block.id}`);
      if (handle) {
        const parent = handle.parentElement;
        if (parent) parent.style.height = `${newHeight}px`;
      }
    };
    const onEnd = async (ev: MouseEvent | TouchEvent) => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onEnd);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onEnd);
      if (!resizingRef.current) return;
      const currentY = 'changedTouches' in ev ? ev.changedTouches[0].clientY : (ev as MouseEvent).clientY;
      const delta = currentY - resizingRef.current.startY;
      const addedMinutes = Math.round((delta / HOUR_HEIGHT) * 60 / SNAP_MINUTES) * SNAP_MINUTES;
      const origEnd = new Date(resizingRef.current.originalEndAt);
      origEnd.setMinutes(origEnd.getMinutes() + addedMinutes);
      const startAt = new Date(block.start_at);
      if (origEnd <= startAt) { origEnd.setTime(startAt.getTime() + SNAP_MINUTES * 60000); }
      const { error } = await supabase.from("schedule_blocks").update({ end_at: origEnd.toISOString() } as any).eq("id", block.id);
      if (error) toast.error("Failed to resize");
      else { hapticSuccess(); fetchBlocks(); }
      resizingRef.current = null;
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onEnd);
    document.addEventListener("touchmove", onMove, { passive: false });
    document.addEventListener("touchend", onEnd);
  };

  /* ── Copy to Tomorrow ── */
  const handleCopyToTomorrow = async () => {
    if (!user || !selectedScreenId) return;
    setCopyingTomorrow(true);
    const today = new Date(focusDate); today.setHours(0, 0, 0, 0);
    const tomorrow = addDays(today, 1);
    const todayBlocks = expandedBlocks.filter((b) => isSameDay(new Date(b.start_at), today));
    if (todayBlocks.length === 0) { toast.error("No blocks to copy"); setCopyingTomorrow(false); return; }
    const dayDiff = tomorrow.getTime() - today.getTime();
    const inserts = todayBlocks.map((b) => ({
      screen_id: selectedScreenId, media_id: b.media_id, playlist_id: b.playlist_id,
      start_at: new Date(new Date(b.start_at).getTime() + dayDiff).toISOString(),
      end_at: new Date(new Date(b.end_at).getTime() + dayDiff).toISOString(),
      block_type: b.block_type, recurrence: "none", color_code: b.color_code,
      priority: b.priority, label: b.label, user_id: user.id,
    }));
    const { error } = await supabase.from("schedule_blocks").insert(inserts as any);
    if (error) toast.error("Failed to copy");
    else { hapticSuccess(); toast.success(`Copied ${inserts.length} blocks to ${format(tomorrow, "MMM d")}`); fetchBlocks(); }
    setCopyingTomorrow(false);
  };

  /* ── Click on timeline slot ── */
  const handleSlotClick = (day: Date, hour: number) => {
    hapticLight();
    setPendingSlot({ day, hour });
    setNewBlock((prev) => ({
      ...prev, start_time: `${hour.toString().padStart(2, "0")}:00`,
      end_time: `${Math.min(hour + 1, 23).toString().padStart(2, "0")}:00`,
    }));
    setShowCreateDialog(true);
  };

  /* ── Scroll to 8am on mount ── */
  useEffect(() => {
    if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 8 * HOUR_HEIGHT;
  }, [viewMode, selectedScreenId]);

  /* ── Now-playing detection ── */
  const nowPlaying = useMemo(() => {
    const now = new Date();
    return expandedBlocks
      .filter((b) => new Date(b.start_at) <= now && new Date(b.end_at) > now && b.block_type !== "blackout")
      .sort((a, b) => b.priority - a.priority)[0] ?? null;
  }, [expandedBlocks]);

  const getMediaName = (id: string | null) => media.find((m) => m.id === id)?.name ?? "";
  const getMediaType = (id: string | null) => media.find((m) => m.id === id)?.type ?? "";
  const getMediaPath = (id: string | null) => media.find((m) => m.id === id)?.storage_path ?? "";
  const getPlaylistName = (id: string | null) => playlists.find((p) => p.id === id)?.title ?? "";

  if (loading) return <div className="flex items-center justify-center h-full"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0B1120]">
      <SEOHead title="Schedule — Glow" description="Advanced multi-day scheduling engine" />

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-b border-[#1E293B]/60 bg-[#0B1120]/80 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-5 w-5 text-[#00E5CC]" />
          <h1 className="text-lg font-bold text-[#E2E8F0]">Schedule Engine</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedScreenId} onValueChange={setSelectedScreenId}>
            <SelectTrigger className="w-[180px] bg-[#0F1A2E] border-[#1E293B]">
              <Monitor className="h-3.5 w-3.5 mr-1.5 text-[#00E5CC]" /><SelectValue placeholder="Select screen" />
            </SelectTrigger>
            <SelectContent>{screens.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>

          <div className="flex rounded-lg border border-[#1E293B] bg-[#0F1A2E] overflow-hidden">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition-all ${viewMode === mode ? "bg-[#00A3A3]/20 text-[#00E5CC] shadow-[inset_0_0_10px_rgba(0,163,163,0.15)]" : "text-[#64748B] hover:text-[#94A3B8]"}`}>
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <button onClick={() => setFocusDate(new Date())} className="text-xs font-medium px-2 py-1 rounded hover:bg-[#1E293B]/50 text-[#94A3B8] transition-colors">Today</button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => nav(1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>

          <span className="text-sm font-medium text-[#94A3B8]">
            {viewMode === "day" && format(focusDate, "EEEE, MMM d, yyyy")}
            {viewMode === "week" && `${format(rangeStart, "MMM d")} — ${format(rangeEnd, "MMM d, yyyy")}`}
            {viewMode === "month" && format(focusDate, "MMMM yyyy")}
          </span>
        </div>
      </div>

      {/* ── Action bar ── */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[#1E293B]/40 text-xs bg-[#0B1120]/60">
        <span className="flex items-center gap-1.5"><Film className="h-3 w-3 text-[#00E5CC]" /> Video</span>
        <span className="flex items-center gap-1.5"><Image className="h-3 w-3 text-[#60A5FA]" /> Image</span>
        <span className="flex items-center gap-1.5"><Zap className="h-3 w-3 text-[#FF66FF]" /> Hype</span>
        <span className="flex items-center gap-1.5"><Moon className="h-3 w-3 text-[#94A3B8]" /> Blackout</span>
        {overlappingPairs.length > 0 && <span className="flex items-center gap-1.5 text-[#FF4466]"><AlertTriangle className="h-3 w-3" /> {overlappingPairs.length} conflict{overlappingPairs.length > 1 ? "s" : ""}</span>}
        <div className="flex-1" />
        {viewMode === "day" && (
          <>
            <Button variant="outline" size="sm" className="h-7 text-xs border-[#1E293B] bg-[#0F1A2E] hover:bg-[#1E293B]" onClick={handleCopyToTomorrow} disabled={copyingTomorrow}>
              <Copy className="h-3 w-3 mr-1" />{copyingTomorrow ? "Copying…" : "Copy to Tomorrow"}
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs border-[#1E293B] bg-[#0F1A2E] hover:bg-[#1E293B]" onClick={() => setShowPreview(true)}>
              <Eye className="h-3 w-3 mr-1" />Preview Now
            </Button>
          </>
        )}
      </div>

      {/* ── Timeline ── */}
      {viewMode === "month" ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-1">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <div key={d} className="text-center text-xs font-medium text-[#64748B] pb-2">{d}</div>)}
            {Array.from({ length: (days[0].getDay() + 6) % 7 }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const dayBlocks = expandedBlocks.filter((b) => isSameDay(new Date(b.start_at), day));
              return (
                <div key={day.toISOString()} onClick={() => { setFocusDate(day); setViewMode("day"); }}
                  className={`min-h-[80px] rounded-lg border p-1.5 cursor-pointer transition-all hover:border-[#00A3A3]/40 ${isSameDay(day, new Date()) ? "border-[#00A3A3]/50 bg-[#00A3A3]/5" : "border-[#1E293B]/50 bg-[#0B1120]/50"}`}>
                  <span className={`text-xs font-medium ${isSameDay(day, new Date()) ? "text-[#00E5CC]" : "text-[#94A3B8]"}`}>{format(day, "d")}</span>
                  <div className="mt-1 space-y-0.5">
                    {dayBlocks.slice(0, 3).map((b, i) => {
                      const c = COLOR_MAP[b.color_code] || COLOR_MAP.teal;
                      return <div key={`${b.id}-${i}`} className={`rounded px-1 py-0.5 text-[10px] truncate ${c.bg} ${c.text} ${c.border} border`}>{b.label || "▶"}</div>;
                    })}
                    {dayBlocks.length > 3 && <span className="text-[10px] text-[#64748B]">+{dayBlocks.length - 3}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="flex-1 overflow-hidden flex">
          {/* Time gutter */}
          <div className="w-16 shrink-0 border-r border-[#1E293B]/40 bg-[#0B1120]">
            <div className="h-10" />
            <div className="overflow-auto" style={{ height: "calc(100vh - 210px)" }}>
              {HOURS.map((h) => (
                <div key={h} style={{ height: HOUR_HEIGHT }} className="relative">
                  <span className="absolute -top-2 right-3 text-[11px] text-[#475569] font-mono select-none">
                    {`${h.toString().padStart(2, "0")}:00`}
                  </span>
                  <div className="absolute right-0 top-0 w-2 border-t border-[#1E293B]/30" />
                  <div className="absolute right-0 w-1.5 border-t border-[#1E293B]/15" style={{ top: HALF_HOUR_HEIGHT }} />
                </div>
              ))}
            </div>
          </div>

          {/* Day columns */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex" style={{ minWidth: viewMode === "day" ? "100%" : `${days.length * 200}px` }}>
              {days.map((day) => {
                const dayBlocks = expandedBlocks.filter((b) => isSameDay(new Date(b.start_at), day));
                return (
                  <div key={day.toISOString()} className="flex-1 min-w-[180px] border-r border-[#1E293B]/20">
                    <div className={`h-10 flex items-center justify-center text-xs font-semibold border-b border-[#1E293B]/40 ${isSameDay(day, new Date()) ? "text-[#00E5CC] bg-[#00A3A3]/5" : "text-[#94A3B8]"}`}>
                      {format(day, viewMode === "day" ? "EEEE, MMM d" : "EEE d")}
                    </div>

                    <div ref={viewMode === "day" ? scrollContainerRef : undefined} className="relative overflow-auto" style={{ height: "calc(100vh - 210px)" }}>
                      {/* Hour grid lines */}
                      {HOURS.map((h) => (
                        <div key={h} style={{ height: HOUR_HEIGHT }} className="border-b border-[#1E293B]/15 cursor-pointer hover:bg-[#00A3A3]/[0.03] transition-colors relative" onClick={() => handleSlotClick(day, h)}>
                          <div className="absolute left-0 right-0 border-b border-dashed border-[#1E293B]/10" style={{ top: HALF_HOUR_HEIGHT }} />
                        </div>
                      ))}

                      {/* Blocks */}
                      {dayBlocks.map((block, idx) => {
                        const { top, height } = getBlockStyle(block, day);
                        const colors = COLOR_MAP[block.color_code] || COLOR_MAP.teal;
                        const hasOverlap = isOverlapping(block.id);
                        const mediaType = block.media_id ? getMediaType(block.media_id) : "";
                        const isVideo = mediaType === "video";
                        const mediaPath = block.media_id ? getMediaPath(block.media_id) : "";
                        const showThumb = block.block_type === "content" && mediaPath && !isVideo;

                        return (
                          <div key={`${block.id}-${idx}`} id={`resize-block-${block.id}`}
                            className={`absolute left-2 right-2 rounded-xl border backdrop-blur-sm cursor-pointer transition-shadow group ${colors.bg} ${colors.border} ${colors.glow} ${hasOverlap ? "ring-1 ring-[#FF003C]/50" : ""} ${block.block_type === "blackout" ? "opacity-70" : ""}`}
                            style={{ top, height, minHeight: 28, zIndex: 10 + block.priority }}
                            onClick={(e) => { e.stopPropagation(); setEditBlock(block); }}>
                            <div className="px-2.5 py-1.5 overflow-hidden h-full flex gap-2">
                              {/* Thumbnail */}
                              {showThumb && height > 40 && (
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-white/10">
                                  <img src={getStorageUrl(mediaPath)} alt="" className="w-full h-full object-cover" loading="lazy" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0 flex flex-col">
                                <div className="flex items-center gap-1">
                                  {block.block_type === "blackout" && <Moon className="h-3 w-3 shrink-0" />}
                                  {block.block_type === "hype_override" && <Zap className="h-3 w-3 shrink-0 animate-pulse" />}
                                  {block.block_type === "content" && isVideo && <Film className="h-3 w-3 shrink-0" />}
                                  {block.block_type === "content" && !isVideo && block.media_id && <Image className="h-3 w-3 shrink-0" />}
                                  <span className={`text-[11px] font-semibold truncate ${colors.text}`}>
                                    {block.label || getMediaName(block.media_id) || getPlaylistName(block.playlist_id) || block.block_type}
                                  </span>
                                </div>
                                {height > 40 && (
                                  <span className="text-[10px] text-[#64748B] mt-0.5">
                                    {format(new Date(block.start_at), "HH:mm")} – {format(new Date(block.end_at), "HH:mm")}
                                  </span>
                                )}
                                {height > 56 && block.recurrence !== "none" && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 mt-0.5 w-fit border-[#475569]/40 text-[#64748B]">↻ {block.recurrence}</Badge>
                                )}
                                {hasOverlap && height > 48 && (
                                  <span className="text-[8px] text-[#FF4466] flex items-center gap-0.5 mt-0.5"><AlertTriangle className="h-2.5 w-2.5" /> Overlap</span>
                                )}
                              </div>
                            </div>
                            {/* Resize handle */}
                            <div className="absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center cursor-s-resize opacity-0 group-hover:opacity-100 transition-opacity"
                              onMouseDown={(e) => handleResizeStart(e, block, height)}
                              onTouchStart={(e) => handleResizeStart(e, block, height)}>
                              <GripHorizontal className="h-3 w-3 text-[#64748B]" />
                            </div>
                          </div>
                        );
                      })}

                      {/* Current time indicator */}
                      {isSameDay(day, new Date()) && (
                        <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: currentTimeTop }}>
                          <div className="relative">
                            <div className="absolute -left-0.5 -top-[5px] w-3 h-3 rounded-full bg-[#00E5CC] shadow-[0_0_12px_rgba(0,229,204,0.7),0_0_24px_rgba(0,229,204,0.3)]" />
                            <div className="h-[2px] bg-gradient-to-r from-[#00E5CC] via-[#00E5CC]/60 to-transparent shadow-[0_0_8px_rgba(0,229,204,0.5)]" />
                          </div>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-4 w-4 text-[#00E5CC]" /> New Schedule Block</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs text-[#94A3B8]">Block Type</Label>
              <div className="flex gap-2 mt-1.5">
                {([
                  { value: "content", label: "Content", icon: Film, color: "text-[#00E5CC]" },
                  { value: "blackout", label: "Blackout", icon: Moon, color: "text-[#94A3B8]" },
                  { value: "hype_override", label: "Hype Override", icon: Zap, color: "text-[#FF66FF]" },
                ] as const).map(({ value, label, icon: Icon, color }) => (
                  <button key={value} onClick={() => setNewBlock((p) => ({ ...p, block_type: value }))}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg border text-xs font-medium transition-all ${newBlock.block_type === value ? `border-[#00A3A3]/50 bg-[#00A3A3]/10 ${color}` : "border-[#1E293B] text-[#64748B] hover:border-[#475569]"}`}>
                    <Icon className="h-3.5 w-3.5" />{label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs text-[#94A3B8]">Start</Label><Input type="time" value={newBlock.start_time} onChange={(e) => setNewBlock((p) => ({ ...p, start_time: e.target.value }))} className="bg-[#0B1120] border-[#1E293B] mt-1" /></div>
              <div><Label className="text-xs text-[#94A3B8]">End</Label><Input type="time" value={newBlock.end_time} onChange={(e) => setNewBlock((p) => ({ ...p, end_time: e.target.value }))} className="bg-[#0B1120] border-[#1E293B] mt-1" /></div>
            </div>
            <div><Label className="text-xs text-[#94A3B8]">Label</Label><Input value={newBlock.label} onChange={(e) => setNewBlock((p) => ({ ...p, label: e.target.value }))} placeholder="e.g. Morning Promo" className="bg-[#0B1120] border-[#1E293B] mt-1" /></div>
            {newBlock.block_type === "content" && (
              <div>
                <Label className="text-xs text-[#94A3B8]">Content</Label>
                <div className="grid grid-cols-2 gap-2 mt-1.5">
                  <Select value={newBlock.media_id || "none"} onValueChange={(v) => setNewBlock((p) => ({ ...p, media_id: v === "none" ? "" : v, playlist_id: "" }))}>
                    <SelectTrigger className="bg-[#0B1120] border-[#1E293B]"><SelectValue placeholder="Media" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">No media</SelectItem>{media.map((m) => <SelectItem key={m.id} value={m.id}>{m.type === "video" ? "🎬" : "🖼"} {m.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={newBlock.playlist_id || "none"} onValueChange={(v) => setNewBlock((p) => ({ ...p, playlist_id: v === "none" ? "" : v, media_id: "" }))}>
                    <SelectTrigger className="bg-[#0B1120] border-[#1E293B]"><SelectValue placeholder="Playlist" /></SelectTrigger>
                    <SelectContent><SelectItem value="none">No playlist</SelectItem>{playlists.map((p) => <SelectItem key={p.id} value={p.id}>📋 {p.title}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="mt-3">
                  <Label className="text-xs text-[#94A3B8]">Color</Label>
                  <div className="flex gap-2 mt-1.5">
                    {(["teal", "magenta", "amber", "blue", "red"] as const).map((c) => {
                      const cl = COLOR_MAP[c];
                      return <button key={c} onClick={() => setNewBlock((p) => ({ ...p, color_code: c }))} className={`w-8 h-8 rounded-lg border-2 transition-all ${cl.bg} ${newBlock.color_code === c ? `${cl.border} ${cl.glow} scale-110` : "border-transparent"}`} />;
                    })}
                  </div>
                </div>
              </div>
            )}
            <div>
              <Label className="text-xs text-[#94A3B8]">Repeat</Label>
              <Select value={newBlock.recurrence} onValueChange={(v) => setNewBlock((p) => ({ ...p, recurrence: v }))}>
                <SelectTrigger className="bg-[#0B1120] border-[#1E293B] mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repeat</SelectItem><SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem><SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {newBlock.block_type !== "hype_override" && (
              <div><Label className="text-xs text-[#94A3B8]">Priority</Label><Input type="number" value={newBlock.priority} onChange={(e) => setNewBlock((p) => ({ ...p, priority: parseInt(e.target.value) || 0 }))} className="bg-[#0B1120] border-[#1E293B] mt-1 w-24" min={0} max={100} /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowCreateDialog(false)}>Cancel</Button>
            <Button onClick={handleCreateBlock} className="bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] text-[#0B1120] font-semibold hover:shadow-[0_0_20px_rgba(0,163,163,0.35)]">Create Block</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ EDIT DIALOG ══════════ */}
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
              {/* Thumbnail preview */}
              {editBlock.media_id && getMediaPath(editBlock.media_id) && getMediaType(editBlock.media_id) !== "video" && (
                <div className="rounded-lg overflow-hidden border border-[#1E293B] h-32">
                  <img src={getStorageUrl(getMediaPath(editBlock.media_id))} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-[#64748B] text-xs">Start</span><p className="text-[#E2E8F0]">{format(new Date(editBlock.start_at), "MMM d, HH:mm")}</p></div>
                <div><span className="text-[#64748B] text-xs">End</span><p className="text-[#E2E8F0]">{format(new Date(editBlock.end_at), "MMM d, HH:mm")}</p></div>
              </div>
              <Separator className="bg-[#1E293B]" />
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-[#64748B] text-xs">Type</span><p className="text-[#E2E8F0] capitalize">{editBlock.block_type.replace("_", " ")}</p></div>
                <div><span className="text-[#64748B] text-xs">Recurrence</span><p className="text-[#E2E8F0] capitalize">{editBlock.recurrence}</p></div>
              </div>
              {editBlock.media_id && <div><span className="text-[#64748B] text-xs">Media</span><p className="text-[#E2E8F0]">{getMediaName(editBlock.media_id)}</p></div>}
              {editBlock.playlist_id && <div><span className="text-[#64748B] text-xs">Playlist</span><p className="text-[#E2E8F0]">{getPlaylistName(editBlock.playlist_id)}</p></div>}
              {isOverlapping(editBlock.id) && (
                <div className="rounded-lg border border-[#FF003C]/30 bg-[#FF003C]/10 p-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#FF4466] shrink-0" />
                  <span className="text-xs text-[#FF4466]">Overlaps with another block. Higher priority wins.</span>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" size="sm" onClick={() => setEditBlock(null)}>Close</Button>
            <Button variant="destructive" size="sm" onClick={() => editBlock && handleDeleteBlock(editBlock.id)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══════════ PREVIEW DIALOG ══════════ */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="bg-[#0B1120] border-[#1E293B] max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Eye className="h-4 w-4 text-[#00E5CC]" /> Now Playing</DialogTitle></DialogHeader>
          {nowPlaying ? (
            <div className="space-y-3">
              {nowPlaying.media_id && getMediaPath(nowPlaying.media_id) && (
                <div className="rounded-xl overflow-hidden border border-[#1E293B] aspect-video bg-[#0F1A2E]">
                  {getMediaType(nowPlaying.media_id) === "video" ? (
                    <video src={getStorageUrl(getMediaPath(nowPlaying.media_id))} className="w-full h-full object-contain" autoPlay muted loop />
                  ) : (
                    <img src={getStorageUrl(getMediaPath(nowPlaying.media_id))} alt="" className="w-full h-full object-contain" />
                  )}
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-[#00E5CC] animate-pulse shadow-[0_0_8px_rgba(0,229,204,0.6)]" />
                <div>
                  <p className="text-sm font-semibold text-[#E2E8F0]">{nowPlaying.label || getMediaName(nowPlaying.media_id) || getPlaylistName(nowPlaying.playlist_id) || "Content"}</p>
                  <p className="text-xs text-[#64748B]">{format(new Date(nowPlaying.start_at), "HH:mm")} – {format(new Date(nowPlaying.end_at), "HH:mm")}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Moon className="h-8 w-8 text-[#475569] mx-auto mb-2" />
              <p className="text-sm text-[#64748B]">Nothing scheduled right now</p>
              <p className="text-xs text-[#475569] mt-1">The screen is idle or in blackout</p>
            </div>
          )}
          <DialogFooter><Button variant="ghost" onClick={() => setShowPreview(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
