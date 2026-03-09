import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";
import type { Plan, PlanFeatures, FeatureKey } from "@/types/plans";
import { FEATURE_LABELS, FEATURE_CATEGORIES } from "@/types/plans";

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
  const [description, setDescription] = useState(plan?.description || "");
  const [price, setPrice] = useState(plan?.price?.toString() || "0");
  const [checkoutLink, setCheckoutLink] = useState(plan?.checkout_link || "");
  const [isActive, setIsActive] = useState(plan?.is_active ?? true);
  const [displayOrder, setDisplayOrder] = useState(plan?.display_order?.toString() || "0");
  const [chatStatsLimit, setChatStatsLimit] = useState(
    (plan?.chat_estatisticas_max_msgs_per_day ?? 0).toString()
  );
  const [geradorLimit, setGeradorLimit] = useState(
    (plan?.gerador_max_per_day ?? 0).toString()
  );
  const [features, setFeatures] = useState<PlanFeatures>(
    plan?.features || {}
  );

  const handleFeatureChange = (feature: FeatureKey, checked: boolean) => {
    setFeatures((prev) => ({ ...prev, [feature]: checked }));
  };

  const handleCategoryToggle = (categoryFeatures: FeatureKey[], checked: boolean) => {
    setFeatures((prev) => {
      const next = { ...prev };
      for (const f of categoryFeatures) {
        next[f] = checked;
      }
      return next;
    });
  };

  const isCategoryFullyChecked = (categoryFeatures: FeatureKey[]) =>
    categoryFeatures.every((f) => features[f] === true);

  const isCategoryPartiallyChecked = (categoryFeatures: FeatureKey[]) =>
    categoryFeatures.some((f) => features[f] === true) && !isCategoryFullyChecked(categoryFeatures);

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
        description: description.trim() || null,
        price: parseFloat(price) || 0,
        checkout_link: checkoutLink.trim() || null,
        is_active: isActive,
        display_order: parseInt(displayOrder) || 0,
        features,
        chat_estatisticas_max_msgs_per_day: Math.max(0, parseInt(chatStatsLimit) || 0),
        gerador_max_per_day: Math.max(0, parseInt(geradorLimit) || 0),
      };

      if (plan) {
        const { error } = await supabase
          .from("plans")
          .update(planData)
          .eq("id", plan.id);

        if (error) throw error;
        toast.success("Plano atualizado");
      } else {
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
      {/* Seção: Identificação */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Identificação
        </h3>
        
        <div className="space-y-2">
          <Label htmlFor="name">Nome do Plano</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Plano Mensal, Plano Anual"
          />
          {name && (
            <p className="text-xs text-muted-foreground">
              Slug: <code className="bg-muted px-1 py-0.5 rounded">{generateSlug(name)}</code>
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Para quem joga toda semana"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Subtítulo exibido no card de vendas
          </p>
        </div>
      </div>

      {/* Seção: Mapeamento Financeiro */}
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Mapeamento Financeiro
          </h3>
        </div>

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
          <Label htmlFor="checkoutLink">Link de Checkout (Kirvano)</Label>
          <Input
            id="checkoutLink"
            type="url"
            value={checkoutLink}
            onChange={(e) => setCheckoutLink(e.target.value)}
            placeholder="https://checkout.kirvano.com/..."
          />
          <p className="text-xs text-muted-foreground">
            Link de pagamento da Kirvano. Copie e cole a URL do checkout.
          </p>
        </div>
      </div>

      {/* Seção: Configuração */}
      <div className="space-y-4 pt-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Configuração
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="order">Ordem de Exibição</Label>
            <Input
              id="order"
              type="number"
              min="0"
              value={displayOrder}
              onChange={(e) => setDisplayOrder(e.target.value)}
            />
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

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="geradorLimit">Gerador: limite/dia</Label>
            <Input
              id="geradorLimit"
              type="number"
              min={0}
              value={geradorLimit}
              onChange={(e) => setGeradorLimit(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="chatStatsLimit">Chat Stats: msgs/dia</Label>
            <Input
              id="chatStatsLimit"
              type="number"
              min={0}
              value={chatStatsLimit}
              onChange={(e) => setChatStatsLimit(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Seção: Funcionalidades por Categoria */}
      <div className="space-y-3 pt-4 border-t">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Funcionalidades Incluídas
        </h3>

        <div className="space-y-4">
          {FEATURE_CATEGORIES.map((category) => {
            const allChecked = isCategoryFullyChecked(category.features);
            const partial = isCategoryPartiallyChecked(category.features);

            return (
              <div key={category.label} className="border rounded-lg overflow-hidden">
                {/* Category header */}
                <div
                  className="flex items-center gap-3 px-4 py-2.5 bg-muted/50 cursor-pointer select-none"
                  onClick={() => handleCategoryToggle(category.features, !allChecked)}
                >
                  <Checkbox
                    checked={allChecked}
                    className={partial ? "data-[state=unchecked]:bg-primary/30 data-[state=unchecked]:border-primary" : ""}
                    onCheckedChange={(checked) =>
                      handleCategoryToggle(category.features, checked === true)
                    }
                  />
                  <span className="text-sm font-semibold">
                    {category.emoji} {category.label}
                  </span>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {category.features.filter((f) => features[f]).length}/{category.features.length}
                  </span>
                </div>

                {/* Individual features */}
                <div className="px-4 py-2 space-y-2">
                  {category.features.map((feature) => (
                    <div key={feature} className="flex items-center space-x-3">
                      <Checkbox
                        id={`plan-${feature}`}
                        checked={features[feature] || false}
                        onCheckedChange={(checked) =>
                          handleFeatureChange(feature, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`plan-${feature}`}
                        className="text-sm font-normal cursor-pointer"
                      >
                        {FEATURE_LABELS[feature]}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-3 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="flex-1">
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {plan ? "Salvar Alterações" : "Criar Plano"}
        </Button>
      </div>
    </form>
  );
}
