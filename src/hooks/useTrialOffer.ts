import { useEffect, useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { usePermissionContext } from "@/contexts/PermissionContext";

export function useTrialOffer() {
  const { user } = useAuthContext();
  const { isPremium, loading: permissionsLoading } = usePermissionContext();
  const { data: subscription, loading: subLoading } = useMySubscription(user?.id);
  const [shouldShow, setShouldShow] = useState(false);

  useEffect(() => {
    if (!permissionsLoading && !subLoading && !isPremium && subscription && !subscription.trial_used && subscription.status === "inativa") {
      const trialOffered = sessionStorage.getItem("trial_offered_generator");
      if (!trialOffered) {
        setShouldShow(true);
        sessionStorage.setItem("trial_offered_generator", "true");
      }
    }
  }, [permissionsLoading, subLoading, isPremium, subscription]);

  return { shouldShow, setShouldShow };
}
