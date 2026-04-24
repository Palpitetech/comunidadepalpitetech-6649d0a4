import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  Check,
  Crown,
  Star,
  Sparkles,
  Bot,
  Zap,
  MessageCircle,
  Infinity,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import type { Plan, PlanFeatures } from "@/types/plans";

// Installment config
const INSTALLMENTS: Record<string, { parcelas: number; valor: string }> = {
  "plano-anual-vip": { parcelas: 12, valor: "40,69" },
  anual: { parcelas: 12, valor: "30,44" },
};

// Compact highlights per plan slug
const PLAN_HIGHLIGHTS: Record<string, string[]> = {
  "grupo-vip-lotofacil": [
    "Palpites prontos no WhatsApp",
    "Grupo exclusivo Lotofácil",
    "Análises diárias da equipe",
    "Sem precisar usar ferramentas",
  ],
  mensal: [
    "Gerador de Jogos (10x/dia)",
    "Fechamento e Desdobramento",
    "Estatísticas completas",
    "Comunidade e Mesa Redonda",
  ],
  anual: [
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

export default function PlanosPublico() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from("plans")
          .select("*")
          .eq("is_active", true)
          .order("display_order", { ascending: true });

        if (error) throw error;

        setPlans(
          (data || []).map((p) => ({
            ...p,
            price: Number(p.price),
            features: p.features as PlanFeatures,
          }))
        );
      } catch (err) {
        console.error("Erro ao carregar planos:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSubscribe = (plan: Plan) => {
    if (plan.checkout_link) {
      window.open(plan.checkout_link, "_blank");
    }
  };

  const paidPlans = plans.filter((p) => p.price > 0);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <Helmet>
        <title>Planos Palpite Tech | Escolha o seu</title>
        <meta
          name="description"
          content="Conheça os planos do Palpite Tech: ferramentas de análise, gerador inteligente e comunidade exclusiva para aumentar suas chances nas loterias."
        />
        <meta name="robots" content="index, follow" />
      </Helmet>

      {/* Header */}
      <header className="border-b bg-white">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img
              src="/logo-palpite-tech.png"
              alt="Palpite Tech"
              className="h-9 w-auto"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="text-lg font-bold text-foreground">Palpite Tech</span>
          </Link>
          <Link
            to="/login"
            className="text-sm font-semibold text-primary hover:underline"
          >
            Já sou cliente
          </Link>
        </div>
      </header>

      <div className="py-8 max-w-6xl mx-auto px-4">
        {/* Hero */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-4">
            <Sparkles className="h-4 w-4" />
            <span className="text-sm font-medium">Escolha seu plano</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Invista no seu jogo
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto">
            Ferramentas de análise, gerador inteligente e comunidade exclusiva
            para aumentar suas chances.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Plans */}
            <div
              className="rounded-xl border-l-4 p-4 md:p-5"
              style={{
                borderLeftColor: "hsl(var(--primary))",
                backgroundColor: "hsl(var(--primary) / 0.04)",
              }}
            >
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4 items-stretch">
                {paidPlans.map((plan) => {
                  const isVip = plan.slug === "plano-anual-vip";
                  const isAnual = plan.slug === "anual";
                  const isGrupoVip = plan.slug === "grupo-vip-lotofacil";
                  const inst = INSTALLMENTS[plan.slug];
                  const activeFeatures = Object.values(plan.features).filter(
                    Boolean
                  ).length;

                  return (
                    <div
                      key={plan.id}
                      className={`relative rounded-2xl border-2 bg-card flex flex-col overflow-hidden transition-all duration-200 min-h-[480px] ${
                        isVip
                          ? "border-amber-400 shadow-xl"
                          : isAnual
                          ? "border-accent/60 shadow-md"
                          : isGrupoVip
                          ? "border-emerald-400/60 shadow-md"
                          : "border-border hover:shadow-md hover:border-primary/30"
                      }`}
                    >
                      {/* Top ribbon */}
                      {isVip ? (
                        <div className="bg-gradient-to-r from-amber-500 to-amber-400 text-white text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                          ⭐ Mais completo
                        </div>
                      ) : isAnual ? (
                        <div className="bg-accent text-accent-foreground text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                          Melhor custo-benefício
                        </div>
                      ) : isGrupoVip ? (
                        <div className="bg-emerald-500 text-white text-center py-1.5 text-xs font-bold uppercase tracking-widest">
                          📱 Mensal · Grupo
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
                          <div
                            className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl ${
                              isVip
                                ? "bg-amber-100 text-amber-600"
                                : "bg-secondary text-primary"
                            }`}
                          >
                            {isVip ? (
                              <Crown className="h-7 w-7" />
                            ) : plan.price >= 200 ? (
                              <Crown className="h-7 w-7" />
                            ) : (
                              <Star className="h-7 w-7" />
                            )}
                          </div>
                          <h2 className="text-xl font-bold text-foreground">
                            {plan.name}
                          </h2>
                          {plan.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {plan.description}
                            </p>
                          )}
                        </div>

                        {/* Price */}
                        <div className="text-center mb-5 pb-5 border-b">
                          {inst ? (
                            <>
                              <div className="flex items-baseline justify-center gap-1.5">
                                <span className="text-muted-foreground text-sm">
                                  12x de
                                </span>
                                <span className="text-3xl font-extrabold text-foreground">
                                  R$ {inst.valor}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1.5">
                                ou{" "}
                                <span className="font-bold text-foreground">
                                  R$ {plan.price.toFixed(2).replace(".", ",")}
                                </span>{" "}
                                à vista no Pix
                              </p>
                            </>
                          ) : (
                            <div className="flex items-baseline justify-center gap-1">
                              <span className="text-3xl font-extrabold text-foreground">
                                R$ {plan.price.toFixed(2).replace(".", ",")}
                              </span>
                              <span className="text-muted-foreground text-sm">
                                /mês
                              </span>
                            </div>
                          )}
                        </div>

                        {/* VIP Exclusive Highlights */}
                        {isVip && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 mb-4 space-y-2">
                            <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1">
                              <Zap className="h-3 w-3" />
                              Exclusivo VIP
                            </p>
                            <VipFeature
                              icon={<Bot className="h-3.5 w-3.5 text-amber-600" />}
                              title="Ferramentas com IA"
                            />
                            <VipFeature
                              icon={
                                <MessageCircle className="h-3.5 w-3.5 text-amber-600" />
                              }
                              title="Chat IA Completo"
                            />
                            <VipFeature
                              icon={
                                <Infinity className="h-3.5 w-3.5 text-amber-600" />
                              }
                              title="Gerador Ilimitado"
                            />
                          </div>
                        )}

                        {/* Compact highlights */}
                        <ul className="flex-1 space-y-1.5 mb-4">
                          {(PLAN_HIGHLIGHTS[plan.slug] || []).map((item) => (
                            <li
                              key={item}
                              className="flex items-center gap-2 text-sm"
                            >
                              <Check className="h-4 w-4 text-accent flex-shrink-0" />
                              <span className="text-foreground">{item}</span>
                            </li>
                          ))}
                        </ul>

                        {/* Resource count */}
                        <p className="text-xs text-muted-foreground text-center mb-3">
                          {activeFeatures} recursos incluídos
                        </p>

                        {/* CTA */}
                        <div className="mt-auto pt-2">
                          {plan.checkout_link ? (
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
                            <Button
                              disabled
                              className="w-full h-12 text-base"
                              variant="secondary"
                            >
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
                <p className="text-lg">Nenhum plano disponível no momento.</p>
              </div>
            )}
          </>
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

      {/* Footer minimal */}
      <footer className="border-t bg-white mt-10">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Palpite Tech. Todos os direitos reservados.
        </div>
      </footer>
    </div>
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
