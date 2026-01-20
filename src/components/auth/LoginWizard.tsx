import { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Lock, ArrowLeft, Phone, Mail, LifeBuoy } from "lucide-react";
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

  const supportHref = "tel:+5516997175392";

  const handleIdentificar = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = identificador.trim();
    if (!input) return;

    // Validação rápida no client (o backend valida de novo)
    if (normalized.tipo === "celular") {
      const d = normalized.celular || "";
      const ok = d.length === 10 || d.length === 11 || (d.length >= 12 && d.startsWith("55"));
      if (!ok) {
        toast({
          title: "Telefone inválido",
          description: "Digite com DDD. Ex: (16) 99999-9999",
          variant: "destructive",
        });
        return;
      }
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("identificar-conta", {
        body: { identificador: input },
      });
      if (error) throw error;

      if (data?.exists) {
        if (!data?.email) {
          toast({
            title: "Conta encontrada",
            description:
              "Precisamos do seu e-mail para entrar. Se precisar, chame o suporte.",
            variant: "destructive",
          });
          return;
        }
        setResolvedEmail(String(data.email));
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
      navigate("/", { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "E-mail/telefone ou senha inválidos";
      toast({ title: "Não foi possível entrar", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-xl">
      {etapa === "identificar" && (
        <>
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-senior-2xl">Palpite Tech</CardTitle>
            <CardDescription className="text-senior-base">
              Digite seu telefone ou e-mail para continuar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleIdentificar} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="identificador" className="text-senior-base flex items-center gap-2">
                  <Icon className="h-5 w-5" />
                  Telefone ou E-mail
                </Label>
                <Input
                  id="identificador"
                  type="text"
                  placeholder="seu@email.com ou (16) 99999-9999"
                  value={identificador}
                  onChange={(e) => setIdentificador(e.target.value)}
                  className="input-senior"
                  autoFocus
                />
              </div>

              <Button type="submit" className="btn-senior w-full" disabled={isLoading || !identificador.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Verificando...
                  </>
                ) : (
                  "Continuar"
                )}
              </Button>

              <div className="flex flex-col gap-3 pt-2">
                <Link to="/recuperar-senha" className="text-center text-senior-base text-primary underline underline-offset-4">
                  Resetar senha
                </Link>

                <a
                  href={supportHref}
                  className="inline-flex items-center justify-center gap-2 text-senior-base text-muted-foreground hover:text-foreground"
                >
                  <LifeBuoy className="h-5 w-5" />
                  Chamar no Suporte (16) 99717-5392
                </a>
              </div>
            </form>
          </CardContent>
        </>
      )}

      {etapa === "senha" && (
        <>
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-senior-2xl">Digite sua senha</CardTitle>
            <CardDescription className="text-senior-base">
              Encontramos sua conta. Agora é só entrar.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEntrar} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="senha" className="text-senior-base flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Senha
                </Label>
                <Input
                  id="senha"
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="input-senior"
                  autoFocus
                />
              </div>

              <Button type="submit" className="btn-senior w-full" disabled={isLoading || !senha.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>

              <div className="flex flex-col gap-3">
                <Link to="/recuperar-senha" className="text-center text-senior-base text-primary underline underline-offset-4">
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
                  className="w-full h-12 text-senior-base"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Voltar
                </Button>
              </div>
            </form>
          </CardContent>
        </>
      )}

      {etapa === "cadastro" && (
        <div className="p-1">
          <div className="px-5 pt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setEtapa("identificar")}
              className="h-12 text-senior-base"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Voltar
            </Button>
          </div>
          <div className="px-6 pb-6">
            <p className="text-senior-base text-muted-foreground mb-4">
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
      )}
    </Card>
  );
}
