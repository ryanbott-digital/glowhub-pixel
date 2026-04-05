export function GlowHubLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold ${className}`}>
      <span className="text-glow">Glow</span>
      <span className="text-hub">Hub</span>
    </span>
  );
}

export function GHSymbol({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="40" height="40" rx="8" fill="hsl(215, 55%, 15%)" />
      <text x="6" y="28" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="20" fill="hsl(180, 100%, 45%)">G</text>
      <text x="20" y="28" fontFamily="Poppins, sans-serif" fontWeight="800" fontSize="20" fill="hsl(24, 95%, 53%)">H</text>
    </svg>
  );
}
