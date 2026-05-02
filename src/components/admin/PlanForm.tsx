import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, DollarSign, Wallet, Star, Shield, Layout, Save, Trash2, Check, RefreshCw } from "lucide-react";
import type { Plan, PlanFeatures, FeatureKey } from "@/types/plans";
import { FEATURE_LABELS, FEATURE_CATEGORIES } from "@/types/plans";
import { cn } from "@/lib/utils";

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

  const [activeTab, setActiveTab] = useState<'geral' | 'recursos'>('geral');

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Tabs Custom mobile-first */}
      <div className="flex p-1 bg-muted/30 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('geral')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all",
            activeTab === 'geral' ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
          )}
        >
          <Layout className="h-3.5 w-3.5" />
          Dados Gerais
        </button>
        <button
          onClick={() => setActiveTab('recursos')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all",
            activeTab === 'recursos' ? "bg-white shadow-sm text-primary" : "text-muted-foreground"
          )}
        >
          <Shield className="h-3.5 w-3.5" />
          Recursos
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
        <div className="flex-1 space-y-8">
          {activeTab === 'geral' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Identificação */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/5 flex items-center justify-center">
                    <Star className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                    Identificação
                  </h3>
                </div>
                
                <div className="grid gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-xs font-bold uppercase ml-1">Nome do Plano</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Plano Mensal, Plano Anual"
                      className="h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                    {name && (
                      <p className="text-[10px] text-muted-foreground ml-1">
                        Slug automático: <span className="font-mono text-primary/60">{generateSlug(name)}</span>
                      </p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="description" className="text-xs font-bold uppercase ml-1">Descrição Curta</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Ex: Para quem joga toda semana"
                      rows={2}
                      className="rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Financeiro */}
              <div className="space-y-4 pt-6 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-500/5 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                    Financeiro & Checkout
                  </h3>
                </div>

                <div className="grid gap-5">
                  <div className="space-y-1.5">
                    <Label htmlFor="price" className="text-xs font-bold uppercase ml-1">Preço (R$)</Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        className="pl-9 h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="checkoutLink" className="text-xs font-bold uppercase ml-1">Link de Checkout (Kirvano)</Label>
                    <Input
                      id="checkoutLink"
                      type="url"
                      value={checkoutLink}
                      onChange={(e) => setCheckoutLink(e.target.value)}
                      placeholder="https://checkout.kirvano.com/..."
                      className="h-12 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Configuração Técnica */}
              <div className="space-y-4 pt-6 border-t border-border/40">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-orange-500/5 flex items-center justify-center">
                    <RefreshCw className="h-4 w-4 text-orange-500" />
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/70">
                    Limites & Status
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="geradorLimit" className="text-[10px] font-bold uppercase ml-1">Gerador: msgs/dia</Label>
                    <Input
                      id="geradorLimit"
                      type="number"
                      min={0}
                      value={geradorLimit}
                      onChange={(e) => setGeradorLimit(e.target.value)}
                      className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="chatStatsLimit" className="text-[10px] font-bold uppercase ml-1">Chat: msgs/dia</Label>
                    <Input
                      id="chatStatsLimit"
                      type="number"
                      min={0}
                      value={chatStatsLimit}
                      onChange={(e) => setChatStatsLimit(e.target.value)}
                      className="h-11 rounded-xl bg-muted/20 border-none focus-visible:ring-1 focus-visible:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl">
                  <div className="space-y-0.5">
                    <Label htmlFor="active" className="text-sm font-bold">Plano Ativo</Label>
                    <p className="text-[10px] text-muted-foreground">Exibir este plano no catálogo</p>
                  </div>
                  <Switch
                    id="active"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recursos' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {FEATURE_CATEGORIES.map((category) => {
                const allChecked = isCategoryFullyChecked(category.features);
                const partial = isCategoryPartiallyChecked(category.features);
                const activeCount = category.features.filter((f) => features[f]).length;

                return (
                  <div key={category.label} className="bg-muted/10 rounded-2xl border border-border/30 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border/30">
                      <Checkbox
                        id={`cat-${category.label}`}
                        checked={allChecked}
                        className={cn(
                          "rounded-md",
                          partial && "data-[state=unchecked]:bg-primary/30 data-[state=unchecked]:border-primary"
                        )}
                        onCheckedChange={(checked) =>
                          handleCategoryToggle(category.features, checked === true)
                        }
                      />
                      <Label
                        htmlFor={`cat-${category.label}`}
                        className="text-xs font-black uppercase tracking-widest flex-1 cursor-pointer"
                      >
                        {category.emoji} {category.label}
                      </Label>
                      <Badge variant="secondary" className="text-[9px] font-black h-5">
                        {activeCount}/{category.features.length}
                      </Badge>
                    </div>

                    <div className="p-2 grid gap-1">
                      {category.features.map((feature) => (
                        <div 
                          key={feature} 
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer active:bg-muted/50",
                            features[feature] ? "bg-primary/5" : "opacity-60"
                          )}
                          onClick={() => handleFeatureChange(feature, !features[feature])}
                        >
                          <Checkbox
                            id={`plan-${feature}`}
                            checked={features[feature] || false}
                            className="rounded-md"
                            onCheckedChange={(checked) =>
                              handleFeatureChange(feature, checked === true)
                            }
                          />
                          <Label
                            htmlFor={`plan-${feature}`}
                            className="text-sm font-semibold flex-1 cursor-pointer"
                          >
                            {FEATURE_LABELS[feature]}
                          </Label>
                          {features[feature] && <Check className="h-4 w-4 text-primary" />}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer fixo dentro do formulário para Mobile */}
        <div className="sticky bottom-0 pt-6 mt-10 pb-2 bg-gradient-to-t from-white via-white to-transparent">
          <Button 
            type="submit" 
            disabled={saving} 
            className="w-full h-14 rounded-2xl text-lg font-black uppercase tracking-widest shadow-lg shadow-primary/20 gap-3"
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            {plan ? "Salvar Plano" : "Criar Novo Plano"}
          </Button>
        </div>
      </form>
    </div>
  );
}
