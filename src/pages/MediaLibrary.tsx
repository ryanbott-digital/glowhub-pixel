import { useState, useEffect, useCallback, useRef } from "react";
// glass classes used instead of Card components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image as ImageIcon, Film, Trash2, FileWarning, Loader2, CheckSquare, X, Send, Monitor } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface PairedScreen {
  id: string;
  name: string;
  status: string;
}

const BUCKET = "signage-content";

interface MediaItem {
  id: string;
  name: string;
  storage_path: string;
  type: string;
  created_at: string;
  duration: number | null;
  mux_asset_id: string | null;
  mux_status: string | null;
}

interface MediaWithSize extends MediaItem {
  fileSize: number | null;
}

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

export default function MediaLibrary() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaWithSize[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [pairedScreens, setPairedScreens] = useState<PairedScreen[]>([]);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSelecting = selected.size > 0;

  // Fetch user's screens
  const fetchScreens = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("screens")
      .select("id, name, status")
      .eq("user_id", user.id);
    if (data) setPairedScreens(data);
  }, [user]);

  const openSendDialog = () => {
    fetchScreens();
    setSendDialogOpen(true);
  };

  const sendToScreen = async (screenId: string) => {
    if (selected.size === 0 || !user) return;
    setSending(true);
    try {
      const selectedIds = Array.from(selected);
      const timestamp = new Date().toLocaleString("en-GB", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

      // 1. Create a quick playlist
      const { data: playlist, error: plErr } = await supabase
        .from("playlists")
        .insert({ title: `Quick Send · ${timestamp}`, user_id: user.id })
        .select("id")
        .single();
      if (plErr || !playlist) throw plErr;

      // 2. Batch-insert playlist items with sequential positions
      const items = selectedIds.map((mediaId, i) => ({
        playlist_id: playlist.id,
        media_id: mediaId,
        position: i,
      }));
      const { error: itemErr } = await supabase.from("playlist_items").insert(items);
      if (itemErr) throw itemErr;

      // 3. Assign playlist to screen
      const { error: scrErr } = await supabase
        .from("screens")
        .update({ current_playlist_id: playlist.id })
        .eq("id", screenId);
      if (scrErr) throw scrErr;

      const screen = pairedScreens.find((s) => s.id === screenId);
      toast.success(`Sent ${selectedIds.length} item${selectedIds.length > 1 ? "s" : ""} to ${screen?.name ?? "screen"}`);
      setSendDialogOpen(false);
      setSelected(new Set());
    } catch {
      toast.error("Failed to send content to screen");
    }
    setSending(false);
  };

  const fetchMedia = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("media")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (!data) return;

    // Fetch file sizes from storage
    const { data: storageFiles } = await supabase.storage
      .from(BUCKET)
      .list(user.id, { limit: 1000 });

    const sizeMap = new Map<string, number>();
    if (storageFiles) {
      for (const f of storageFiles) {
        sizeMap.set(`${user.id}/${f.name}`, (f.metadata as any)?.size ?? 0);
      }
    }

    setMedia(
      data.map((item) => ({
        ...item,
        fileSize: sizeMap.get(item.storage_path) ?? null,
      }))
    );
  }, [user]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  // Poll Mux status for videos still processing
  useEffect(() => {
    const processingIds = media
      .filter((m) => m.mux_asset_id && m.mux_status === "preparing")
      .map((m) => m.id);
    if (processingIds.length === 0) return;

    const checkStatus = async () => {
      const { data } = await supabase.functions.invoke("mux-status", {
        body: { media_ids: processingIds },
      });
      if (data?.results) {
        const readyIds = new Set(
          data.results.filter((r: any) => r.status === "ready").map((r: any) => r.id)
        );
        if (readyIds.size > 0) {
          setMedia((prev) =>
            prev.map((m) => (readyIds.has(m.id) ? { ...m, mux_status: "ready" } : m))
          );
        }
      }
    };

    const interval = setInterval(checkStatus, 8000);
    checkStatus();
    return () => clearInterval(interval);
  }, [media.filter((m) => m.mux_status === "preparing").length]);

  const uploadFiles = async (files: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      console.error("[Upload] No authenticated user found");
      return;
    }

    console.log(`[Upload] Starting upload for ${files.length} file(s), user: ${user.id}`);

    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        toast.error(`${f.name}: only images and videos are supported`);
        console.warn(`[Upload] Rejected ${f.name} — unsupported type: ${f.type}`);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name}: file exceeds 50 MB — consider compressing before upload`);
        console.warn(`[Upload] Rejected ${f.name} — size ${(f.size / 1024 / 1024).toFixed(1)} MB exceeds limit`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);
    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${i}.${ext}`;
      const isImage = file.type.startsWith("image/");

      console.log(`[Upload] [${i + 1}/${validFiles.length}] Uploading "${file.name}" (${(file.size / 1024).toFixed(0)} KB, ${file.type}) → ${path}`);

      // Step 1: Upload to storage
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        console.error(`[Upload] Storage upload failed for "${file.name}":`, uploadError);
        continue;
      }
      console.log(`[Upload] Storage upload OK for "${file.name}"`);

      // Step 2: Get video duration
      let duration: number | null = null;
      if (!isImage) {
        duration = await getVideoDuration(file);
        console.log(`[Upload] Video duration for "${file.name}": ${duration}s`);
      }

      // Step 3: Insert media record
      const { data: mediaRow, error: insertError } = await supabase.from("media").insert({
        user_id: user.id,
        name: file.name,
        storage_path: path,
        type: isImage ? "image" : "video",
        duration,
      }).select("id").single();

      if (insertError) {
        toast.error(`Failed to save ${file.name} to library: ${insertError.message}`);
        console.error(`[Upload] DB insert failed for "${file.name}":`, insertError);
        continue;
      }
      console.log(`[Upload] DB insert OK for "${file.name}", media_id: ${mediaRow.id}`);

      // Step 4: Send videos to Mux for transcoding
      if (!isImage && mediaRow) {
        toast.info(`Transcoding ${file.name} via Mux…`);
        console.log(`[Upload] Invoking mux-upload for "${file.name}", media_id: ${mediaRow.id}`);
        try {
          const { data: muxData, error: muxError } = await supabase.functions.invoke("mux-upload", {
            body: { storage_path: path, file_name: file.name, media_id: mediaRow.id },
          });
          if (muxError) {
            console.error(`[Upload] Mux function invocation error for "${file.name}":`, muxError);
            throw muxError;
          }
          console.log(`[Upload] Mux response for "${file.name}":`, muxData);
          if (muxData?.stream_url) {
            toast.success(`${file.name} optimized for streaming`);
          }
        } catch (err: any) {
          console.error(`[Upload] Mux transcoding error for "${file.name}":`, err);
          toast.warning(`${file.name} uploaded but transcoding failed — raw file will be used`);
        }
      }

      successCount++;
      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    if (successCount > 0) {
      toast.success(`Uploaded ${successCount} file(s)`);
    }
    console.log(`[Upload] Complete: ${successCount}/${validFiles.length} succeeded`);
    setUploading(false);
    setUploadProgress(0);
    fetchMedia();
  };

  const getVideoDuration = (file: File): Promise<number | null> =>
    new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteMedia = async (item: MediaWithSize) => {
    await supabase.storage.from(BUCKET).remove([item.storage_path]);
    await supabase.from("media").delete().eq("id", item.id);
    toast.success("Deleted " + item.name);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setDeleting(true);

    const toDelete = media.filter((m) => selected.has(m.id));
    const paths = toDelete.map((m) => m.storage_path);

    await supabase.storage.from(BUCKET).remove(paths);

    for (const item of toDelete) {
      await supabase.from("media").delete().eq("id", item.id);
    }

    toast.success(`Deleted ${toDelete.length} file(s)`);
    setMedia((prev) => prev.filter((m) => !selected.has(m.id)));
    setSelected(new Set());
    setDeleting(false);
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === media.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(media.map((m) => m.id)));
    }
  };

  const getPublicUrl = (path: string) => {
    if (path.startsWith("https://")) return path;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const totalSize = media.reduce((sum, m) => sum + (m.fileSize ?? 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-1">
            {media.length} file{media.length !== 1 ? "s" : ""}
            {totalSize > 0 && ` · ${formatFileSize(totalSize)} total`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSelecting && (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
                <X className="h-3 w-3 mr-1" /> Cancel
              </Button>
              <Button variant="outline" size="sm" onClick={selectAll}>
                <CheckSquare className="h-3 w-3 mr-1" />
                {selected.size === media.length ? "Deselect All" : "Select All"}
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={openSendDialog}
              >
                <Send className="h-3 w-3 mr-1" />
                Send {selected.size} to Screen
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={bulkDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1" />
                )}
                Delete {selected.size}
              </Button>
            </>
          )}
          <label>
            <Button disabled={uploading} asChild>
              <span className="cursor-pointer">
                {uploading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? `Uploading ${uploadProgress}%` : "Upload Files"}
              </span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="image/*,video/*"
              multiple
              onChange={handleFileInput}
            />
          </label>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`glass glass-spotlight rounded-2xl p-10 text-center transition-all duration-200 border ${
          dragOver
            ? "border-primary shadow-[0_0_30px_rgba(0,163,163,0.3)] scale-[1.01]"
            : "border-white/[0.06] hover:border-primary/30"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className="p-3 rounded-full bg-primary/10">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <p className="font-medium text-foreground">Drag & drop files here</p>
          <p className="text-sm text-muted-foreground">Images and videos up to 50MB each</p>
        </div>
      </div>

      {/* Media grid */}
      {media.length > 0 && (
        <div className={`grid gap-4 stagger-in ${
          (() => {
            const size = localStorage.getItem("glowhub_media_grid") || "medium";
            if (size === "small") return "grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
            if (size === "large") return "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
            return "grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
          })()
        }`}>
          {media.map((item) => {
            const url = getPublicUrl(item.storage_path);
            const isSelected = selected.has(item.id);
            return (
              <div
                key={item.id}
                className={`glass glass-spotlight rounded-2xl group overflow-hidden transition-all cursor-pointer border ${
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "border-white/[0.06] hover:border-primary/30"
                }`}
                onClick={() => toggleSelect(item.id)}
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {item.type === "image" ? (
                    <img
                      src={url}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <video
                      src={url}
                      className="w-full h-full object-cover"
                      muted
                      preload="metadata"
                      onMouseOver={(e) => (e.target as HTMLVideoElement).play()}
                      onMouseOut={(e) => {
                        const v = e.target as HTMLVideoElement;
                        v.pause();
                        v.currentTime = 0;
                      }}
                    />
                  )}

                  {/* Selection checkbox */}
                  <div
                    className={`absolute top-2 left-2 transition-opacity ${
                      isSelecting || isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(item.id)}
                      className="h-5 w-5 border-2 bg-background/80 backdrop-blur-sm"
                    />
                  </div>

                  {/* Type badge */}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 right-12 text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    {item.type === "image" ? (
                      <ImageIcon className="h-2.5 w-2.5 mr-1" />
                    ) : (
                      <Film className="h-2.5 w-2.5 mr-1" />
                    )}
                    {item.type}
                  </Badge>

                  {/* Duration badge for video */}
                  {item.type === "video" && item.duration && (
                    <Badge
                      variant="secondary"
                      className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm"
                    >
                      {formatDuration(item.duration)}
                    </Badge>
                  )}

                  {/* Mux processing badge */}
                  {item.type === "video" && item.mux_asset_id && item.mux_status === "preparing" && (
                    <Badge
                      className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 bg-amber-500/90 text-white backdrop-blur-sm animate-pulse border-0"
                    >
                      <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                      Processing
                    </Badge>
                  )}

                  {!isSelecting && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMedia(item);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-destructive/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <Trash2 className="h-3 w-3 text-destructive-foreground" />
                    </button>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-sm font-medium truncate text-foreground" title={item.name}>
                    {item.name}
                  </p>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.fileSize != null && (
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(item.fileSize)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {media.length === 0 && !uploading && (
        <div className="glass glass-spotlight rounded-2xl text-center py-16 text-muted-foreground border border-white/[0.06]">
          <FileWarning className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">No media uploaded yet</p>
          <p className="text-sm mt-1">Upload images and videos to build your content library</p>
        </div>
      )}

      {/* Send to Screen dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent className="glass border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-foreground">Send to Screen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">
            Select a paired screen to push {selected.size === 1 ? "this item" : `${selected.size} items`} to.
          </p>
          {pairedScreens.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Monitor className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No paired screens found</p>
              <p className="text-xs mt-1">Pair a screen first from the Screens page</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pairedScreens.map((screen) => (
                <button
                  key={screen.id}
                  onClick={() => sendToScreen(screen.id)}
                  disabled={sending}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all text-left"
                >
                  <Monitor className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{screen.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{screen.status}</p>
                  </div>
                  <Send className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
