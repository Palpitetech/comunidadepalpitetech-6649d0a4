import { Link } from "react-router-dom";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { Target, MessageCircle, BarChart3, Wrench, CheckCircle2, ArrowRight, Users, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate("/", { replace: true });
  }, [isAuthenticated, navigate]);

  const ctaLink = "/login?cadastro=true";

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/landing" className="flex items-center gap-2">
            <img src="/logo.png" alt="Palpite Tech" className="h-9 w-9 rounded-lg" />
            <span className="font-bold text-lg text-primary hidden sm:inline">Palpite Tech</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to={ctaLink}>Criar Conta</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* ===== 1. HERO ===== */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-4 py-20 md:py-28 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span>🎯</span> Comunidade 100% Gratuita
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight tracking-tight mb-6">
            A Comunidade Onde Apostadores da Lotofácil e Mega-Sena Trocam Estratégias Todos os Dias
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
            Receba dicas durante todo o dia, participe de discussões com outros apostadores, analise resultados e utilize ferramentas exclusivas para montar seus jogos com mais estratégia.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base md:text-lg px-8 py-6 rounded-xl shadow-lg" asChild>
            <Link to={ctaLink}>
              👉 Entrar na Comunidade Gratuitamente
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8 text-sm text-white/70">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Cadastro gratuito</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Dicas todos os dias</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-accent" /> Comunidade ativa</span>
          </div>
        </div>
      </section>

      {/* ===== 2. PROBLEMA ===== */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            A maioria das pessoas aposta sozinha… e no escuro.
          </h2>
          <div className="space-y-3 text-muted-foreground text-base md:text-lg">
            <p>❌ Sem estratégia.</p>
            <p>❌ Sem análise de resultados.</p>
            <p>❌ Sem trocar ideias com quem também aposta.</p>
          </div>
          <p className="mt-8 text-foreground text-base md:text-lg max-w-xl mx-auto">
            A verdade é que muitos apostadores perdem oportunidades simplesmente por não ter <strong>informação e análise no momento certo</strong>.
          </p>
          <p className="mt-4 text-primary font-semibold text-lg">
            Foi por isso que criamos essa comunidade.
          </p>
        </div>
      </section>

      {/* ===== 3. FEATURES ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Tudo o que um apostador precisa em um só lugar
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              { icon: Target, emoji: "🎯", title: "Dicas Todos os Dias", desc: "Estratégias e análises sendo publicadas durante todo o dia." },
              { icon: MessageCircle, emoji: "💬", title: "Comunidade de Apostadores", desc: "Comente posts, responda comentários e troque ideias com quem também aposta." },
              { icon: BarChart3, emoji: "📊", title: "Resultados e Análises", desc: "Acompanhe resultados e discussões sobre os últimos concursos." },
              { icon: Wrench, emoji: "🧠", title: "Ferramentas Exclusivas", desc: "Utilize ferramentas desenvolvidas para ajudar na montagem dos seus jogos." },
            ].map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-3xl mb-3">{f.emoji}</div>
                <h3 className="text-lg font-bold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. COMO FUNCIONA ===== */}
      <section className="py-16 md:py-24 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-12">
            Entrar na comunidade leva menos de 1 minuto
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { step: "1", icon: Zap, title: "Crie seu cadastro gratuito", desc: "Preencha seus dados e pronto." },
              { step: "2", icon: Users, title: "Entre na comunidade", desc: "Comece a acompanhar as dicas publicadas." },
              { step: "3", icon: TrendingUp, title: "Participe e utilize", desc: "Discuta estratégias e use as ferramentas." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground text-xl font-bold mb-4 shadow-md">
                  {s.step}
                </div>
                <h3 className="font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-sm">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 5. PARA QUEM É ===== */}
      <section className="py-16 md:py-24">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-8">
            Essa comunidade é para quem quer apostar com mais estratégia
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 max-w-md mx-auto text-left mb-8">
            {[
              "Apostadores da Lotofácil",
              "Apostadores da Mega-Sena",
              "Quem gosta de analisar resultados",
              "Quem quer trocar estratégias com outros",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                <span className="text-sm font-medium">{t}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">
            Se você aposta apenas por impulso, talvez não seja para você.<br />
            Mas se gosta de <strong className="text-foreground">estratégia e análise</strong>, você vai se sentir em casa.
          </p>
        </div>
      </section>

      {/* ===== 6. BENEFÍCIO PRINCIPAL ===== */}
      <section className="py-16 md:py-24 bg-primary/5">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-6">
            Apostar sozinho é difícil. Apostar em comunidade é diferente.
          </h2>
          <p className="text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Quando várias pessoas analisam os jogos, compartilham ideias e discutem estratégias, você passa a ter mais informação antes de fazer suas apostas.
          </p>
          <p className="mt-4 text-primary font-semibold">
            É exatamente isso que acontece dentro da comunidade.
          </p>
        </div>
      </section>

      {/* ===== 7. CTA FINAL ===== */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-4xl font-extrabold mb-4">
            🚀 Entre agora na Comunidade de Apostadores
          </h2>
          <p className="text-white/80 text-base md:text-lg mb-8 max-w-lg mx-auto">
            O cadastro é gratuito e você já pode começar a acompanhar as dicas e discussões imediatamente.
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-base md:text-lg px-8 py-6 rounded-xl shadow-lg" asChild>
            <Link to={ctaLink}>
              👉 Criar Conta Gratuita Agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Palpite Tech" className="h-6 w-6 rounded" />
            <span>© {new Date().getFullYear()} Palpite Tech</span>
          </div>
          <div className="flex gap-4">
            <Link to="/termos" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacidade" className="hover:text-foreground transition-colors">Privacidade</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
