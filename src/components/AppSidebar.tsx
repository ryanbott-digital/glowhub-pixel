import { useState, useEffect } from "react";
import { LogOut, Download, Smartphone, Check } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GlowHubLogo, GHSymbol, BrandCalendarIcon, BrandPlayIcon, BrandGridIcon, BrandMonitorIcon, BrandChartIcon } from "@/components/GlowHubLogo";
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

const items = [
  { title: "Dashboard", url: "/", icon: BrandCalendarIcon },
  { title: "Media Library", url: "/media", icon: BrandGridIcon },
  { title: "Playlists", url: "/playlists", icon: BrandPlayIcon },
  { title: "Screens", url: "/screens", icon: BrandMonitorIcon },
  { title: "Analytics", url: "/analytics", icon: BrandChartIcon },
  { title: "Install Guide", url: "/install", icon: ({ className }: { className?: string }) => <Download className={className} /> },
  { title: "Install App", url: "/install-app", icon: ({ className }: { className?: string }) => <Smartphone className={className} /> },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut } = useAuth();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <div className="p-4 flex items-center gap-2">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <GHSymbol size={32} />
            <GlowHubLogo className="text-xl" />
          </div>
        )}
        {collapsed && <GHSymbol size={28} />}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="hover:bg-sidebar-accent/50"
                      activeClassName="bg-sidebar-accent text-sidebar-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
          className="w-full justify-start text-sidebar-foreground hover:text-sidebar-primary hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
