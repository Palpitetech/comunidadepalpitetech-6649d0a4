import { Helmet } from "react-helmet-async";
import { MainLayout } from "@/components/layout/MainLayout";

export interface AjudaContent {
  slug: string;
  title: string;
  meta_title?: string;
  meta_description?: string;
  updated_at: string;
  main_question: string;
  direct_answer: string;
  content: string;
  intent?: 'informational' | 'analytical' | 'commercial' | 'data'; // SEO Intention: informational (o que é), analytical (interpretação), commercial (autoridade), data (fatos/números)
  faq_items: {
    question: string;
    answer: string;
  }[];
  author_name?: string;
  author_experience?: string;
  review_method?: string;
}

interface AjudaTemplateProps {
  content: AjudaContent;
}

export const AjudaTemplate = ({ content }: AjudaTemplateProps) => {
  const {
    title,
    meta_title,
    meta_description,
    updated_at,
    main_question,
    direct_answer,
    intent = 'informational', // Default to informational
    content: bodyContent,
    faq_items,
    author_name = "Equipe de Suporte",
    author_experience,
    review_method,
  } = content;

  // Formatar data
  const date = new Date(updated_at);
  const formattedDate = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Generate Structured Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq_items.map((item) => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer,
      },
    })),
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": title,
    "dateModified": updated_at,
    "author": {
      "@type": "Organization",
      "name": "Palpite Tech",
    },
    "publisher": {
      "@type": "Organization",
      "name": "Palpite Tech",
    }
  };

  // 5. LINKAGEM AUTOMÁTICA COM CONTEXTO SEMÂNTICO (REVISADA)
  const enrichContentWithLinks = (html: string) => {
    // Whitelist controlada de links internos com contexto semântico exigido
    const internalLinks = [
      { 
        keyword: "confiável", 
        slug: "palpite-tech-e-confiavel", 
        isPillar: true,
        contexts: ["avaliação", "segurança", "reputação", "confiança", "testamos", "análise"]
      },
      { 
        keyword: "resultado lotofácil", 
        slug: "lotofacil-resultado", 
        isPillar: true,
        contexts: ["concurso", "sorteio", "números", "premiação", "ganhadores"]
      },
      { 
        keyword: "estratégias", 
        slug: "estratefias-vencedoras",
        contexts: ["jogar", "aposta", "vencer", "dicas", "técnica"]
      },
      { 
        keyword: "fechamento", 
        slug: "como-funciona-fechamento", 
        isPillar: true,
        contexts: ["matemática", "redução", "garantia", "bilhetes", "jogos"]
      },
      { 
        keyword: "como funciona", 
        slug: "como-usar-o-sistema",
        contexts: ["tutorial", "passo a passo", "explicando", "guia", "iniciar"]
      }
    ];

    const MAX_LINKS_PER_PAGE = 5;
    let globalLinkCount = 0;
    
    // Separar por blocos (parágrafos) para análise de contexto
    const blocks = html.split(/<\/?p>/g);
    const linkedSlugs = new Set<string>();

    const processedBlocks = blocks.map(block => {
      if (!block.trim() || globalLinkCount >= MAX_LINKS_PER_PAGE) return block;

      let enrichedBlock = block;

      internalLinks.forEach(({ keyword, slug: linkSlug, contexts, isPillar }) => {
        if (globalLinkCount >= MAX_LINKS_PER_PAGE) return;
        if (linkedSlugs.has(linkSlug)) return; // 1 link por slug por página
        if (linkSlug === content.slug) return; // Não linkar para si mesmo

        // 1. Verificar se a keyword existe no bloco
        const keywordRegex = new RegExp(`(?<!<a[^>]*>)\\b(${keyword})\\b(?![^<]*</a>)`, 'i');
        if (!keywordRegex.test(enrichedBlock)) return;

        // 2. Validação Semântica (Layer 1): Verificar contexto exigido no MESMO bloco
        const contextMatches = contexts.filter(ctx => 
          new RegExp(`\\b${ctx}\\b`, 'i').test(enrichedBlock)
        );
        const hasContext = contextMatches.length > 0;
        
        // Calcular Score de Relevância (0 a 1)
        const relevanceScore = contexts.length > 0 ? contextMatches.length / contexts.length : 0;

        // 3. Fallback Controlado (Layer 2): Só linka se tiver contexto forte OU for Pillar com relevância mínima (> 0.3)
        // Isso evita "link injection" sem sentido semântico
        if (hasContext || (isPillar && relevanceScore > 0.3)) {
          enrichedBlock = enrichedBlock.replace(keywordRegex, (match) => {
            globalLinkCount++;
            linkedSlugs.add(linkSlug);
            return `<a href="/ajuda/${linkSlug}" class="text-primary hover:underline font-medium">${match}</a>`;
          });
        }
      });

      return enrichedBlock;
    });

    // Reconstruir o HTML mantendo os parágrafos se eles existiam (simplificado)
    return html.includes('<p>') 
      ? processedBlocks.map(b => b.trim() ? `<p>${b}</p>` : '').join('')
      : processedBlocks.join('');
  };

  const finalBodyContent = enrichContentWithLinks(bodyContent);

  // Helper para renderizar o Snippet de Resposta Direta (Padrão Google)
  const renderSnippet = (variant: 'standard' | 'prominent' | 'technical' = 'standard') => {
    const styles = {
      standard: "bg-primary/5 p-6 rounded-xl border border-primary/20 mb-10 shadow-sm",
      prominent: "bg-primary/10 p-8 rounded-xl border-2 border-primary/30 mb-10 shadow-md",
      technical: "bg-primary/5 p-6 rounded-xl border border-primary/20 mb-10 shadow-sm opacity-90 border-l-4"
    };
    
    return (
      <section id="resposta-direta" className={styles[variant]} data-intent={intent}>
        <h2 className="text-xl font-bold mt-0 mb-4 flex items-center gap-2 text-foreground">
          <span className={`w-2 h-6 rounded-full ${variant === 'prominent' ? 'bg-primary' : 'bg-primary/30'}`} />
          {main_question}
        </h2>
        <div className={`${variant === 'prominent' ? 'text-xl font-extrabold' : 'text-lg font-medium'} leading-relaxed text-foreground`}>
          {direct_answer}
        </div>
      </section>
    );
  };

  return (
    <MainLayout hideBottomNav={true}>
      <Helmet>
        <title>{meta_title || `${title} | Palpite Tech`}</title>
        {meta_description && <meta name="description" content={meta_description} />}
        <link rel="canonical" href={`https://palpitetech.com.br/ajuda/${content.slug}`} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-10 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          {/* 2.1 H1 único - Clear semantic focus */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 text-foreground leading-tight">
            {title}
          </h1>
          
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1 bg-border" />
            <p className="text-sm text-muted-foreground m-0 whitespace-nowrap">
              <em>Atualizado em {formattedDate}</em>
            </p>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* 2.3 Resposta direta (snippet) - Obligatory for /ajuda/* */}
          {renderSnippet(intent === 'commercial' ? 'prominent' : intent === 'analytical' ? 'technical' : 'standard')}

          {/* 2.4 Conteúdo principal (ou análise, dependendo da intent) */}
          <div 
            className={`mb-10 help-content-body ${intent === 'analytical' ? 'border-l-2 border-primary/10 pl-4 md:pl-6 leading-relaxed' : ''} ${intent === 'data' ? 'opacity-95 text-sm md:text-base' : ''}`}
            dangerouslySetInnerHTML={{ __html: finalBodyContent }}
          />

          {/* 2.5 🎥 VÍDEO (apoio explicativo) */}
          <section id="video-explicativo" className="mb-10">
            <div className="aspect-video w-full rounded-xl overflow-hidden border border-border shadow-sm">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/V4a0CXAZUd4?si=Gzy4_o-LGP01djW8&amp;start=4" 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              ></iframe>
            </div>
          </section>

          {/* 2.6 FAQ visível (obrigatório) */}
          <section id="faq-seo" className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">Perguntas frequentes</h2>
            <div className="space-y-8">
              {faq_items.map((item, index) => (
                <div key={index} className="border-b border-border pb-6 last:border-0">
                  <h3 className="text-lg font-bold text-foreground mb-3 m-0">
                    {item.question}
                  </h3>
                  <p className="text-muted-foreground m-0">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* 2.7 Bloco de autoridade (E-E-A-T) - Micro variation background */}
          <section id="authority-boost" className="bg-primary/[0.03] dark:bg-slate-900/50 p-8 rounded-2xl border border-primary/10 mb-12 shadow-sm">
            <h2 className="text-xl font-bold mt-0 mb-6 flex items-center gap-2">
              <div className="w-1.5 h-6 bg-primary rounded-full" />
              Por que confiar neste conteúdo?
            </h2>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-xl shadow-inner">
                {author_name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-foreground m-0 text-lg">{author_name}</p>
                <p className="text-sm text-muted-foreground m-0">
                  {author_experience || "Especialista em Análise de Dados e Sistemas de Loteria"}
                </p>
              </div>
            </div>
            
            {review_method && (
              <div className="mb-6 text-sm bg-white/50 dark:bg-background/50 p-4 rounded-xl border border-border/50 italic leading-relaxed shadow-sm">
                <strong>Método de revisão:</strong> {review_method}
              </div>
            )}

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none p-0 m-0">
              <li className="flex items-start gap-3 text-sm m-0">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span>Baseado em análise e testes reais</span>
              </li>
              <li className="flex items-start gap-3 text-sm m-0">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span>Conteúdo revisado regularmente</span>
              </li>
              <li className="flex items-start gap-3 text-sm m-0">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span>Transparência total nos processos</span>
              </li>
              <li className="flex items-start gap-3 text-sm m-0">
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                </div>
                <span>Sem promessas de ganhos garantidos</span>
              </li>
            </ul>
          </section>
        </article>
      </div>
    </MainLayout>
  );
};
