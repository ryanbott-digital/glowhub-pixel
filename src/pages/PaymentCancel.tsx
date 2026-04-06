import { Button } from "@/components/ui/button";
import { XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function PaymentCancel() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1120] flex items-center justify-center p-6">
      {/* Radiant glow background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#00A3A3]/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] bg-[#3B82F6]/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 max-w-md w-full text-center space-y-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
          <XCircle className="h-10 w-10 text-amber-400" />
        </div>

        <h1 className="text-3xl font-bold text-white tracking-tight">
          Checkout Canceled
        </h1>

        <p className="text-[#94A3B8] text-lg">
          No worries — you weren't charged. You can upgrade to Pro anytime from your dashboard.
        </p>

        <div className="rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 backdrop-blur-xl p-6">
          <p className="text-sm text-[#94A3B8]">
            Still on the fence? The Pro plan includes up to 5 screens, advanced scheduling, and priority support — all for just <span className="text-white font-semibold">$9/mo</span>.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate("/subscription")}
            className="w-full bg-gradient-to-r from-[#00A3A3] to-[#3B82F6] hover:shadow-[0_0_20px_rgba(0,163,163,0.4)] text-white border-0 h-12 text-base"
          >
            View Plans
          </Button>

          <button
            onClick={() => navigate("/")}
            className="flex items-center justify-center gap-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
