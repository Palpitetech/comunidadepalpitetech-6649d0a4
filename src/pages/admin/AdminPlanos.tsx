import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
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
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="container-senior py-8 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-senior-2xl font-bold text-white">Gestão de Planos</h1>
            <p className="text-white/70">Crie e gerencie os planos de assinatura</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewPlan} className="gap-2 bg-white text-[#1E3A5F] hover:bg-white/90">
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
            <Card 
              key={plan.id} 
              className={`bg-white/10 border-white/20 ${!plan.is_active ? "opacity-60" : ""}`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-senior-lg text-white">{plan.name}</CardTitle>
                    {!plan.is_active && (
                      <Badge variant="secondary" className="bg-white/20 text-white">Inativo</Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(plan)}
                      className="text-white/70 hover:text-white hover:bg-white/10"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(plan.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-white/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <CardDescription className="text-white/70">
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
                          ? "bg-emerald-500/80 text-white border-emerald-500/80"
                          : "text-white/50 border-white/30"
                      }
                    >
                      {plan.features[feature] ? "✓" : "✗"} {FEATURE_LABELS[feature]}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-white/60 mt-3">
                  {countActiveFeatures(plan.features)} de {FEATURE_LIST.length} recursos ativos
                </p>
              </CardContent>
            </Card>
          ))}

          {plans.length === 0 && (
            <Card className="bg-white/10 border-white/20">
              <CardContent className="py-8 text-center text-white/70">
                Nenhum plano cadastrado. Clique em "Novo Plano" para começar.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
