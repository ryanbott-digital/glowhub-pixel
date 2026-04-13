import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
  Copy, AlertTriangle, RefreshCw, Eye, GripHorizontal, Clipboard, CalendarRange, Sparkles,
  PanelLeftOpen, PanelLeftClose, Search, GripVertical, ArrowLeft, X
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
const HOUR_HEIGHT = 80;
const HALF_HOUR_HEIGHT = HOUR_HEIGHT / 2;
const SNAP_MINUTES = 15;
const SNAP_PX = (SNAP_MINUTES / 60) * HOUR_HEIGHT;
const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

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
  const navigate = useNavigate();
  const [screens, setScreens] = useState<Screen[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistItem[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("week");
  const [focusDate, setFocusDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [editBlock, setEditBlock] = useState<ScheduleBlock | null>(null);
  const [pendingSlot, setPendingSlot] = useState<{ day: Date; hour: number } | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copyingTomorrow, setCopyingTomorrow] = useState(false);
  const [currentTimeTop, setCurrentTimeTop] = useState(0);
  const [clipboard, setClipboard] = useState<ScheduleBlock | null>(null);
  const [showClipboard, setShowClipboard] = useState(false);
  const [patternSuggestion, setPatternSuggestion] = useState<{ block: ScheduleBlock; daysFound: number[] } | null>(null);
  const [draggingBlock, setDraggingBlock] = useState<{ block: ScheduleBlock; originDay: Date } | null>(null);
  const [mediaSidebarOpen, setMediaSidebarOpen] = useState(false);
  const [mediaSidebarSearch, setMediaSidebarSearch] = useState("");
  const [mediaDragItem, setMediaDragItem] = useState<MediaItem | null>(null);
  const [newBlock, setNewBlock] = useState({
    block_type: "content" as "content" | "blackout" | "hype_override",
    start_time: "09:00", end_time: "17:00", recurrence: "none" as string,
    label: "", color_code: "teal", priority: 0, media_id: "" as string, playlist_id: "" as string,
  });

  /* Refs for synced scroll */
  const gutterScrollRef = useRef<HTMLDivElement>(null);
  const columnsScrollRef = useRef<HTMLDivElement>(null);
  const scrollingSource = useRef<string | null>(null);
  const resizingRef = useRef<{ blockId: string; startY: number; originalEndAt: string; originalHeight: number } | null>(null);

  /* ── Synced vertical scroll ── */
  const handleGutterScroll = () => {
    if (scrollingSource.current === "columns") return;
    scrollingSource.current = "gutter";
    if (columnsScrollRef.current && gutterScrollRef.current) {
      columnsScrollRef.current.scrollTop = gutterScrollRef.current.scrollTop;
    }
    requestAnimationFrame(() => { scrollingSource.current = null; });
  };
  const handleColumnsScroll = () => {
    if (scrollingSource.current === "gutter") return;
    scrollingSource.current = "columns";
    if (gutterScrollRef.current && columnsScrollRef.current) {
      gutterScrollRef.current.scrollTop = columnsScrollRef.current.scrollTop;
    }
    requestAnimationFrame(() => { scrollingSource.current = null; });
  };

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

  /* ── Fetch blocks — single query for entire week ── */
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

  /* ── Pattern recognition ── */
  useEffect(() => {
    if (viewMode !== "week" || expandedBlocks.length < 2) { setPatternSuggestion(null); return; }
    // Find blocks that appear on exactly 2 consecutive weekdays and suggest the rest
    const weekdayBlocks = expandedBlocks.filter(b => {
      const d = new Date(b.start_at).getDay();
      return d >= 1 && d <= 5 && b.block_type === "content";
    });
    // Group by label + time
    const groups = new Map<string, number[]>();
    for (const b of weekdayBlocks) {
      const start = new Date(b.start_at);
      const key = `${b.label || b.media_id || b.playlist_id}__${start.getHours()}:${start.getMinutes()}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(start.getDay());
    }
    for (const [, foundDays] of groups) {
      const unique = [...new Set(foundDays)].sort();
      if (unique.length === 2 && unique[1] - unique[0] === 1 && unique.length < 5) {
        // Found a pattern on 2 consecutive days — suggest the rest of the workweek
        const sourceBlock = weekdayBlocks.find(b => {
          const d = new Date(b.start_at).getDay();
          return d === unique[0];
        });
        if (sourceBlock) {
          setPatternSuggestion({ block: sourceBlock, daysFound: unique });
          return;
        }
      }
    }
    setPatternSuggestion(null);
  }, [expandedBlocks, viewMode]);

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

  /* ── Apply block to entire week ── */
  const handleApplyToWeek = async (block: ScheduleBlock) => {
    if (!user || !selectedScreenId) return;
    const origStart = new Date(block.start_at);
    const origEnd = new Date(block.end_at);
    const duration = origEnd.getTime() - origStart.getTime();
    const origDayOfWeek = origStart.getDay();
    const weekStart = startOfWeek(origStart, { weekStartsOn: 1 });
    const inserts: any[] = [];

    for (let d = 0; d < 7; d++) {
      const targetDay = addDays(weekStart, d);
      if (targetDay.getDay() === origDayOfWeek) continue; // skip the original day
      const newStart = new Date(targetDay);
      newStart.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds(), 0);
      const newEnd = new Date(newStart.getTime() + duration);
      inserts.push({
        screen_id: selectedScreenId, media_id: block.media_id, playlist_id: block.playlist_id,
        start_at: newStart.toISOString(), end_at: newEnd.toISOString(),
        block_type: block.block_type, recurrence: "none", color_code: block.color_code,
        priority: block.priority, label: block.label, user_id: user.id,
      });
    }
    const { error } = await supabase.from("schedule_blocks").insert(inserts as any);
    if (error) toast.error("Failed to apply to week");
    else { hapticSuccess(); toast.success(`Applied to ${inserts.length} days`); fetchBlocks(); setEditBlock(null); }
  };

  /* ── Apply pattern to remaining weekdays ── */
  const handleApplyPattern = async () => {
    if (!patternSuggestion || !user || !selectedScreenId) return;
    const block = patternSuggestion.block;
    const origStart = new Date(block.start_at);
    const origEnd = new Date(block.end_at);
    const duration = origEnd.getTime() - origStart.getTime();
    const weekStart = startOfWeek(origStart, { weekStartsOn: 1 });
    const missingDays = [1, 2, 3, 4, 5].filter(d => !patternSuggestion.daysFound.includes(d));
    const inserts: any[] = [];

    for (const dayNum of missingDays) {
      const offset = dayNum - 1; // Mon=1 → offset 0
      const targetDay = addDays(weekStart, offset);
      const newStart = new Date(targetDay);
      newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
      const newEnd = new Date(newStart.getTime() + duration);
      inserts.push({
        screen_id: selectedScreenId, media_id: block.media_id, playlist_id: block.playlist_id,
        start_at: newStart.toISOString(), end_at: newEnd.toISOString(),
        block_type: block.block_type, recurrence: "none", color_code: block.color_code,
        priority: block.priority, label: block.label, user_id: user.id,
      });
    }
    const { error } = await supabase.from("schedule_blocks").insert(inserts as any);
    if (error) toast.error("Failed to apply pattern");
    else { hapticSuccess(); toast.success(`Applied to ${inserts.length} remaining weekdays`); setPatternSuggestion(null); fetchBlocks(); }
  };

  /* ── Cross-day drag: move block to a different day ── */
  const handleCrossDayDrop = async (block: ScheduleBlock, targetDay: Date) => {
    const origStart = new Date(block.start_at);
    const origEnd = new Date(block.end_at);
    const duration = origEnd.getTime() - origStart.getTime();
    const newStart = new Date(targetDay);
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), origStart.getSeconds(), 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const { error } = await supabase.from("schedule_blocks").update({
      start_at: newStart.toISOString(), end_at: newEnd.toISOString(),
    } as any).eq("id", block.id);
    if (error) toast.error("Failed to move block");
    else { hapticSuccess(); toast.success(`Moved to ${format(targetDay, "EEE")}`); fetchBlocks(); }
    setDraggingBlock(null);
  };

  /* ── Clipboard: paste block onto a day ── */
  const handlePasteFromClipboard = async (targetDay: Date) => {
    if (!clipboard || !user || !selectedScreenId) return;
    const origStart = new Date(clipboard.start_at);
    const origEnd = new Date(clipboard.end_at);
    const duration = origEnd.getTime() - origStart.getTime();
    const newStart = new Date(targetDay);
    newStart.setHours(origStart.getHours(), origStart.getMinutes(), 0, 0);
    const newEnd = new Date(newStart.getTime() + duration);

    const { error } = await supabase.from("schedule_blocks").insert({
      screen_id: selectedScreenId, media_id: clipboard.media_id, playlist_id: clipboard.playlist_id,
      start_at: newStart.toISOString(), end_at: newEnd.toISOString(),
      block_type: clipboard.block_type, recurrence: "none", color_code: clipboard.color_code,
      priority: clipboard.priority, label: clipboard.label, user_id: user.id,
    } as any);
    if (error) toast.error("Failed to paste block");
    else { hapticSuccess(); toast.success(`Pasted to ${format(targetDay, "EEE MMM d")}`); fetchBlocks(); }
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
    if (draggingBlock) return;
    // If clipboard is active, paste
    if (clipboard) {
      handlePasteFromClipboard(day);
      return;
    }
    hapticLight();
    setPendingSlot({ day, hour });
    setNewBlock((prev) => ({
      ...prev, start_time: `${hour.toString().padStart(2, "0")}:00`,
      end_time: `${Math.min(hour + 1, 23).toString().padStart(2, "0")}:00`,
    }));
    setShowCreateDialog(true);
  };

  /* ── Drop media onto timeline slot ── */
  const handleMediaDrop = async (day: Date, hour: number, e: React.DragEvent) => {
    e.preventDefault();
    const mediaId = e.dataTransfer.getData("application/glow-media-id");
    if (!mediaId || !user || !selectedScreenId) return;
    const item = media.find((m) => m.id === mediaId);
    if (!item) return;

    const startDate = new Date(day);
    startDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(day);
    endDate.setHours(hour + 1, 0, 0, 0);

    const { error } = await supabase.from("schedule_blocks").insert({
      screen_id: selectedScreenId, media_id: mediaId, playlist_id: null,
      start_at: startDate.toISOString(), end_at: endDate.toISOString(),
      block_type: "content", recurrence: "none", color_code: "teal",
      priority: 0, label: item.name, user_id: user.id,
    } as any);
    if (error) { toast.error("Failed to create block"); return; }
    hapticSuccess();
    toast.success(`"${item.name}" scheduled at ${hour.toString().padStart(2, "0")}:00`);
    setMediaDragItem(null);
    fetchBlocks();
  };


  useEffect(() => {
    const scrollTo8am = () => {
      if (gutterScrollRef.current) gutterScrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
      if (columnsScrollRef.current) columnsScrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
    };
    setTimeout(scrollTo8am, 100);
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

  const timelineHeight = "calc(100vh - 220px)";

  /* ══════════════════ RENDER ══════════════════ */
  return (
    <div className="flex flex-col h-full overflow-hidden bg-[#0B1120]">
      <SEOHead title="Schedule — Glow" description="Advanced multi-day scheduling engine" />

      {/* ── Header ── */}
      <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-b border-[#1E293B]/60 bg-[#0B1120]/80 backdrop-blur-xl">
        {/* Back / Close button */}
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-[#94A3B8] hover:text-[#E2E8F0]" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        <CalendarClock className="h-5 w-5 text-[#00E5CC] shrink-0 hidden sm:block" />
        <h1 className="text-sm sm:text-lg font-bold text-[#E2E8F0] truncate">Schedule</h1>

        <div className="flex-1" />

        {/* Controls row — scrollable on mobile */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide">
          <Select value={selectedScreenId} onValueChange={setSelectedScreenId}>
            <SelectTrigger className="w-[130px] sm:w-[180px] bg-[#0F1A2E] border-[#1E293B] h-8 text-xs">
              <Monitor className="h-3 w-3 mr-1 text-[#00E5CC]" /><SelectValue placeholder="Screen" />
            </SelectTrigger>
            <SelectContent>{screens.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
          </Select>

          <div className="flex rounded-lg border border-[#1E293B] bg-[#0F1A2E] overflow-hidden shrink-0">
            {(["day", "week", "month"] as ViewMode[]).map((mode) => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-2 sm:px-3 py-1.5 text-[10px] sm:text-xs font-medium capitalize transition-all ${viewMode === mode ? "bg-[#00A3A3]/20 text-[#00E5CC] shadow-[inset_0_0_10px_rgba(0,163,163,0.15)]" : "text-[#64748B] hover:text-[#94A3B8]"}`}>
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => nav(-1)}><ChevronLeft className="h-3.5 w-3.5" /></Button>
            <button onClick={() => setFocusDate(new Date())} className="text-[10px] sm:text-xs font-medium px-1.5 py-1 rounded hover:bg-[#1E293B]/50 text-[#94A3B8] transition-colors">Today</button>
            <Button variant="ghost" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={() => nav(1)}><ChevronRight className="h-3.5 w-3.5" /></Button>
          </div>
        </div>
      </div>

      {/* ── Date label (separate row on mobile for space) ── */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 border-b border-[#1E293B]/30 bg-[#0B1120]/40">
        <span className="text-xs sm:text-sm font-medium text-[#94A3B8] truncate">
          {viewMode === "day" && format(focusDate, "EEE, MMM d, yyyy")}
          {viewMode === "week" && `${format(rangeStart, "MMM d")} — ${format(rangeEnd, "MMM d, yyyy")}`}
          {viewMode === "month" && format(focusDate, "MMMM yyyy")}
        </span>
        <div className="flex-1" />
        {/* Quick action buttons — visible on mobile too */}
        {viewMode === "day" && (
          <>
            <Button variant="outline" size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs border-[#1E293B] bg-[#0F1A2E] hover:bg-[#1E293B] px-2" onClick={handleCopyToTomorrow} disabled={copyingTomorrow}>
              <Copy className="h-3 w-3 mr-1" /><span className="hidden sm:inline">{copyingTomorrow ? "Copying…" : "Copy to Tomorrow"}</span><span className="sm:hidden">Copy</span>
            </Button>
            <Button variant="outline" size="sm" className="h-6 sm:h-7 text-[10px] sm:text-xs border-[#1E293B] bg-[#0F1A2E] hover:bg-[#1E293B] px-2" onClick={() => setShowPreview(true)}>
              <Eye className="h-3 w-3 mr-1" /><span className="hidden sm:inline">Preview Now</span><span className="sm:hidden">Preview</span>
            </Button>
          </>
        )}
      </div>

      {/* ── Action bar (legend + media toggle) ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 border-b border-[#1E293B]/40 text-[10px] sm:text-xs bg-[#0B1120]/60 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setMediaSidebarOpen((v) => !v)}
          className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all shrink-0 ${mediaSidebarOpen ? "border-[#00A3A3]/40 bg-[#00A3A3]/10 text-[#00E5CC]" : "border-[#1E293B] text-[#64748B] hover:text-[#94A3B8] hover:border-[#475569]"}`}
        >
          {mediaSidebarOpen ? <PanelLeftClose className="h-3 w-3" /> : <PanelLeftOpen className="h-3 w-3" />}
          <span className="hidden sm:inline">Media</span>
        </button>
        <span className="flex items-center gap-1 shrink-0"><Film className="h-3 w-3 text-[#00E5CC]" /><span className="hidden sm:inline">Video</span></span>
        <span className="flex items-center gap-1 shrink-0"><Image className="h-3 w-3 text-[#60A5FA]" /><span className="hidden sm:inline">Image</span></span>
        <span className="flex items-center gap-1 shrink-0"><Zap className="h-3 w-3 text-[#FF66FF]" /><span className="hidden sm:inline">Hype</span></span>
        <span className="flex items-center gap-1 shrink-0"><Moon className="h-3 w-3 text-[#94A3B8]" /><span className="hidden sm:inline">Blackout</span></span>
        {overlappingPairs.length > 0 && <span className="flex items-center gap-1 text-[#FF4466] shrink-0"><AlertTriangle className="h-3 w-3" /> {overlappingPairs.length}</span>}
        <div className="flex-1" />

        {/* Clipboard indicator */}
        {clipboard && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[#00A3A3]/30 bg-[#00A3A3]/10 shrink-0">
            <Clipboard className="h-3 w-3 text-[#00E5CC]" />
            <span className="text-[#00E5CC] text-[10px] font-medium truncate max-w-[60px] sm:max-w-[100px]">{clipboard.label || "Block"}</span>
            <button onClick={() => setClipboard(null)} className="text-[#64748B] hover:text-[#FF4466] text-[10px]">✕</button>
          </div>
        )}
      </div>

      {/* ── Pattern suggestion banner ── */}
      {patternSuggestion && viewMode === "week" && (
        <div className="mx-4 mt-2 flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[#00A3A3]/30 bg-gradient-to-r from-[#00A3A3]/10 to-[#0B1120] backdrop-blur-sm">
          <Sparkles className="h-4 w-4 text-[#00E5CC] shrink-0" />
          <span className="text-xs text-[#94A3B8] flex-1">
            <span className="text-[#00E5CC] font-medium">"{patternSuggestion.block.label || "Block"}"</span> is on {patternSuggestion.daysFound.map(d => DAY_NAMES[d - 1]).join(" & ")}. Apply to the rest of the work week?
          </span>
          <Button size="sm" className="h-7 text-xs bg-[#00A3A3]/20 text-[#00E5CC] border border-[#00A3A3]/40 hover:bg-[#00A3A3]/30" onClick={handleApplyPattern}>
            <CalendarRange className="h-3 w-3 mr-1" />Apply
          </Button>
          <button onClick={() => setPatternSuggestion(null)} className="text-[#475569] hover:text-[#94A3B8] text-sm">✕</button>
        </div>
      )}

      {/* ── Timeline ── */}
      {viewMode === "month" ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-7 gap-1">
            {DAY_NAMES.map((d) => <div key={d} className="text-center text-xs font-medium text-[#64748B] pb-2">{d}</div>)}
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
          {/* ── Media Library Sidebar ── */}
          {mediaSidebarOpen && (
            <div className="w-56 shrink-0 border-r border-[#1E293B]/40 bg-[#0B1120] flex flex-col">
              <div className="px-3 py-2 border-b border-[#1E293B]/40 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="h-3.5 w-3.5 text-[#00E5CC]" />
                  <span className="text-xs font-semibold text-[#E2E8F0]">Media Library</span>
                  <Badge variant="outline" className="ml-auto text-[9px] px-1.5 py-0 border-[#1E293B] text-[#64748B]">{media.length}</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-[#475569]" />
                  <Input
                    value={mediaSidebarSearch}
                    onChange={(e) => setMediaSidebarSearch(e.target.value)}
                    placeholder="Search…"
                    className="h-7 pl-7 text-xs bg-[#0F1A2E] border-[#1E293B]"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-1 scrollbar-hide">
                {media
                  .filter((m) => !mediaSidebarSearch || m.name.toLowerCase().includes(mediaSidebarSearch.toLowerCase()))
                  .map((item) => (
                    <div
                      key={item.id}
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("application/glow-media-id", item.id);
                        e.dataTransfer.effectAllowed = "copy";
                        setMediaDragItem(item);
                      }}
                      onDragEnd={() => setMediaDragItem(null)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded-lg border border-transparent hover:border-[#1E293B] hover:bg-[#0F1A2E] cursor-grab active:cursor-grabbing transition-all group"
                    >
                      <GripVertical className="h-3 w-3 text-[#475569] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      <div className="w-7 h-7 rounded-md overflow-hidden bg-[#1E293B] shrink-0 flex items-center justify-center">
                        {item.type === "video" ? (
                          <Film className="h-3.5 w-3.5 text-[#00E5CC]" />
                        ) : (
                          <img src={getStorageUrl(item.storage_path)} alt="" className="w-full h-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-medium text-[#E2E8F0] truncate">{item.name}</p>
                        <p className="text-[9px] text-[#475569] uppercase">{item.type}</p>
                      </div>
                    </div>
                  ))}
                {media.filter((m) => !mediaSidebarSearch || m.name.toLowerCase().includes(mediaSidebarSearch.toLowerCase())).length === 0 && (
                  <p className="text-[11px] text-[#475569] text-center py-4">No media found</p>
                )}
              </div>
              <div className="px-3 py-2 border-t border-[#1E293B]/40 shrink-0">
                <p className="text-[10px] text-[#475569] text-center">Drag media onto the timeline</p>
              </div>
            </div>
          )}
          {/* Time gutter — synced scroll */}
          <div className="w-16 shrink-0 border-r border-[#1E293B]/40 bg-[#0B1120] flex flex-col">
            {/* Gutter header spacer */}
            <div className="h-10 border-b border-[#1E293B]/40 shrink-0" />
            <div ref={gutterScrollRef} className="overflow-y-auto overflow-x-hidden flex-1 scrollbar-hide" style={{ height: timelineHeight }} onScroll={handleGutterScroll}>
              <div style={{ height: 24 * HOUR_HEIGHT }}>
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
          </div>

          {/* Day columns — horizontal scroll wrapper for week */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Fixed column headers */}
            <div className="flex shrink-0 border-b border-[#1E293B]/40 overflow-x-auto" style={{ minWidth: viewMode === "day" ? "100%" : undefined }}>
              <div className="flex" style={{ minWidth: viewMode === "week" ? `${days.length * 180}px` : "100%" }}>
                {days.map((day) => {
                  const isToday = isSameDay(day, new Date());
                  const isDragTarget = draggingBlock && !isSameDay(draggingBlock.originDay, day);
                  return (
                    <div key={day.toISOString()}
                      className={`flex-1 min-w-[160px] h-10 flex items-center justify-center text-xs font-semibold transition-all relative
                        ${isToday ? "text-[#00E5CC] bg-[#00A3A3]/8 border-b-2 border-[#00E5CC]" : "text-[#94A3B8]"}
                        ${isDragTarget ? "bg-[#00A3A3]/10" : ""}`}
                      onClick={() => {
                        if (draggingBlock) {
                          handleCrossDayDrop(draggingBlock.block, day);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[10px] uppercase tracking-wider">{format(day, "EEE")}</span>
                        <span className={`text-sm ${isToday ? "font-bold" : "font-medium"}`}>{format(day, "d")}</span>
                      </div>
                      {isToday && <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#00E5CC] shadow-[0_0_8px_rgba(0,229,204,0.6)]" />}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Scrollable columns body — synced with gutter */}
            <div ref={columnsScrollRef} className="flex-1 overflow-auto" onScroll={handleColumnsScroll}>
              <div className="flex" style={{ minWidth: viewMode === "week" ? `${days.length * 180}px` : "100%", height: 24 * HOUR_HEIGHT }}>
                {days.map((day, dayIdx) => {
                  const dayBlocks = expandedBlocks.filter((b) => isSameDay(new Date(b.start_at), day));
                  const isToday = isSameDay(day, new Date());
                  const isDragTarget = draggingBlock && !isSameDay(draggingBlock.originDay, day);

                  return (
                    <div key={day.toISOString()}
                      className={`flex-1 min-w-[160px] relative
                        ${dayIdx < days.length - 1 ? "border-r border-[#1E293B]/20" : ""}
                        ${isToday ? "bg-[#00A3A3]/[0.03]" : ""}
                        ${isDragTarget ? "bg-[#00A3A3]/[0.04]" : ""}`}
                      onClick={(e) => {
                        if (draggingBlock) {
                          handleCrossDayDrop(draggingBlock.block, day);
                          return;
                        }
                      }}
                    >
                      {/* Grid glow background for today */}
                      {isToday && (
                        <div className="absolute inset-0 pointer-events-none"
                          style={{
                            background: "linear-gradient(180deg, rgba(0,163,163,0.03) 0%, transparent 20%, transparent 80%, rgba(0,163,163,0.03) 100%)",
                            borderLeft: "1px solid rgba(0,229,204,0.08)",
                            borderRight: "1px solid rgba(0,229,204,0.08)",
                          }}
                        />
                      )}

                      {/* Hour grid lines */}
                      {HOURS.map((h) => (
                        <div key={h} style={{ height: HOUR_HEIGHT }}
                          className={`border-b border-[#1E293B]/15 cursor-pointer hover:bg-[#00A3A3]/[0.03] transition-colors relative`}
                          onClick={(e) => { e.stopPropagation(); handleSlotClick(day, h); }}
                          onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; e.currentTarget.classList.add("bg-[#00A3A3]/10"); }}
                          onDragLeave={(e) => { e.currentTarget.classList.remove("bg-[#00A3A3]/10"); }}
                          onDrop={(e) => { e.currentTarget.classList.remove("bg-[#00A3A3]/10"); handleMediaDrop(day, h, e); }}
                        >
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
                        const isCompact = viewMode === "week";

                        return (
                          <div key={`${block.id}-${idx}`} id={`resize-block-${block.id}`}
                            className={`absolute rounded-xl border backdrop-blur-sm cursor-pointer transition-shadow group
                              ${colors.bg} ${colors.border} ${colors.glow}
                              ${hasOverlap ? "ring-1 ring-[#FF003C]/50" : ""}
                              ${block.block_type === "blackout" ? "opacity-70" : ""}
                              ${draggingBlock?.block.id === block.id ? "opacity-40 pointer-events-none" : ""}`}
                            style={{ top, height, minHeight: 24, zIndex: 10 + block.priority, left: isCompact ? 4 : 8, right: isCompact ? 4 : 8 }}
                            onClick={(e) => { e.stopPropagation(); setEditBlock(block); }}
                          >
                            <div className={`overflow-hidden h-full flex gap-1.5 ${isCompact ? "px-1.5 py-1" : "px-2.5 py-1.5"}`}>
                              {/* Thumbnail */}
                              {showThumb && height > 40 && !isCompact && (
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
                                  <span className={`font-semibold truncate ${colors.text} ${isCompact ? "text-[10px]" : "text-[11px]"}`}>
                                    {block.label || getMediaName(block.media_id) || getPlaylistName(block.playlist_id) || block.block_type}
                                  </span>
                                </div>
                                {height > 36 && (
                                  <span className="text-[10px] text-[#64748B] mt-0.5">
                                    {format(new Date(block.start_at), "HH:mm")} – {format(new Date(block.end_at), "HH:mm")}
                                  </span>
                                )}
                                {height > 56 && block.recurrence !== "none" && !isCompact && (
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 mt-0.5 w-fit border-[#475569]/40 text-[#64748B]">↻ {block.recurrence}</Badge>
                                )}
                                {hasOverlap && height > 48 && !isCompact && (
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
                      {isToday && (
                        <div className="absolute left-0 right-0 z-30 pointer-events-none" style={{ top: currentTimeTop }}>
                          <div className="relative">
                            <div className="absolute -left-0.5 -top-[5px] w-3 h-3 rounded-full bg-[#00E5CC] shadow-[0_0_12px_rgba(0,229,204,0.7),0_0_24px_rgba(0,229,204,0.3)]" />
                            <div className="h-[2px] bg-gradient-to-r from-[#00E5CC] via-[#00E5CC]/60 to-transparent shadow-[0_0_8px_rgba(0,229,204,0.5)]" />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════ CLIPBOARD DOCK ══════════ */}
      {clipboard && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#00A3A3]/30 bg-[#0F1A2E]/95 backdrop-blur-xl shadow-[0_0_30px_rgba(0,163,163,0.15)]">
          <Clipboard className="h-4 w-4 text-[#00E5CC]" />
          <div className="text-xs">
            <span className="text-[#94A3B8]">Clipboard: </span>
            <span className="text-[#00E5CC] font-medium">{clipboard.label || getMediaName(clipboard.media_id) || "Block"}</span>
            <span className="text-[#64748B] ml-2">{format(new Date(clipboard.start_at), "HH:mm")}–{format(new Date(clipboard.end_at), "HH:mm")}</span>
          </div>
          <span className="text-[10px] text-[#475569]">Click any time slot to paste</span>
          <button onClick={() => setClipboard(null)} className="text-[#64748B] hover:text-[#FF4466] transition-colors ml-1">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* ══════════ DRAG INDICATOR ══════════ */}
      {draggingBlock && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl border border-[#FF66FF]/30 bg-[#0F1A2E]/95 backdrop-blur-xl shadow-[0_0_30px_rgba(255,0,255,0.15)]">
          <CalendarRange className="h-4 w-4 text-[#FF66FF]" />
          <span className="text-xs text-[#FF66FF] font-medium">Moving "{draggingBlock.block.label || "Block"}" — click a day header to drop</span>
          <button onClick={() => setDraggingBlock(null)} className="text-[#64748B] hover:text-[#FF4466] transition-colors ml-1 text-xs">Cancel</button>
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
                <div><span className="text-[#64748B] text-xs">Start</span><p className="text-[#E2E8F0]">{format(new Date(editBlock.start_at), "EEE MMM d, HH:mm")}</p></div>
                <div><span className="text-[#64748B] text-xs">End</span><p className="text-[#E2E8F0]">{format(new Date(editBlock.end_at), "EEE MMM d, HH:mm")}</p></div>
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
          <DialogFooter className="flex-wrap gap-2">
            {/* Clipboard & Apply to Week actions */}
            <div className="flex gap-2 flex-1">
              <Button variant="outline" size="sm" className="text-xs border-[#1E293B] bg-[#0B1120] hover:bg-[#1E293B]"
                onClick={() => { if (editBlock) { setClipboard(editBlock); setEditBlock(null); toast.success("Copied to clipboard"); } }}>
                <Clipboard className="h-3 w-3 mr-1" />To Clipboard
              </Button>
              <Button variant="outline" size="sm" className="text-xs border-[#1E293B] bg-[#0B1120] hover:bg-[#1E293B]"
                onClick={() => { if (editBlock) handleApplyToWeek(editBlock); }}>
                <CalendarRange className="h-3 w-3 mr-1" />Apply to Week
              </Button>
              {viewMode === "week" && (
                <Button variant="outline" size="sm" className="text-xs border-[#FF66FF]/30 bg-[#FF00FF]/5 hover:bg-[#FF00FF]/10 text-[#FF66FF]"
                  onClick={() => {
                    if (editBlock) {
                      setDraggingBlock({ block: editBlock, originDay: new Date(editBlock.start_at) });
                      setEditBlock(null);
                      toast.info("Click a day column to move this block");
                    }
                  }}>
                  <GripHorizontal className="h-3 w-3 mr-1" />Move to Day
                </Button>
              )}
            </div>
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
