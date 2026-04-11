import { ReactNode, useEffect, useState } from "react";
import { usePermissionContext } from "@/contexts/PermissionContext";
import type { FeatureKey } from "@/types/plans";
import { FEATURE_LABELS } from "@/types/plans";
import { useUpsell } from "@/contexts/UpsellContext";
import { VIP_ONLY_FEATURES } from "@/lib/featureMap";

interface GatedPageProps {
  feature: FeatureKey;
  children: ReactNode;
}

/**
 * Wraps a page. If user lacks permission, shows the upgrade modal overlay.
 * The page content is still rendered underneath (blurred) for a teaser effect.
 * Admin always gets full access — no modal, no blur.
 */
export function GatedPage({ feature, children }: GatedPageProps) {
  const { hasPermission, loading, isAdmin } = usePermissionContext();
  const { openUpgradeModal } = useUpsell();
  const [shouldShowOverlay, setShouldShowOverlay] = useState(false);

  // Admin always has access, skip everything
  const hasAccess = loading || isAdmin || hasPermission(feature);

  useEffect(() => {
    if (!hasAccess) {
      const timer = setTimeout(() => {
        setShouldShowOverlay(true);
        openUpgradeModal(FEATURE_LABELS[feature], VIP_ONLY_FEATURES.includes(feature) ? "vip" : "premium");
      }, 400);
      return () => clearTimeout(timer);
    } else {
      setShouldShowOverlay(false);
    }
  }, [hasAccess, feature, openUpgradeModal]);

  if (hasAccess) return <>{children}</>;

  return (
    <div className="relative min-h-[60vh]">
      <div className="pointer-events-none select-none opacity-40 blur-[4px] transition-all duration-500">
        {children}
      </div>
      {shouldShowOverlay && (
        <div className="absolute inset-0 z-10 bg-background/20 backdrop-blur-[2px] rounded-xl flex items-center justify-center" />
      )}
    </div>
  );
}
