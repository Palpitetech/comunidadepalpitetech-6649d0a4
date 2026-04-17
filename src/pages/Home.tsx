import { Link, useSearchParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Volume2, UserPlus, BarChart3, BookOpen, Lock, Dices, Table, CalendarDays, MessageSquare } from "lucide-react";
import { CheckCircle2, ArrowRight, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { captureReferralCode } from "@/hooks/useConvites";

function VideoWithSoundPrompt() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  const handleUnmute = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.muted = false;
      videoRef.current.play();
      setIsMuted(false);
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-lg max-w-xs mx-auto relative cursor-pointer" onClick={isMuted ? handleUnmute : undefined}>
      <video
        ref={videoRef}
        className="w-full aspect-[9/16] object-cover"
        autoPlay
        loop
        muted={isMuted}
        playsInline
      >
        <source src="/videos/tour-comunidade.mp4" type="video/mp4" />
        Seu navegador não suporta vídeo.
      </video>
      {isMuted && (
        <div className="absolute inset-0 flex items-end justify-center pb-8 bg-gradient-to-t from-black/60 via-transparent to-transparent">
          <div className="flex items-center gap-2 bg-white/90 dark:bg-card/90 text-foreground rounded-full px-4 py-2.5 shadow-lg animate-pulse">
            <Volume2 className="h-4 w-4 text-primary" />
            <span className="text-xs font-semibold">Clique para ativar o som</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LandingPage() {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [referrerName, setReferrerName] = useState<string | null>(null);

  const refCode = searchParams.get("ref");

  useEffect(() => {
    if (isAuthenticated) navigate("/home", { replace: true });
  }, [isAuthenticated, navigate]);

  // Capture referral code and fetch referrer name
  useEffect(() => {
    if (!refCode) return;
    captureReferralCode();

    const fetchReferrer = async () => {
      const { data } = await supabase.rpc("get_referrer_name", { p_code: refCode });
      if (data) {
        setReferrerName((data as string).split(" ")[0]);
      }
    };
    fetchReferrer();
  }, [refCode]);

  const ctaLink = refCode ? `/login?cadastro=true&ref=${refCode}` : "/login?cadastro=true";

  const CtaPrimary = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <Button size="lg" className={`bg-accent text-accent-foreground hover:bg-accent/90 text-sm md:text-base font-semibold px-7 py-5 rounded-xl shadow-lg ${className}`} asChild>
      <Link to={ctaLink}>
        {children}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Link>
    </Button>
  );

  const CtaSecondary = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <Button variant="outline" size="lg" className={`border-primary/30 text-primary hover:bg-primary/5 text-sm font-medium px-6 py-5 rounded-xl ${className}`} asChild>
      <Link to={ctaLink}>
        {children}
        <ChevronRight className="ml-1.5 h-4 w-4" />
      </Link>
    </Button>
  );

  const CtaGhost = ({ children }: { children: React.ReactNode }) => (
    <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-semibold underline-offset-4 hover:underline px-0" asChild>
      <Link to={ctaLink}>
        {children}
        <ArrowRight className="ml-1 h-3.5 w-3.5" />
      </Link>
    </Button>
  );

  const CtaLight = ({ children }: { children: React.ReactNode }) => (
    <Button size="lg" variant="secondary" className="bg-white/15 text-primary-foreground hover:bg-white/25 border border-white/20 text-sm font-medium px-6 py-5 rounded-xl backdrop-blur" asChild>
      <Link to="/login">
        {children}
      </Link>
    </Button>
  );

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-5 py-3.5">
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.png" alt="Palpite Tech" className="h-9 w-9 rounded-lg" />
            <span className="font-bold text-base text-primary hidden sm:inline tracking-tight">Palpite Tech</span>
          </Link>
          <div className="flex gap-2.5">
            <Button variant="ghost" size="sm" className="text-sm font-medium" asChild>
              <Link to="/login">Entrar</Link>
            </Button>
            <Button size="sm" className="text-sm font-semibold" asChild>
              <Link to={ctaLink}>Criar Conta</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Referral Banner */}
      {referrerName && (
        <div className="bg-accent/10 border-b border-accent/20">
          <div className="max-w-5xl mx-auto px-5 py-3 flex items-center justify-center gap-2.5 text-center">
            <UserPlus className="h-5 w-5 text-accent shrink-0" />
            <p className="text-sm font-medium text-foreground">
              <span className="font-bold">{referrerName}</span> te convidou para interagir com ele sobre a <span className="font-bold">Lotofácil</span> e <span className="font-bold">Mega Sena</span>.
            </p>
          </div>
        </div>
      )}

      {/* ===== 1. HERO ===== */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
        <div className="max-w-3xl mx-auto px-5 py-14 md:py-20 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-8">
            <span>🎯</span> Comunidade 100% Gratuita
          </div>
          <h1 className="text-2xl sm:text-3xl md:text-[2.75rem] font-extrabold leading-[1.2] tracking-tight mb-5">
            A Comunidade Onde Apostadores da Lotofácil e Mega-Sena Trocam Estratégias Todos os Dias
          </h1>
          <p className="text-base md:text-lg text-primary-foreground/75 max-w-xl mx-auto mb-10 leading-relaxed">
            Receba dicas durante todo o dia, participe de discussões com outros apostadores, analise resultados e utilize ferramentas exclusivas para montar seus jogos com mais estratégia.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <CtaPrimary>Entrar na Comunidade Gratuitamente</CtaPrimary>
            <CtaLight>Já tenho conta</CtaLight>
          </div>
          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 mt-8 text-xs font-medium text-primary-foreground/60">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Cadastro gratuito</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Dicas todos os dias</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-accent" /> Comunidade ativa</span>
          </div>
        </div>
      </section>

      {/* ===== QUICK ACCESS MOBILE GRID ===== */}
      <section className="py-8 bg-background md:hidden">
        <div className="max-w-md mx-auto px-5 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            {[
              { title: "Resultados", icon: BarChart3, color: "text-blue-500" },
              { title: "Estudos", icon: BookOpen, color: "text-green-500" },
              { title: "Fechamentos", icon: Lock, color: "text-orange-500" },
              { title: "Gerador de Palpite", icon: Dices, color: "text-purple-500" },
              { title: "Tabela de Movimentação", icon: Table, color: "text-red-500" },
              { title: "Analise do Dia", icon: CalendarDays, color: "text-yellow-500" },
            ].map((item, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-3xl p-5 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col items-center justify-center text-center gap-3 border border-gray-50 active:scale-95 transition-all cursor-pointer group"
              >
                <div className="bg-gray-50 p-3 rounded-2xl group-hover:bg-primary/5 transition-colors">
                  <item.icon className={`h-8 w-8 ${item.color}`} />
                </div>
                <span className="text-xs font-bold text-senior-dark leading-tight">{item.title}</span>
              </div>
            ))}
          </div>

          <div className="flex justify-center">
            <Button 
              variant="outline" 
              className="w-[70%] h-auto py-4 px-6 bg-[#25D366] hover:bg-[#20ba5a] text-white border-none shadow-lg flex-col gap-1 rounded-[2rem] active:scale-95 transition-all"
            >
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 fill-white" />
                <span className="text-[10px] uppercase font-black tracking-widest opacity-90">WhatsApp</span>
              </div>
              <span className="text-[13px] font-bold">
                Quero receber Resultados no meu whatsapp
              </span>
            </Button>
          </div>
        </div>
      </section>


      <section className="py-10 md:py-14 bg-secondary/30">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-foreground mb-5 leading-snug">
            A maioria das pessoas aposta sozinha… e no escuro.
          </h2>
          <div className="space-y-2 text-muted-foreground text-sm md:text-base">
            <p>❌ Sem estratégia.</p>
            <p>❌ Sem análise de resultados.</p>
            <p>❌ Sem trocar ideias com quem também aposta.</p>
          </div>
          <p className="mt-5 text-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            A verdade é que muitos apostadores perdem oportunidades simplesmente por não ter <strong>informação e análise no momento certo</strong>.
          </p>
          <p className="mt-3 text-primary font-semibold text-base">
            Foi por isso que criamos essa comunidade.
          </p>
          <div className="mt-5">
            <CtaGhost>Quero mudar isso agora</CtaGhost>
          </div>
        </div>
      </section>

      {/* ===== 3. FEATURES ===== */}
      <section className="py-10 md:py-14">
        <div className="max-w-4xl mx-auto px-5">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 leading-snug">
            Tudo o que um apostador precisa em um só lugar
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {[
              { emoji: "🎯", title: "Dicas Todos os Dias", desc: "Estratégias e análises sendo publicadas durante todo o dia." },
              { emoji: "💬", title: "Comunidade de Apostadores", desc: "Comente posts, responda comentários e troque ideias com quem também aposta." },
              { emoji: "📊", title: "Resultados e Análises", desc: "Acompanhe resultados e discussões sobre os últimos concursos." },
              { emoji: "🧠", title: "Ferramentas Exclusivas", desc: "Utilize ferramentas desenvolvidas para ajudar na montagem dos seus jogos." },
            ].map((f) => (
              <div key={f.title} className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2.5">{f.emoji}</div>
                <h3 className="text-base font-bold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <CtaSecondary>Quero acessar tudo isso</CtaSecondary>
          </div>
        </div>
      </section>

      {/* ===== 4. COMO FUNCIONA ===== */}
      <section className="py-10 md:py-14 bg-secondary/30">
        <div className="max-w-3xl mx-auto px-5">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 leading-snug">
            Entrar na comunidade leva menos de 1 minuto
          </h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {[
              { step: "1", title: "Crie seu cadastro gratuito", desc: "Preencha seus dados e pronto." },
              { step: "2", title: "Entre na comunidade", desc: "Comece a acompanhar as dicas publicadas." },
              { step: "3", title: "Participe e utilize", desc: "Discuta estratégias e use as ferramentas." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center">
                <div className="flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground text-lg font-bold mb-3 shadow-sm">
                  {s.step}
                </div>
                <h3 className="text-sm font-bold text-foreground mb-1">{s.title}</h3>
                <p className="text-muted-foreground text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-6">
            <CtaPrimary>Começar Agora — É Grátis</CtaPrimary>
          </div>
        </div>
      </section>

      {/* ===== 5. PARA QUEM É ===== */}
      <section className="py-10 md:py-14">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-7 leading-snug">
            Essa comunidade é para quem quer apostar com mais estratégia
          </h2>
          <div className="grid sm:grid-cols-2 gap-2.5 max-w-sm mx-auto text-left mb-7">
            {[
              "Apostadores da Lotofácil",
              "Apostadores da Mega-Sena",
              "Quem gosta de analisar resultados",
              "Quem quer trocar estratégias",
            ].map((t) => (
              <div key={t} className="flex items-center gap-2 text-foreground">
                <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                <span className="text-sm">{t}</span>
              </div>
            ))}
          </div>
          <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed mb-8">
            Se você aposta apenas por impulso, talvez não seja para você.
            Mas se gosta de <strong className="text-foreground">estratégia e análise</strong>, você vai se sentir em casa.
          </p>
          <CtaGhost>Sim, quero participar</CtaGhost>
        </div>
      </section>

      {/* ===== 6. BENEFÍCIO PRINCIPAL ===== */}
      <section className="py-10 md:py-14 bg-primary/5">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-5 leading-snug">
            Apostar sozinho é difícil. Apostar em comunidade é diferente.
          </h2>
          <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto leading-relaxed">
            Quando várias pessoas analisam os jogos, compartilham ideias e discutem estratégias, você passa a ter mais informação antes de fazer suas apostas.
          </p>
          <p className="mt-3 text-primary font-semibold text-sm">
            É exatamente isso que acontece dentro da comunidade.
          </p>
          <div className="mt-5">
            <CtaSecondary>Fazer parte da comunidade</CtaSecondary>
          </div>
        </div>
      </section>

      {/* ===== VÍDEO TOUR ===== */}
      <section className="py-10 md:py-14">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2 leading-snug">
            Conheça por dentro a comunidade
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mb-6">
            Você nunca viu uma comunidade assim antes.
          </p>
          <VideoWithSoundPrompt />
          <div className="mt-6">
            <CtaPrimary>Quero fazer parte</CtaPrimary>
          </div>
        </div>
      </section>

      <section className="py-14 md:py-20 bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground">
        <div className="max-w-2xl mx-auto px-5 text-center">
          <h2 className="text-xl md:text-3xl font-extrabold mb-4 leading-snug">
            🚀 Entre agora na Comunidade de Apostadores
          </h2>
          <p className="text-primary-foreground/75 text-sm md:text-base mb-8 max-w-md mx-auto leading-relaxed">
            O cadastro é gratuito e você já pode começar a acompanhar as dicas e discussões imediatamente.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <CtaPrimary>Criar Conta Gratuita Agora</CtaPrimary>
            <CtaLight>Já tenho conta</CtaLight>
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <div className="bg-muted/50 border-t border-border px-5 py-4">
        <p className="max-w-3xl mx-auto text-[10px] md:text-xs text-muted-foreground text-center leading-relaxed">
          <strong>Aviso legal:</strong> Este site não possui qualquer vínculo com a Caixa Econômica Federal, Facebook, Instagram, Meta ou qualquer outra empresa do grupo Meta Platforms, Inc. O conteúdo apresentado tem caráter exclusivamente educacional e informativo, baseado em análises estatísticas de resultados públicos. <strong>Não garantimos premiação em nenhuma modalidade de loteria.</strong> Aposte com responsabilidade.
        </p>
      </div>

      {/* Footer */}
      <footer className="py-6 border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Palpite Tech" className="h-5 w-5 rounded" />
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
