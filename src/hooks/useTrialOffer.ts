import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { usePermissionContext } from "@/contexts/PermissionContext";

export type OfferType = "trial" | "upgrade" | null;

export function useTrialOffer() {
  const { user } = useAuthContext();
  const { isPremium, loading: permissionsLoading } = usePermissionContext();
  const { data: subscription, loading: subLoading } = useMySubscription(user?.id);
  const [shouldShow, setShouldShow] = useState(false);
  const [offerType, setOfferType] = useState<OfferType>(null);

  useEffect(() => {
    if (!permissionsLoading && !subLoading && !isPremium && subscription && subscription.status === "inativa") {
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
  }, [permissionsLoading, subLoading, isPremium, subscription]);

  return { shouldShow, setShouldShow, offerType };
}
