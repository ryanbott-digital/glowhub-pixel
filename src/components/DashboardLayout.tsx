import { ReactNode, useEffect, useCallback, useState, useRef } from "react";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAntiTamper } from "@/hooks/use-anti-tamper";
import { useAdminManifest } from "@/hooks/use-admin-manifest";
import { AdminInstallBanner } from "@/components/AdminInstallBanner";

function SwipeHandler() {
  const { setOpenMobile, openMobile, isMobile } = useSidebar();
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      touchStart.current = null;

      // Must be a horizontal swipe (dx > dy) with minimum 60px travel
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx)) return;

      if (dx > 0 && !openMobile) {
        setOpenMobile(true);
      } else if (dx < 0 && openMobile) {
        setOpenMobile(false);
      }
    };

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, openMobile, setOpenMobile]);

  return null;
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [defaultOpen, setDefaultOpen] = useState(() => {
    return localStorage.getItem("glowhub_compact_sidebar") !== "true";
  });

  useAntiTamper();
  useAdminManifest();

  const handleMouseMove = useCallback((e: MouseEvent) => {
    const cards = document.querySelectorAll('.glass-spotlight');
    cards.forEach((card) => {
      const rect = (card as HTMLElement).getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
      (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);

  return (
    <SidebarProvider defaultOpen={defaultOpen}>
      <SwipeHandler />
      <div className="min-h-screen flex w-full mesh-bg overflow-x-hidden">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminInstallBanner />
          <header className="h-14 flex items-center glass-strong mx-3 mt-3 rounded-2xl px-4 sticky top-3 z-30">
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-primary transition-colors" />
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-glow-green heartbeat-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">Live</span>
            </div>
          </header>
          <main className="flex-1 p-3 md:p-6 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
