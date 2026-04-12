import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/use-admin-role";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Users, Crown, Mail, Calendar, Megaphone, Trash2, ExternalLink, Reply, Clock, Infinity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  subscription_tier: string;
  granted_pro_until: string | null;
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

function computeGrantExpiry(duration: string): string | null {
  if (duration === "forever") return null; // null = forever in DB
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

  useEffect(() => {
    fetchUsers();
    fetchSubmissions();
    fetchLeads();
  }, []);

  const handleTierChange = (user: AdminUser, tier: string) => {
    if (tier === "pro" && user.subscription_tier !== "pro") {
      // Open grant dialog to choose duration
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
    const isForever = tier === "pro" && user.granted_pro_until === null;
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
          <CardDescription>Grant or revoke subscription tiers for any user</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading users…</p>
          ) : users.length === 0 ? (
            <p className="text-muted-foreground text-sm">No users found</p>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(user.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    {tierBadge(user)}
                  </div>
                  <Select
                    value={user.subscription_tier}
                    onValueChange={(val) => handleTierChange(user, val)}
                    disabled={updating === user.id}
                  >
                    <SelectTrigger className="w-28">
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

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
    </div>
  );
}
