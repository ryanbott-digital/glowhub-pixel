import { useState, useEffect, useCallback, useRef } from "react";
// glass classes used instead of Card components
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, Image as ImageIcon, Film, Trash2, FileWarning, Loader2, CheckSquare, X, Send, Monitor, Pencil, Shrink, Volume2, VolumeX, FolderPlus, Folder, FolderOpen, ChevronRight, Home, MoveRight, ArrowLeft, ListMusic, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { hapticMedium } from "@/lib/haptics";

interface PairedScreen {
  id: string;
  name: string;
  status: string;
}

interface PlaylistOption {
  id: string;
  title: string;
  item_count: number;
}

interface MediaFolder {
  id: string;
  name: string;
  parent_id: string | null;
  color: string;
  created_at: string;
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
  audio_muted: boolean;
  folder_id: string | null;
}

interface MediaWithSize extends MediaItem {
  fileSize: number | null;
  hasAudio?: boolean;
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

const MAX_SIZE = 50 * 1024 * 1024; // 50MB
const VIDEO_MAX_SIZE = 500 * 1024 * 1024; // 500MB for videos (Mux transcodes)

const FOLDER_COLORS = [
  { id: "gray", bg: "bg-muted/60", text: "text-muted-foreground", accent: "border-muted-foreground/20" },
  { id: "teal", bg: "bg-primary/10", text: "text-primary", accent: "border-primary/30" },
  { id: "blue", bg: "bg-blue-500/10", text: "text-blue-400", accent: "border-blue-500/30" },
  { id: "purple", bg: "bg-purple-500/10", text: "text-purple-400", accent: "border-purple-500/30" },
  { id: "amber", bg: "bg-amber-500/10", text: "text-amber-400", accent: "border-amber-500/30" },
  { id: "rose", bg: "bg-rose-500/10", text: "text-rose-400", accent: "border-rose-500/30" },
];

const getFolderColor = (colorId: string) => FOLDER_COLORS.find(c => c.id === colorId) || FOLDER_COLORS[0];

const compressImage = (file: File, maxDim = 4000, quality = 0.8): Promise<File> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return reject(new Error("Compression failed"));
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = URL.createObjectURL(file);
  });

interface OversizedFile {
  file: File;
  isImage: boolean;
}

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
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFired = useRef(false);
  const isSelecting = selected.size > 0;

  // Compression dialog state
  const [compressDialogOpen, setCompressDialogOpen] = useState(false);
  const [oversizedFiles, setOversizedFiles] = useState<OversizedFile[]>([]);
  const [pendingValidFiles, setPendingValidFiles] = useState<File[]>([]);
  const [compressing, setCompressing] = useState(false);

  // Folder state
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [folderPath, setFolderPath] = useState<MediaFolder[]>([]); // breadcrumb path
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("New Folder");
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [renameFolderValue, setRenameFolderValue] = useState("");
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);

  // Add to playlist state
  const [playlistDialogOpen, setPlaylistDialogOpen] = useState(false);
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [playlistMediaIds, setPlaylistMediaIds] = useState<string[]>([]);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("media_folders")
      .select("*")
      .eq("user_id", user.id)
      .order("name");
    if (data) setFolders(data as MediaFolder[]);
  }, [user]);

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

      const { data: playlist, error: plErr } = await supabase
        .from("playlists")
        .insert({ title: `Quick Send · ${timestamp}`, user_id: user.id })
        .select("id")
        .single();
      if (plErr || !playlist) throw plErr;

      const items = selectedIds.map((mediaId, i) => ({
        playlist_id: playlist.id,
        media_id: mediaId,
        position: i,
      }));
      const { error: itemErr } = await supabase.from("playlist_items").insert(items);
      if (itemErr) throw itemErr;

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
        folder_id: (item as any).folder_id ?? null,
        fileSize: sizeMap.get(item.storage_path) ?? null,
      }))
    );
  }, [user]);

  useEffect(() => {
    fetchMedia();
    fetchFolders();
  }, [fetchMedia, fetchFolders]);

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

  // ── Folder operations ──
  const createFolder = async () => {
    if (!user || !newFolderName.trim()) return;
    const { data, error } = await supabase
      .from("media_folders")
      .insert({
        user_id: user.id,
        name: newFolderName.trim(),
        parent_id: currentFolderId,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create folder");
    } else {
      setFolders((prev) => [...prev, data as MediaFolder]);
      toast.success(`Folder "${newFolderName.trim()}" created`);
    }
    setCreatingFolder(false);
    setNewFolderName("New Folder");
  };

  const [deleteFolderConfirm, setDeleteFolderConfirm] = useState<{ id: string; name: string } | null>(null);

  const deleteFolder = async (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    const folderName = folder?.name || "Folder";
    setDeleteFolderConfirm(null);

    // Remember which media was in this folder for undo
    const folderMedia = media.filter((m) => m.folder_id === folderId);

    // Optimistically remove folder and move its media to root
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setMedia((prev) => prev.map((m) => m.folder_id === folderId ? { ...m, folder_id: null } : m));
    if (currentFolderId === folderId) navigateToFolder(null);

    const undoRef = { undone: false };
    toast(`Deleted folder "${folderName}"`, {
      action: {
        label: "Undo",
        onClick: () => {
          undoRef.undone = true;
          if (folder) setFolders((prev) => [...prev, folder]);
          setMedia((prev) => prev.map((m) => {
            const was = folderMedia.find((fm) => fm.id === m.id);
            return was ? { ...m, folder_id: folderId } : m;
          }));
          toast.success(`Restored folder "${folderName}"`);
        },
      },
      duration: 5000,
      onAutoClose: () => {
        if (!undoRef.undone) {
          (supabase.from("media") as any).update({ folder_id: null }).eq("folder_id", folderId).then(() => {
            supabase.from("media_folders").delete().eq("id", folderId);
          });
        }
      },
      onDismiss: () => {
        if (!undoRef.undone) {
          (supabase.from("media") as any).update({ folder_id: null }).eq("folder_id", folderId).then(() => {
            supabase.from("media_folders").delete().eq("id", folderId);
          });
        }
      },
    });
  };

  const commitFolderRename = async () => {
    if (!renamingFolderId || !renameFolderValue.trim()) {
      setRenamingFolderId(null);
      return;
    }
    const { error } = await supabase
      .from("media_folders")
      .update({ name: renameFolderValue.trim() })
      .eq("id", renamingFolderId);
    if (error) {
      toast.error("Rename failed");
    } else {
      setFolders((prev) =>
        prev.map((f) => (f.id === renamingFolderId ? { ...f, name: renameFolderValue.trim() } : f))
      );
      // Update breadcrumb too
      setFolderPath((prev) =>
        prev.map((f) => (f.id === renamingFolderId ? { ...f, name: renameFolderValue.trim() } : f))
      );
      toast.success("Renamed");
    }
    setRenamingFolderId(null);
  };

  const navigateToFolder = (folderId: string | null) => {
    setSelected(new Set());
    setCurrentFolderId(folderId);
    if (folderId === null) {
      setFolderPath([]);
    } else {
      const folder = folders.find((f) => f.id === folderId);
      if (folder) {
        // Build path by walking up parent_ids
        const path: MediaFolder[] = [];
        let current: MediaFolder | undefined = folder;
        while (current) {
          path.unshift(current);
          current = current.parent_id ? folders.find((f) => f.id === current!.parent_id) : undefined;
        }
        setFolderPath(path);
      }
    }
  };

  const moveSelectedToFolder = async (targetFolderId: string | null) => {
    if (selected.size === 0) return;
    const ids = Array.from(selected);
    for (const id of ids) {
      await (supabase.from("media") as any).update({ folder_id: targetFolderId }).eq("id", id);
    }
    setMedia((prev) =>
      prev.map((m) => (selected.has(m.id) ? { ...m, folder_id: targetFolderId } : m))
    );
    const targetName = targetFolderId ? folders.find(f => f.id === targetFolderId)?.name ?? "folder" : "root";
    toast.success(`Moved ${ids.length} item${ids.length > 1 ? "s" : ""} to ${targetName}`);
    setSelected(new Set());
    setMoveDialogOpen(false);
  };

  // ── Playlist operations ──
  const fetchPlaylists = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("playlists")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      // Get item counts
      const { data: items } = await supabase
        .from("playlist_items")
        .select("playlist_id");
      const countMap = new Map<string, number>();
      if (items) {
        for (const item of items) {
          countMap.set(item.playlist_id, (countMap.get(item.playlist_id) || 0) + 1);
        }
      }
      setPlaylists(data.map(p => ({ ...p, item_count: countMap.get(p.id) || 0 })));
    }
  }, [user]);

  const openPlaylistDialog = (mediaIds: string[]) => {
    setPlaylistMediaIds(mediaIds);
    fetchPlaylists();
    setPlaylistDialogOpen(true);
  };

  const addToPlaylist = async (playlistId: string) => {
    if (playlistMediaIds.length === 0) return;
    setAddingToPlaylist(true);
    try {
      // Get current max position
      const { data: existing } = await supabase
        .from("playlist_items")
        .select("position")
        .eq("playlist_id", playlistId)
        .order("position", { ascending: false })
        .limit(1);
      const startPos = existing && existing.length > 0 ? existing[0].position + 1 : 0;

      const items = playlistMediaIds.map((mediaId, i) => ({
        playlist_id: playlistId,
        media_id: mediaId,
        position: startPos + i,
      }));
      const { error } = await supabase.from("playlist_items").insert(items);
      if (error) throw error;

      const playlist = playlists.find(p => p.id === playlistId);
      toast.success(`Added ${playlistMediaIds.length} item${playlistMediaIds.length > 1 ? "s" : ""} to "${playlist?.title ?? "playlist"}"`);
      setPlaylistDialogOpen(false);
      setSelected(new Set());
    } catch {
      toast.error("Failed to add to playlist");
    }
    setAddingToPlaylist(false);
  };

  // ── Existing operations ──
  const uploadFiles = async (files: File[]) => {
    if (!user) {
      toast.error("You must be logged in to upload files");
      return;
    }

    const validFiles: File[] = [];
    const oversized: OversizedFile[] = [];

    for (const f of files) {
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) {
        toast.error(`${f.name}: only images and videos are supported`);
        continue;
      }
      const isImage = f.type.startsWith("image/");
      const limit = isImage ? MAX_SIZE : VIDEO_MAX_SIZE;
      if (f.size > limit) {
        if (isImage) {
          oversized.push({ file: f, isImage: true });
        } else {
          toast.error(`${f.name}: video exceeds 500 MB — please compress with HandBrake or similar`);
        }
        continue;
      }
      validFiles.push(f);
    }

    if (oversized.length > 0) {
      setOversizedFiles(oversized);
      setPendingValidFiles(validFiles);
      setCompressDialogOpen(true);
      return;
    }

    if (validFiles.length === 0) return;
    await doUpload(validFiles);
  };

  const handleCompressAndUpload = async () => {
    setCompressing(true);
    const compressed: File[] = [];
    for (const { file } of oversizedFiles) {
      try {
        const result = await compressImage(file);
        if (result.size > MAX_SIZE) {
          const result2 = await compressImage(file, 3000, 0.6);
          if (result2.size > MAX_SIZE) {
            toast.error(`${file.name}: still too large after compression`);
            continue;
          }
          compressed.push(result2);
        } else {
          compressed.push(result);
        }
        toast.success(`Compressed ${file.name} → ${formatFileSize(result.size)}`);
      } catch {
        toast.error(`Failed to compress ${file.name}`);
      }
    }
    setCompressing(false);
    setCompressDialogOpen(false);
    const allFiles = [...pendingValidFiles, ...compressed];
    setOversizedFiles([]);
    setPendingValidFiles([]);
    if (allFiles.length > 0) await doUpload(allFiles);
  };

  const doUpload = async (validFiles: File[]) => {
    if (!user) return;
    console.log(`[Upload] Starting upload for ${validFiles.length} file(s), user: ${user.id}`);

    setUploading(true);
    setUploadProgress(0);
    let successCount = 0;

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      const ext = file.name.split(".").pop();
      const path = `${user.id}/${Date.now()}-${i}.${ext}`;
      const isImage = file.type.startsWith("image/");

      console.log(`[Upload] [${i + 1}/${validFiles.length}] Uploading "${file.name}" (${(file.size / 1024).toFixed(0)} KB, ${file.type}) → ${path}`);

      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file);
      if (uploadError) {
        toast.error(`Failed to upload ${file.name}: ${uploadError.message}`);
        console.error(`[Upload] Storage upload failed for "${file.name}":`, uploadError);
        continue;
      }
      console.log(`[Upload] Storage upload OK for "${file.name}"`);

      let duration: number | null = null;
      if (!isImage) {
        duration = await getVideoDuration(file);
        console.log(`[Upload] Video duration for "${file.name}": ${duration}s`);
      }

      const insertPayload: Record<string, any> = {
        user_id: user.id,
        name: file.name,
        storage_path: path,
        type: isImage ? "image" : "video",
        duration,
        folder_id: currentFolderId,
      };
      const { data: mediaRow, error: insertError } = await supabase.from("media").insert(insertPayload as any).select("id").single();

      if (insertError) {
        toast.error(`Failed to save ${file.name} to library: ${insertError.message}`);
        console.error(`[Upload] DB insert failed for "${file.name}":`, insertError);
        continue;
      }
      console.log(`[Upload] DB insert OK for "${file.name}", media_id: ${mediaRow.id}`);

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

  const toggleAudioMuted = async (item: MediaWithSize) => {
    const newMuted = !item.audio_muted;
    const { error } = await supabase
      .from("media")
      .update({ audio_muted: newMuted })
      .eq("id", item.id);
    if (error) {
      toast.error("Failed to update audio setting");
    } else {
      setMedia((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, audio_muted: newMuted } : m))
      );
      toast.success(newMuted ? "Audio muted" : "Audio unmuted");
    }
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

  // Delete confirmation state
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<MediaWithSize | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [restoredIds, setRestoredIds] = useState<Set<string>>(new Set());

  const markRestored = (ids: string[]) => {
    setRestoredIds(new Set(ids));
    setTimeout(() => setRestoredIds(new Set()), 1200);
  };

  const deleteMedia = async (item: MediaWithSize) => {
    // Optimistically remove from UI
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
    setDeleteConfirmItem(null);

    // Show undo toast
    const undoRef = { undone: false };
    toast("Deleted " + item.name, {
      action: {
        label: "Undo",
        onClick: () => {
          undoRef.undone = true;
          setMedia((prev) => [...prev, item].sort((a, b) => b.created_at.localeCompare(a.created_at)));
          toast.success("Restored " + item.name);
        },
      },
      duration: 5000,
      onAutoClose: () => {
        if (!undoRef.undone) {
          supabase.storage.from(BUCKET).remove([item.storage_path]);
          supabase.from("media").delete().eq("id", item.id);
        }
      },
      onDismiss: () => {
        if (!undoRef.undone) {
          supabase.storage.from(BUCKET).remove([item.storage_path]);
          supabase.from("media").delete().eq("id", item.id);
        }
      },
    });
  };

  const bulkDelete = async () => {
    if (selected.size === 0) return;
    setBulkDeleteConfirm(false);

    const toDelete = media.filter((m) => selected.has(m.id));
    const deletedIds = new Set(toDelete.map((m) => m.id));

    // Optimistically remove from UI
    setMedia((prev) => prev.filter((m) => !deletedIds.has(m.id)));
    setSelected(new Set());
    setDeleting(false);

    const undoRef = { undone: false };
    toast(`Deleted ${toDelete.length} file(s)`, {
      action: {
        label: "Undo",
        onClick: () => {
          undoRef.undone = true;
          setMedia((prev) => [...prev, ...toDelete].sort((a, b) => b.created_at.localeCompare(a.created_at)));
          toast.success(`Restored ${toDelete.length} file(s)`);
        },
      },
      duration: 5000,
      onAutoClose: () => {
        if (!undoRef.undone) {
          supabase.storage.from(BUCKET).remove(toDelete.map((m) => m.storage_path));
          for (const item of toDelete) {
            supabase.from("media").delete().eq("id", item.id);
          }
        }
      },
      onDismiss: () => {
        if (!undoRef.undone) {
          supabase.storage.from(BUCKET).remove(toDelete.map((m) => m.storage_path));
          for (const item of toDelete) {
            supabase.from("media").delete().eq("id", item.id);
          }
        }
      },
    });
  };

  const toggleSelect = (id: string) => {
    if (renamingId) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const startRename = (item: MediaWithSize, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(item.id);
    setRenameValue(item.name);
  };

  const commitRename = async () => {
    if (!renamingId || !renameValue.trim()) {
      setRenamingId(null);
      return;
    }
    const { error } = await supabase
      .from("media")
      .update({ name: renameValue.trim() })
      .eq("id", renamingId);
    if (error) {
      toast.error("Rename failed");
    } else {
      setMedia((prev) =>
        prev.map((m) => (m.id === renamingId ? { ...m, name: renameValue.trim() } : m))
      );
      toast.success("Renamed");
    }
    setRenamingId(null);
  };

  const selectAll = () => {
    const currentMedia = filteredMedia;
    if (selected.size === currentMedia.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(currentMedia.map((m) => m.id)));
    }
  };

  const getPublicUrl = (path: string) => {
    if (path.startsWith("https://")) return path;
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
    return data.publicUrl;
  };

  // ── Derived data ──
  const currentFolders = folders.filter((f) => f.parent_id === currentFolderId);
  const filteredMedia = media.filter((m) => m.folder_id === currentFolderId);
  const totalSize = media.reduce((sum, m) => sum + (m.fileSize ?? 0), 0);

  // Folders available as move targets (exclude current folder)
  const moveTargetFolders = folders.filter((f) => f.id !== currentFolderId);

  return (
    <div className="space-y-5 animate-fade-in min-w-0">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between min-w-0">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">Media Library</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
              {media.length} file{media.length !== 1 ? "s" : ""}
              {totalSize > 0 && ` · ${formatFileSize(totalSize)}`}
              {folders.length > 0 && ` · ${folders.length} folder${folders.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="h-10 sm:h-9"
              onClick={() => setCreatingFolder(true)}
            >
              <FolderPlus className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Folder</span>
            </Button>
            <label>
              <Button disabled={uploading} asChild className="h-10 sm:h-9">
                <span className="cursor-pointer">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1.5" />
                  )}
                  {uploading ? `${uploadProgress}%` : "Upload"}
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

        {/* Breadcrumb navigation */}
        {(currentFolderId !== null || folderPath.length > 0) && (
          <div className="flex items-center gap-1 text-sm flex-wrap">
            <button
              onClick={() => navigateToFolder(null)}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/40 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              <span>Library</span>
            </button>
            {folderPath.map((folder) => (
              <div key={folder.id} className="flex items-center gap-1">
                <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
                <button
                  onClick={() => navigateToFolder(folder.id)}
                  className={`px-2 py-1 rounded-md transition-colors ${
                    folder.id === currentFolderId
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {folder.name}
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bulk action toolbar — only visible when items selected */}
        {isSelecting && (
          <div className="rounded-xl glass border-primary/20 px-3 py-2.5 space-y-2 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{selected.size} selected</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={selectAll}>
                  <CheckSquare className="h-3.5 w-3.5 mr-1" />
                  {selected.size === filteredMedia.length ? "None" : "All"}
                </Button>
                <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => setSelected(new Set())}>
                  <X className="h-3.5 w-3.5 mr-1" /> Cancel
                </Button>
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="default"
                size="sm"
                className="h-10 sm:h-8 text-xs flex-1 min-w-[100px]"
                onClick={openSendDialog}
              >
                <Send className="h-3.5 w-3.5 mr-1.5" />
                Send to Screen
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 sm:h-8 text-xs flex-1 min-w-[100px]"
                onClick={() => openPlaylistDialog(Array.from(selected))}
              >
                <ListMusic className="h-3.5 w-3.5 mr-1.5" />
                Add to Playlist
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-10 sm:h-8 text-xs flex-1 min-w-[100px]"
                onClick={() => setMoveDialogOpen(true)}
              >
                <MoveRight className="h-3.5 w-3.5 mr-1.5" />
                Move to Folder
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="h-10 sm:h-8 text-xs"
                onClick={() => setBulkDeleteConfirm(true)}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                )}
                Delete
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Drop zone — compact on mobile */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`glass glass-spotlight rounded-2xl p-6 sm:p-10 text-center transition-all duration-200 border cursor-pointer ${
          dragOver
            ? "border-primary shadow-[0_0_30px_rgba(0,163,163,0.3)] scale-[1.01]"
            : "border-white/[0.06] hover:border-primary/30 active:scale-[0.99]"
        }`}
      >
        <div className="flex flex-col items-center gap-1.5 sm:gap-2">
          <div className="p-2.5 sm:p-3 rounded-full bg-primary/10">
            <Upload className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          </div>
          <p className="font-medium text-foreground text-sm sm:text-base">
            Tap to upload or drag & drop
            {currentFolderId && <span className="text-primary"> into this folder</span>}
          </p>
          <p className="text-xs sm:text-sm text-muted-foreground">Images auto-compressed if needed · Videos up to 500 MB</p>
        </div>
      </div>

      {/* Folders grid */}
      {currentFolders.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-[0.15em] text-muted-foreground font-semibold">Folders</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {currentFolders.map((folder) => {
              const colorStyle = getFolderColor(folder.color);
              const itemCount = media.filter((m) => m.folder_id === folder.id).length;
              return (
                <div
                  key={folder.id}
                  className={`group glass rounded-xl border transition-all cursor-pointer active:scale-[0.98] ${
                    dragOverFolderId === folder.id
                      ? "border-primary ring-2 ring-primary/50 scale-[1.02] shadow-[0_0_20px_rgba(0,163,163,0.3)]"
                      : `${colorStyle.accent} hover:border-primary/40`
                  }`}
                  onClick={() => navigateToFolder(folder.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderId(folder.id);
                  }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderId(folder.id);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    if (dragOverFolderId === folder.id) setDragOverFolderId(null);
                  }}
                  onDrop={async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragOverFolderId(null);
                    const mediaId = e.dataTransfer.getData("text/media-id");
                    if (!mediaId) return;
                    // Move the dragged item (and any selected items if the dragged one is selected)
                    const idsToMove = selected.has(mediaId) ? Array.from(selected) : [mediaId];
                    for (const id of idsToMove) {
                      await (supabase.from("media") as any).update({ folder_id: folder.id }).eq("id", id);
                    }
                    setMedia((prev) =>
                      prev.map((m) => (idsToMove.includes(m.id) ? { ...m, folder_id: folder.id } : m))
                    );
                    toast.success(`Moved ${idsToMove.length} item${idsToMove.length > 1 ? "s" : ""} to ${folder.name}`);
                    setSelected(new Set());
                  }}
                >
                  <div className={`p-4 flex flex-col gap-2 ${colorStyle.bg} rounded-xl`}>
                    <div className="flex items-center justify-between">
                      <FolderOpen className={`h-6 w-6 ${colorStyle.text}`} />
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFolderId(folder.id);
                            setRenameFolderValue(folder.name);
                          }}
                          className="p-1 rounded hover:bg-background/30 transition-colors"
                        >
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteFolderConfirm({ id: folder.id, name: folder.name });
                          }}
                          className="p-1 rounded hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    </div>
                    {renamingFolderId === folder.id ? (
                      <Input
                        autoFocus
                        value={renameFolderValue}
                        onChange={(e) => setRenameFolderValue(e.target.value)}
                        onBlur={commitFolderRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitFolderRename();
                          if (e.key === "Escape") setRenamingFolderId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-xs py-0 px-1.5 bg-background/50 border-primary/30"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-foreground truncate">{folder.name}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {itemCount} item{itemCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Back button when in a folder */}
      {currentFolderId && (
        <button
          onClick={() => {
            const parentFolder = folders.find(f => f.id === currentFolderId);
            navigateToFolder(parentFolder?.parent_id ?? null);
          }}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back
        </button>
      )}

      {/* Media grid */}
      {filteredMedia.length > 0 && (
        <div className={`grid gap-3 sm:gap-4 stagger-in ${
          (() => {
            const size = localStorage.getItem("glowhub_media_grid") || "medium";
            if (size === "small") return "grid-cols-3 md:grid-cols-4 lg:grid-cols-6";
            if (size === "large") return "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3";
            return "grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";
          })()
        }`}>
          {filteredMedia.map((item) => {
            const url = getPublicUrl(item.storage_path);
            const isSelected = selected.has(item.id);
            return (
              <div
                key={item.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("text/media-id", item.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                className={`glass glass-spotlight rounded-xl sm:rounded-2xl group overflow-hidden transition-all cursor-grab border active:scale-[0.98] ${
                  isSelected
                    ? "ring-2 ring-primary border-primary"
                    : "border-white/[0.06] hover:border-primary/30"
                }`}
                onClick={() => {
                  if (longPressFired.current) { longPressFired.current = false; return; }
                  toggleSelect(item.id);
                }}
                onTouchStart={() => {
                  longPressFired.current = false;
                   longPressRef.current = setTimeout(() => {
                    longPressFired.current = true;
                    if (!isSelecting) {
                      hapticMedium();
                      setRenamingId(item.id);
                      setRenameValue(item.name);
                    }
                  }, 600);
                }}
                onTouchEnd={() => {
                  if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                }}
                onTouchMove={() => {
                  if (longPressRef.current) { clearTimeout(longPressRef.current); longPressRef.current = null; }
                }}
                onContextMenu={(e) => e.preventDefault()}
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
                    className={`absolute top-1.5 left-1.5 sm:top-2 sm:left-2 transition-opacity ${
                      isSelecting || isSelected ? "opacity-100" : "sm:opacity-0 sm:group-hover:opacity-100 opacity-70"
                    }`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleSelect(item.id)}
                      className="h-6 w-6 sm:h-5 sm:w-5 border-2 bg-background/80 backdrop-blur-sm"
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

                  {/* Audio mute toggle for videos */}
                  {item.type === "video" && !isSelecting && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleAudioMuted(item);
                      }}
                      className="absolute bottom-2 left-2 p-1.5 rounded-md bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-colors z-10"
                      title={item.audio_muted ? "Unmute audio" : "Mute audio"}
                    >
                      {item.audio_muted ? (
                        <VolumeX className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </button>
                  )}

                  {/* Mux processing badge */}
                  {item.type === "video" && item.mux_asset_id && item.mux_status === "preparing" && (
                    <Badge
                      className="absolute bottom-2 left-10 text-[10px] px-1.5 py-0.5 bg-amber-500/90 text-white backdrop-blur-sm animate-pulse border-0"
                    >
                      <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
                      Processing
                    </Badge>
                  )}

                  {!isSelecting && (
                    <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 opacity-70 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openPlaylistDialog([item.id]);
                        }}
                        className="p-2 sm:p-1.5 bg-primary/90 rounded-lg sm:rounded-md hover:bg-primary transition-colors"
                        title="Add to playlist"
                      >
                        <ListMusic className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-primary-foreground" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirmItem(item);
                        }}
                        className="p-2 sm:p-1.5 bg-destructive/90 rounded-lg sm:rounded-md hover:bg-destructive transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-3 sm:w-3 text-destructive-foreground" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="p-2 sm:p-3">
                  <div className="flex items-center gap-1 min-w-0">
                    {renamingId === item.id ? (
                      <Input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className="h-6 text-xs py-0 px-1.5 bg-background/50 border-primary/30 flex-1 min-w-0"
                      />
                    ) : (
                      <>
                        <p className="text-xs sm:text-sm font-medium truncate text-foreground flex-1 min-w-0" title={item.name}>
                          {item.name}
                        </p>
                        {!isSelecting && (
                          <button
                            onClick={(e) => startRename(item, e)}
                            className="p-1 rounded hover:bg-primary/10 transition-colors shrink-0 sm:opacity-0 sm:group-hover:opacity-100 opacity-70"
                            title="Rename"
                          >
                            <Pencil className="h-3 w-3 text-muted-foreground hover:text-primary" />
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-[10px] sm:text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                    {item.fileSize != null && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground">
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

      {filteredMedia.length === 0 && currentFolders.length === 0 && !uploading && (
        <div className="glass glass-spotlight rounded-2xl text-center py-16 text-muted-foreground border border-white/[0.06]">
          {currentFolderId ? (
            <>
              <Folder className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">This folder is empty</p>
              <p className="text-sm mt-1">Upload files or move existing media here</p>
            </>
          ) : (
            <>
              <FileWarning className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p className="font-medium text-foreground">No media uploaded yet</p>
              <p className="text-sm mt-1">Upload images and videos to build your content library</p>
            </>
          )}
        </div>
      )}

      {/* Create folder dialog */}
      <Dialog open={creatingFolder} onOpenChange={setCreatingFolder}>
        <DialogContent className="glass border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FolderPlus className="h-5 w-5 text-primary" />
              New Folder
            </DialogTitle>
            <DialogDescription>
              Create a folder to organize your media
              {currentFolderId && " (inside current folder)"}
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }}
            placeholder="Folder name"
            className="bg-background/50"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreatingFolder(false)}>Cancel</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()}>
              <FolderPlus className="h-4 w-4 mr-1.5" />
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Move to folder dialog */}
      <Dialog open={moveDialogOpen} onOpenChange={setMoveDialogOpen}>
        <DialogContent className="glass border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <MoveRight className="h-5 w-5 text-primary" />
              Move to Folder
            </DialogTitle>
            <DialogDescription>
              Move {selected.size} item{selected.size !== 1 ? "s" : ""} to a folder
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentFolderId !== null && (
              <button
                onClick={() => moveSelectedToFolder(null)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all text-left"
              >
                <Home className="h-5 w-5 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground">Root (no folder)</p>
                  <p className="text-xs text-muted-foreground">Move back to library root</p>
                </div>
              </button>
            )}
            {moveTargetFolders.map((folder) => {
              const itemCount = media.filter((m) => m.folder_id === folder.id).length;
              const colorStyle = getFolderColor(folder.color);
              return (
                <button
                  key={folder.id}
                  onClick={() => moveSelectedToFolder(folder.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all text-left"
                >
                  <FolderOpen className={`h-5 w-5 shrink-0 ${colorStyle.text}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{folder.name}</p>
                    <p className="text-xs text-muted-foreground">{itemCount} item{itemCount !== 1 ? "s" : ""}</p>
                  </div>
                  <MoveRight className="h-4 w-4 text-muted-foreground" />
                </button>
              );
            })}
            {moveTargetFolders.length === 0 && currentFolderId === null && (
              <div className="text-center py-8 text-muted-foreground">
                <Folder className="h-8 w-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No folders yet</p>
                <p className="text-xs mt-1">Create a folder first</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

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

      {/* Compress oversized images dialog */}
      <Dialog open={compressDialogOpen} onOpenChange={(open) => {
        if (!open && !compressing) {
          setCompressDialogOpen(false);
          if (pendingValidFiles.length > 0) {
            doUpload(pendingValidFiles);
            setPendingValidFiles([]);
          }
          setOversizedFiles([]);
        }
      }}>
        <DialogContent className="glass border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Shrink className="h-5 w-5 text-primary" />
              Compress & Upload
            </DialogTitle>
            <DialogDescription>
              {oversizedFiles.length} image{oversizedFiles.length !== 1 ? "s" : ""} exceed{oversizedFiles.length === 1 ? "s" : ""} 50 MB. Compress to fit?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {oversizedFiles.map(({ file }, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <span className="text-sm truncate flex-1 min-w-0 text-foreground">{file.name}</span>
                <Badge variant="secondary" className="ml-2 shrink-0 text-xs">
                  {formatFileSize(file.size)}
                </Badge>
              </div>
            ))}
          </div>
          {pendingValidFiles.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {pendingValidFiles.length} other file{pendingValidFiles.length !== 1 ? "s" : ""} will upload normally.
            </p>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setCompressDialogOpen(false);
                if (pendingValidFiles.length > 0) {
                  doUpload(pendingValidFiles);
                  setPendingValidFiles([]);
                }
                setOversizedFiles([]);
              }}
              disabled={compressing}
            >
              Skip
            </Button>
            <Button onClick={handleCompressAndUpload} disabled={compressing}>
              {compressing ? (
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              ) : (
                <Shrink className="h-4 w-4 mr-1.5" />
              )}
              {compressing ? "Compressing…" : "Compress & Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add to Playlist dialog */}
      <Dialog open={playlistDialogOpen} onOpenChange={setPlaylistDialogOpen}>
        <DialogContent className="glass border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ListMusic className="h-5 w-5 text-primary" />
              Add to Playlist
            </DialogTitle>
            <DialogDescription>
              Add {playlistMediaIds.length} item{playlistMediaIds.length !== 1 ? "s" : ""} to an existing playlist
            </DialogDescription>
          </DialogHeader>
          {playlists.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <ListMusic className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No playlists found</p>
              <p className="text-xs mt-1">Create a playlist first from the Playlists page</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {playlists.map((playlist) => (
                <button
                  key={playlist.id}
                  onClick={() => addToPlaylist(playlist.id)}
                  disabled={addingToPlaylist}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/[0.06] bg-white/5 hover:bg-white/10 hover:border-primary/30 transition-all text-left"
                >
                  <ListMusic className="h-5 w-5 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{playlist.title}</p>
                    <p className="text-xs text-muted-foreground">{playlist.item_count} item{playlist.item_count !== 1 ? "s" : ""}</p>
                  </div>
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Single delete confirmation */}
      <AlertDialog open={!!deleteConfirmItem} onOpenChange={(open) => !open && setDeleteConfirmItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete media?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteConfirmItem?.name}"? You'll have a few seconds to undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirmItem && deleteMedia(deleteConfirmItem)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk delete confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selected.size} file{selected.size !== 1 ? "s" : ""}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the selected files? You'll have a few seconds to undo this action.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={bulkDelete}
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Folder delete confirmation */}
      <AlertDialog open={!!deleteFolderConfirm} onOpenChange={(open) => !open && setDeleteFolderConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete folder?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteFolderConfirm?.name}"? Media inside will be moved to the root library. You'll have a few seconds to undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteFolderConfirm && deleteFolder(deleteFolderConfirm.id)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
