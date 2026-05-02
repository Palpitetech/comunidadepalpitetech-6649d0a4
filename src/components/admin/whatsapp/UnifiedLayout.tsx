import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EvolutionHealthBanner } from "./shared/EvolutionHealthBanner";

interface UnifiedLayoutProps {
  children: ReactNode;
  showBanner?: boolean;
}

/**
 * UnifiedLayout provides a consistent structure for all Communication sub-pages.
 * It includes a standardized top banner area and consistent padding.
 */
export function UnifiedLayout({ children, showBanner = true }: UnifiedLayoutProps) {
  return (
    <div className="flex flex-col w-full animate-in fade-in duration-500">
      {showBanner && (
        <div className="mb-4">
          <EvolutionHealthBanner />
        </div>
      )}
      <div className={cn(
        "flex flex-col w-full",
        // Standardized padding to align with the "clean and objective" goal
        "pt-2"
      )}>
        {children}
      </div>
    </div>
  );
}
