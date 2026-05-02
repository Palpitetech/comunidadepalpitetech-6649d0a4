import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Pencil, Trash2, Loader2, Crown, Star, Gift, Copy, RefreshCw, X, ChevronRight, Check } from "lucide-react";
import { toast } from "sonner";
import { PlanForm } from "@/components/admin/PlanForm";
import { KirvanoWebhookCard } from "@/components/admin/KirvanoWebhookCard";
import type { Plan, PlanFeatures } from "@/types/plans";
import { FEATURE_LABELS, FEATURE_CATEGORIES } from "@/types/plans";
import { cn } from "@/lib/utils";

export default function AdminPlanos() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

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

  useEffect(() => {
    if (isFormOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isFormOpen]);

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
    setIsFormOpen(true);
  };

  const handleNewPlan = () => {
    setEditingPlan(null);
    setIsFormOpen(true);
  };

  const handleSaved = () => {
    setIsFormOpen(false);
    setEditingPlan(null);
    fetchPlans();
  };

  const getPlanIcon = (price: number) => {
    if (price === 0) return <Gift className="h-4 w-4 text-blue-500" />;
    if (price >= 200) return <Crown className="h-4 w-4 text-yellow-500" />;
    return <Star className="h-4 w-4 text-primary" />;
  };

  if (loading) {
    return (
      <AdminLayout pageTitle="Planos & Preços">
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout pageTitle="Planos & Preços">
      <div className="flex flex-col flex-1 min-h-0 bg-background">
        <div className="px-4 py-4 md:px-6 md:py-6 max-w-4xl mx-auto w-full space-y-6">
          
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold hidden md:block">Planos & Preços</h1>
            <Button onClick={handleNewPlan} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" />
              Novo Plano
            </Button>
          </div>

          <div className="space-y-1">
            {plans.map((plan) => {
              const activeFeatures = Object.values(plan.features).filter(Boolean).length;
              return (
                <button
                  key={plan.id}
                  onClick={() => handleEdit(plan)}
                  className={cn(
                    "w-full flex items-center justify-between gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all text-left active:scale-[0.98]",
                    !plan.is_active && "opacity-60"
                  )}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                      {getPlanIcon(plan.price)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-base truncate">{plan.name}</span>
                        {!plan.is_active && (
                          <Badge variant="secondary" className="text-[9px] uppercase tracking-tighter h-4">Inativo</Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate italic">
                        {activeFeatures} recursos ativos • slug: {plan.slug}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-base">
                        R$ {plan.price.toFixed(0)}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">/mês</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/30" />
                  </div>
                </button>
              );
            })}

            {plans.length === 0 && (
              <div className="py-20 text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Star className="h-6 w-6 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">Nenhum plano cadastrado ainda.</p>
              </div>
            )}
          </div>

          <KirvanoWebhookCard />
        </div>
      </div>

      {/* Full Screen Form View */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col animate-in slide-in-from-bottom duration-300">
          <div className="flex items-center justify-between px-4 h-16 border-b border-border bg-white shrink-0 z-50 relative">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={() => setIsFormOpen(false)}>
              <X className="h-6 w-6" />
            </Button>
            <h2 className="text-base font-bold absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
              {editingPlan ? "Editar Plano" : "Novo Plano"}
            </h2>
            <div className="flex items-center gap-1">
              {editingPlan && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full text-destructive" 
                  onClick={() => handleDelete(editingPlan.id)}
                >
                  <Trash2 className="h-5 w-5" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={fetchPlans}>
                <RefreshCw className={cn("h-5 w-5", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto overscroll-contain bg-white">
            <div className="p-4 pb-[calc(4rem+env(safe-area-inset-bottom))] max-w-2xl mx-auto">
              <PlanForm
                plan={editingPlan}
                onSaved={handleSaved}
                onCancel={() => setIsFormOpen(false)}
              />
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
