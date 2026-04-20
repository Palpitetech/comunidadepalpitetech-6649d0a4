import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, User, MessageCircle, ArrowRight, ArrowLeft, Phone, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Etapa = 
  | "email" 
  | "senha" 
  | "celular" 
  | "cadastro-nome" 
  | "cadastro-email" 
  | "cadastro-whatsapp" 
  | "cadastro-codigo"
  | "verificacao-email-pendente";

interface VerificationResult {
  exists: boolean;
  nome: string | null;
  email: string | null;
  type: string | null;
}

// Espelha a regra do edge function receive-lead
function validateCelularBR(value: string): { ok: boolean; normalized?: string; reason?: string } {
  const digits = value.replace(/\D/g, "");
  let normalized = digits;
  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    normalized = digits.substring(2);
  }
  if (normalized.length < 10 || normalized.length > 11) {
    return { ok: false, reason: "Celular precisa ter 10 ou 11 dígitos com DDD" };
  }
  const ddd = parseInt(normalized.substring(0, 2), 10);
  if (isNaN(ddd) || ddd < 11 || ddd > 99) {
    return { ok: false, reason: "DDD inválido" };
  }
  if (normalized.length === 11 && normalized[2] !== "9") {
    return { ok: false, reason: "Celular deve começar com 9 após o DDD" };
  }
  if (/^(\d)\1+$/.test(normalized)) {
    return { ok: false, reason: "Celular inválido" };
  }
  if (normalized === "12345678901" || normalized === "1234567890") {
    return { ok: false, reason: "Celular inválido" };
  }
  return { ok: true, normalized: `55${normalized}` };
}

function formatCelularMask(value: string): string {
  const n = value.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7, 11)}`;
}

export function LoginWizard() {
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [emailLogin, setEmailLogin] = useState(""); // Email retornado pelo RPC se achar por celular
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nomeUsuarioEncontrado, setNomeUsuarioEncontrado] = useState("");
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signInWithOtp, verifyOtp, updateProfile, profile, resetPassword } = useAuthContext();

  const supportWhatsApp = "https://wa.me/5516997175392";
  const senderEmail = "contato@mail.palpitetech.com.br";

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const inputLimpo = email.trim().toLowerCase();
    
    if (!inputLimpo) {
      toast({ title: "Email ou Celular obrigatório", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Tenta localizar por email ou celular (caso o usuário tenha digitado o celular no campo de email)
      const { data, error } = await supabase.rpc("verificar_existencia_usuario", { 
        p_email: inputLimpo.includes("@") ? inputLimpo : null,
        p_celular: !inputLimpo.includes("@") ? inputLimpo : null
      });

      if (error) throw error;

      const result = data as unknown as VerificationResult;

      if (result.exists) {
        const emailParaLogin = result.email || inputLimpo;
        setNomeUsuarioEncontrado(result.nome || "");
        setEmailLogin(emailParaLogin);

        // Verifica se o email já foi confirmado (lead pendente do webhook)
        const { data: perfil } = await supabase
          .from("perfis")
          .select("id, email_verificado, nome")
          .eq("email", emailParaLogin)
          .maybeSingle();

        if (perfil && perfil.email_verificado === false) {
          // Lead pendente — dispara OTP automaticamente e pula pra etapa de verificação
          setPendingUserId(perfil.id);
          await supabase.functions.invoke("enviar-codigo-email", {
            body: { 
              user_id: perfil.id, 
              email: emailParaLogin, 
              nome: perfil.nome || result.nome || "" 
            },
          });
          setEtapa("verificacao-email-pendente");
          toast({ 
            title: "Conta pendente de ativação", 
            description: "Enviamos um código de 6 dígitos pro seu email." 
          });
          return;
        }

        setEtapa("senha");
      } else {
        setEtapa("celular");
      }
    } catch (err) {
      toast({ title: "Erro ao verificar conta", description: "Tente novamente em instantes.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckCelular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!celular.trim()) {
      toast({ title: "Celular obrigatório", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("verificar_existencia_usuario", { 
        p_celular: celular.trim() 
      });

      if (error) throw error;

      const result = data as unknown as VerificationResult;

      if (result.exists) {
        setNomeUsuarioEncontrado(result.nome || "");
        setEmailLogin(result.email || "");
        setEtapa("senha");
      } else {
        setEtapa("cadastro-nome");
      }
    } catch (err) {
      toast({ title: "Erro ao verificar celular", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;

    setIsLoading(true);
    try {
      await signIn(emailLogin || email, password);
      toast({ title: "Sucesso!", description: "Você está logado." });
      const from = (location.state as any)?.from?.pathname || "/home";
      navigate(from, { replace: true });
    } catch (err) {
      toast({ title: "Erro no login", description: "Senha incorreta. Tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!emailLogin && !email) return;
    setIsLoading(true);
    try {
      await resetPassword(emailLogin || email);
      toast({ title: "Email enviado", description: "Verifique seu e-mail para resetar a senha." });
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível enviar o e-mail.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setEtapa("cadastro-email");
  };

  const handleRegisterEmail = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEtapa("cadastro-whatsapp");
  };

  const handleRegisterWhatsapp = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateCelularBR(whatsapp);
    if (!validation.ok) {
      toast({ title: "Celular inválido", description: validation.reason || "Use formato (DDD) 9XXXX-XXXX", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      // Dispara o OTP via email (Supabase criará o usuário)
      await signInWithOtp(email.trim().toLowerCase());
      setEtapa("cadastro-codigo");
      toast({ title: "Código enviado!", description: `Verifique seu e-mail ${email}.` });
    } catch (err) {
      toast({ title: "Erro ao cadastrar", description: "Verifique os dados e tente novamente.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (codigo.length < 6) return;

    const validation = validateCelularBR(whatsapp);
    if (!validation.ok) {
      toast({ title: "Celular inválido", description: validation.reason, variant: "destructive" });
      setEtapa("cadastro-whatsapp");
      return;
    }

    setIsLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), codigo);
      // Salva o mesmo número normalizado em celular E whatsapp pra evitar
      // que RequireCelularModal abra após cadastro novo
      await updateProfile({ 
        nome: nome.trim(), 
        celular: validation.normalized!,
        whatsapp: validation.normalized!,
      });
      toast({ title: "Conta criada!", description: "Bem-vindo ao Palpite Tech." });
      const from = (location.state as any)?.from?.pathname || "/home";
      navigate(from, { replace: true });
    } catch (err) {
      toast({ title: "Código inválido", description: "Verifique o código e tente novamente.", variant: "destructive" });
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

      // Email confirmado → trigger ativou trial 3 dias + role premium.
      // Como a conta foi criada via webhook (sem senha conhecida), enviamos reset
      // para o usuário criar senha e logar.
      await resetPassword(emailLogin || email);

      toast({ 
        title: "Conta ativada! 🎉", 
        description: "Trial de 3 dias liberado! Enviamos um link no seu email pra criar sua senha e acessar." 
      });
      setEtapa("email");
      setCodigo("");
      setPendingUserId(null);
    } catch (err: any) {
      toast({ 
        title: "Código inválido", 
        description: err?.message || "Verifique o código e tente novamente.", 
        variant: "destructive" 
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
          nome: nomeUsuarioEncontrado || "" 
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
                Digite seu Email para localizar seu Cadastro.
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
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading}>
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                  Localizar Cadastro
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
                  <Button type="button" variant="outline" className="h-11 md:h-14 px-4" onClick={() => setEtapa("email")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button type="submit" className="flex-1 h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Acessar Conta
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

      case "celular":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Não Localizamos!</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Não localizamos nenhum cadastro com esse Email, informe seu Celular:
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleCheckCelular} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="celular" className="text-sm md:text-senior-base flex items-center gap-2">
                    <Phone className="h-4 w-4 md:h-5 md:w-5" />
                    Celular
                  </Label>
                  <Input
                    id="celular"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={celular}
                    onChange={(e) => setCelular(e.target.value)}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-11 md:h-14 px-4" onClick={() => setEtapa("email")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button type="submit" className="flex-1 h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Localizar Cadastro
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

      case "cadastro-nome":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Vamos criar sua conta</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Para começar, qual seu nome?
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleRegisterName} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="reg-nome" className="text-sm md:text-senior-base flex items-center gap-2">
                    <User className="h-4 w-4 md:h-5 md:w-5" />
                    Seu Nome
                  </Label>
                  <Input
                    id="reg-nome"
                    type="text"
                    placeholder="Nome completo"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-11 md:h-14 px-4" onClick={() => setEtapa("celular")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button type="submit" className="flex-1 h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl">
                    Próximo Step
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

      case "cadastro-email":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Email de Contato</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Confirme seu melhor Email para receber acesso:
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleRegisterEmail} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="reg-email" className="text-sm md:text-senior-base flex items-center gap-2">
                    <Mail className="h-4 w-4 md:h-5 md:w-5" />
                    Email
                  </Label>
                  <Input
                    id="reg-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-11 md:h-14 px-4" onClick={() => setEtapa("cadastro-nome")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button type="submit" className="flex-1 h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl">
                    Próximo Step
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

      case "cadastro-whatsapp": {
        const whatsValidation = validateCelularBR(whatsapp);
        const showError = whatsapp.replace(/\D/g, "").length >= 10 && !whatsValidation.ok;
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Confirme seu celular</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Vamos enviar resultados e códigos de acesso pelo WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleRegisterWhatsapp} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="reg-whatsapp" className="text-sm md:text-senior-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                    Celular (WhatsApp)
                  </Label>
                  <Input
                    id="reg-whatsapp"
                    type="tel"
                    inputMode="numeric"
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(formatCelularMask(e.target.value))}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                  {showError && (
                    <p className="text-destructive text-xs">
                      {whatsValidation.reason || "Celular inválido. Use formato (DDD) 9XXXX-XXXX"}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-11 md:h-14 px-4" onClick={() => setEtapa("cadastro-email")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
                    disabled={isLoading || !whatsValidation.ok}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Enviar Código de Acesso
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );
      }

      case "cadastro-codigo":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Verifique seu Email</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Agora, vá até seu email, e informe o Código de autenticação. Verifique a página de Spam, promoções e outros. Você vai receber Email de: <span className="font-semibold text-primary">{senderEmail}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <div className="flex flex-col items-center space-y-6">
                <div className="space-y-2">
                  <Label className="text-sm md:text-senior-base block text-center">Código de 6 dígitos</Label>
                  <InputOTP 
                    maxLength={6} 
                    value={codigo} 
                    onChange={(val) => setCodigo(val)}
                    onComplete={() => handleVerifyCode()}
                    disabled={isLoading}
                  >
                    <InputOTPGroup className="gap-2">
                      <InputOTPSlot index={0} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={1} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={2} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={3} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={4} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={5} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Button 
                    onClick={() => handleVerifyCode()} 
                    className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" 
                    disabled={isLoading || codigo.length < 6}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <><ShieldCheck className="h-5 w-5 mr-2" /> Validar Acesso</>}
                  </Button>
                  <Button variant="ghost" className="text-xs" onClick={() => setEtapa("cadastro-whatsapp")}>
                    Voltar e corrigir dados
                  </Button>
                </div>
              </div>
            </CardContent>
          </>
        );

      case "verificacao-email-pendente":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Ative sua conta</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Sua conta ainda não foi ativada. Enviamos um código de 6 dígitos para <span className="font-semibold text-primary">{emailLogin || email}</span>. Confira a caixa de Spam, Promoções e Outros.
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
                      <InputOTPSlot index={0} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={1} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={2} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={3} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={4} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                      <InputOTPSlot index={5} className="h-12 w-10 md:h-14 md:w-12 border-2 text-xl" />
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                <div className="flex flex-col w-full gap-3">
                  <Button 
                    type="submit"
                    className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" 
                    disabled={isLoading || codigo.length < 6}
                  >
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <><ShieldCheck className="h-5 w-5 mr-2" /> Ativar conta e liberar trial</>}
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
                    onClick={() => { setEtapa("email"); setCodigo(""); setPendingUserId(null); }}
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