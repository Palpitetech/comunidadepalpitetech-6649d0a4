import { Link } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermission";
import { getFeatureForRoute, isVipFeature } from "@/lib/featureMap";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";
import { useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";

export interface HubTool {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
}

interface HubLoteriaGridProps {
  tools: HubTool[];
  themeColor: string; // HSL string e.g. "270, 60%, 50%"
  themeFg?: string;   // foreground color, defaults to white
}

export function HubLoteriaGrid({ tools, themeColor, themeFg = "#fff" }: HubLoteriaGridProps) {
  const { hasPermission } = usePermissions();
  const [upgradeOpen, setUpgradeOpen] = useState(false);
  const [upgradeLabel, setUpgradeLabel] = useState<string | undefined>();
  const [upgradeVariant, setUpgradeVariant] = useState<"premium" | "vip">("premium");

  const handleGatedClick = (e: React.MouseEvent, path: string) => {
    const feature = getFeatureForRoute(path);
    if (feature && !hasPermission(feature)) {
      e.preventDefault();
      setUpgradeLabel(FEATURE_LABELS[feature]);
      setUpgradeVariant(isVipFeature(feature) ? "vip" : "premium");
      setUpgradeOpen(true);
    }
  };

  const renderBadge = (path: string) => {
    const feature = getFeatureForRoute(path);
    if (!feature || hasPermission(feature)) return null;
    return <PremiumBadge variant={isVipFeature(feature) ? "vip" : "premium"} />;
  };

  return (
    <>
      <div className="space-y-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const badge = renderBadge(tool.path);

          return (
            <Link
              key={tool.path}
              to={tool.path}
              onClick={(e) => handleGatedClick(e, tool.path)}
              className="block"
            >
              <div
                className="flex items-center gap-4 p-4 rounded-xl border bg-card hover:shadow-md transition-all duration-200"
                style={{
                  borderLeftWidth: 4,
                  borderLeftColor: `hsl(${themeColor})`,
                  boxShadow: `0 1px 3px hsl(${themeColor} / 0.08)`,
                }}
              >
                <div
                  className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: `hsl(${themeColor} / 0.12)`,
                    color: `hsl(${themeColor})`,
                  }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{tool.title}</h3>
                    {badge}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {tool.description}
                  </p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </div>
            </Link>
          );
        })}
      </div>

      <UpgradeModal
        open={upgradeOpen}
        onOpenChange={setUpgradeOpen}
        featureLabel={upgradeLabel}
        variant={upgradeVariant}
      />
    </>
  );
}
