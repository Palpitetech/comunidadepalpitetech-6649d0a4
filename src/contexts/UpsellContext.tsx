import React, { createContext, useContext, useState, useEffect } from "react";
import { UpgradeModal } from "@/components/shared/UpgradeModal";
import { useTrialOffer } from "@/hooks/useTrialOffer";

interface UpsellContextType {
  openUpgradeModal: (feature?: string, variant?: "premium" | "vip") => void;
}

const UpsellContext = createContext<UpsellContextType | undefined>(undefined);

export const UpsellProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [feature, setFeature] = useState<string | undefined>();
  const [variant, setVariant] = useState<"premium" | "vip">("premium");
  
  const { shouldShow, setShouldShow } = useTrialOffer();

  useEffect(() => {
    if (shouldShow) {
      setOpen(true);
      setShouldShow(false);
    }
  }, [shouldShow, setShouldShow]);

  const openUpgradeModal = (featureName?: string, v: "premium" | "vip" = "premium") => {
    setFeature(featureName);
    setVariant(v);
    setOpen(true);
  };

  return (
    <UpsellContext.Provider value={{ openUpgradeModal }}>
      {children}
      <UpgradeModal
        open={open}
        onOpenChange={setOpen}
        featureLabel={feature}
        variant={variant}
      />
    </UpsellContext.Provider>
  );
};

export const useUpsell = () => {
  const context = useContext(UpsellContext);
  if (context === undefined) {
    throw new Error("useUpsell must be used within an UpsellProvider");
  }
  return context;
};
