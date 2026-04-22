import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Página pública /gerar-novo-pix/:slug
 *
 * Recebe um slug de plano (grupo-vip-lotofacil, mensal, anual, ...),
 * busca o checkout_link em `plans` e redireciona o usuário.
 *
 * Funciona como link mascarado em mensagens transacionais (PIX gerado),
 * para que o usuário veja o domínio palpitetech.com.br antes de ir ao Kirvano.
 */
export default function GerarNovoPix() {
  const { slug } = useParams<{ slug: string }>();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!slug) {
        setError("Link inválido.");
        return;
      }

      const { data, error: dbError } = await supabase
        .from("plans")
        .select("checkout_link, name")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (cancelled) return;

      if (dbError || !data?.checkout_link) {
        setError(
          data && !data.checkout_link
            ? `O plano "${data.name}" não possui link de pagamento configurado.`
            : "Não encontramos esse link de pagamento.",
        );
        return;
      }

      // Pequeno delay para o usuário enxergar o domínio palpitetech.com.br carregando
      setTimeout(() => {
        if (!cancelled) {
          window.location.replace(data.checkout_link as string);
        }
      }, 900);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {error ? (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-7 h-7 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Link indisponível</h1>
              <p className="text-muted-foreground">{error}</p>
            </div>
            <Link
              to="/planos"
              className="inline-flex items-center justify-center px-5 py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
            >
              Ver planos disponíveis
            </Link>
          </>
        ) : (
          <>
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Redirecionando…</h1>
              <p className="text-muted-foreground">
                Estamos te levando para o pagamento seguro via Kirvano.
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>palpitetech.com.br</span>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
