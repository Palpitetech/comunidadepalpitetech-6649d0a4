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

  // 5. LINKAGEM AUTOMÁTICA INTELIGENTE
  const enrichContentWithLinks = (html: string) => {
    const internalLinks = [
      { keyword: "confiável", slug: "palpite-tech-e-confiavel" },
      { keyword: "resultado lotofácil", slug: "lotofacil-resultado" },
      { keyword: "estratégias", slug: "estratefias-vencedoras" },
      { keyword: "fechamento", slug: "como-funciona-fechamento" },
      { keyword: "como funciona", slug: "como-usar-o-sistema" }
    ];

    let enrichedHtml = html;
    internalLinks.forEach(({ keyword, slug: linkSlug }) => {
      // Don't link if it's already inside an <a> tag
      const regex = new RegExp(`(?<!<a[^>]*>)\\b(${keyword})\\b(?![^<]*</a>)`, 'gi');
      // Only replace first 2 occurrences to avoid over-linking
      let count = 0;
      enrichedHtml = enrichedHtml.replace(regex, (match) => {
        if (count < 2 && linkSlug !== content.slug) {
          count++;
          return `<a href="/ajuda/${linkSlug}" class="text-primary hover:underline font-medium">${match}</a>`;
        }
        return match;
      });
    });
    return enrichedHtml;
  };

  const finalBodyContent = enrichContentWithLinks(bodyContent);

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

          {/* Variação Estrutural Controlada: Ordem das seções pode variar */}
          {content.slug.length % 2 === 0 ? (
            <>
              {/* Ordem Padrão */}
              <section id="snippet-answer" className="bg-primary/5 p-6 rounded-xl border border-primary/20 mb-10">
                <h2 className="text-xl font-bold mt-0 mb-4">{main_question}</h2>
                <p className="text-lg leading-relaxed font-medium">
                  <strong>{direct_answer}</strong>
                </p>
              </section>

              <div 
                className="mb-10 help-content-body"
                dangerouslySetInnerHTML={{ __html: finalBodyContent }}
              />
            </>
          ) : (
            <>
              {/* Ordem Invertida (Variação para SEO) */}
              <div 
                className="mb-10 help-content-body"
                dangerouslySetInnerHTML={{ __html: finalBodyContent }}
              />

              <section id="snippet-answer" className="bg-primary/5 p-6 rounded-xl border border-primary/20 mb-10">
                <h2 className="text-xl font-bold mt-0 mb-4">{main_question}</h2>
                <p className="text-lg leading-relaxed font-medium">
                  <strong>{direct_answer}</strong>
                </p>
              </section>
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
