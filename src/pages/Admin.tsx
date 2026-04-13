import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Users, Crown, Mail, Calendar, Megaphone, Trash2, ExternalLink, Reply, Clock, Infinity, Smartphone, Save, Loader2, Monitor, Wifi, WifiOff, AlertTriangle, CreditCard, Plus, ChevronRight, Package, Image, RotateCcw, Unplug, Activity } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface AdminScreen {
  id: string;
  name: string;
  status: string;
  last_ping: string | null;
  last_screenshot_url: string | null;
}

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  subscription_tier: string;
  granted_pro_until: string | null;
  screen_packs: number;
  stripe_customer_id: string | null;
  screens: AdminScreen[];
}

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

interface Lead {
  id: string;
  email: string;
  created_at: string;
  consented_at: string;
}

const TIERS = [
  { value: "free", label: "Free", color: "secondary" as const },
  { value: "basic", label: "Basic", color: "default" as const },
  { value: "pro", label: "Pro", color: "default" as const },
];

const GRANT_DURATIONS = [
  { value: "1m", label: "1 Month" },
  { value: "3m", label: "3 Months" },
  { value: "6m", label: "6 Months" },
  { value: "1y", label: "1 Year" },
  { value: "2y", label: "2 Years" },
  { value: "forever", label: "Forever" },
];

const SCREENS_PER_PACK = 5;
const BASE_SCREEN_LIMITS: Record<string, number> = { free: 1, basic: 3, pro: 5, enterprise: 25 };

function computeGrantExpiry(duration: string): string | null {
  if (duration === "forever") return null;
  const now = new Date();
  const match = duration.match(/^(\d+)(m|y)$/);
  if (!match) return null;
  const amount = parseInt(match[1]);
  const unit = match[2];
  if (unit === "m") now.setMonth(now.getMonth() + amount);
  else if (unit === "y") now.setFullYear(now.getFullYear() + amount);
  return now.toISOString();
}

function formatGrantExpiry(dateStr: string | null): string {
  if (!dateStr) return "Forever";
  const d = new Date(dateStr);
  if (d < new Date()) return "Expired";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function isOnline(lastPing: string | null): boolean {
  if (!lastPing) return false;
  return Date.now() - new Date(lastPing).getTime() < 90_000;
}

function isOfflineLong(lastPing: string | null): boolean {
  if (!lastPing) return false;
  return Date.now() - new Date(lastPing).getTime() > 300_000;
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function Admin() {
  const navigate = useNavigate();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<ContactSubmission | null>(null);

  // Grant dialog state
  const [grantUser, setGrantUser] = useState<AdminUser | null>(null);
  const [grantDuration, setGrantDuration] = useState("1m");

  // APK version manager state
  const [apkVersion, setApkVersion] = useState("");
  const [apkDownloadUrl, setApkDownloadUrl] = useState("");
  const [apkLoading, setApkLoading] = useState(true);
  const [apkSaving, setApkSaving] = useState(false);

  // User detail sheet
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [addingPack, setAddingPack] = useState(false);
  const [screenCommandLoading, setScreenCommandLoading] = useState<string | null>(null);
  const [bulkRestarting, setBulkRestarting] = useState(false);
  const [userSearch, setUserSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activityLogs, setActivityLogs] = useState<{ id: string; action: string; screen_id: string; playlist_title: string | null; created_at: string }[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityScreenFilter, setActivityScreenFilter] = useState("all");
  const [activityActionFilter, setActivityActionFilter] = useState("all");

  // Admin: remote restart a screen via broadcast
  const handleAdminRestart = async (screenId: string, screenName: string) => {
    setScreenCommandLoading(screenId);
    try {
      const channel = supabase.channel(`remote-refresh-${screenId}`);
      await channel.subscribe();
      await channel.send({ type: "broadcast", event: "remote-refresh", payload: {} });
      supabase.removeChannel(channel);
      toast.success(`Restart signal sent to "${screenName}"`);
    } catch {
      toast.error("Failed to send restart signal");
    }
    setTimeout(() => setScreenCommandLoading(null), 2000);
  };

  // Admin: restart all screens for a user
  const handleRestartAllScreens = async (screens: AdminScreen[]) => {
    const onlineScreens = screens.filter((s) => isOnline(s.last_ping));
    if (onlineScreens.length === 0) { toast.error("No online screens to restart"); return; }
    setBulkRestarting(true);
    let sent = 0;
    for (const screen of onlineScreens) {
      try {
        const channel = supabase.channel(`remote-refresh-${screen.id}`);
        await channel.subscribe();
        await channel.send({ type: "broadcast", event: "remote-refresh", payload: {} });
        supabase.removeChannel(channel);
        sent++;
      } catch { /* continue */ }
    }
    toast.success(`Restart signal sent to ${sent} screen${sent !== 1 ? "s" : ""}`);
    setBulkRestarting(false);
  };

  // Admin: unpair confirmation state
  const [unpairTarget, setUnpairTarget] = useState<{ id: string; name: string } | null>(null);
  const [restartTarget, setRestartTarget] = useState<{ id: string; name: string } | null>(null);

  // Admin: unpair a screen via edge function
  const handleAdminUnpair = async (screenId: string, screenName: string) => {
    setScreenCommandLoading(screenId);
    try {
      const { error } = await supabase.functions.invoke("admin-screen-command", {
        body: { action: "unpair", screen_id: screenId },
      });
      if (error) throw error;
      toast.success(`"${screenName}" has been unpaired`);
      // Update local state
      if (selectedUser) {
        setSelectedUser({
          ...selectedUser,
          screens: selectedUser.screens.map(s =>
            s.id === screenId ? { ...s, status: "offline", last_ping: null, last_screenshot_url: null } : s
          ),
        });
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to unpair screen");
    }
    setScreenCommandLoading(null);
  };

  // Redirect non-admins
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/", { replace: true });
    }
  }, [isAdmin, adminLoading, navigate]);

  const fetchUsers = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase.functions.invoke("admin-users", {
      method: "GET",
    });

    if (error) {
      toast.error("Failed to load users — you may not have admin access");
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setLoading(false);
  };

  const fetchSubmissions = async () => {
    setSubsLoading(true);
    const { data, error } = await supabase
      .from("contact_submissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("Failed to load submissions:", error);
    } else {
      setSubmissions((data as ContactSubmission[]) || []);
    }
    setSubsLoading(false);
  };

  const fetchLeads = async () => {
    setLeadsLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);
    if (!error) setLeads((data as Lead[]) || []);
    setLeadsLoading(false);
  };

  const fetchApkSettings = async () => {
    setApkLoading(true);
    const { data } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["latest_apk_version", "apk_download_url"]);
    if (data) {
      for (const row of data) {
        if (row.key === "latest_apk_version") setApkVersion(row.value);
        if (row.key === "apk_download_url") setApkDownloadUrl(row.value);
      }
    }
    setApkLoading(false);
  };

  const saveApkSettings = async () => {
    setApkSaving(true);
    try {
      const now = new Date().toISOString();
      await supabase.from("app_settings").upsert({ key: "latest_apk_version", value: apkVersion, updated_at: now });
      await supabase.from("app_settings").upsert({ key: "apk_download_url", value: apkDownloadUrl, updated_at: now });
      toast.success(`APK version set to v${apkVersion} — all devices will be notified`);
    } catch {
      toast.error("Failed to save APK settings");
    }
    setApkSaving(false);
  };

  useEffect(() => {
    fetchUsers();
    fetchSubmissions();
    fetchLeads();
    fetchApkSettings();
  }, []);

  const handleTierChange = (user: AdminUser, tier: string) => {
    if (tier === "pro" && user.subscription_tier !== "pro") {
      setGrantUser({ ...user });
      setGrantDuration("1m");
    } else {
      updateTier(user.id, tier, undefined);
    }
  };

  const updateTier = async (userId: string, tier: string, grantedProUntil: string | null | undefined) => {
    setUpdating(userId);
    const body: Record<string, any> = { user_id: userId, subscription_tier: tier };
    if (grantedProUntil !== undefined) {
      body.granted_pro_until = grantedProUntil;
    }

    const { error } = await supabase.functions.invoke("admin-users", {
      method: "POST",
      body,
    });

    if (error) {
      toast.error("Failed to update tier");
    } else {
      const durationLabel = grantedProUntil === null
        ? "forever"
        : grantedProUntil
          ? `until ${new Date(grantedProUntil).toLocaleDateString()}`
          : "";
      toast.success(`Tier updated to ${tier}${durationLabel ? ` (${durationLabel})` : ""}`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                subscription_tier: tier,
                subscription_status: tier === "free" ? "free" : tier,
                granted_pro_until: grantedProUntil !== undefined ? grantedProUntil : u.granted_pro_until,
              }
            : u
        )
      );
    }
    setUpdating(null);
    setGrantUser(null);
  };

  const confirmGrant = () => {
    if (!grantUser) return;
    const expiry = computeGrantExpiry(grantDuration);
    updateTier(grantUser.id, "pro", expiry);
  };

  const handleAddScreenPack = async (userId: string) => {
    setAddingPack(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-users", {
        method: "POST",
        body: { action: "add_screen_pack", user_id: userId },
      });

      if (error) {
        toast.error(typeof error === "object" && "message" in error ? error.message : "Failed to add screen pack");
        setAddingPack(false);
        return;
      }

      if (data?.error) {
        toast.error(data.error);
        setAddingPack(false);
        return;
      }

      toast.success("Screen pack added — $9 charged to user");
      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, screen_packs: data.screen_packs ?? u.screen_packs + 1 } : u
        )
      );
      if (selectedUser?.id === userId) {
        setSelectedUser((prev) => prev ? { ...prev, screen_packs: data.screen_packs ?? prev.screen_packs + 1 } : prev);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add screen pack");
    }
    setAddingPack(false);
  };

  const deleteLead = async (id: string) => {
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete lead");
    } else {
      setLeads((prev) => prev.filter((l) => l.id !== id));
      toast.success("Lead deleted");
    }
  };

  const deleteSubmission = async (id: string) => {
    const { error } = await supabase.from("contact_submissions").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete submission");
    } else {
      setSubmissions((prev) => prev.filter((s) => s.id !== id));
      if (selectedSub?.id === id) setSelectedSub(null);
      toast.success("Submission deleted");
    }
  };

  const tierBadge = (user: AdminUser) => {
    const tier = user.subscription_tier;
    const t = TIERS.find((t) => t.value === tier) || TIERS[0];
    const isGranted = tier === "pro" && user.granted_pro_until !== null && user.granted_pro_until !== undefined;
    const isExpired = isGranted && new Date(user.granted_pro_until!) < new Date();

    return (
      <div className="flex items-center gap-1.5">
        <Badge variant={t.color} className={tier === "pro" ? "bg-primary text-primary-foreground" : ""}>
          {tier === "pro" && <Crown className="h-3 w-3 mr-1" />}
          {t.label}
        </Badge>
        {tier === "pro" && (
          <span className={`text-[10px] flex items-center gap-0.5 ${isExpired ? "text-destructive" : "text-muted-foreground"}`}>
            {user.granted_pro_until === null ? (
              <><Infinity className="h-3 w-3" /></>
            ) : (
              <><Clock className="h-3 w-3" /> {formatGrantExpiry(user.granted_pro_until)}</>
            )}
          </span>
        )}
      </div>
    );
  };

  // User detail helpers
  const getUserScreenLimit = (user: AdminUser) => {
    const base = BASE_SCREEN_LIMITS[user.subscription_tier] ?? 1;
    return base + (user.screen_packs * SCREENS_PER_PACK);
  };

  const getOnlineCount = (screens: AdminScreen[]) => screens.filter((s) => isOnline(s.last_ping)).length;
  const getOfflineAlerts = (screens: AdminScreen[]) => screens.filter((s) => s.last_ping && isOfflineLong(s.last_ping));

  if (adminLoading || !isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
          <p className="text-muted-foreground text-sm">Manage users and subscription tiers</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" /> Users
          </CardTitle>
          <CardDescription>Click a user to see full details. Grant or revoke subscription tiers.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found</p>
          ) : (
            <div className="space-y-3">
              {(() => {
                const filteredUsers = users
                  .filter((u) => !userSearch || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                  .filter((u) => tierFilter === "all" || u.subscription_tier === tierFilter)
                  .filter((u) => {
                    if (statusFilter === "all") return true;
                    if (statusFilter === "no-screens") return u.screens.length === 0;
                    if (statusFilter === "has-online") return u.screens.some((s) => isOnline(s.last_ping));
                    if (statusFilter === "all-offline") return u.screens.length > 0 && u.screens.every((s) => !isOnline(s.last_ping));
                    return true;
                  });
                const isFiltered = userSearch || tierFilter !== "all" || statusFilter !== "all";
                return (
                  <>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Input
                        placeholder="Search by email…"
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="max-w-sm"
                      />
                      <Select value={tierFilter} onValueChange={setTierFilter}>
                        <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue placeholder="All Tiers" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Tiers</SelectItem>
                          <SelectItem value="free">Free</SelectItem>
                          <SelectItem value="basic">Basic</SelectItem>
                          <SelectItem value="pro">Pro</SelectItem>
                          <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-[170px]">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="has-online">Has Online Screen</SelectItem>
                          <SelectItem value="all-offline">All Screens Offline</SelectItem>
                          <SelectItem value="no-screens">No Screens</SelectItem>
                        </SelectContent>
                      </Select>
                      <Badge variant="secondary" className="self-center whitespace-nowrap h-7 px-2.5 text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        {isFiltered ? `${filteredUsers.length} / ${users.length}` : users.length}
                      </Badge>
                    </div>
                    {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => {
                    setSelectedUser(user);
                    setActivityLogs([]);
                    setActivityLoading(true);
                    setActivityScreenFilter("all");
                    setActivityActionFilter("all");
                    const screenIds = user.screens.map((s) => s.id);
                    if (screenIds.length === 0) { setActivityLoading(false); return; }
                    supabase.from("screen_activity_logs").select("id, action, screen_id, playlist_title, created_at")
                      .in("screen_id", screenIds).order("created_at", { ascending: false }).limit(25)
                      .then(({ data }) => { setActivityLogs(data ?? []); setActivityLoading(false); });
                  }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{user.email}</p>
                        {user.screens.length > 0 && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Monitor className="h-3 w-3" />
                            {user.screens.length}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {tierBadge(user)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Select
                      value={user.subscription_tier}
                      onValueChange={(val) => handleTierChange(user, val)}
                      disabled={updating === user.id}
                    >
                      <SelectTrigger className="w-28" onClick={(e) => e.stopPropagation()}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIERS.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
                    ))}
                  </>
                );
              })()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Detail Sheet */}
      <Sheet open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              User Details
            </SheetTitle>
            <SheetDescription>{selectedUser?.email}</SheetDescription>
          </SheetHeader>

          {selectedUser && (
            <div className="space-y-6 mt-6">
              {/* User Info */}
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Account</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium truncate">{selectedUser.email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Joined</p>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Tier</p>
                    <div className="mt-0.5">{tierBadge(selectedUser)}</div>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Stripe</p>
                    <p className="font-medium flex items-center gap-1">
                      {selectedUser.stripe_customer_id ? (
                        <><CreditCard className="h-3 w-3 text-green-500" /> Linked</>
                      ) : (
                        <span className="text-muted-foreground">Not linked</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Screens */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Monitor className="h-4 w-4" /> Screens
                  </h3>
                  <div className="flex items-center gap-2">
                    {selectedUser.screens.length > 1 && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1" disabled={bulkRestarting || getOnlineCount(selectedUser.screens) === 0}>
                            {bulkRestarting ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
                            Restart All
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Restart All Screens</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will send a restart signal to all <span className="font-semibold text-foreground">{getOnlineCount(selectedUser.screens)} online</span> screen{getOnlineCount(selectedUser.screens) !== 1 ? "s" : ""} for {selectedUser.email}. Screens will briefly disconnect and reload.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleRestartAllScreens(selectedUser.screens)}>
                              Restart {getOnlineCount(selectedUser.screens)} Screen{getOnlineCount(selectedUser.screens) !== 1 ? "s" : ""}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {selectedUser.screens.length} of {getUserScreenLimit(selectedUser)} used
                      {selectedUser.screen_packs > 0 && ` (${selectedUser.screen_packs} pack${selectedUser.screen_packs !== 1 ? "s" : ""})`}
                    </span>
                  </div>
                </div>

                {/* Health Alerts */}
                {getOfflineAlerts(selectedUser.screens).length > 0 && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <div className="flex items-center gap-2 text-destructive text-xs font-medium mb-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Offline Alerts
                    </div>
                    {getOfflineAlerts(selectedUser.screens).map((s) => (
                      <p key={s.id} className="text-xs text-muted-foreground">
                        {s.name} — last seen {timeAgo(s.last_ping)}
                      </p>
                    ))}
                  </div>
                )}

                {selectedUser.screens.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No screens registered</p>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Screen</TableHead>
                          <TableHead className="text-xs">Status</TableHead>
                          <TableHead className="text-xs">Last Seen</TableHead>
                          <TableHead className="text-xs text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedUser.screens.map((screen) => {
                          const online = isOnline(screen.last_ping);
                          const isLoading = screenCommandLoading === screen.id;
                          return (
                            <TableRow key={screen.id}>
                              <TableCell className="py-2">
                                <div className="flex items-center gap-2">
                                  {screen.last_screenshot_url ? (
                                    <img
                                      src={screen.last_screenshot_url}
                                      alt=""
                                      className="h-8 w-12 rounded object-cover border"
                                    />
                                  ) : (
                                    <div className="h-8 w-12 rounded bg-muted flex items-center justify-center">
                                      <Image className="h-3 w-3 text-muted-foreground" />
                                    </div>
                                  )}
                                  <span className="text-sm font-medium truncate max-w-[120px]">{screen.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2">
                                <div className="flex items-center gap-1.5">
                                  {online ? (
                                    <Wifi className="h-3.5 w-3.5 text-green-500" />
                                  ) : (
                                    <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
                                  )}
                                  <span className={`text-xs ${online ? "text-green-600" : "text-muted-foreground"}`}>
                                    {online ? "Online" : "Offline"}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell className="py-2 text-xs text-muted-foreground">
                                {timeAgo(screen.last_ping)}
                              </TableCell>
                              <TableCell className="py-2 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        disabled={isLoading}
                                        onClick={() => setRestartTarget({ id: screen.id, name: screen.name })}
                                      >
                                        {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Remote Restart</TooltipContent>
                                  </Tooltip>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        disabled={isLoading}
                                        onClick={() => setUnpairTarget({ id: screen.id, name: screen.name })}
                                      >
                                        <Unplug className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Unpair Device</TooltipContent>
                                  </Tooltip>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}

                <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Wifi className="h-3 w-3 text-green-500" />
                  {getOnlineCount(selectedUser.screens)} online
                </div>
              </div>

              <Separator />

              {/* Billing / Screen Packs */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" /> Screen Capacity
                </h3>
                <div className="rounded-lg border p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base limit ({selectedUser.subscription_tier})</span>
                    <span className="font-medium">{BASE_SCREEN_LIMITS[selectedUser.subscription_tier] ?? 1}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Screen packs purchased</span>
                    <span className="font-medium">{selectedUser.screen_packs} × 5 = +{selectedUser.screen_packs * SCREENS_PER_PACK}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-sm font-semibold">
                    <span>Total capacity</span>
                    <span className="text-primary">{getUserScreenLimit(selectedUser)} screens</span>
                  </div>
                </div>

                {selectedUser.stripe_customer_id ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        className="w-full gap-2"
                        disabled={addingPack}
                      >
                        {addingPack ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-4 w-4" />
                        )}
                        Add Screen Pack (+5 screens, $9 charge)
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Screen Pack Purchase</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will charge <span className="font-semibold text-foreground">$9</span> to {selectedUser.email}'s Stripe account and add <span className="font-semibold text-foreground">5 additional screens</span> to their capacity. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleAddScreenPack(selectedUser.id)}>
                          Confirm &amp; Charge $9
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-muted-foreground">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500 inline mr-1" />
                    Cannot charge — user has no Stripe payment method linked. They need to subscribe or visit the billing portal first.
                  </div>
                )}
              </div>

              {/* Activity Log */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4" /> Recent Screen Activity
                </h3>
                {activityLoading ? (
                  <p className="text-xs text-muted-foreground">Loading activity…</p>
                ) : activityLogs.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No recent activity</p>
                ) : (
                  <>
                    {/* Filters */}
                    <div className="flex gap-2">
                      <Select value={activityScreenFilter} onValueChange={setActivityScreenFilter}>
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue placeholder="All Screens" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Screens</SelectItem>
                          {selectedUser?.screens.map((s) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={activityActionFilter} onValueChange={setActivityActionFilter}>
                        <SelectTrigger className="h-7 text-xs flex-1">
                          <SelectValue placeholder="All Actions" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          {[...new Set(activityLogs.map((l) => l.action))].sort().map((action) => (
                            <SelectItem key={action} value={action}>{action}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {(() => {
                      const filtered = activityLogs
                        .filter((l) => activityScreenFilter === "all" || l.screen_id === activityScreenFilter)
                        .filter((l) => activityActionFilter === "all" || l.action === activityActionFilter);
                      if (filtered.length === 0) return (
                        <p className="text-xs text-muted-foreground">No activity matches filters</p>
                      );
                      return (
                        <div className="space-y-1.5 max-h-[240px] overflow-y-auto">
                          {filtered.map((log) => {
                            const screen = selectedUser?.screens.find((s) => s.id === log.screen_id);
                            return (
                              <div key={log.id} className="flex items-start gap-2 p-2 rounded-lg border bg-muted/30 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                                <div className="min-w-0 flex-1">
                                  <span className="font-medium text-foreground">{log.action}</span>
                                  {log.playlist_title && (
                                    <span className="text-muted-foreground"> — {log.playlist_title}</span>
                                  )}
                                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground">
                                    <span className="flex items-center gap-1"><Monitor className="h-2.5 w-2.5" />{screen?.name || "Unknown"}</span>
                                    <span>{timeAgo(log.created_at)}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Grant Duration Dialog */}
      <Dialog open={!!grantUser} onOpenChange={(open) => !open && setGrantUser(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Grant Pro Access
            </DialogTitle>
          </DialogHeader>
          {grantUser && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                How long should <span className="font-medium text-foreground">{grantUser.email}</span> have Pro access?
              </p>
              <div className="grid grid-cols-2 gap-2">
                {GRANT_DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => setGrantDuration(d.value)}
                    className={`h-10 rounded-lg border text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      grantDuration === d.value
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/40 text-muted-foreground hover:border-border/70"
                    }`}
                  >
                    {d.value === "forever" && <Infinity className="h-3.5 w-3.5" />}
                    {d.value !== "forever" && <Clock className="h-3.5 w-3.5" />}
                    {d.label}
                  </button>
                ))}
              </div>
              {grantDuration !== "forever" && (
                <p className="text-xs text-muted-foreground">
                  Access expires on{" "}
                  <span className="font-medium text-foreground">
                    {new Date(computeGrantExpiry(grantDuration)!).toLocaleDateString(undefined, {
                      month: "long", day: "numeric", year: "numeric",
                    })}
                  </span>
                  . After expiry, they'll be prompted to subscribe.
                </p>
              )}
              {grantDuration === "forever" && (
                <p className="text-xs text-muted-foreground">
                  This user will have Pro access indefinitely until you manually revoke it.
                </p>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setGrantUser(null)}>Cancel</Button>
            <Button onClick={confirmGrant} disabled={updating === grantUser?.id}>
              <Crown className="h-4 w-4 mr-1.5" />
              Grant Pro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Contact Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" /> Contact Submissions
            <Badge variant="secondary" className="ml-auto">{submissions.length}</Badge>
          </CardTitle>
          <CardDescription>Messages from the public contact form</CardDescription>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <p className="text-muted-foreground text-sm">Loading submissions…</p>
          ) : submissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submissions yet</p>
          ) : (
            <div className="space-y-2">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card group cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => setSelectedSub(sub)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{sub.name}</span>
                        <span className="text-xs text-muted-foreground truncate">{sub.email}</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate max-w-[300px]">{sub.message}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(sub.created_at).toLocaleDateString(undefined, {
                        month: "short", day: "numeric",
                      })}
                    </span>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => { e.stopPropagation(); deleteSubmission(sub.id); }}
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Submission Detail Modal */}
      <Dialog open={!!selectedSub} onOpenChange={(open) => !open && setSelectedSub(null)}>
        <DialogContent className="max-w-lg">
          {selectedSub && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Message from {selectedSub.name}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <a href={`mailto:${selectedSub.email}`} className="text-primary hover:underline underline-offset-2">
                    {selectedSub.email}
                  </a>
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {new Date(selectedSub.created_at).toLocaleDateString(undefined, {
                      month: "short", day: "numeric", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="rounded-lg border bg-muted/50 p-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{selectedSub.message}</p>
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <a
                    href={`mailto:${selectedSub.email}?subject=Re: Your message on GlowHub&body=%0A%0A---%0AOriginal message:%0A${encodeURIComponent(selectedSub.message)}`}
                  >
                    <Button variant="default" className="gap-2">
                      <Reply className="h-4 w-4" /> Reply
                    </Button>
                  </a>
                  <Button
                    variant="destructive"
                    className="gap-2"
                    onClick={() => deleteSubmission(selectedSub.id)}
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* APK Version Manager */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" /> APK Update Manager
          </CardTitle>
          <CardDescription>Set the latest APK version — devices running an older version will see an update prompt</CardDescription>
        </CardHeader>
        <CardContent>
          {apkLoading ? (
            <p className="text-muted-foreground text-sm">Loading…</p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="apk-ver" className="text-sm">Latest APK Version</Label>
                  <Input
                    id="apk-ver"
                    value={apkVersion}
                    onChange={(e) => setApkVersion(e.target.value)}
                    placeholder="e.g. 2.3.0"
                    className="font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="apk-url" className="text-sm">Download URL</Label>
                  <Input
                    id="apk-url"
                    value={apkDownloadUrl}
                    onChange={(e) => setApkDownloadUrl(e.target.value)}
                    placeholder="/download"
                  />
                </div>
              </div>
              <Button onClick={saveApkSettings} disabled={apkSaving} size="sm" className="gap-1.5">
                {apkSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                Save & Notify Devices
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Captured Leads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" /> Captured Leads
            <Badge variant="secondary" className="ml-auto">{leads.length}</Badge>
          </CardTitle>
          <CardDescription>Email leads from the download page</CardDescription>
        </CardHeader>
        <CardContent>
          {leadsLoading ? (
            <p className="text-muted-foreground text-sm">Loading leads…</p>
          ) : leads.length === 0 ? (
            <p className="text-muted-foreground text-sm">No leads captured yet</p>
          ) : (
            <div className="space-y-2">
              {leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Mail className="h-4 w-4 text-primary shrink-0" />
                    <a
                      href={`mailto:${lead.email}`}
                      className="text-sm font-medium truncate text-primary underline-offset-2 hover:underline"
                      title={`Send email to ${lead.email}`}
                    >
                      {lead.email}
                    </a>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(lead.created_at).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                    <a href={`mailto:${lead.email}`} title="Reply">
                      <Button size="icon" variant="ghost" className="h-7 w-7">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </a>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => deleteLead(lead.id)}
                      title="Delete lead"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Unpair confirmation dialog */}
      <AlertDialog open={!!unpairTarget} onOpenChange={(open) => { if (!open) setUnpairTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unpair Device</AlertDialogTitle>
            <AlertDialogDescription>
              This will disconnect <span className="font-semibold text-foreground">"{unpairTarget?.name}"</span> and clear its pairing data, playlist assignment, and screenshots. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (unpairTarget) {
                  handleAdminUnpair(unpairTarget.id, unpairTarget.name);
                  setUnpairTarget(null);
                }
              }}
            >
              Unpair Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
