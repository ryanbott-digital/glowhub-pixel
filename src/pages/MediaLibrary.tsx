import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image as ImageIcon, Film, Trash2, FileWarning, Loader2, CheckSquare, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isSelecting = selected.size > 0;

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
    if (!user) return;
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        toast.error(`${f.name}: only images and videos are supported`);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name}: file exceeds 50 MB — consider compressing before upload`);
        return false;
      }
      return true;
    });
    if (validFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${i}.${ext}`;
      const isImage = file.type.startsWith("image/");

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        continue;
      }

      let duration: number | null = null;
      if (!isImage) {
        duration = await getVideoDuration(file);
      }

      const { data: mediaRow } = await supabase.from("media").insert({
        user_id: user.id,
        name: file.name,
        storage_path: path,
        type: isImage ? "image" : "video",
        duration,
      }).select("id").single();

      // Send videos to Mux for transcoding
      if (!isImage && mediaRow) {
        toast.info(`Transcoding ${file.name} via Mux…`);
        try {
          const { data: muxData, error: muxError } = await supabase.functions.invoke("mux-upload", {
            body: { storage_path: path, file_name: file.name, media_id: mediaRow.id },
          });
          if (muxError) throw muxError;
          if (muxData?.stream_url) {
            toast.success(`${file.name} optimized for streaming`);
          }
        } catch (err: any) {
          console.error("Mux transcoding error:", err);
          toast.warning(`${file.name} uploaded but transcoding failed — raw file will be used`);
        }
      }

      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    toast.success(`Uploaded ${validFiles.length} file(s)`);
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
          <p className="text-sm text-muted-foreground mt-1">
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
        className={`border-2 border-dashed rounded-xl p-10 text-center transition-all duration-200 ${
          dragOver
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50"
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
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => {
            const url = getPublicUrl(item.storage_path);
            const isSelected = selected.has(item.id);
            return (
              <Card
                key={item.id}
                className={`group overflow-hidden transition-all cursor-pointer ${
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "border-border/50 hover:border-primary/30"
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

                  {/* Delete button */}
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
                <CardContent className="p-3">
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {media.length === 0 && !uploading && (
        <div className="text-center py-16 text-muted-foreground">
          <FileWarning className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium text-foreground">No media uploaded yet</p>
          <p className="text-sm mt-1">Upload images and videos to build your content library</p>
        </div>
      )}
    </div>
  );
}
