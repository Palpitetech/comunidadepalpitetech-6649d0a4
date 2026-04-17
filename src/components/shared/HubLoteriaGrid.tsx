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
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {tools.map((tool) => {
          const Icon = tool.icon;
          const badge = renderBadge(tool.path);

          return (
            <Link
              key={tool.path}
              to={tool.path}
              onClick={(e) => handleGatedClick(e, tool.path)}
              className="block group"
            >
              <div
                className="flex flex-col items-center justify-center p-5 rounded-2xl border bg-card hover:shadow-lg transition-all duration-300 text-center h-full relative group-active:scale-95 shadow-sm"
                style={{
                  borderBottomWidth: 4,
                  borderBottomColor: `hsl(${themeColor})`,
                }}
              >
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"
                  style={{
                    backgroundColor: `hsl(${themeColor} / 0.1)`,
                    color: `hsl(${themeColor})`,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex flex-col items-center gap-1">
                  <h3 className="text-xs font-bold text-foreground leading-tight uppercase tracking-tight">
                    {tool.title}
                  </h3>
                  {badge && <div className="mt-1">{badge}</div>}
                </div>
                
                <p className="text-[10px] text-muted-foreground mt-2 line-clamp-2 leading-tight opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                  {tool.description}
                </p>
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
