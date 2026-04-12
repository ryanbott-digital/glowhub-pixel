import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Dynamically switches the <link rel="manifest"> href between
 * the player manifest and the admin manifest based on the current route.
 *
 * Player routes (/player, /display) → /manifest.json
 * All other authenticated routes   → /manifest-admin.json
 */
const PLAYER_PREFIXES = ["/player", "/display"];

export function useAdminManifest() {
  const { pathname } = useLocation();

  useEffect(() => {
    const isPlayerRoute = PLAYER_PREFIXES.some((p) => pathname.startsWith(p));
    const manifestHref = isPlayerRoute ? "/manifest.json" : "/manifest-admin.json";

    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (link) {
      if (link.getAttribute("href") !== manifestHref) {
        link.setAttribute("href", manifestHref);
      }
    } else {
      link = document.createElement("link");
      link.rel = "manifest";
      link.crossOrigin = "use-credentials";
      link.href = manifestHref;
      document.head.prepend(link);
    }
  }, [pathname]);
}
