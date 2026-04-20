import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Helmet } from "react-helmet-async";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useMySubscription } from "@/hooks/useMySubscription";
import { Loader2, Check, Crown, Star, Sparkles, Bot, Zap, MessageCircle, Infinity, ShieldCheck, ArrowRight } from "lucide-react";
import type { Plan, PlanFeatures } from "@/types/plans";
import { STATUS_CONFIG } from "@/lib/subscription";
import type { StatusAssinatura } from "@/types/plans";

// Installment config
const INSTALLMENTS: Record<string, { parcelas: number; valor: string }> = {
  "plano-anual-vip": { parcelas: 12, valor: "40,69" },
  "anual": { parcelas: 12, valor: "30,44" },
};

// Compact highlights per plan slug
const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  "grupo-vip-lotofacil": [
    "Palpites prontos no WhatsApp",
    "Grupo exclusivo Lotofácil",
    "Análises diárias da equipe",
    "Sem precisar usar ferramentas",
  ],
  "mensal": [
    "Gerador de Jogos (10x/dia)",
    "Fechamento e Desdobramento",
    "Estatísticas completas",
    "Comunidade e Mesa Redonda",
  ],
  "anual": [
    "Tudo do Mensal",
    "Gerador de Jogos (10x/dia)",
    "Economia de 47% vs mensal",
    "Comunidade e Mesa Redonda",
  ],
  "plano-anual-vip": [
    "Tudo do Anual +",
    "Gerador Ilimitado",
    "Chat IA completo",
    "Ferramentas com IA exclusivas",
  ],
};

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

  const isCurrentPlan = (planId: string) => userPlanId === planId;

  const handleSubscribe = (plan: Plan) => {
    if (plan.checkout_link) {
      window.open(plan.checkout_link, "_blank");
    }
  };

  if (loading) {
    return (
      <MainLayout pageTitle="Planos">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const statusLabel = subscription
    ? STATUS_CONFIG[subscription.status as StatusAssinatura]?.label ?? "Sem assinatura"
    : null;

  const trialPlan = plans.find((p) => p.slug === "trial" || p.slug === "teste-gratis-3-dias");
  const paidPlans = plans.filter((p) => p.price > 0);
  const showTrialCard = trialPlan && !subscription?.trial_used && subscription?.status === "inativa";

  return (
    <MainLayout pageTitle="Planos">
      <Helmet>
        <title>Planos e Assinaturas | Palpite Tech</title>
        <meta name="description" content="Escolha o melhor plano do Palpite Tech para ter acesso a ferramentas exclusivas de análise de loterias." />
      </Helmet>
      <div className="py-8 max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Escolha seu plano</span>
          </div>
          <h1 className="text-senior-3xl font-bold text-foreground mb-2">
            Invista no seu jogo
          </h1>
          <p className="text-muted-foreground text-senior-base max-w-xl mx-auto">
            Ferramentas de análise, gerador inteligente e comunidade exclusiva para aumentar suas chances.
          </p>

          {subscription && user && (
            <div className="mt-4 inline-flex items-center gap-2 bg-card border rounded-full px-4 py-2">
              <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Sua assinatura:</span>
              <Badge variant={STATUS_CONFIG[subscription.status as StatusAssinatura]?.variant ?? "outline"}>
                {statusLabel}
              </Badge>
            </div>
          )}
        </div>

        {/* Plans */}
        <div
          className="rounded-xl border-l-4 p-4 md:p-5"
          style={{
            borderLeftColor: "hsl(var(--primary))",
            backgroundColor: "hsl(var(--primary) / 0.04)",
          }}
        >
        <div className="grid gap-5 md:grid-cols-3 items-stretch">
          {paidPlans.map((plan) => {
            const isCurrent = isCurrentPlan(plan.id);
            const isVip = plan.slug === "plano-anual-vip";
            const isAnual = plan.slug === "anual";
            const inst = INSTALLMENTS[plan.slug];
            const activeFeatures = Object.values(plan.features).filter(Boolean).length;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border-2 bg-card flex flex-col overflow-hidden transition-all duration-200 min-h-[520px] ${
                  isCurrent
                    ? "border-primary shadow-lg"
                    : isVip
                    ? "border-amber-400 shadow-xl"
                    : isAnual
                    ? "border-accent/60 shadow-md"
                    : "border-border hover:shadow-md hover:border-primary/30"
                }`}
              >
                {/* Top ribbon - all cards get one for symmetry */}
                {isCurrent ? (
                  <div className="bg-primary text-primary-foreground text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                    Seu plano atual
                  </div>
                ) : isVip ? (
                  <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                    ⭐ Mais completo
                  </div>
                ) : isAnual ? (
                  <div className="bg-accent text-accent-foreground text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                    Melhor custo-benefício
                  </div>
                ) : (
                  <div className="bg-secondary text-secondary-foreground text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                    Flexível
                  </div>
                )}

                {/* Plan content */}
                <div className="p-6 flex flex-col flex-1">
                  {/* Icon + Name */}
                  <div className="text-center mb-5">
                    <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                      isVip
                        ? "bg-amber-100 text-amber-600"
                        : isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-primary"
                    }`}>
                      {isVip ? <Crown className="h-7 w-7" /> : plan.price >= 200 ? <Crown className="h-7 w-7" /> : <Star className="h-7 w-7" />}
                    </div>
                    <h2 className="text-senior-xl font-bold text-foreground">{plan.name}</h2>
                    {plan.description && (
                      <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="text-center mb-5 pb-5 border-b">
                    {inst ? (
                      <>
                        <div className="flex items-baseline justify-center gap-1.5">
                          <span className="text-muted-foreground text-sm">12x de</span>
                          <span className="text-senior-3xl font-extrabold text-foreground">
                            R$ {inst.valor}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1.5">
                          ou <span className="font-bold text-foreground">R$ {plan.price.toFixed(2).replace(".", ",")}</span> à vista no Pix
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-baseline justify-center gap-1">
                          <span className="text-senior-3xl font-extrabold text-foreground">
                            R$ {plan.price.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-muted-foreground text-sm">/mês</span>
                        </div>
                      </>
                    )}
                  </div>

                  {/* VIP Exclusive Highlights */}
                  {isVip && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 mb-4 space-y-2">
                      <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Exclusivo VIP
                      </p>
                      <VipFeature icon={<Bot className="h-3.5 w-3.5 text-amber-600" />} title="Ferramentas com IA" />
                      <VipFeature icon={<MessageCircle className="h-3.5 w-3.5 text-amber-600" />} title="Chat IA Completo" />
                      <VipFeature icon={<Infinity className="h-3.5 w-3.5 text-amber-600" />} title="Gerador Ilimitado" />
                    </div>
                  )}

                  {/* Compact highlights */}
                  <ul className="flex-1 space-y-1.5 mb-4">
                    {(PLAN_HIGHLIGHTS[plan.slug] || []).map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm">
                        <Check className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Resource count */}
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    {activeFeatures} recursos incluídos
                  </p>

                  {/* CTA - pushed to bottom */}
                  <div className="mt-auto pt-2">
                  {isCurrent ? (
                    <Button disabled className="w-full h-12 text-base" variant="outline">
                      Plano atual
                    </Button>
                  ) : plan.checkout_link ? (
                    <Button
                      onClick={() => handleSubscribe(plan)}
                      className={`w-full h-12 text-base font-semibold gap-2 ${
                        isVip
                          ? "bg-amber-500 hover:bg-amber-600 text-white"
                          : isAnual
                          ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                          : ""
                      }`}
                      size="lg"
                    >
                      Assinar agora
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button disabled className="w-full h-12 text-base" variant="secondary">
                      Em breve
                    </Button>
                  )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        </div>

        {paidPlans.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-senior-lg">Nenhum plano disponível no momento.</p>
          </div>
        )}

        {/* Trust footer */}
        <div className="mt-10 text-center space-y-2">
          <div className="flex items-center justify-center gap-6 text-muted-foreground text-sm">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4" />
              Pagamento seguro
            </span>
            <span className="flex items-center gap-1.5">
              <Check className="h-4 w-4" />
              Acesso imediato
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Cancele a qualquer momento. Sem fidelidade.
          </p>
        </div>
      </div>
    </MainLayout>
  );
}

// Small sub-component for VIP features
function VipFeature({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-200/60 flex-shrink-0">
        {icon}
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
    </div>
  );
}
