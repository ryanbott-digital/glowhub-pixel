import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Image as ImageIcon, Film, Trash2, FileWarning, Loader2 } from "lucide-react";
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
}

export default function MediaLibrary() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMedia = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("media")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setMedia(data);
  }, [user]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const uploadFiles = async (files: File[]) => {
    if (!user) return;
    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        toast.error(`${f.name}: only images and videos are supported`);
        return false;
      }
      if (f.size > 50 * 1024 * 1024) {
        toast.error(`${f.name}: file too large (max 50MB)`);
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

      // Get video duration if applicable
      let duration: number | null = null;
      if (!isImage) {
        duration = await getVideoDuration(file);
      }

      const { error: dbError } = await supabase.from("media").insert({
        user_id: user.id,
        name: file.name,
        storage_path: path,
        type: isImage ? "image" : "video",
        duration,
      });

      if (dbError) {
        toast.error(`Failed to save record for ${file.name}`);
      }

      setUploadProgress(Math.round(((i + 1) / validFiles.length) * 100));
    }

    toast.success(`Uploaded ${validFiles.length} file(s)`);
    setUploading(false);
    setUploadProgress(0);
    fetchMedia();
  };

  const getVideoDuration = (file: File): Promise<number | null> => {
    return new Promise((resolve) => {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(Math.round(video.duration));
      };
      video.onerror = () => resolve(null);
      video.src = URL.createObjectURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    uploadFiles(Array.from(e.target.files || []));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const deleteMedia = async (item: MediaItem) => {
    const { error: storageErr } = await supabase.storage.from(BUCKET).remove([item.storage_path]);
    if (storageErr) {
      toast.error("Failed to delete file from storage");
      return;
    }
    const { error: dbErr } = await supabase.from("media").delete().eq("id", item.id);
    if (dbErr) {
      toast.error("Failed to delete record");
      return;
    }
    toast.success("Deleted " + item.name);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {media.length} file{media.length !== 1 ? "s" : ""} uploaded
          </p>
        </div>
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
          <p className="font-medium text-foreground">
            Drag & drop files here
          </p>
          <p className="text-sm text-muted-foreground">
            Images and videos up to 50MB each
          </p>
        </div>
      </div>

      {/* Media grid */}
      {media.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item) => {
            const url = getPublicUrl(item.storage_path);
            return (
              <Card key={item.id} className="group overflow-hidden border-border/50 hover:border-primary/30 transition-colors">
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

                  {/* Type badge */}
                  <Badge
                    variant="secondary"
                    className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-background/80 backdrop-blur-sm"
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
                  <button
                    onClick={() => deleteMedia(item)}
                    className="absolute top-2 right-2 p-1.5 bg-destructive/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                  >
                    <Trash2 className="h-3 w-3 text-destructive-foreground" />
                  </button>
                </div>
                <CardContent className="p-3">
                  <p className="text-sm font-medium truncate text-foreground" title={item.name}>
                    {item.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
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
