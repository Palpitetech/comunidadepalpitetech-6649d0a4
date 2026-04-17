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

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          {/* 2.1 H1 único */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-foreground">
            {title}
          </h1>

          {/* 2.2 Data de atualização */}
          <p className="text-sm text-muted-foreground mt-0 mb-8">
            <em>Última atualização: {formattedDate} — conteúdo baseado em análise e testes reais.</em>
          </p>

          {/* SEO Snippet Logic: Sempre presente, variando apenas ordem e destaque visual para consistência de padrão (SEO Governance) */}
          
          {/* Renderização baseada em Intenção com Ordem Controlada */}
          {intent === 'analytical' ? (
            <>
              {/* Analítica: Conteúdo topo (interpretação), Snippet reforço (padrão mantido) */}
              <div 
                className="mb-10 help-content-body border-l-2 border-primary/10 pl-4 md:pl-6 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: finalBodyContent }}
              />
              {renderSnippet('technical')}
            </>
          ) : intent === 'data' ? (
            <>
              {/* Dados: Snippet topo (foco em números), Conteúdo abaixo */}
              {renderSnippet('prominent')}
              <div 
                className="mb-10 help-content-body opacity-95 text-sm md:text-base"
                dangerouslySetInnerHTML={{ __html: finalBodyContent }}
              />
            </>
          ) : (
            <>
              {/* Padrão (Informacional/Comercial): Snippet topo para Featured Snippet */}
              {renderSnippet(intent === 'commercial' ? 'prominent' : 'standard')}
              <div 
                className="mb-10 help-content-body"
                dangerouslySetInnerHTML={{ __html: finalBodyContent }}
              />
            </>
          )}

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

          {/* 2.7 Bloco de autoridade (E-E-A-T) */}
          <section id="authority-boost" className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-10">
            <h2 className="text-xl font-bold mt-0 mb-4">Por que confiar neste conteúdo?</h2>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                {author_name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-foreground m-0">{author_name}</p>
                <p className="text-xs text-muted-foreground m-0">
                  {author_experience || "Especialista em Análise de Dados e Sistemas de Loteria"}
                </p>
              </div>
            </div>
            
            {review_method && (
              <div className="mb-4 text-sm bg-background/50 p-3 rounded border border-border/50 italic">
                <strong>Método de revisão:</strong> {review_method}
              </div>
            )}

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Baseado em análise e testes reais
              </li>
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Conteúdo revisado regularmente
              </li>
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Transparência total nos processos
              </li>
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Sem promessas de ganhos garantidos
              </li>
            </ul>
          </section>
        </article>
      </div>
    </MainLayout>
  );
};
