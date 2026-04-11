import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { usePermissionContext } from "@/contexts/PermissionContext";
import { useLocation } from "react-router-dom";

export type OfferType = "trial" | "upgrade" | null;

export function useTrialOffer() {
  const { user } = useAuthContext();
  const { isPremium, loading: permissionsLoading } = usePermissionContext();
  const { data: subscription, loading: subLoading } = useMySubscription(user?.id);
  const [shouldShow, setShouldShow] = useState(false);
  const [offerType, setOfferType] = useState<OfferType>(null);
  const location = useLocation();

  useEffect(() => {
    // Only show trial/upgrade offers when user is on a generator page
    const generatorPaths = [
      "/smart-gerador",
      "/gerar-jogos",
      "/megasena/gerador",
      "/quina/gerador",
      "/duplasena/gerador"
    ];

    const isGeneratorPage = generatorPaths.includes(location.pathname);

    if (isGeneratorPage && !permissionsLoading && !subLoading && !isPremium && subscription && subscription.status === "inativa") {
      // Logic:
      // If trial NOT used -> Offer Trial
      // If trial ALREADY used -> Offer Upgrade
      
      const currentOfferType: OfferType = subscription.trial_used ? "upgrade" : "trial";
      
      // Store in session to avoid showing too many times in the same session
      const trialOffered = sessionStorage.getItem("trial_offered_generator");
      const upgradeOffered = sessionStorage.getItem("upgrade_offered_generator");
      
      if (currentOfferType === "trial" && !trialOffered) {
        setOfferType("trial");
        setShouldShow(true);
        sessionStorage.setItem("trial_offered_generator", "true");
      } else if (currentOfferType === "upgrade" && !upgradeOffered) {
        setOfferType("upgrade");
        setShouldShow(true);
        sessionStorage.setItem("upgrade_offered_generator", "true");
      }
    }
  }, [permissionsLoading, subLoading, isPremium, subscription, location.pathname]);

  return { shouldShow, setShouldShow, offerType };
}
