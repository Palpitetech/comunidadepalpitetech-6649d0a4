import { MainLayout } from "@/components/layout/MainLayout";
import { useEffect } from "react";

const Ajuda = () => {
  useEffect(() => {
    document.title = "Ajuda e Suporte | Palpite Tech";
    
    // Structured Data (JSON-LD) for SEO
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "HelpPage",
      "mainEntity": {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Como utilizar o Palpite Tech?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "O Palpite Tech é uma plataforma de análise estatística para loterias. Você pode utilizar nossas ferramentas de tendências, gerador de jogos e desdobramentos para melhorar suas estratégias de aposta."
            }
          },
          {
            "@type": "Question",
            "name": "Os palpites são garantidos?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Não garantimos premiações. Nossas ferramentas são baseadas em estatísticas e probabilidades matemáticas para auxiliar nas escolhas, mas as loterias são jogos de azar."
            }
          }
        ]
      },
      "description": "Página de ajuda e suporte do Palpite Tech. Encontre tutoriais e respostas para suas dúvidas sobre nossas ferramentas de análise lotérica.",
      "publisher": {
        "@type": "Organization",
        "name": "Palpite Tech",
        "logo": {
          "@type": "ImageObject",
          "url": "https://palpitetech.com.br/logo.png"
        }
      }
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return (
    <MainLayout 
      hideBackButton={true}
      youtubeVideoId="dQw4w9WgXcQ" // ID do vídeo de exemplo (Rickroll) - substitua pelo real
      hideBottomNav={true}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Content Section */}
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Central de Ajuda</h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed">
            Bem-vindo à nossa Central de Ajuda. Aqui você encontrará todas as informações necessárias para extrair o máximo potencial das nossas ferramentas de análise estatística.
          </p>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Primeiros Passos</h2>
          <p>
            Para começar a usar o Palpite Tech, navegue pelo menu lateral para acessar as diferentes loterias disponíveis. Cada modalidade possui suas próprias ferramentas de análise:
          </p>
          <ul>
            <li><strong>Tendências:</strong> Visualize quais números estão saindo com mais frequência.</li>
            <li><strong>Gerador:</strong> Crie jogos baseados em filtros estatísticos avançados.</li>
            <li><strong>Desdobramentos:</strong> Aumente suas chances com coberturas matemáticas inteligentes.</li>
          </ul>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Dúvidas Frequentes</h2>
          <div className="space-y-6 not-prose">
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">Como funcionam os desdobramentos?</h3>
              <p className="text-muted-foreground">
                Os desdobramentos permitem que você jogue com mais dezenas, garantindo prêmios menores caso as condições escolhidas sejam atendidas, otimizando seu investimento.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">O site é seguro?</h3>
              <p className="text-muted-foreground">
                Sim, utilizamos criptografia de ponta a ponta e não armazenamos dados de pagamento sensíveis em nossos servidores.
              </p>
            </div>
            <div className="bg-card p-6 rounded-lg border border-border">
              <h3 className="text-lg font-bold text-foreground mb-2">O Palpite Tech é confiável?</h3>
              <p className="text-muted-foreground mb-4">
                Sim, o Palpite Tech é confiável por oferecer transparência, teste gratuito e estratégias fundamentadas. No entanto, não há garantia de ganhos em loterias.
              </p>
              <a 
                href="/ajuda/palpite-tech-e-confiavel" 
                className="text-primary hover:underline font-medium inline-flex items-center gap-1"
              >
                Ler análise completa →
              </a>
            </div>
          </div>

          <h2 className="text-2xl font-semibold mt-10 mb-4">Contato e Suporte</h2>
          <p>
            Se você não encontrou o que procurava, nossa equipe de suporte está à disposição para ajudar. Você pode entrar em contato conosco através do nosso chat oficial ou pelas nossas redes sociais.
          </p>
          
          <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10">
            <p className="text-sm italic text-muted-foreground text-center">
              "Nossa missão é transformar dados complexos em estratégias simples para você."
            </p>
          </div>
        </article>
      </div>
    </MainLayout>
  );
};

export default Ajuda;
