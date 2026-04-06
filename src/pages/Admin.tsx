import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Shield, Users, Crown, Mail, Calendar } from "lucide-react";

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

  useEffect(() => {
    fetchUsers();
    fetchSubmissions();
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
          </CardTitle>
          <CardDescription>Messages from the public contact form</CardDescription>
        </CardHeader>
        <CardContent>
          {subsLoading ? (
            <p className="text-muted-foreground text-sm">Loading submissions…</p>
          ) : submissions.length === 0 ? (
            <p className="text-muted-foreground text-sm">No submissions yet</p>
          ) : (
            <div className="space-y-3">
              {submissions.map((sub) => (
                <div
                  key={sub.id}
                  className="p-4 rounded-lg border bg-card space-y-2"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-foreground truncate">{sub.name}</span>
                      <span className="text-xs text-muted-foreground truncate">{sub.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <Calendar className="h-3 w-3" />
                      {new Date(sub.created_at).toLocaleDateString(undefined, {
                        month: "short", day: "numeric", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">{sub.message}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
