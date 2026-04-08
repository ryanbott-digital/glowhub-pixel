import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Crown, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function WelcomePro() {
  const navigate = useNavigate();
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowContent(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Level Up neon flash */}
      <div className="fixed inset-0 z-[100] pointer-events-none animate-[levelUpPulse_1.5s_ease-out_forwards]">
        <div className="absolute inset-0 bg-cyan-400/25" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vmax] h-[200vmax] rounded-full bg-cyan-400/20 animate-[levelUpRing_1.5s_ease-out_forwards]" />
      </div>

      {/* Background glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-400/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className={`relative z-10 max-w-md w-full text-center space-y-6 transition-all duration-700 ${showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
        <div className="mx-auto w-24 h-24 rounded-full bg-cyan-400/15 flex items-center justify-center shadow-[0_0_40px_rgba(34,211,238,0.3)]">
          <Crown className="h-12 w-12 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.6)]" />
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight">
          System Level Up
        </h1>

        <p className="text-[#94A3B8] text-lg">
          You've unlocked <span className="text-cyan-400 font-semibold">Glow Pro</span>. Up to 5 screens, advanced scheduling, weather & RSS widgets, and priority support are now yours.
        </p>

        <Button
          onClick={() => navigate("/")}
          className="w-full bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] hover:shadow-[0_0_20px_rgba(0,163,163,0.4)] text-white border-0 h-12 text-base"
        >
          Start Pro Broadcast <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <button
          onClick={() => navigate("/billing")}
          className="text-sm text-[#94A3B8] hover:text-white transition-colors"
        >
          Go to Billing
        </button>
      </div>

      <style>{`
        @keyframes levelUpPulse {
          0% { opacity: 0; }
          15% { opacity: 1; }
          100% { opacity: 0; }
        }
        @keyframes levelUpRing {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
