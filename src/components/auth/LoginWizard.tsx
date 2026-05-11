import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, MessageCircle, ArrowLeft, ShieldCheck, UserPlus, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Etapa = "email" | "senha" | "nao-encontrado" | "verificacao-email-pendente";

interface VerificationResult {
  exists: boolean;
  nome: string | null;
  email: string | null;
  type: string | null;
}

export function LoginWizard() {
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [emailLogin, setEmailLogin] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nomeUsuarioEncontrado, setNomeUsuarioEncontrado] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn } = useAuthContext();

  const supportWhatsApp = "https://wa.me/5516997175392";
  const senderEmail = "contato@mail.palpitetech.com.br";

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputLimpo = email.trim().toLowerCase();

    if (!inputLimpo || !inputLimpo.includes("@")) {
      toast({ title: "Informe um e-mail válido", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("verificar_existencia_usuario", {
        p_email: inputLimpo,
        p_celular: null,
      });

      if (error) throw error;

      const result = data as unknown as VerificationResult;

      if (result.exists) {
        const emailParaLogin = result.email || inputLimpo;
        setNomeUsuarioEncontrado(result.nome || "");
        setEmailLogin(emailParaLogin);

        // Se a conta existe mas o email ainda não foi verificado (lead pendente do webhook),
        // dispara OTP automaticamente para ativação.
        const { data: perfil } = await supabase
          .from("perfis")
          .select("id, email_verificado, nome")
          .eq("email", emailParaLogin)
          .maybeSingle();

        if (perfil && perfil.email_verificado === false) {
          setPendingUserId(perfil.id);
          await supabase.functions.invoke("enviar-codigo-email", {
            body: {
              user_id: perfil.id,
              email: emailParaLogin,
              nome: perfil.nome || result.nome || "",
            },
          });
          setEtapa("verificacao-email-pendente");
          toast({
            title: "Conta pendente de ativação",
            description: "Enviamos um código de 6 dígitos pro seu email.",
          });
          return;
        }

        setEtapa("senha");
      } else {
        // Não encontrado — oferece verificar email ou criar conta
        setEtapa("nao-encontrado");
      }
    } catch (err) {
      toast({
        title: "Erro ao verificar conta",
        description: "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast({ title: "Informe sua senha", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      await signIn(emailLogin || email, password);
      toast({ title: "Sucesso!", description: "Você está logado." });
      const from = (location.state as any)?.from?.pathname || "/home";
      navigate(from, { replace: true });
    } catch (err) {
      toast({
        title: "Senha incorreta",
        description: "Verifique sua senha e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPendingEmail = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (codigo.length < 6 || !pendingUserId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("verificar-codigo", {
        body: { user_id: pendingUserId, codigo, tipo: "email" },
      });

      if (error || !data?.sucesso) {
        throw new Error(data?.erro || "Código inválido");
      }

      // Email confirmado → trigger libera trial. Como conta veio de webhook (sem senha conhecida),
      // redefinimos a senha para 12345678.
      const identificador = emailLogin || email;
      await supabase.functions.invoke("recuperar-senha", {
        body: { identificador },
      });

      toast({
        title: "Conta ativada! 🎉",
        description: "Trial liberado! Sua senha foi definida como 12345678. Faça login para acessar.",
      });
      setEtapa("email");
      setCodigo("");
      setPendingUserId(null);
    } catch (err: any) {
      toast({
        title: "Código inválido",
        description: err?.message || "Verifique o código e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendPendingCode = async () => {
    if (!pendingUserId) return;
    setIsLoading(true);
    try {
      await supabase.functions.invoke("enviar-codigo-email", {
        body: {
          user_id: pendingUserId,
          email: emailLogin || email,
          nome: nomeUsuarioEncontrado || "",
        },
      });
      toast({ title: "Código reenviado", description: "Verifique seu email." });
      setCodigo("");
    } catch (err) {
      toast({ title: "Erro ao reenviar", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (etapa) {
      case "email":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Acessar Conta</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Digite seu e-mail para entrar.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleCheckEmail} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="email" className="text-sm md:text-senior-base flex items-center gap-2">
                    <Mail className="h-4 w-4 md:h-5 md:w-5" />
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
                  disabled={isLoading}
                >
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Continuar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/cadastro")}
                  className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
                >
                  <UserPlus className="h-5 w-5 mr-2" />
                  Criar nova conta
                </Button>
                <a
                  href={supportWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full gap-2 text-sm md:text-senior-base text-[#25D366] hover:text-[#25D366]/80 h-10 transition-colors"
                >
                  <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                  Preciso de Suporte
                </a>
              </form>
            </CardContent>
          </>
        );

      case "senha":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Olá {nomeUsuarioEncontrado || "Usuário"}</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Digite sua senha para acessar sua conta
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleLogin} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="password" className="text-sm md:text-senior-base flex items-center gap-2">
                    <Lock className="h-4 w-4 md:h-5 md:w-5" />
                    Senha
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                  <Button
                    type="button"
                    variant="link"
                    onClick={handleForgotPassword}
                    className="p-0 h-auto text-xs text-muted-foreground hover:text-primary"
                  >
                    Esqueci minha senha
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="h-11 md:h-14 px-4"
                    onClick={() => { setEtapa("email"); setPassword(""); }}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Acessar Conta
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

      case "nao-encontrado":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <div className="mx-auto w-14 h-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-2">
                <AlertCircle className="h-7 w-7 text-amber-600" />
              </div>
              <CardTitle className="text-xl md:text-senior-2xl">Não encontramos sua conta</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Nenhum cadastro encontrado com <span className="font-semibold text-foreground">{email}</span>.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6 space-y-4">
              <div className="rounded-lg bg-muted/50 border border-border p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground mb-1">O que fazer agora?</p>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Verifique se digitou o e-mail corretamente</li>
                  <li>Se não tem conta, crie uma agora em poucos passos</li>
                </ul>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={() => { setEtapa("email"); }}
                className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                Verificar e-mail novamente
              </Button>

              <Button
                type="button"
                onClick={() => navigate("/cadastro")}
                className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Criar nova conta
              </Button>

              <a
                href={supportWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center w-full gap-2 text-sm text-[#25D366] hover:text-[#25D366]/80 h-10 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Suporte
              </a>
            </CardContent>
          </>
        );

      case "verificacao-email-pendente":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Ative sua conta</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Sua conta ainda não foi ativada. Enviamos um código de 6 dígitos para{" "}
                <span className="font-semibold text-primary">{emailLogin || email}</span>. Confira a caixa de Spam, Promoções e Outros. Você vai receber um e-mail de:{" "}
                <span className="font-semibold">{senderEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleVerifyPendingEmail} className="flex flex-col items-center space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm md:text-senior-base block text-center">Código de 6 dígitos</Label>
                  <InputOTP
                    maxLength={6}
                    value={codigo}
                    onChange={(val) => setCodigo(val)}
                    onComplete={() => handleVerifyPendingEmail()}
                    disabled={isLoading}
                  >
                    <InputOTPGroup className="gap-2">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <InputOTPSlot key={i} index={i} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Button
                    type="submit"
                    className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
                    disabled={isLoading || codigo.length < 6}
                  >
                    {isLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    ) : (
                      <>
                        <ShieldCheck className="h-5 w-5 mr-2" /> Ativar conta e liberar trial
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={handleResendPendingCode}
                    disabled={isLoading}
                  >
                    Não recebi — reenviar código
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-xs"
                    onClick={() => {
                      setEtapa("email");
                      setCodigo("");
                      setPendingUserId(null);
                    }}
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="w-full max-w-lg shadow-none border-0 md:shadow-xl md:border">
      {renderStep()}
    </Card>
  );
}
