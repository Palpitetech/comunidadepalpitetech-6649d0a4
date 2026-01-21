import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PlanForm } from "@/components/admin/PlanForm";
import type { Plan, PlanFeatures } from "@/types/plans";
import { FEATURE_LABELS, FEATURE_LIST } from "@/types/plans";

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
        .order("display_order", { ascending: true });

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

  const countActiveFeatures = (features: PlanFeatures): number => {
    return Object.values(features).filter((v) => v === true).length;
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-senior py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-senior-2xl font-bold">Gestão de Planos</h1>
            <p className="text-muted-foreground">Crie e gerencie os planos de assinatura</p>
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
            <Card key={plan.id} className={!plan.is_active ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-senior-lg">{plan.name}</CardTitle>
                    {!plan.is_active && (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(plan)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(plan.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription>
                  R$ {plan.price.toFixed(2).replace(".", ",")} / mês
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {FEATURE_LIST.map((feature) => (
                    <Badge
                      key={feature}
                      variant={plan.features[feature] ? "default" : "outline"}
                      className={
                        plan.features[feature]
                          ? ""
                          : "text-muted-foreground"
                      }
                    >
                      {plan.features[feature] ? "✓" : "✗"} {FEATURE_LABELS[feature]}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  {countActiveFeatures(plan.features)} de {FEATURE_LIST.length} recursos ativos
                </p>
              </CardContent>
            </Card>
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
    </MainLayout>
  );
}
