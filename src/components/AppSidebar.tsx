import { useState, useEffect, useRef, useCallback } from "react";
import { LogOut, Download, CreditCard, Shield, Settings, Layers, PenTool, ExternalLink, CalendarClock, Zap } from "lucide-react";
import { useIsAdmin } from "@/hooks/use-admin-role";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
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
  { title: "Dashboard", url: "/", icon: BrandCalendarIcon, pro: false, adminOnly: false },
  { title: "Media Library", url: "/media", icon: BrandGridIcon, pro: false, adminOnly: false },
  { title: "Playlists", url: "/playlists", icon: BrandPlayIcon, pro: false, adminOnly: false },
  { title: "Screens", url: "/screens", icon: BrandMonitorIcon, pro: false, adminOnly: false },
  { title: "Canvas", url: "/canvas", icon: ({ className }: { className?: string }) => <Layers className={className} />, pro: true, adminOnly: false },
  { title: "Studio", url: "/studio", icon: ({ className }: { className?: string }) => <PenTool className={className} />, pro: false, adminOnly: false, newTab: true },
  { title: "Schedule", url: "/schedule", icon: ({ className }: { className?: string }) => <CalendarClock className={className} />, pro: false, adminOnly: false },
  { title: "Analytics", url: "/analytics", icon: BrandChartIcon, pro: true, adminOnly: false },
  { title: "Billing", url: "/billing", icon: ({ className }: { className?: string }) => <CreditCard className={className} />, pro: false, adminOnly: false },
  { title: "Integrations", url: "/integrations", icon: ({ className }: { className?: string }) => <Zap className={className} />, pro: true, adminOnly: false },
  { title: "Admin", url: "/admin", icon: ({ className }: { className?: string }) => <Shield className={className} />, pro: false, adminOnly: true },
  { title: "Download", url: "/download", icon: ({ className }: { className?: string }) => <Download className={className} />, pro: false, adminOnly: false },
  { title: "Settings", url: "/settings", icon: ({ className }: { className?: string }) => <Settings className={className} />, pro: false, adminOnly: false },
];

export function AppSidebar() {
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { isAdmin } = useIsAdmin();

  const [screenUsage, setScreenUsage] = useState<{ count: number; limit: number } | null>(null);
  const [unreadSubmissions, setUnreadSubmissions] = useState(0);
  const userTier = useAuth().subscriptionTier;

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      const { currentCount, limit } = await checkScreenLimit(user.id);
      setScreenUsage({ count: currentCount, limit });
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
        {collapsed ? <GHSymbol size={28} /> : <GlowLogoImage className="h-7 w-auto drop-shadow-[0_0_12px_hsl(180,100%,40%,0.35)]" />}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.filter((item) => !item.adminOnly || isAdmin).map((item) => {
                const isLockedPro = item.pro && !isProTier(userTier);
                const isNewTab = 'newTab' in item && item.newTab;
                return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    {isNewTab && !isLockedPro ? (
                      <TooltipProvider delayDuration={300}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={item.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => { if (isMobile) setOpenMobile(false); }}
                              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-sidebar-accent/50 transition-all duration-200 ${
                                location.pathname === item.url ? "bg-primary/10 text-primary font-medium border-l-2 border-primary shadow-[inset_0_0_20px_hsla(180,100%,45%,0.05)]" : ""
                              }`}
                            >
                              <item.icon className="mr-2 h-4 w-4" />
                              {!collapsed && (
                                <span className="flex items-center gap-1.5 flex-1">
                                  {item.title}
                                  {item.pro && !isProTier(userTier) && <span className="pro-badge">PRO</span>}
                                  <ExternalLink className="h-3 w-3 ml-auto text-muted-foreground/50" />
                                </span>
                              )}
                            </a>
                          </TooltipTrigger>
                          <TooltipContent side="right">Opens in new tab</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ) : (
                    <NavLink
                      to={isLockedPro ? "#" : item.url}
                      end={item.url === "/"}
                      onClick={isLockedPro ? (e: React.MouseEvent) => {
                        e.preventDefault();
                        toast("Upgrade to Pro to access " + item.title, { action: { label: "Upgrade", onClick: () => navigate("/billing") } });
                      } : () => {
                        if (isMobile) setOpenMobile(false);
                      }}
                      className="hover:bg-sidebar-accent/50 transition-all duration-200"
                      activeClassName="bg-primary/10 text-primary font-medium border-l-2 border-primary shadow-[inset_0_0_20px_hsla(180,100%,45%,0.05)]"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && (
                        <span className="flex items-center gap-1.5">
                          {item.title}
                          {item.pro && !isProTier(userTier) && <span className="pro-badge">PRO</span>}
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
                    </NavLink>
                    )}
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
