import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { toast } from "sonner";

type AuthView = "login" | "signup" | "forgot";

export default function Auth() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (view === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully!");
      } else if (view === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        toast.success("Account created!");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Check your email for a password reset link.");
        setView("login");
      }
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const title = view === "login" ? "Welcome back" : view === "signup" ? "Create your account" : "Reset your password";
  const buttonLabel = view === "login" ? "Sign In" : view === "signup" ? "Sign Up" : "Send Reset Link";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-glow">Glow</h1>
          <p className="text-muted-foreground mt-2">Digital Signage Platform</p>
        </div>

        <Card className="radiant-glow-sm">
          <CardHeader className="text-center">
            <h2 className="text-xl font-semibold text-foreground">{title}</h2>
            {view === "forgot" && (
              <p className="text-sm text-muted-foreground mt-1">
                Enter your email and we'll send you a reset link
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {view !== "forgot" && (
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Loading..." : buttonLabel}
              </Button>
            </form>

            <div className="mt-4 space-y-2 text-center text-sm">
              {view === "login" && (
                <>
                  <button
                    onClick={() => setView("forgot")}
                    className="block w-full text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot your password?
                  </button>
                  <button
                    onClick={() => setView("signup")}
                    className="block w-full text-muted-foreground hover:text-primary transition-colors"
                  >
                    Don't have an account? Sign up
                  </button>
                </>
              )}
              {view === "signup" && (
                <button
                  onClick={() => setView("login")}
                  className="block w-full text-muted-foreground hover:text-primary transition-colors"
                >
                  Already have an account? Sign in
                </button>
              )}
              {view === "forgot" && (
                <button
                  onClick={() => setView("login")}
                  className="block w-full text-muted-foreground hover:text-primary transition-colors"
                >
                  Back to sign in
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
