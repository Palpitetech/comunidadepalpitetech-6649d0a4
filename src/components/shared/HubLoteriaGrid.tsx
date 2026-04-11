import { Link } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermission";
import { getFeatureForRoute, isVipFeature } from "@/lib/featureMap";
import { PremiumBadge } from "@/components/shared/PremiumBadge";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { FEATURE_LABELS } from "@/types/plans";
import { useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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
      <div className="grid grid-cols-1 gap-4">
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
                className={cn(
                  "flex items-center gap-4 p-5 rounded-2xl border-none bg-card shadow-md transition-all duration-300",
                  "hover:shadow-lg hover:-translate-y-1 active:scale-[0.98]"
                )}
                style={{
                  borderLeft: `4px solid hsl(${themeColor})`,
                }}
              >
                <div
                  className="h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                  style={{
                    backgroundColor: `hsl(${themeColor} / 0.1)`,
                    color: `hsl(${themeColor})`,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base font-bold text-foreground leading-tight">{tool.title}</h3>
                    {badge}
                  </div>
                  <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 opacity-80">
                    {tool.description}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center opacity-40 group-hover:opacity-100 group-hover:bg-primary/10 group-hover:text-primary transition-all">
                  <ChevronRight className="h-4 w-4" />
                </div>
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