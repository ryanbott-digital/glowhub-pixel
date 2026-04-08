import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";

const STORAGE_KEY = "glow-cookie-consent";

interface CookiePrefs {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: CookiePrefs = {
  essential: true,
  analytics: false,
  marketing: false,
};

export function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [show, setShow] = useState(false);
  const [flashing, setFlashing] = useState(false);
  const [customizing, setCustomizing] = useState(false);
  const [prefs, setPrefs] = useState<CookiePrefs>(DEFAULT_PREFS);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    setShow(true);
    const t = setTimeout(() => setVisible(true), 2000);
    return () => clearTimeout(t);
  }, []);

  if (!show) return null;

  const dismiss = (selectedPrefs: CookiePrefs) => {
    setFlashing(true);
    setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...selectedPrefs, timestamp: new Date().toISOString() }));
      setVisible(false);
      setTimeout(() => setShow(false), 500);
    }, 300);
  };

  const handleAcceptAll = () => {
    dismiss({ essential: true, analytics: true, marketing: true });
  };

  const handleSavePrefs = () => {
    dismiss(prefs);
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
      <div className="relative overflow-hidden rounded-2xl bg-white/5 backdrop-blur-[15px] border border-cyan-400/20 shadow-[0_0_20px_rgba(0,200,200,0.08)]">
        {/* Neon flash overlay */}
        {flashing && (
          <div className="absolute inset-0 rounded-2xl bg-cyan-400/30 animate-[flash_300ms_ease-out_forwards] pointer-events-none z-10" />
        )}

        {/* Main row */}
        <div className="px-5 py-3 flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto sm:flex-1">
            {/* Pulsing dot */}
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
            </span>

            <p className="text-xs sm:text-sm text-[#E2E8F0] flex-1">
              We use cookies to optimize your Glow experience. System optimized?
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleAcceptAll}
              className="rounded-full bg-cyan-400 px-4 py-1.5 text-xs font-semibold text-[#0B1120] hover:bg-cyan-300 transition-colors"
            >
              Accept
            </button>
            <button
              onClick={() => setCustomizing(!customizing)}
              className="rounded-full border border-white/10 px-4 py-1.5 text-xs font-semibold text-[#E2E8F0] hover:border-cyan-400/40 hover:text-cyan-400 transition-colors"
            >
              Customize
            </button>
          </div>
        </div>

        {/* Expandable preferences panel */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: customizing ? "300px" : "0px", opacity: customizing ? 1 : 0 }}
        >
          <div className="border-t border-white/10 px-5 py-4 space-y-3">
            <CookieRow
              label="Essential"
              description="Required for core functionality"
              checked={prefs.essential}
              disabled
            />
            <CookieRow
              label="Analytics"
              description="Help us understand how you use Glow"
              checked={prefs.analytics}
              onChange={(v) => setPrefs((p) => ({ ...p, analytics: v }))}
            />
            <CookieRow
              label="Marketing"
              description="Personalized content and offers"
              checked={prefs.marketing}
              onChange={(v) => setPrefs((p) => ({ ...p, marketing: v }))}
            />

            <button
              onClick={handleSavePrefs}
              className="w-full rounded-lg bg-cyan-400/10 border border-cyan-400/20 px-4 py-2 text-xs font-semibold text-cyan-400 hover:bg-cyan-400/20 transition-colors mt-1"
            >
              Save Preferences
            </button>
          </div>
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

function CookieRow({
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold text-[#E2E8F0]">
          {label}
          {disabled && (
            <span className="ml-1.5 text-[10px] font-normal text-cyan-400/60">Always on</span>
          )}
        </p>
        <p className="text-[10px] text-[#94A3B8] leading-snug">{description}</p>
      </div>
      <Switch
        checked={checked}
        disabled={disabled}
        onCheckedChange={onChange}
        className="shrink-0 data-[state=checked]:bg-cyan-400"
      />
    </div>
  );
}
