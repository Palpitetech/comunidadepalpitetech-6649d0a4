import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, ArrowLeft, Phone, Mail, MessageCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { RegisterWizard } from "./RegisterWizard";

type Etapa = "identificar" | "senha" | "cadastro";

function normalizeIdentifier(input: string) {
  const raw = input.trim();
  const isEmail = raw.includes("@");
  if (isEmail) {
    return {
      raw,
      tipo: "email" as const,
      email: raw.toLowerCase(),
      celular: null as string | null,
    };
  }
  const digits = raw.replace(/\D/g, "");
  return {
    raw,
    tipo: "celular" as const,
    email: null as string | null,
    celular: digits,
  };
}

export function LoginWizard() {
  const [etapa, setEtapa] = useState<Etapa>("identificar");
  const [identificador, setIdentificador] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedEmail, setResolvedEmail] = useState<string | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuthContext();

  const normalized = useMemo(() => normalizeIdentifier(identificador), [identificador]);
  const Icon = normalized.tipo === "email" ? Mail : Phone;

  const supportWhatsApp = "https://wa.me/5516997175392";

  const handleIdentificar = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = identificador.trim();
    if (!input) return;

    if (normalized.tipo === "celular") {
      const d = normalized.celular || "";
      const isShort = d.length < 10;
      const ok = d.length === 10 || d.length === 11 || (d.length >= 12 && d.startsWith("55"));
      
      if (isShort) {
        toast({
          title: "O telefone parece curto",
          description: "Lembre-se de colocar o DDD (Ex: 11 99999-9999)",
          variant: "destructive",
        });
        return;
      }
      
      if (!ok) {
        toast({
          title: "Verifique o número",
          description: "O telefone não está no formato esperado. Ex: (16) 99999-9999",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("identificar_conta", {
        p_identificador: input,
      });
      if (error) throw error;

      const result = data as any;
      if (result?.error) {
        toast({ title: "Erro", description: result.error, variant: "destructive" });
        return;
      }

      if (result?.exists) {
        if (!result?.email) {
          toast({
            title: "Conta encontrada",
            description:
              "Precisamos do seu e-mail para entrar. Se precisar, chame o suporte.",
            variant: "destructive",
          });
          return;
        }
        setResolvedEmail(String(result.email));
        setEtapa("senha");
        return;
      }

      setEtapa("cadastro");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível continuar";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEntrar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvedEmail) return;
    if (!senha.trim()) return;

    setIsLoading(true);
    try {
      await signIn(resolvedEmail, senha);
      toast({ title: "Bem-vindo!", description: "Login realizado com sucesso." });
      navigate("/home", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "E-mail/telefone ou senha inválidos";
      toast({ title: "Não foi possível entrar", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  /* ─── Cadastro fullscreen no mobile ─── */
  if (etapa === "cadastro") {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col md:static md:z-auto md:bg-transparent md:block">
        {/* Header com voltar */}
        <div className="flex items-center gap-2 px-3 py-2 md:px-5 md:pt-5 shrink-0 border-b md:border-none bg-background">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setEtapa("identificar")}
            className="h-9 text-sm md:h-12 md:text-senior-base"
          >
            <ArrowLeft className="h-4 w-4 mr-1 md:h-5 md:w-5 md:mr-2" />
            Voltar
          </Button>
          <span className="text-xs text-muted-foreground md:hidden">Criar conta</span>
        </div>

        {/* Mensagem + RegisterWizard */}
        <div className="flex flex-col flex-1 min-h-0 md:px-6 md:pb-6">
          <p className="text-xs md:text-senior-base text-muted-foreground px-4 py-2 md:mb-4 shrink-0">
            Ainda não existe conta com esse contato. Vamos criar uma agora.
          </p>
          <RegisterWizard
            initialData={{
              email: normalized.tipo === "email" ? normalized.email ?? undefined : undefined,
              celular: normalized.tipo === "celular" ? normalized.celular ?? undefined : undefined,
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <Card className="w-full max-w-lg shadow-none border-0 md:shadow-xl md:border">
      {etapa === "identificar" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Palpite Tech</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Digite seu telefone ou e-mail para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleIdentificar} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="identificador" className="text-sm md:text-senior-base flex items-center gap-2">
                  <Icon className="h-4 w-4 md:h-5 md:w-5" />
                  Telefone ou E-mail
                </Label>
                <Input
                  id="identificador"
                  type="text"
                  placeholder="seu@email.com ou (16) 99999-9999"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading || !identificador.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>

              <div className="flex flex-col gap-2 md:gap-3 pt-1 md:pt-2">
                <Link to="/recuperar-senha" className="text-center text-sm md:text-senior-base text-primary underline underline-offset-4">
                  Resetar senha
                </Link>

                <button
                  type="button"
                  onClick={() => setEtapa("cadastro")}
                  className="text-center text-sm md:text-senior-base text-primary underline underline-offset-4"
                >
                  Criar Conta
                </button>

                <a
                  href={supportWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 text-sm md:text-senior-base text-[#25D366] hover:text-[#25D366]/80 h-10 md:h-12 px-4 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                  Preciso de Suporte
                </a>
              </div>
            </form>
          </CardContent>
        </>
      )}

      {etapa === "senha" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Digite sua senha</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Encontramos sua conta. Agora é só entrar.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleEntrar} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="senha" className="text-sm md:text-senior-base flex items-center gap-2">
                  <Lock className="h-4 w-4 md:h-5 md:w-5" />
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading || !senha.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="flex flex-col gap-2 md:gap-3">
                <Link to="/recuperar-senha" className="text-center text-sm md:text-senior-base text-primary underline underline-offset-4">
                  Resetar senha
                </Link>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setSenha("");
                    setResolvedEmail(null);
                    setEtapa("identificar");
                  }}
                  className="w-full h-10 md:h-12 text-sm md:text-senior-base"
                >
                  <ArrowLeft className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
}
