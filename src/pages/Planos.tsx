import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { Loader2, Check, Crown, Star, Gift, ExternalLink, Sparkles, Bot, Zap, MessageCircle, Infinity } from "lucide-react";
import type { Plan, PlanFeatures } from "@/types/plans";
import { FEATURE_CATEGORIES, FEATURE_LABELS } from "@/types/plans";
import { STATUS_CONFIG } from "@/lib/subscription";
import type { StatusAssinatura } from "@/types/plans";

export default function Planos() {
  const { user } = useAuthContext();
  const { data: subscription } = useMySubscription(user?.id);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPlanId, setUserPlanId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const [plansRes, perfilRes] = await Promise.all([
          supabase
            .from("plans")
            .select("*")
            .eq("is_active", true)
            .order("display_order", { ascending: true }),
          user
            ? supabase.from("perfis").select("plan_id").eq("id", user.id).maybeSingle()
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (plansRes.error) throw plansRes.error;

        setPlans(
          (plansRes.data || []).map((p) => ({
            ...p,
            price: Number(p.price),
            features: p.features as PlanFeatures,
          }))
        );

        if (perfilRes.data) {
          setUserPlanId(perfilRes.data.plan_id);
        }
      } catch (err) {
        console.error("Erro ao carregar planos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [user]);

  const getPlanIcon = (price: number) => {
    if (price === 0) return <Gift className="h-6 w-6" />;
    if (price >= 200) return <Crown className="h-6 w-6" />;
    return <Star className="h-6 w-6" />;
  };

  const isCurrentPlan = (planId: string) => userPlanId === planId;

  const handleSubscribe = (plan: Plan) => {
    if (plan.checkout_link) {
      window.open(plan.checkout_link, "_blank");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const statusLabel = subscription
    ? STATUS_CONFIG[subscription.status as StatusAssinatura]?.label ?? "Sem assinatura"
    : null;

  // Find the "best" plan (highest price) to mark as popular
  const bestPlanId = plans.length > 0
    ? plans.reduce((best, p) => (p.price > best.price ? p : best), plans[0]).id
    : null;

  return (
    <MainLayout>
      <div className="container-senior py-8 max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Escolha seu plano</span>
          </div>
          <h1 className="text-senior-3xl font-bold text-foreground mb-3">
            Desbloqueie todo o potencial
          </h1>
          <p className="text-muted-foreground text-senior-base max-w-2xl mx-auto">
            Acesse ferramentas avançadas de análise, gerador inteligente e muito mais para aumentar suas chances na loteria.
          </p>

          {subscription && user && (
            <div className="mt-4 inline-flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Sua assinatura:</span>
              <Badge variant={STATUS_CONFIG[subscription.status as StatusAssinatura]?.variant ?? "outline"}>
                {statusLabel}
              </Badge>
            </div>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {plans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const isPopular = plan.id === bestPlanId && plan.price > 0;
            const activeFeatureCount = Object.values(plan.features).filter(Boolean).length;

            return (
              <Card
                key={plan.id}
                className={`relative flex flex-col transition-all duration-200 ${
                  isCurrent
                    ? "border-primary ring-2 ring-primary/20 shadow-lg"
                    : isPopular
                    ? "border-accent ring-1 ring-accent/30 shadow-md"
                    : "hover:shadow-md"
                }`}
              >
                {/* Popular badge */}
                {isPopular && !isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-accent text-accent-foreground px-3 py-0.5 text-xs shadow-sm">
                      Mais completo
                    </Badge>
                  </div>
                )}

                {/* Current plan badge */}
                {isCurrent && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs shadow-sm">
                      Seu plano atual
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4 pt-6 text-center">
                  <div className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl ${
                    isCurrent ? "bg-primary text-primary-foreground" : "bg-secondary text-primary"
                  }`}>
                    {getPlanIcon(plan.price)}
                  </div>
                  <CardTitle className="text-senior-lg">{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  )}
                </CardHeader>

                <CardContent className="flex flex-col flex-1 gap-5">
                  {/* Price */}
                  <div className="text-center">
                    {plan.price === 0 ? (
                      <div className="text-senior-2xl font-bold text-foreground">Grátis</div>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-sm text-muted-foreground">R$</span>
                          <span className="text-senior-3xl font-bold text-foreground">
                            {plan.price.toFixed(2).replace(".", ",")}
                          </span>
                        </div>
                        <span className="text-sm text-muted-foreground">por período</span>
                      </>
                    )}
                  </div>

                  {/* Feature summary */}
                  <div className="flex-1 space-y-3">
                    {FEATURE_CATEGORIES.map((category) => {
                      const active = category.features.filter((f) => plan.features[f]);
                      if (active.length === 0) return null;

                      return (
                        <div key={category.label}>
                          <p className="text-xs font-semibold text-muted-foreground mb-1.5">
                            {category.emoji} {category.label}
                          </p>
                          <ul className="space-y-1">
                            {active.map((feature) => (
                              <li key={feature} className="flex items-start gap-2 text-sm">
                                <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
                                <span className="text-foreground">{FEATURE_LABELS[feature]}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    {activeFeatureCount} recursos incluídos
                  </p>

                  {/* CTA Button */}
                  <div className="pt-2">
                    {isCurrent ? (
                      <Button disabled className="w-full" variant="outline" size="lg">
                        Plano atual
                      </Button>
                    ) : plan.checkout_link ? (
                      <Button
                        onClick={() => handleSubscribe(plan)}
                        className={`w-full gap-2 ${
                          isPopular ? "bg-accent hover:bg-accent/90 text-accent-foreground" : ""
                        }`}
                        size="lg"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {plan.price === 0 ? "Começar grátis" : "Assinar agora"}
                      </Button>
                    ) : (
                      <Button disabled className="w-full" variant="secondary" size="lg">
                        {plan.price === 0 ? "Plano gratuito" : "Em breve"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {plans.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-senior-lg">Nenhum plano disponível no momento.</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
