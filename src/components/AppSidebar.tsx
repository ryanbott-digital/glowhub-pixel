import { useState, useEffect, useRef, useCallback } from "react";
import { LogOut, Download, Smartphone, Check, CreditCard, Shield, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { isProTier } from "@/lib/subscription";
import { toast } from "sonner";
import { GlowHubLogo, GHSymbol, GlowLogoImage, BrandCalendarIcon, BrandPlayIcon, BrandGridIcon, BrandMonitorIcon, BrandChartIcon } from "@/components/GlowHubLogo";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { checkScreenLimit } from "@/lib/subscription";

const items = [
  { title: "Dashboard", url: "/", icon: BrandCalendarIcon, pro: false },
  { title: "Media Library", url: "/media", icon: BrandGridIcon, pro: false },
  { title: "Playlists", url: "/playlists", icon: BrandPlayIcon, pro: false },
  { title: "Screens", url: "/screens", icon: BrandMonitorIcon, pro: false },
  { title: "Analytics", url: "/analytics", icon: BrandChartIcon, pro: true },
  { title: "Subscription", url: "/subscription", icon: ({ className }: { className?: string }) => <CreditCard className={className} />, pro: false },
  { title: "Admin", url: "/admin", icon: ({ className }: { className?: string }) => <Shield className={className} />, pro: false },
  { title: "Install Guide", url: "/install", icon: ({ className }: { className?: string }) => <Download className={className} />, pro: false },
  { title: "Install App", url: "/install-app", icon: ({ className }: { className?: string }) => <Smartphone className={className} />, pro: false },
  { title: "Settings", url: "/settings", icon: ({ className }: { className?: string }) => <Settings className={className} />, pro: false },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const [isInstalled, setIsInstalled] = useState(false);
  const [screenUsage, setScreenUsage] = useState<{ count: number; limit: number } | null>(null);
  const [unreadSubmissions, setUnreadSubmissions] = useState(0);
  const [userTier, setUserTier] = useState("free");

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as any).standalone === true;
    setIsInstalled(standalone);
  }, []);

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      const { currentCount, limit, tier } = await checkScreenLimit(user.id);
      setScreenUsage({ count: currentCount, limit });
      setUserTier(tier);
    };
    fetchUsage();
  }, [user, location.pathname]);

  // Fetch unread contact submissions count
  useEffect(() => {
    if (!user) return;
    const fetchUnread = async () => {
      const lastSeen = localStorage.getItem("glowhub_admin_last_seen") || "1970-01-01T00:00:00Z";
      const { count } = await supabase
        .from("contact_submissions")
        .select("*", { count: "exact", head: true })
        .gt("created_at", lastSeen);
      setUnreadSubmissions(count || 0);
    };
    fetchUnread();

    // Mark as read when visiting /admin
    if (location.pathname === "/admin") {
      localStorage.setItem("glowhub_admin_last_seen", new Date().toISOString());
      setUnreadSubmissions(0);
    }
  }, [user, location.pathname]);

  return (
    <Sidebar collapsible="icon" className="border-r-0 glass-strong">
      <div className="p-4 flex items-center justify-center">
        {!collapsed && <GlowLogoImage className="h-7 w-auto drop-shadow-[0_0_12px_hsl(180,100%,40%,0.35)]" />}
        {collapsed && <GlowLogoImage className="h-6 w-auto drop-shadow-[0_0_10px_hsl(180,100%,40%,0.35)]" />}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const isLockedPro = item.pro && !isProTier(userTier);
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={isLockedPro ? "#" : item.url}
                      end={item.url === "/"}
                      onClick={isLockedPro ? (e: React.MouseEvent) => {
                        e.preventDefault();
                        toast("Upgrade to Pro to access " + item.title, { action: { label: "Upgrade", onClick: () => navigate("/subscription") } });
                      } : undefined}
                      className="hover:bg-sidebar-accent/50 transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary shadow-[inset_0_0_20px_hsla(180,100%,45%,0.05)]"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-1.5">
                          {item.title}
                          {item.pro && <span className="pro-badge">PRO</span>}
                        </span>
                      )}
                      {item.url === "/screens" && !collapsed && screenUsage && (
                        <span className={`ml-auto inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          screenUsage.count >= screenUsage.limit
                            ? "bg-destructive/15 text-destructive"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {screenUsage.count}/{screenUsage.limit}
                        </span>
                      )}
                      {item.url === "/admin" && unreadSubmissions > 0 && !collapsed && (
                        <span className="ml-auto inline-flex items-center justify-center rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-destructive-foreground min-w-[18px]">
                          {unreadSubmissions > 99 ? "99+" : unreadSubmissions}
                        </span>
                      )}
                      {item.url === "/admin" && unreadSubmissions > 0 && collapsed && (
                        <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-destructive shadow-[0_0_6px_hsl(var(--destructive))]" />
                      )}
                      {item.url === "/install-app" && !collapsed && isInstalled && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                          <Check className="h-3 w-3" />
                          Installed
                        </span>
                      )}
                      {item.url === "/install-app" && collapsed && isInstalled && (
                        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2 space-y-1">
        <ThemeToggle />
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          onClick={signOut}
          className="w-full justify-start text-sidebar-foreground hover:text-primary hover:bg-primary/10 transition-all"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
