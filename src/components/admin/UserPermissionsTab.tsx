import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Check, X, Minus } from "lucide-react";
import type { ExtendedProfile, Plan, PlanFeatures, FeatureKey } from "@/types/plans";
import { FEATURE_LABELS, FEATURE_LIST } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserPermissionsTabProps {
  user: UserWithPlan;
  onUserUpdated: () => void;
}

type PermissionOverride = "inherit" | "force_on" | "force_off";

export function UserPermissionsTab({ user, onUserUpdated }: UserPermissionsTabProps) {
  const [saving, setSaving] = useState(false);
  const [customFeatures, setCustomFeatures] = useState<PlanFeatures>(
    user.custom_features || {}
  );

  const getOverrideValue = (feature: FeatureKey): PermissionOverride => {
    if (customFeatures[feature] === true) return "force_on";
    if (customFeatures[feature] === false) return "force_off";
    return "inherit";
  };

  const getPlanValue = (feature: FeatureKey): boolean => {
    return user.plan?.features?.[feature] === true;
  };

  const getEffectiveValue = (feature: FeatureKey): boolean => {
    const override = getOverrideValue(feature);
    if (override === "force_on") return true;
    if (override === "force_off") return false;
    return getPlanValue(feature);
  };

  const handleOverrideChange = (feature: FeatureKey, value: PermissionOverride) => {
    setCustomFeatures((prev) => {
      const updated = { ...prev };
      if (value === "inherit") {
        delete updated[feature];
      } else if (value === "force_on") {
        updated[feature] = true;
      } else {
        updated[feature] = false;
      }
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updateData: any = {
        custom_features: Object.keys(customFeatures).length > 0 ? customFeatures : null,
      };
      const { error } = await supabase
        .from("perfis")
        .update(updateData)
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Permissões atualizadas");
      onUserUpdated();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao atualizar permissões");
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    JSON.stringify(customFeatures) !== JSON.stringify(user.custom_features || {});

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Configure permissões individuais que sobrescrevem o plano.
      </div>

      <div className="space-y-4">
        {FEATURE_LIST.map((feature) => {
          const override = getOverrideValue(feature);
          const effective = getEffectiveValue(feature);
          const planValue = getPlanValue(feature);

          return (
            <div key={feature} className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {effective ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <X className="h-4 w-4 text-destructive" />
                  )}
                  <span className="font-medium">{FEATURE_LABELS[feature]}</span>
                </div>
                <Badge
                  variant={effective ? "default" : "secondary"}
                  className={effective ? "" : "text-muted-foreground"}
                >
                  {effective ? "Ativo" : "Inativo"}
                </Badge>
              </div>

              <RadioGroup
                value={override}
                onValueChange={(v) => handleOverrideChange(feature, v as PermissionOverride)}
                className="flex gap-2"
              >
                <div className="flex items-center">
                  <RadioGroupItem value="inherit" id={`${feature}-inherit`} className="sr-only" />
                  <Label
                    htmlFor={`${feature}-inherit`}
                    className={`px-3 py-1.5 text-xs rounded-md cursor-pointer border transition-colors ${
                      override === "inherit"
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted hover:bg-muted/80 border-transparent"
                    }`}
                  >
                    <Minus className="h-3 w-3 inline mr-1" />
                    Padrão ({planValue ? "✓" : "✗"})
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="force_on" id={`${feature}-on`} className="sr-only" />
                  <Label
                    htmlFor={`${feature}-on`}
                    className={`px-3 py-1.5 text-xs rounded-md cursor-pointer border transition-colors ${
                      override === "force_on"
                        ? "bg-green-600 text-white border-green-600"
                        : "bg-muted hover:bg-muted/80 border-transparent"
                    }`}
                  >
                    <Check className="h-3 w-3 inline mr-1" />
                    Forçar Ativar
                  </Label>
                </div>
                <div className="flex items-center">
                  <RadioGroupItem value="force_off" id={`${feature}-off`} className="sr-only" />
                  <Label
                    htmlFor={`${feature}-off`}
                    className={`px-3 py-1.5 text-xs rounded-md cursor-pointer border transition-colors ${
                      override === "force_off"
                        ? "bg-destructive text-destructive-foreground border-destructive"
                        : "bg-muted hover:bg-muted/80 border-transparent"
                    }`}
                  >
                    <X className="h-3 w-3 inline mr-1" />
                    Forçar Desativar
                  </Label>
                </div>
              </RadioGroup>
            </div>
          );
        })}
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || !hasChanges}
        className="w-full"
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
