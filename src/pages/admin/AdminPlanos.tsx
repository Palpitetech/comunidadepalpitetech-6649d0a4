import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Crown, Star, Gift, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { PlanForm } from "@/components/admin/PlanForm";
import { KirvanoWebhookCard } from "@/components/admin/KirvanoWebhookCard";
import type { Plan, PlanFeatures } from "@/types/plans";
import { FEATURE_LABELS, FEATURE_CATEGORIES } from "@/types/plans";

export default function AdminPlanos() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plans")
        .select("*")
        .order("price", { ascending: true });

      if (error) throw error;

      setPlans(
        (data || []).map((p) => ({
          ...p,
          price: Number(p.price),
          features: p.features as PlanFeatures,
        }))
      );
    } catch (error) {
      console.error("Erro ao buscar planos:", error);
      toast.error("Erro ao carregar planos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDelete = async (planId: string) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      const { error } = await supabase.from("plans").delete().eq("id", planId);
      if (error) throw error;
      toast.success("Plano excluído");
      fetchPlans();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast.error(error.message || "Erro ao excluir plano");
    }
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setIsDialogOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setIsDialogOpen(true);
  };

  const handleSaved = () => {
    setIsDialogOpen(false);
    setEditingPlan(null);
    fetchPlans();
  };

  const getPlanIcon = (price: number) => {
    if (price === 0) return <Gift className="h-5 w-5 text-primary" />;
    if (price >= 200) return <Crown className="h-5 w-5 text-primary" />;
    return <Star className="h-5 w-5 text-primary" />;
  };

  const copyCheckoutLink = (link: string) => {
    navigator.clipboard.writeText(link);
    toast.success("Link copiado!");
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-senior py-8 max-w-4xl mx-auto">
        <div className="mb-6">
          <KirvanoWebhookCard />
        </div>

        <div className="flex items-center justify-between mb-6">
          <div className="hidden md:block">
            <h1 className="text-senior-2xl font-bold">Planos & Preços</h1>
            <p className="text-muted-foreground">Gerencie o catálogo de produtos e preços</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewPlan} className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Plano
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingPlan ? "Editar Plano" : "Novo Plano"}
                </DialogTitle>
              </DialogHeader>
              <PlanForm
                plan={editingPlan}
                onSaved={handleSaved}
                onCancel={() => setIsDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onCopyLink={copyCheckoutLink}
              getPlanIcon={getPlanIcon}
            />
          ))}

          {plans.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum plano cadastrado. Clique em "Novo Plano" para começar.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

// Extracted PlanCard component
function PlanCard({
  plan,
  onEdit,
  onDelete,
  onCopyLink,
  getPlanIcon,
}: {
  plan: Plan;
  onEdit: (plan: Plan) => void;
  onDelete: (id: string) => void;
  onCopyLink: (link: string) => void;
  getPlanIcon: (price: number) => React.ReactNode;
}) {
  return (
    <Card className={!plan.is_active ? "opacity-60" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {getPlanIcon(plan.price)}
            <div>
              <CardTitle className="text-senior-lg">{plan.name}</CardTitle>
              {plan.description && (
                <p className="text-sm text-muted-foreground mt-0.5">
                  {plan.description}
                </p>
              )}
            </div>
            {!plan.is_active && <Badge variant="secondary">Inativo</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => onEdit(plan)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(plan.id)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-2">
          <CardDescription className="text-base font-medium text-foreground">
            R$ {plan.price.toFixed(2).replace(".", ",")}
            <span className="text-muted-foreground font-normal"> / mês</span>
          </CardDescription>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            slug: {plan.slug}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Features grouped by category */}
        <div className="space-y-2">
          {FEATURE_CATEGORIES.map((category) => {
            const activeCount = category.features.filter((f) => plan.features[f]).length;
            if (activeCount === 0) return null;

            return (
              <div key={category.label}>
                <p className="text-xs font-medium text-muted-foreground mb-1">
                  {category.emoji} {category.label}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {category.features.map((feature) => (
                    <Badge
                      key={feature}
                      variant={plan.features[feature] ? "default" : "outline"}
                      className={`text-[11px] px-1.5 py-0 ${
                        plan.features[feature] ? "" : "text-muted-foreground"
                      }`}
                    >
                      {plan.features[feature] ? "✓" : "✗"} {FEATURE_LABELS[feature]}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-sm text-muted-foreground">
          {Object.values(plan.features).filter(Boolean).length} de{" "}
          {Object.keys(FEATURE_LABELS).length} recursos ativos
        </p>

        {plan.checkout_link && (
          <div className="flex items-center gap-2 pt-2 border-t">
            <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground truncate flex-1">
              {plan.checkout_link}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onCopyLink(plan.checkout_link!)}
              className="h-7 px-2 gap-1"
            >
              <Copy className="h-3 w-3" />
              Copiar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
