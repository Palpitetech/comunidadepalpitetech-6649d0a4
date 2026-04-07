import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { detectEnvironment, getRedirectUrl } from "@/lib/smartLinkRedirect";
import { Loader2, ExternalLink, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SmartLinkRedirect() {
  const { slug } = useParams<{ slug: string }>();
  const [status, setStatus] = useState<"loading" | "inapp" | "fallback" | "error">("loading");
  const [originalUrl, setOriginalUrl] = useState("");
  const [groupName, setGroupName] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!slug) {
      setStatus("error");
      return;
    }

    (async () => {
      // Buscar smart link
      const { data, error } = await supabase
        .from("whatsapp_smart_links")
        .select("group_invite_code, original_url, group_name")
        .eq("slug", slug)
        .eq("is_active", true)
        .maybeSingle();

      if (error || !data) {
        setStatus("error");
        return;
      }

      setOriginalUrl(data.original_url);
      setGroupName(data.group_name ?? "");

      // Incrementar cliques (fire-and-forget)
      supabase.rpc("increment_smart_link_clicks" as any, { p_slug: slug }).then(() => {});

      const env = detectEnvironment();

      // Se está em browser interno, mostrar botão para abrir no navegador
      if (env.isInAppBrowser) {
        setStatus("inapp");
        return;
      }

      // Tentar redirecionar
      const redirectUrl = getRedirectUrl(data.group_invite_code, env);
      window.location.href = redirectUrl;

      // Fallback após 3 segundos
      setTimeout(() => {
        setStatus((prev) => (prev === "loading" ? "fallback" : prev));
      }, 3000);
    })();
  }, [slug]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(originalUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenExternal = () => {
    window.open(originalUrl, "_blank");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-sm w-full text-center space-y-6">
        {/* Logo / brand */}
        <div className="flex flex-col items-center gap-2">
          <div className="h-16 w-16 rounded-2xl bg-[#25D366] flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="h-9 w-9 text-white fill-current">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
          </div>
          {groupName && (
            <h1 className="text-lg font-semibold text-foreground">{groupName}</h1>
          )}
        </div>

        {status === "loading" && (
          <div className="space-y-3">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#25D366]" />
            <p className="text-muted-foreground text-sm">Entrando no grupo...</p>
          </div>
        )}

        {status === "inapp" && (
          <div className="space-y-4">
            <div className="bg-muted rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">
                Você está usando um navegador interno
              </p>
              <p className="text-xs text-muted-foreground">
                Para entrar no grupo, abra este link no navegador do seu celular (Safari ou Chrome).
              </p>
            </div>
            <div className="space-y-2">
              <Button onClick={handleCopy} variant="outline" className="w-full gap-2">
                {copied ? <CheckCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Link copiado!" : "Copiar link"}
              </Button>
              <Button onClick={handleOpenExternal} className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white">
                <ExternalLink className="h-4 w-4" />
                Abrir no navegador
              </Button>
            </div>
          </div>
        )}

        {status === "fallback" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Não conseguimos abrir o WhatsApp automaticamente.
            </p>
            <Button
              onClick={() => window.open(originalUrl, "_blank")}
              className="w-full gap-2 bg-[#25D366] hover:bg-[#1da851] text-white h-12 text-base font-semibold"
            >
              <ExternalLink className="h-5 w-5" />
              Entrar no Grupo
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-3">
            <p className="text-destructive font-medium">Link não encontrado ou inativo.</p>
            <p className="text-xs text-muted-foreground">
              Verifique se o link está correto ou entre em contato com o administrador.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
