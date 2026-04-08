import { useState, useEffect } from "react";

const STORAGE_KEY = "glow-cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [flashing, setFlashing] = useState(false);
  

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    setShow(true);
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const handleAccept = () => {
    setFlashing(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
      setVisible(false);
      setTimeout(() => setShow(false), 500);
    }, 300);
  };

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl"
      style={{
        transform: visible
          ? "translateX(-50%) translateY(0)"
          : "translateX(-50%) translateY(calc(100% + 3rem))",
        opacity: visible ? 1 : 0,
        transition: "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease",
      }}
    >
      <div className="relative overflow-hidden rounded-2xl sm:rounded-full bg-white/5 backdrop-blur-[15px] border border-cyan-400/20 px-5 py-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-4 shadow-[0_0_20px_rgba(0,200,200,0.08)]">
        {/* Neon flash overlay */}
        {flashing && (
          <div className="absolute inset-0 rounded-full bg-cyan-400/30 animate-[flash_300ms_ease-out_forwards] pointer-events-none" />
        )}

        {/* Pulsing dot */}
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
        </span>

        <p className="text-xs sm:text-sm text-[#E2E8F0] flex-1">
          We use cookies to optimize your Glow experience. System optimized?
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleAccept}
            className="rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-[#0B1120] hover:bg-cyan-300 transition-colors"
          >
            Accept
          </button>
          <a
            href="/terms?tab=privacy"
            className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-[#E2E8F0] hover:border-cyan-400/40 hover:text-cyan-400 transition-colors inline-block"
          >
            Customize
          </a>
        </div>
      </div>

      <style>{`
        @keyframes flash {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
