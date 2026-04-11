import { Link } from "react-router-dom";
import { Check, AlertTriangle, X, MessageCircle, BarChart3, Settings, ShieldCheck, ArrowRight, Star, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RealGeneratorDemo } from "@/components/vendas/RealGeneratorDemo";

export default function Vendas2() {
  const ctaLink = "/login?cadastro=true";

  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-purple-100 overflow-x-hidden">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center relative justify-center">
          <Link to="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="Logo" className="h-10 w-10 rounded-xl shadow-sm" />
            <span className="font-bold text-xl tracking-tight text-purple-900 hidden sm:block">Palpite Tech</span>
          </Link>
          <div className="absolute right-4">
            <Button variant="outline" className="border-purple-200 text-purple-900 font-bold px-3 md:px-6 h-10 md:h-12 rounded-full hover:bg-purple-50 transition-all text-sm md:text-lg" asChild>
              <Link to={ctaLink}>Comprar agora</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* SESSÃO 01 — HERO */}
      <section className="relative pt-12 pb-20 md:pt-24 md:pb-32 overflow-hidden bg-gradient-to-b from-purple-50/50 to-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center text-center md:text-left">
            <div className="space-y-8">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight text-gray-900">
                Pare de perder tempo com tabelas de Excel e sistemas confusos tentando acertar <span className="inline-block bg-purple-100 px-3 py-1 rounded-xl text-purple-900 whitespace-nowrap">14 e 15 pontos</span>.
              </h1>
              <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium">
                E não, não é promessa vazia. Você recebe a estratégia completa + Palpites diretamente no seu Whatsapp e ainda pode gerar seus próprios palpites usando nosso gerador inteligente, esse gerador possui mais de 50 mil linhas de código atualizado diariamente por mim criando inteligência real para seus jogos.
              </p>
              <div className="pt-4">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-black text-2xl h-20 px-12 rounded-full shadow-2xl shadow-green-200 w-full md:w-auto transition-transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3" asChild>
                  <Link to={ctaLink}>
                    👉 TESTAR AGORA
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <div className="bg-white p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-purple-50">
                <RealGeneratorDemo />
              </div>
              <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-100/30 rounded-full blur-3xl" />
            </div>
          </div>
        </div>
      </section>

      {/* SESSÃO 02 — DOR / IDENTIFICAÇÃO */}
      <section className="py-24 bg-[#f5f5f5]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-black mb-12 text-gray-900 leading-tight">
            <span className="text-purple-900">A verdade é simples:</span> você está cansado de gastar dinheiro e não ter resultados.
          </h2>
          
          <div className="grid gap-6">
            {[
              { text: "Você joga toda semana, mas os grandes prêmios parecem impossíveis.", icon: <AlertTriangle className="text-amber-500" /> },
              { text: "Sistemas complexos que prometem tudo e não entregam nada.", icon: <X className="text-red-500" /> },
              { text: "E isso não é culpa sua. O sistema é feito para você perder.", icon: <AlertTriangle className="text-amber-500" /> },
              { text: "Quando você acha que vai ganhar, os números simplesmente somem!", icon: <X className="text-red-500" /> }
            ].map((item, index) => (
              <div key={index} className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-6 text-left group hover:shadow-md transition-shadow">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-2xl">
                  {item.icon}
                </div>
                <p className="text-xl md:text-2xl font-semibold text-gray-800 leading-snug">
                  {item.text.split(/(E isso não é culpa sua\.|eles somem!)/).map((part, i) => (
                    part === "E isso não é culpa sua." || part === "eles somem!" ? <strong key={i} className="text-purple-900">{part}</strong> : part
                  ))}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SESSÃO 03 — SOLUÇÃO */}
      <section className="py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-gray-900">A Solução Definitiva para o Apostador Inteligente</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:border-purple-200 transition-all text-center group">
              <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-10 h-10 text-purple-900" />
              </div>
              <h3 className="text-2xl font-black mb-4 text-purple-900">Palpites no WhatsApp</h3>
              <p className="text-xl text-gray-600 leading-relaxed font-medium">Receba as melhores combinações prontas para jogar diretamente no seu celular.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:border-purple-200 transition-all text-center group">
              <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-10 h-10 text-purple-900" />
              </div>
              <h3 className="text-2xl font-black mb-4 text-purple-900">Estatísticas Reais</h3>
              <p className="text-xl text-gray-600 leading-relaxed font-medium">Dados atualizados diariamente com inteligência artificial para aumentar suas chances.</p>
            </div>

            <div className="bg-white p-10 rounded-3xl border border-gray-100 shadow-sm hover:border-purple-200 transition-all text-center group">
              <div className="w-20 h-20 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:scale-110 transition-transform">
                <Settings className="w-10 h-10 text-purple-900" />
              </div>
              <h3 className="text-2xl font-black mb-4 text-purple-900">Gerador Inteligente</h3>
              <p className="text-xl text-gray-600 leading-relaxed font-medium">Mais de 50 mil linhas de código trabalhando para você gerar os melhores jogos.</p>
            </div>
          </div>
          
          <div className="mt-16">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-black text-2xl h-20 px-12 rounded-full shadow-2xl w-full md:w-auto" asChild>
              <Link to={ctaLink}>👉 TESTAR AGORA</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SESSÃO 04 — QUEBRA DE OBJEÇÃO */}
      <section className="py-24 bg-white border-y border-gray-50">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-gray-900">Por que somos diferentes?</h2>
          <div className="space-y-8 text-left max-w-2xl mx-auto px-4">
            {[
              "Sem promessas de riqueza fácil, apenas estatística pura.",
              "Interface simples pensada para quem não tem paciência com tecnologia.",
              "Suporte real feito por humanos que entendem do assunto.",
              "Atualização diária baseada nos últimos concursos sorteados.",
              "Acesso imediato após a confirmação do pagamento.",
              "Satisfação garantida ou seu investimento de volta."
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-6 group">
                <div className="mt-1 w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-xl md:text-2xl font-semibold text-gray-800 leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SESSÃO 05 — DEMONSTRAÇÃO */}
      <section className="py-24 bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-12">Veja a ferramenta em ação</h2>
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gray-800 p-2 rounded-3xl shadow-[0_0_50px_rgba(139,92,246,0.3)] border border-purple-500/30">
              <div className="bg-white rounded-[22px] overflow-hidden p-6 sm:p-10">
                <RealGeneratorDemo />
              </div>
            </div>
          </div>
          <div className="mt-16">
            <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-black text-2xl h-20 px-12 rounded-full shadow-2xl w-full md:w-auto" asChild>
              <Link to={ctaLink}>👉 TESTAR AGORA</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* SESSÃO 06 — AUTORIDADE */}
      <section className="py-24 bg-white overflow-hidden">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
              <div className="relative">
                <img 
                  src="/logo.png" 
                  alt="Autoridade" 
                  className="w-full max-w-md mx-auto rounded-[40px] shadow-2xl border-8 border-purple-50"
                />
                <div className="absolute -bottom-6 -right-6 bg-purple-900 text-white p-8 rounded-3xl shadow-xl hidden md:block">
                  <p className="text-3xl font-black">7+ Anos</p>
                  <p className="text-sm font-bold uppercase tracking-widest text-purple-200">De Experiência</p>
                </div>
              </div>
            </div>
            <div className="md:w-1/2 space-y-8 text-center md:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 leading-tight">Quem está por trás da tecnologia?</h2>
              <div className="space-y-6">
                <p className="text-xl md:text-2xl text-gray-700 leading-relaxed font-medium">
                  Meu nome é o desenvolvedor do Palpite Tech e dediquei os últimos anos a transformar matemática complexa em ferramentas simples para pessoas comuns.
                </p>
                <div className="space-y-4">
                  {[
                    "Mais de 50 mil linhas de código proprietário.",
                    "Focado exclusivamente em resultados estatísticos.",
                    "Comprometido com a transparência total."
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-4 justify-center md:justify-start">
                      <div className="w-3 h-3 bg-purple-900 rounded-full" />
                      <span className="text-xl font-bold text-purple-900">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SESSÃO 07 — COMPARAÇÃO */}
      <section className="py-24 bg-[#fcfcfc]">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-5xl font-black mb-16 text-gray-900">A Escolha é Sua</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-50 p-10 md:p-14 rounded-[40px] border border-red-100 text-left">
              <h3 className="text-3xl font-black mb-8 text-red-900 flex items-center gap-3">
                <X className="w-8 h-8" /> Outros sistemas
              </h3>
              <ul className="space-y-6">
                {["Complexos e difíceis de usar", "Promessas de ganhos garantidos", "Sem suporte ou ajuda real", "Dados desatualizados", "Layout confuso e poluído"].map((item, i) => (
                  <li key={i} className="text-xl font-semibold text-red-800 flex items-center gap-4 opacity-70">
                    <div className="w-2 h-2 bg-red-400 rounded-full" /> {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="bg-green-50 p-10 md:p-14 rounded-[40px] border-4 border-green-500 text-left relative overflow-hidden">
              <div className="absolute top-6 right-6 bg-green-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest animate-pulse">
                Recomendado
              </div>
              <h3 className="text-3xl font-black mb-8 text-green-900 flex items-center gap-3">
                <Check className="w-8 h-8" /> Palpite Tech
              </h3>
              <ul className="space-y-6">
                {["Simples, direto e intuitivo", "Foco em estatística real", "Suporte prioritário via WhatsApp", "Atualizado diariamente", "Visual limpo e letras grandes"].map((item, i) => (
                  <li key={i} className="text-xl font-bold text-green-900 flex items-center gap-4">
                    <Check className="w-6 h-6 text-green-600 flex-shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* SESSÃO 08 — PREÇO (OFERTA FINAL) */}
      <section className="py-24 bg-purple-950 text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),transparent_70%)]" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <div className="inline-block bg-white/10 backdrop-blur-md px-6 py-2 rounded-full text-sm font-black uppercase tracking-[0.2em] mb-8 border border-white/20">
            Oferta de Lançamento
          </div>
          <h2 className="text-4xl md:text-6xl font-black mb-12 leading-tight">
            Comece a transformar sua sorte em <span className="text-green-400 text-shadow-glow">Estratégia</span> agora mesmo
          </h2>
          
          <div className="bg-white text-black p-10 md:p-16 rounded-[50px] shadow-2xl border-b-[12px] border-purple-200">
            <div className="mb-8">
              <span className="text-2xl font-bold text-gray-400 line-through">R$ 360/mês</span>
            </div>
            <div className="mb-12">
              <span className="text-6xl md:text-8xl font-black text-purple-900">R$ 47<span className="text-3xl">/mês</span></span>
            </div>
            
            <div className="grid gap-4 max-w-md mx-auto">
              <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-black text-3xl h-24 rounded-3xl shadow-xl shadow-green-900/20 w-full group transition-all active:scale-95 flex items-center justify-center gap-3" asChild>
                <Link to={ctaLink}>
                  👉 COMPRAR AGORA
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-gray-200 text-gray-600 font-bold text-xl h-16 rounded-2xl w-full hover:bg-gray-50 transition-all flex items-center justify-center" asChild>
                <Link to={ctaLink}>👉 TESTAR POR 3 DIAS</Link>
              </Button>
            </div>
            
            <div className="mt-12 pt-8 border-t border-gray-100 flex flex-wrap justify-center gap-8 items-center grayscale opacity-60">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-6 h-6" />
                <span className="font-bold text-sm uppercase tracking-widest">Acesso Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-6 h-6 fill-current" />
                <span className="font-bold text-sm uppercase tracking-widest">50k+ Usuários</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 bg-green-500/20 text-green-400 px-8 py-4 rounded-2xl inline-flex items-center gap-3 border border-green-500/30">
            <Star className="w-5 h-5 fill-current" />
            <span className="font-bold text-lg md:text-xl">Baixo investimento para buscar 14 e 15 pontos</span>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-20 bg-white border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <Link to="/" className="inline-flex items-center gap-3 mb-12">
            <img src="/logo.png" alt="Logo" className="h-12 w-12 rounded-2xl" />
            <span className="font-black text-2xl tracking-tighter text-purple-900">Palpite Tech</span>
          </Link>
          <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-lg font-bold text-gray-400 mb-12">
            <Link to="/termos" className="hover:text-purple-900 transition-colors">Termos</Link>
            <Link to="/privacidade" className="hover:text-purple-900 transition-colors">Privacidade</Link>
            <Link to="/login" className="hover:text-purple-900 transition-colors">Entrar</Link>
          </div>
          <p className="text-gray-400 max-w-2xl mx-auto text-base leading-relaxed font-medium">
            Aviso: Este sistema é uma ferramenta de auxílio estatístico e não garante prêmios. Loterias são jogos de azar. Aposte com responsabilidade.
          </p>
        </div>
      </footer>
    </div>
  );
}
