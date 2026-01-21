import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { Plan, PlanFeatures, FeatureKey } from "@/types/plans";
import { FEATURE_LABELS, FEATURE_LIST } from "@/types/plans";

interface PlanFormProps {
  plan: Plan | null;
  onSaved: () => void;
  onCancel: () => void;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function PlanForm({ plan, onSaved, onCancel }: PlanFormProps) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(plan?.name || "");
  const [price, setPrice] = useState(plan?.price?.toString() || "0");
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);
  const [displayOrder, setDisplayOrder] = useState(plan?.display_order?.toString() || "0");
  const [features, setFeatures] = useState<PlanFeatures>(
    plan?.features || {
      gerador: false,
      estatisticas: false,
      quentes_frias: false,
      ciclos: false,
      comunidade_full: false,
      guias: false,
      notificacoes_push: false,
      notificacoes_email: false,
      notificacoes_sms: false,
    }
  );

  const handleFeatureChange = (feature: FeatureKey, checked: boolean) => {
    setFeatures((prev) => ({ ...prev, [feature]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Nome do plano é obrigatório");
      return;
    }

    setSaving(true);

    try {
      const slug = generateSlug(name);
      const planData: any = {
        name: name.trim(),
        slug,
        price: parseFloat(price) || 0,
        is_active: isActive,
        display_order: parseInt(displayOrder) || 0,
        features,
      };

      if (plan) {
        // Atualizar
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;
        toast.success("Plano atualizado");
      } else {
        // Criar
        const { error } = await supabase.from("plans").insert(planData);

        if (error) throw error;
        toast.success("Plano criado");
      }

      onSaved();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast.error(error.message || "Erro ao salvar plano");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Plano</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Ouro, Prata, Premium"
          />
          {name && (
            <p className="text-xs text-muted-foreground">
              Slug: {generateSlug(name)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Preço (R$)</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="order">Ordem</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-between py-2">
          <Label htmlFor="active">Plano Ativo</Label>
          <Switch
            id="active"
            checked={isActive}
            onCheckedChange={setIsActive}
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label>Recursos Incluídos</Label>
        <div className="border rounded-lg p-4 space-y-3">
          {FEATURE_LIST.map((feature) => (
            <div key={feature} className="flex items-center space-x-3">
              <Checkbox
                id={feature}
                checked={features[feature] || false}
                onCheckedChange={(checked) =>
                  handleFeatureChange(feature, checked === true)
                }
              />
              <Label
                htmlFor={feature}
                className="text-sm font-normal cursor-pointer"
              >
                {FEATURE_LABELS[feature]}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {plan ? "Salvar" : "Criar Plano"}
        </Button>
      </div>
    </form>
  );
}
