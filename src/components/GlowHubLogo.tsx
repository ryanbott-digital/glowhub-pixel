export function GlowHubLogo({ className = "" }: { className?: string }) {
  return (
    <span className={`font-bold font-['Poppins'] ${className}`}>
      <span className="text-glow">Glow</span>
      <span className="text-hub">Hub</span>
    </span>
  );
}

/** Interwoven geometric GH monogram matching brand asset sheet */
export function GHSymbol({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="12" fill="hsl(215, 55%, 15%)" />
      {/* G letter - teal, rounded geometric */}
      <path
        d="M14 32C14 22.06 22.06 14 32 14H34V22H32C26.48 22 22 26.48 22 32C22 37.52 26.48 42 32 42H34V36H28V30H38V48H32C22.06 48 14 41.94 14 32Z"
        fill="hsl(180, 100%, 40%)"
      />
      {/* H letter - slightly offset, interwoven effect */}
      <path
        d="M36 16H44V28H48V16H56V48H48V36H44V48H36V16Z"
        fill="hsl(180, 100%, 50%)"
        opacity="0.85"
      />
      {/* Center glow dot */}
      <circle cx="40" cy="32" r="2.5" fill="hsl(24, 95%, 53%)" opacity="0.9" />
    </svg>
  );
}

/** Branded nav icons matching brand asset sheet style */
export function BrandCalendarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="2" fill="hsl(215, 55%, 23%)" />
      <rect x="3" y="5" width="18" height="5" rx="2" fill="hsl(180, 100%, 40%)" />
      <rect x="7" y="3" width="2" height="4" rx="1" fill="hsl(180, 100%, 40%)" />
      <rect x="15" y="3" width="2" height="4" rx="1" fill="hsl(180, 100%, 40%)" />
      <rect x="6" y="13" width="3" height="2" rx="0.5" fill="hsl(24, 95%, 53%)" />
      <rect x="10.5" y="13" width="3" height="2" rx="0.5" fill="hsl(180, 100%, 50%)" />
      <rect x="15" y="13" width="3" height="2" rx="0.5" fill="hsl(180, 100%, 50%)" />
      <rect x="6" y="17" width="3" height="2" rx="0.5" fill="hsl(180, 100%, 50%)" />
      <rect x="10.5" y="17" width="3" height="2" rx="0.5" fill="hsl(180, 100%, 50%)" />
    </svg>
  );
}

export function BrandPlayIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="4" width="20" height="16" rx="3" fill="hsl(24, 95%, 53%)" />
      <path d="M10 8.5V15.5L16 12L10 8.5Z" fill="white" />
    </svg>
  );
}

export function BrandGridIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="3" width="7.5" height="7.5" rx="1.5" fill="hsl(180, 100%, 40%)" />
      <rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5" fill="hsl(180, 100%, 40%)" />
      <rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5" fill="hsl(180, 100%, 40%)" />
      <rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5" fill="hsl(180, 100%, 40%)" />
    </svg>
  );
}

export function BrandChartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="5" width="18" height="16" rx="2" fill="hsl(215, 55%, 23%)" />
      <polyline points="6,17 10,13 14,15 18,9" stroke="hsl(180, 100%, 45%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <polyline points="6,17 10,13 14,15 18,9" stroke="hsl(24, 95%, 53%)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" strokeDasharray="4 12" strokeDashoffset="4" />
    </svg>
  );
}

export function BrandMonitorIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="20" height="14" rx="2" fill="hsl(215, 55%, 23%)" />
      <rect x="4" y="5" width="16" height="10" rx="1" fill="hsl(180, 100%, 40%)" opacity="0.2" />
      <rect x="9" y="17" width="6" height="2" rx="0.5" fill="hsl(215, 55%, 23%)" />
      <rect x="7" y="19" width="10" height="2" rx="1" fill="hsl(215, 55%, 23%)" />
      {/* Radiant glow lines */}
      <line x1="12" y1="1" x2="12" y2="0" stroke="hsl(180, 100%, 45%)" strokeWidth="1" opacity="0.5" />
      <line x1="5" y1="2" x2="4" y2="1" stroke="hsl(330, 80%, 60%)" strokeWidth="1" opacity="0.4" />
      <line x1="19" y1="2" x2="20" y2="1" stroke="hsl(24, 95%, 53%)" strokeWidth="1" opacity="0.4" />
    </svg>
  );
}
