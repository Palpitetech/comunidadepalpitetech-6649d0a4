import { ReactNode, useEffect, useState } from "react";
import { usePermissionContext } from "@/contexts/PermissionContext";
import type { FeatureKey } from "@/types/plans";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";

const VIP_ONLY_FEATURES: FeatureKey[] = [
  "chat_estatisticas",
  "chat_boloes",
  "guias",
];

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
  const [showModal, setShowModal] = useState(false);

  // Admin always has access, skip everything
  const hasAccess = loading || isAdmin || hasPermission(feature);

  useEffect(() => {
    if (!hasAccess) {
      const timer = setTimeout(() => setShowModal(true), 400);
      return () => clearTimeout(timer);
    } else {
      setShowModal(false);
    }
  }, [hasAccess]);

  const isVip = VIP_ONLY_FEATURES.includes(feature);

  if (hasAccess) return <>{children}</>;

  return (
    <>
      <div className="pointer-events-none select-none opacity-40 blur-[2px]">
        {children}
      </div>
      <UpgradeModal
        open={showModal}
        onOpenChange={setShowModal}
        featureLabel={FEATURE_LABELS[feature]}
        variant={isVip ? "vip" : "premium"}
      />
    </>
  );
}
