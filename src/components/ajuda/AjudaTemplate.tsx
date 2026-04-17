import { Helmet } from "react-helmet-async";
import { MainLayout } from "@/components/layout/MainLayout";

export interface AjudaContent {
  slug: string;
  title: string;
  lastUpdate: string;
  mainKeyword: string;
  snippetAnswer: {
    question: string;
    answer: string; // 40-60 words
  };
  snippetList: {
    title: string;
    items: string[];
  };
  snippetDefinition: {
    topic: string;
    definition: string; // 40-60 words
  };
  snippetComparison?: {
    question: string;
    content: string;
  };
  quickSummary: {
    pros: string[];
    limitation: string;
  };
  faq: {
    question: string;
    answer: string;
  }[];
  hiddenKeywords: string[];
}

interface AjudaTemplateProps {
  content: AjudaContent;
}

export const AjudaTemplate = ({ content }: AjudaTemplateProps) => {
  const {
    title,
    lastUpdate,
    snippetAnswer,
    snippetList,
    snippetDefinition,
    snippetComparison,
    quickSummary,
    faq,
    hiddenKeywords,
  } = content;

  // Generate Structured Data
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faq.map((item) => ({
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
    "dateModified": lastUpdate,
    "author": {
      "@type": "Organization",
      "name": "Palpite Tech",
    },
  };

  return (
    <MainLayout hideBottomNav={true}>
      <Helmet>
        <title>{title} | Palpite Tech</title>
        <link rel="canonical" href={`https://palpitetech.com.br/ajuda/${content.slug}`} />
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          {/* 1. H1 */}
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-foreground">
            {title}
          </h1>

          {/* 2. Data de atualização */}
          <p className="text-sm text-muted-foreground mt-0 mb-8">
            <em>Última atualização: {lastUpdate} — análise baseada em informações e testes reais.</em>
          </p>

          {/* 3. SNIPPET PRINCIPAL */}
          <section id="snippet-answer" className="bg-primary/5 p-6 rounded-xl border border-primary/20 mb-10">
            <h2 className="text-xl font-bold mt-0 mb-4">{snippetAnswer.question}</h2>
            <p className="text-lg leading-relaxed font-medium">
              <strong>{snippetAnswer.answer}</strong>
            </p>
          </section>

          {/* 4. SNIPPET LISTA */}
          <section id="snippet-list" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">{snippetList.title}</h2>
            <ol className="space-y-2">
              {snippetList.items.map((item, index) => (
                <li key={index} className="pl-2">{item}</li>
              ))}
            </ol>
          </section>

          {/* 5. SNIPPET DEFINIÇÃO */}
          <section id="snippet-definition" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4">O que é {snippetDefinition.topic}?</h2>
            <p className="leading-relaxed">{snippetDefinition.definition}</p>
          </section>

          {/* 6. SNIPPET COMPARAÇÃO */}
          {snippetComparison && (
            <section id="snippet-comparison" className="mb-10">
              <h2 className="text-2xl font-semibold mb-4">{snippetComparison.question}</h2>
              <p className="leading-relaxed">{snippetComparison.content}</p>
            </section>
          )}

          {/* 7. RESUMO RÁPIDO */}
          <section id="quick-summary" className="bg-card p-6 rounded-xl border border-border mb-10">
            <h2 className="text-2xl font-semibold mt-0 mb-4">Resumo rápido</h2>
            <ul className="list-none p-0 space-y-3">
              {quickSummary.pros.map((pro, index) => (
                <li key={index} className="flex items-start gap-2 m-0">
                  <span className="text-green-500 font-bold">✔</span>
                  <span>{pro}</span>
                </li>
              ))}
              <li className="flex items-start gap-2 m-0">
                <span className="text-red-500 font-bold">❗</span>
                <span>{quickSummary.limitation}</span>
              </li>
            </ul>
          </section>

          {/* 8. FAQ VISÍVEL */}
          <section id="faq-seo" className="mb-10">
            <h2 className="text-2xl font-semibold mb-6">Perguntas frequentes</h2>
            <div className="space-y-8">
              {faq.map((item, index) => (
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

          {/* 9. BLOCO DE AUTORIDADE */}
          <section id="authority-boost" className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800 mb-10">
            <h2 className="text-xl font-bold mt-0 mb-4">Por que confiar neste conteúdo?</h2>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 list-none p-0">
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Baseado em análise e testes
              </li>
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Conteúdo atualizado regularmente
              </li>
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Explicações transparentes
              </li>
              <li className="flex items-center gap-2 text-sm m-0">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                Sem promessas de resultado garantido
              </li>
            </ul>
          </section>

          {/* 10. KEYWORDS SEMANTICAMENTE OCULTAS */}
          <div 
            style={{ opacity: 0.01, height: 0, overflow: "hidden" }}
            aria-hidden="true"
          >
            {hiddenKeywords.join(", ")}
          </div>
        </article>
      </div>
    </MainLayout>
  );
};
