import { useState, useEffect, useRef, useCallback } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { GlowLogoImage } from "@/components/GlowHubLogo";

type AuthView = "login" | "signup" | "forgot";

/* Magnetic button hook */
function useMagnetic() {
  const ref = useRef<HTMLButtonElement>(null);
  const handleMove = useCallback((e: MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    el.style.transform = `translate(${x * 0.2}px, ${y * 0.3}px)`;
  }, []);
  const handleLeave = useCallback(() => {
    if (ref.current) ref.current.style.transform = "translate(0,0)";
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => { el.removeEventListener("mousemove", handleMove); el.removeEventListener("mouseleave", handleLeave); };
  }, [handleMove, handleLeave]);
  return ref;
}

export default function Auth() {
  const [view, setView] = useState<AuthView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const btnRef = useMagnetic();

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
        toast.success("Account created! Check your email to verify.");
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
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "#0B1120" }}
    >
      {/* Mesh gradient background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[5%] w-[500px] h-[500px] rounded-full bg-[hsla(180,100%,45%,0.06)] blur-[120px] animate-[authMesh1_14s_ease-in-out_infinite_alternate]" />
        <div className="absolute top-[20%] right-[0%] w-[400px] h-[400px] rounded-full bg-[hsla(220,80%,55%,0.05)] blur-[100px] animate-[authMesh2_16s_ease-in-out_infinite_alternate]" />
        <div className="absolute bottom-[5%] left-[25%] w-[350px] h-[350px] rounded-full bg-[hsla(330,80%,60%,0.04)] blur-[110px] animate-[authMesh3_18s_ease-in-out_infinite_alternate]" />
      </div>

      <div className="w-full max-w-md animate-fade-in">
        {/* Centered Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="radiant-glow-sm rounded-2xl mb-6">
            <GlowLogoImage className="h-16" />
          </div>
          <p className="text-[#94A3B8] text-sm tracking-wide">Digital Signage Platform</p>
        </div>

        {/* Glassmorphism Card */}
        <div className="rounded-2xl p-8"
          style={{
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.06)",
            boxShadow: "0 25px 50px rgba(0,0,0,0.3), 0 0 40px hsla(180,100%,45%,0.05)",
          }}
        >
          <h2 className="text-xl font-semibold text-[#E2E8F0] text-center mb-1">{title}</h2>
          {view === "forgot" && (
            <p className="text-sm text-[#94A3B8] text-center mt-1 mb-4">
              Enter your email and we'll send you a reset link
            </p>
          )}
          {view !== "forgot" && <div className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-white/[0.03] border-white/[0.08] text-[#E2E8F0] placeholder:text-[#64748B] glow-focus h-11"
            />
            {view !== "forgot" && (
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="bg-white/[0.03] border-white/[0.08] text-[#E2E8F0] placeholder:text-[#64748B] glow-focus h-11"
              />
            )}
            <Button
              ref={btnRef}
              type="submit"
              disabled={loading}
              className="w-full h-11 font-semibold text-[#0B1120] bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] magnetic-btn will-change-transform"
            >
              {loading ? "Loading..." : buttonLabel}
            </Button>
          </form>

          <div className="mt-5 space-y-2 text-center text-sm">
            {view === "login" && (
              <>
                <button
                  onClick={() => setView("forgot")}
                  className="block w-full text-[#94A3B8] hover:text-[#00A3A3] transition-colors"
                >
                  Forgot your password?
                </button>
                <button
                  onClick={() => setView("signup")}
                  className="block w-full text-[#94A3B8] hover:text-[#00A3A3] transition-colors"
                >
                  Don't have an account? <span className="text-[#00A3A3] font-medium">Sign up</span>
                </button>
              </>
            )}
            {view === "signup" && (
              <button
                onClick={() => setView("login")}
                className="block w-full text-[#94A3B8] hover:text-[#00A3A3] transition-colors"
              >
                Already have an account? <span className="text-[#00A3A3] font-medium">Sign in</span>
              </button>
            )}
            {view === "forgot" && (
              <button
                onClick={() => setView("login")}
                className="block w-full text-[#94A3B8] hover:text-[#00A3A3] transition-colors"
              >
                Back to sign in
              </button>
            )}
            <div className="flex items-center justify-center gap-3 mt-4 text-[10px] text-[#475569]">
              <Link to="/terms" className="hover:text-[#94A3B8] transition-colors">Terms</Link>
              <span>·</span>
              <Link to="/terms?tab=privacy" className="hover:text-[#94A3B8] transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes authMesh1 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(50px, 30px) scale(1.15); }
        }
        @keyframes authMesh2 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(-40px, 40px) scale(1.1); }
        }
        @keyframes authMesh3 {
          0% { transform: translate(0, 0) scale(1); }
          100% { transform: translate(30px, -20px) scale(1.2); }
        }
      `}</style>
    </div>
  );
}
