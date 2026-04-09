import { ReactNode, useEffect, useCallback, useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAntiTamper } from "@/hooks/use-anti-tamper";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [defaultOpen, setDefaultOpen] = useState(() => {
    return localStorage.getItem("glowhub_compact_sidebar") !== "true";
  });

  // Anti-tamper protection
  useAntiTamper();

  // Spotlight cursor effect for glass cards
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
      <div className="min-h-screen flex w-full mesh-bg">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          {/* Floating glass navbar */}
          <header className="h-14 flex items-center glass-strong mx-3 mt-3 rounded-2xl px-4 sticky top-3 z-30">
            <SidebarTrigger className="mr-4 text-muted-foreground hover:text-primary transition-colors" />
            <div className="flex-1" />
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-glow-green heartbeat-pulse" />
              <span className="text-[10px] font-medium text-muted-foreground tracking-widest uppercase">Live</span>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
