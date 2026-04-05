import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Image as ImageIcon, Film, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface MediaItem {
  id: string;
  name: string;
  storage_path: string;
  type: string;
  created_at: string;
}

export default function MediaLibrary() {
  const { user } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const fetchMedia = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("media")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setMedia(data);
  }, [user]);

  useEffect(() => { fetchMedia(); }, [fetchMedia]);

  const uploadFile = async (file: File) => {
    if (!user) return;
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");
    if (!isImage && !isVideo) {
      toast.error("Only images and videos are supported");
      return;
    }

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from("media").upload(path, file);
    if (uploadError) {
      toast.error("Upload failed: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("media").insert({
      user_id: user.id,
      name: file.name,
      storage_path: path,
      type: isImage ? "image" : "video",
    });

    if (dbError) {
      toast.error("Failed to save media record");
    } else {
      toast.success("Uploaded " + file.name);
      fetchMedia();
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(uploadFile);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(uploadFile);
  };

  const deleteMedia = async (item: MediaItem) => {
    await supabase.storage.from("media").remove([item.storage_path]);
    await supabase.from("media").delete().eq("id", item.id);
    toast.success("Deleted " + item.name);
    fetchMedia();
  };

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    return data.publicUrl;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
        <label>
          <Button disabled={uploading} asChild>
            <span className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload"}
            </span>
          </Button>
          <input type="file" className="hidden" accept="image/*,video/*" multiple onChange={handleFileInput} />
        </label>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          dragOver ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-muted-foreground">Drag and drop media files here</p>
        <p className="text-sm text-muted-foreground mt-1">Supports images and videos</p>
      </div>

      {/* Media grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {media.map((item) => (
          <Card key={item.id} className="group overflow-hidden">
            <div className="aspect-video bg-muted relative">
              {item.type === "image" ? (
                <img
                  src={getPublicUrl(item.storage_path)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
              <button
                onClick={() => deleteMedia(item)}
                className="absolute top-2 right-2 p-1.5 bg-destructive/90 rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-3 w-3 text-destructive-foreground" />
              </button>
            </div>
            <CardContent className="p-3">
              <p className="text-sm font-medium truncate text-foreground">{item.name}</p>
              <div className="flex items-center gap-1 mt-1">
                {item.type === "image" ? (
                  <ImageIcon className="h-3 w-3 text-muted-foreground" />
                ) : (
                  <Film className="h-3 w-3 text-muted-foreground" />
                )}
                <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {media.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>No media uploaded yet</p>
          <p className="text-sm">Upload images and videos to get started</p>
        </div>
      )}
    </div>
  );
}
