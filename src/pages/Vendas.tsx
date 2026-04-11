import { Link } from "react-router-dom";
import { CheckCircle2, ArrowRight, ShieldCheck, Zap, Users, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealGeneratorDemo } from "@/components/vendas/RealGeneratorDemo";

export default function Vendas() {
  const ctaLink = "/login?cadastro=true";

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
              <Link to={ctaLink}>Começar Agora</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary via-primary/90 to-primary/80 text-primary-foreground overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
        <div className="max-w-4xl mx-auto px-5 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-8">
            <Trophy className="h-4 w-4 text-accent" />
            <span>A maior plataforma de estatísticas lotéricas</span>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6">
            Transforme sua sorte em <span className="text-accent italic">Estratégia</span>
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            Acesse as ferramentas mais avançadas de análise para Lotofácil, Mega-Sena e Quina. 
            Pare de jogar no escuro e comece a utilizar dados reais a seu favor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-bold h-14 px-10 rounded-xl shadow-xl group" asChild>
              <Link to={ctaLink}>
                QUERO TER ACESSO AGORA
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <p className="mt-6 text-sm text-primary-foreground/60 flex items-center justify-center gap-2">
            <ShieldCheck className="h-4 w-4 text-accent" />
            Acesso imediato após o cadastro
          </p>
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-12 border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">+50k</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Usuários Ativos</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">98%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Satisfação</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">24/7</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Atualizações</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">100%</div>
              <div className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Seguro</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32">
        <div className="max-w-5xl mx-auto px-5">
          <div className="text-center mb-16">
            <h2 className="text-2xl md:text-4xl font-bold mb-4">Por que escolher o Palpite Tech?</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Nossa plataforma oferece tudo o que você precisa para elevar o nível das suas apostas.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Análise em Tempo Real</h3>
              <p className="text-muted-foreground leading-relaxed">
                Resultados atualizados instantaneamente com tendências de dezenas quentes e frias para o próximo concurso.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Comunidade VIP</h3>
              <p className="text-muted-foreground leading-relaxed">
                Troque estratégias com milhares de outros apostadores experientes em nossa comunidade exclusiva.
              </p>
            </div>

            <div className="bg-card border border-border rounded-3xl p-8 hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Gerador Inteligente</h3>
              <p className="text-muted-foreground leading-relaxed">
                Algoritmos avançados que sugerem combinações baseadas em padrões matemáticos e comportamentais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits List */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1">
              <h2 className="text-2xl md:text-4xl font-bold mb-8 leading-tight">
                Tudo o que você ganha ao se tornar membro hoje:
              </h2>
              <div className="space-y-4">
                {[
                  "Acesso a todas as loterias (Lotofácil, Mega, Quina e mais)",
                  "Ferramentas de Desdobramento e Fechamento",
                  "Tabelas de movimentação detalhadas",
                  "Frequência de dezenas por posição",
                  "Suporte priorizado via WhatsApp",
                  "Dicas diárias de especialistas"
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-accent shrink-0" />
                    <span className="text-lg font-medium">{item}</span>
                  </div>
                ))}
              </div>
              <div className="mt-10">
                <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 h-14 px-8 rounded-xl font-bold" asChild>
                  <Link to={ctaLink}>QUERO MEU ACESSO AGORA</Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="bg-gradient-to-tr from-primary to-accent p-1 rounded-3xl shadow-2xl">
                <div className="bg-card rounded-[22px] overflow-hidden p-6 sm:p-10 flex items-center justify-center">
                  <RealGeneratorDemo />
                </div>
              </div>
              {/* Floating Badge */}
              <div className="absolute -bottom-6 -left-6 bg-accent text-accent-foreground p-6 rounded-2xl shadow-xl animate-bounce">
                <div className="text-2xl font-black">ACESSO VIP</div>
                <div className="text-xs font-bold uppercase">Liberado Hoje</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final Call to Action */}
      <section className="py-20 md:py-32">
        <div className="max-w-3xl mx-auto px-5 text-center">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-8">Pronto para subir de nível?</h2>
          <p className="text-xl text-muted-foreground mb-12">
            Junte-se a milhares de apostadores que já estão usando a tecnologia para otimizar seus jogos. 
            O próximo sorteio pode ser o seu!
          </p>
          <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 text-xl font-black h-20 px-12 rounded-2xl shadow-2xl hover:scale-105 transition-all w-full sm:w-auto" asChild>
            <Link to={ctaLink}>
              SIM! QUERO ACESSAR O PALPITE TECH AGORA!
            </Link>
          </Button>
          <p className="mt-8 text-muted-foreground flex items-center justify-center gap-2 font-medium">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Satisfação Garantida ou seu dinheiro de volta
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="Palpite Tech" className="h-10 w-10 rounded-lg" />
              <span className="font-bold text-xl text-primary tracking-tight">Palpite Tech</span>
            </Link>
            <div className="flex gap-8 text-sm font-medium">
              <Link to="/termos" className="hover:text-primary transition-colors">Termos</Link>
              <Link to="/privacidade" className="hover:text-primary transition-colors">Privacidade</Link>
              <Link to="/login" className="hover:text-primary transition-colors">Login</Link>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center">
            <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              <strong>Aviso legal:</strong> Este site não possui qualquer vínculo com a Caixa Econômica Federal. 
              O conteúdo apresentado tem caráter exclusivamente educacional e informativo. 
              <strong>Não garantimos premiação em nenhuma modalidade de loteria.</strong> Aposte com responsabilidade.
            </p>
            <p className="mt-6 text-xs text-muted-foreground">
              © {new Date().getFullYear()} Palpite Tech. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
