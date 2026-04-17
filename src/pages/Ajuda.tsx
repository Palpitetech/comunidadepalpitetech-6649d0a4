import { MainLayout } from "@/components/layout/MainLayout";
import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";

const Ajuda = () => {
  const { data: articles, isLoading } = useQuery({
    queryKey: ["help-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("help_content")
        .select("slug, title, main_question")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HelpPage",
    "description": "Central de Ajuda do Palpite Tech. Encontre tutoriais e análises sobre ferramentas lotéricas.",
    "publisher": {
      "@type": "Organization",
      "name": "Palpite Tech"
    }
  };

  return (
    <MainLayout 
      hideBackButton={true}
      hideBottomNav={true}
    >
      <Helmet>
        <title>Central de Ajuda | Palpite Tech</title>
        <meta name="description" content="Tudo o que você precisa saber sobre o Palpite Tech. Tutoriais, confiabilidade e dicas de uso." />
        <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
      </Helmet>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <article className="prose prose-slate dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Central de Ajuda</h1>
          
          <p className="text-lg text-muted-foreground leading-relaxed mb-10">
            Bem-vindo à nossa Central de Ajuda. Aqui você encontrará todas as informações necessárias para extrair o máximo potencial das nossas ferramentas de análise estatística.
          </p>

          <h2 className="text-2xl font-semibold mb-6">Artigos em Destaque</h2>
          
          <div className="grid gap-6 not-prose">
            {isLoading ? (
              <>
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-32 w-full rounded-lg" />
              </>
            ) : (
              articles?.map((article) => (
                <Link 
                  key={article.slug}
                  to={`/ajuda/${article.slug}`}
                  className="block bg-card p-6 rounded-lg border border-border hover:border-primary/50 transition-colors"
                >
                  <h3 className="text-xl font-bold text-foreground mb-2">{article.title}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {article.main_question}
                  </p>
                  <span className="text-primary text-sm font-medium mt-4 inline-block">
                    Ler artigo completo →
                  </span>
                </Link>
              ))
            )}
          </div>

          <h2 className="text-2xl font-semibold mt-12 mb-4">Contato e Suporte</h2>
          <p>
            Se você não encontrou o que procurava, nossa equipe de suporte está à disposição para ajudar através do nosso chat oficial ou redes sociais.
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
