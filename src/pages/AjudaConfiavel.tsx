import { MainLayout } from "@/components/layout/MainLayout";
import { useEffect } from "react";

const AjudaConfiavel = () => {
  useEffect(() => {
    const title = "Palpite Tech é confiável? Teste real, análise e resultados";
    const description = "Descubra se o Palpite Tech é confiável. Veja análise completa, como funciona, se realmente vale a pena e resultados reais.";
    const url = window.location.href;
    const imageUrl = "https://www.palpitetech.com.br/logo.png";

    document.title = title;
    
    const setMetaTag = (name: string, content: string, property = false) => {
      const attr = property ? "property" : "name";
      let element = document.querySelector(`meta[${attr}="${name}"]`);
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    setMetaTag("description", description);
    setMetaTag("og:type", "article", true);
    setMetaTag("og:url", url, true);
    setMetaTag("og:title", title, true);
    setMetaTag("og:description", description, true);
    setMetaTag("og:image", imageUrl, true);
    setMetaTag("twitter:card", "summary_large_image");
    setMetaTag("twitter:url", url);
    setMetaTag("twitter:title", title);
    setMetaTag("twitter:description", description);
    setMetaTag("twitter:image", imageUrl);

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);

    const structuredData = [
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "Palpite Tech é confiável?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sim, o Palpite Tech é confiável, pois é uma plataforma que oferece palpites para loterias com base em análises e estratégias, além de disponibilizar teste gratuito e transparência. No entanto, não garante resultados, já que jogos de loteria dependem de sorte."
            }
          },
          {
            "@type": "Question",
            "name": "Palpite Tech funciona mesmo?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "O Palpite Tech funciona gerando palpites com base em análise estatística e estratégias, mas como qualquer jogo de loteria, depende da sorte."
            }
          },
          {
            "@type": "Question",
            "name": "Palpite Tech é seguro?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Sim, o Palpite Tech é seguro, pois oferece acesso transparente, teste gratuito e não exige cartão para começar."
            }
          }
        ]
      },
      {
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "description": description,
        "image": imageUrl,
        "author": {
          "@type": "Person",
          "name": "Equipe Palpite Tech"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Palpite Tech",
          "logo": {
            "@type": "ImageObject",
            "url": "https://www.palpitetech.com.br/logo.png"
          }
        },
        "datePublished": "2024-01-01",
        "dateModified": new Date().toISOString().split('T')[0]
      }
    ];

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "json-ld-seo";
    script.innerHTML = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const existingScript = document.getElementById("json-ld-seo");
      if (existingScript) {
        document.head.removeChild(existingScript);
      }
    };
  }, []);

  return (
    <MainLayout 
      hideBackButton={false}
      hideBottomNav={true}
      pageTitle="Palpite Tech é confiável?"
      breadcrumb={[
        { label: "Ajuda", onClick: () => window.location.href = "/ajuda" },
        { label: "Palpite Tech é Confiável?" }
      ]}
    >
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <header className="mb-8 border-b pb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground leading-tight">
              Palpite Tech é confiável? Teste real, análise e resultados
            </h1>
            <p className="text-sm text-muted-foreground italic mb-6">
              <em>Última atualização: Abril de 2026 — análise baseada em testes reais da plataforma.</em>
            </p>
          </header>

          <section id="snippet-answer" className="mb-8 border-b pb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Palpite Tech é confiável?</h2>
            <p className="text-lg leading-relaxed text-foreground">
              <strong>Sim, o Palpite Tech é confiável</strong>, pois é uma plataforma que oferece palpites para loterias com base em análises e estratégias, além de disponibilizar teste gratuito e transparência. No entanto, não garante resultados, já que jogos de loteria dependem de sorte.
            </p>
          </section>

          <section id="snippet-list" className="mb-8 bg-muted/30 p-6 rounded-xl border border-border">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Palpite Tech funciona mesmo?</h2>
            <ol className="list-decimal pl-6 space-y-2 text-foreground">
              <li>Gera palpites com base em análise</li>
              <li>Mostra estratégias utilizadas</li>
              <li>Oferece conteúdo diário</li>
              <li>Permite teste grátis</li>
            </ol>
          </section>

          <section id="snippet-definition" className="mb-8 border-b pb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">O que é o Palpite Tech?</h2>
            <p className="text-lg leading-relaxed text-foreground">
              O Palpite Tech é um sistema que gera palpites para loterias com base em análises estatísticas e estratégias, ajudando apostadores a montar jogos de forma mais estruturada e menos aleatória.
            </p>
          </section>

          <section id="snippet-comparison" className="mb-8 border-b pb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Palpite Tech é melhor que outros geradores de palpites?</h2>
            <p className="text-lg leading-relaxed text-foreground">
              O Palpite Tech se destaca por oferecer estratégias explicadas, teste gratuito e maior transparência, enquanto muitos geradores de palpites entregam apenas números aleatórios sem análise.
            </p>
          </section>

          <section id="faq-seo" className="mb-8 border-b pb-8">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Perguntas frequentes sobre o Palpite Tech</h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Palpite Tech é seguro?</h3>
                <p className="text-foreground leading-relaxed">Sim, o Palpite Tech é seguro, pois oferece acesso transparente, teste gratuito e não exige cartão para começar.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Palpite Tech tem garantia de ganho?</h3>
                <p className="text-foreground leading-relaxed">Não, o Palpite Tech não garante ganhos, pois loterias dependem de sorte e probabilidades.</p>
              </div>

              <div>
                <h3 className="text-xl font-bold mb-2 text-foreground">Palpite Tech vale a pena para iniciantes?</h3>
                <p className="text-foreground leading-relaxed">Sim, principalmente para iniciantes que desejam apostar com mais estratégia e menos aleatoriedade.</p>
              </div>
            </div>
          </section>

          <section id="authority-boost" className="mb-8 bg-primary/5 p-6 rounded-xl border border-primary/10">
            <h2 className="text-2xl font-bold mb-4 text-foreground">Por que confiar no Palpite Tech?</h2>
            <ul className="list-disc pl-6 space-y-2 text-foreground font-medium">
              <li>Baseado em análises e estratégias</li>
              <li>Transparência no funcionamento</li>
              <li>Teste gratuito disponível</li>
              <li>Conteúdo explicativo diário</li>
            </ul>
          </section>

          <div className="mt-12 text-muted-foreground">
            <p className="lead text-lg mb-6">
              Se você está pesquisando se o <strong>Palpite Tech é confiável</strong>, provavelmente já viu anúncios e ficou na dúvida se realmente funciona ou se é apenas mais uma promessa no mercado de loterias.
            </p>

            <div className="my-8 aspect-video w-full max-w-2xl mx-auto overflow-hidden rounded-xl shadow-lg bg-muted">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/V4a0CXAZUd4?si=Gzy4_o-LGP01djW8&amp;start=4" 
                title="Palpite Tech é Confiável? Análise Completa" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
              ></iframe>
            </div>

            <h2 className="text-2xl font-semibold mt-10 mb-4 text-foreground">Quem criou o Palpite Tech?</h2>
            <p>
              O projeto foi desenvolvido por <strong>Augusto Honorato</strong>, um especialista que atua no mercado de loterias desde os 18 anos. Ele traz sua experiência prática de premiações reais para o sistema.
            </p>
          </div>
        </article>
        
        <p style={{ display: 'none' }}>
          palpite tech é confiável, palpite tech funciona mesmo, palpite tech vale a pena, sistema de palpites loteria funciona, gerador de palpites confiável
        </p>
      </div>
    </MainLayout>
  );
};

export default AjudaConfiavel;
