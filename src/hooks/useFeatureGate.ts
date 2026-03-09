import { useState, useCallback } from "react";
import { usePermissions } from "@/hooks/usePermission";
import type { FeatureKey } from "@/types/plans";
import { FEATURE_LABELS } from "@/types/plans";

// Features exclusive to VIP Annual plan
const VIP_ONLY_FEATURES: FeatureKey[] = [
  "chat_estatisticas",
  "chat_boloes",
  "guias",
];

export type PremiumVariant = "premium" | "vip";

export function useFeatureGate() {
  const { hasPermission, loading } = usePermissions();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState<string | undefined>();
  const [upgradeVariant, setUpgradeVariant] = useState<PremiumVariant>("premium");

  const isVipFeature = (feature: FeatureKey) => VIP_ONLY_FEATURES.includes(feature);

  const getBadgeVariant = (feature: FeatureKey): PremiumVariant | null => {
    if (loading) return null;
    if (hasPermission(feature)) return null;
    return isVipFeature(feature) ? "vip" : "premium";
  };

  const gateFeature = useCallback(
    (feature: FeatureKey, onAllowed?: () => void) => {
      if (hasPermission(feature)) {
        onAllowed?.();
        return true;
      }
      setUpgradeLabel(FEATURE_LABELS[feature] || undefined);
      setUpgradeVariant(isVipFeature(feature) ? "vip" : "premium");
      setUpgradeOpen(true);
      return false;
    },
    [hasPermission]
  );

  return {
    gateFeature,
    getBadgeVariant,
    upgradeOpen,
    setUpgradeOpen,
    upgradeLabel,
    upgradeVariant,
    isVipFeature,
  };
}
