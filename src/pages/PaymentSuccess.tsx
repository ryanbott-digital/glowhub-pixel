import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaymentSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
      {/* Radiant glow background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00A3A3]/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-[#3B82F6]/15 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-emerald-500/20 flex items-center justify-center">
          <CheckCircle className="h-10 w-10 text-emerald-400" />
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight">
          Welcome to <span className="bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] bg-clip-text text-transparent">Pro</span>
        </h1>

        <p className="text-[#94A3B8] text-lg">
          Your subscription is active. You now have access to up to 5 screens, advanced scheduling, and priority support.
        </p>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-xl p-6 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-[#94A3B8]">Plan</span>
            <span className="text-white font-medium">Glow Pro</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#94A3B8]">Billing</span>
            <span className="text-white font-medium">$9/month</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#94A3B8]">Screens</span>
            <span className="text-white font-medium">Up to 5</span>
          </div>
        </div>

        <Button
          onClick={() => navigate("/screens")}
          className="w-full bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] hover:shadow-[0_0_20px_rgba(0,163,163,0.4)] text-white border-0 h-12 text-base"
        >
          Go to Screens <ArrowRight className="ml-2 h-4 w-4" />
        </Button>

        <button
          onClick={() => navigate("/")}
          className="text-sm text-[#94A3B8] hover:text-white transition-colors"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
