import { Download, X } from "lucide-react";
import { useApkUpdateCheck } from "@/hooks/use-apk-update-check";

export function ApkUpdateBanner() {
  const { showBanner, latestVersion, currentVersion, downloadUrl, dismiss } =
    useApkUpdateCheck();

  if (!showBanner) return null;

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] animate-fade-in">
      <div className="flex items-center gap-3 rounded-xl border border-primary/30 bg-background/95 backdrop-blur-md px-4 py-3 shadow-lg max-w-md">
        <Download className="h-5 w-5 text-primary shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            GlowHub v{latestVersion} available
          </p>
          <p className="text-xs text-muted-foreground">
            You're running v{currentVersion}
          </p>
        </div>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tv-focusable shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Update
        </a>
        <button
          onClick={dismiss}
          className="tv-focusable shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
