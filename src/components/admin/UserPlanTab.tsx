import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, CreditCard, Calendar } from "lucide-react";
import type { ExtendedProfile, Plan } from "@/types/plans";

interface UserWithPlan extends ExtendedProfile {
  plan?: Plan | null;
}

interface UserPlanTabProps {
  user: UserWithPlan;
  plans: Plan[];
  onUserUpdated: () => void;
}

export function UserPlanTab({ user, plans, onUserUpdated }: UserPlanTabProps) {
  const [saving, setSaving] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(user.plan_id || "");

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("perfis")
        .update({ plan_id: selectedPlanId || null })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Plano atualizado");
      onUserUpdated();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao atualizar plano");
    } finally {
      setSaving(false);
    }
  };

  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Plano Atual</Label>
          <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} - R$ {plan.price.toFixed(2).replace(".", ",")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedPlan && (
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">{selectedPlan.name}</span>
              <Badge variant="secondary">
                R$ {selectedPlan.price.toFixed(2).replace(".", ",")}/mês
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {Object.values(selectedPlan.features).filter(Boolean).length} recursos incluídos
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 border rounded-lg">
          <CreditCard className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Status de Pagamento</p>
            <Badge variant="outline" className="mt-1 text-green-600 border-green-600">
              Em dia (mock)
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-3 p-4 border rounded-lg">
          <Calendar className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium">Próxima Cobrança</p>
            <p className="text-sm text-muted-foreground">
              {selectedPlan?.price === 0
                ? "Sem cobrança (plano grátis)"
                : "Integração de pagamento pendente"}
            </p>
          </div>
        </div>
      </div>

      <Button
        onClick={handleSave}
        disabled={saving || selectedPlanId === user.plan_id}
        className="w-full"
      >
        {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        Salvar Alterações
      </Button>
    </div>
  );
}
