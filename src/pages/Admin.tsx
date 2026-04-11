import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Users, Crown, Mail, Calendar, Megaphone, Trash2, ExternalLink, Reply, X, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  subscription_status: string;
  subscription_tier: string;
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

export default function Admin() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<ContactSubmission[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [selectedSub, setSelectedSub] = useState<ContactSubmission | null>(null);

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

  const updateTier = async (userId: string, tier: string) => {
    setUpdating(userId);
    const { error } = await supabase.functions.invoke("admin-users", {
      method: "POST",
      body: { user_id: userId, subscription_tier: tier },
    });

    if (error) {
      toast.error("Failed to update tier");
    } else {
      toast.success(`Tier updated to ${tier}`);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, subscription_tier: tier, subscription_status: tier === "free" ? "free" : tier }
            : u
        )
      );
    }
    setUpdating(null);
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

  const tierBadge = (tier: string) => {
    const t = TIERS.find((t) => t.value === tier) || TIERS[0];
    return (
      <Badge variant={t.color} className={tier === "pro" ? "bg-primary text-primary-foreground" : ""}>
        {tier === "pro" && <Crown className="h-3 w-3 mr-1" />}
        {t.label}
      </Badge>
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
                    {tierBadge(user.subscription_tier)}
                  </div>
                  <Select
                    value={user.subscription_tier}
                    onValueChange={(val) => updateTier(user.id, val)}
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
