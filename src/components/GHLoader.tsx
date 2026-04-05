/**
 * Branded loading component using the GH monogram symbol.
 * Features: shimmer effect on G/H letters, pulsing multi-color center glow.
 */
export function GHLoader({ size = 64, text }: { size?: number; text?: string }) {
  const id = `gh-loader-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible"
      >
        <defs>
          {/* Shimmer gradient for G letter */}
          <linearGradient id={`${id}-shimmer-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(180, 100%, 40%)" />
            <stop offset="40%" stopColor="hsl(180, 100%, 65%)" />
            <stop offset="60%" stopColor="hsl(180, 100%, 40%)" />
            <stop offset="100%" stopColor="hsl(180, 100%, 40%)" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-1 -1"
              to="1 1"
              dur="2s"
              repeatCount="indefinite"
            />
          </linearGradient>

          {/* Shimmer gradient for H letter */}
          <linearGradient id={`${id}-shimmer-h`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="hsl(180, 100%, 50%)" />
            <stop offset="40%" stopColor="hsl(180, 100%, 72%)" />
            <stop offset="60%" stopColor="hsl(180, 100%, 50%)" />
            <stop offset="100%" stopColor="hsl(180, 100%, 50%)" />
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="-1 -1"
              to="1 1"
              dur="2s"
              repeatCount="indefinite"
              begin="0.3s"
            />
          </linearGradient>

          {/* Multi-color pulsing glow for center */}
          <radialGradient id={`${id}-center-glow`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(24, 95%, 53%)">
              <animate
                attributeName="stop-color"
                values="hsl(24, 95%, 53%);hsl(180, 100%, 50%);hsl(330, 80%, 55%);hsl(24, 95%, 53%)"
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* Background */}
        <rect width="64" height="64" rx="12" fill="hsl(215, 55%, 15%)" />

        {/* G letter with shimmer */}
        <path
          d="M14 32C14 22.06 22.06 14 32 14H34V22H32C26.48 22 22 26.48 22 32C22 37.52 26.48 42 32 42H34V36H28V30H38V48H32C22.06 48 14 41.94 14 32Z"
          fill={`url(#${id}-shimmer-g)`}
        />

        {/* H letter with shimmer */}
        <path
          d="M36 16H44V28H48V16H56V48H48V36H44V48H36V16Z"
          fill={`url(#${id}-shimmer-h)`}
          opacity="0.85"
        />

        {/* Center glow dot — pulsing with multi-color */}
        <circle cx="40" cy="32" r="2.5" fill={`url(#${id}-center-glow)`}>
          <animate
            attributeName="r"
            values="2.5;4;2.5"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Outer glow ring */}
        <circle cx="40" cy="32" r="6" fill="none" stroke={`url(#${id}-center-glow)`} strokeWidth="0.8" opacity="0.4">
          <animate
            attributeName="r"
            values="5;9;5"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.4;0.1;0.4"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
      </svg>

      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

/** Full-page loading screen using GHLoader */
export function GHLoaderPage({ text }: { text?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <GHLoader size={72} text={text} />
    </div>
  );
}
