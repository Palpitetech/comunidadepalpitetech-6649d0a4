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
  | "cadastro-codigo";

interface VerificationResult {
  exists: boolean;
  nome: string | null;
  email: string | null;
  type: string | null;
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
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { signIn, signInWithOtp, verifyOtp, updateProfile, profile, resetPassword } = useAuthContext();

  const supportWhatsApp = "https://wa.me/5516997175392";
  const senderEmail = "contato@mail.palpitetech.com.br";

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    
    if (!emailLimpo) {
      toast({ title: "Email obrigatório", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc("verificar_existencia_usuario", { 
        p_email: emailLimpo 
      });

      if (error) throw error;

      const result = data as unknown as VerificationResult;

      if (result.exists) {
        setNomeUsuarioEncontrado(result.nome || "");
        setEmailLogin(result.email || emailLimpo);
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
    if (!whatsapp.trim()) return;

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

    setIsLoading(true);
    try {
      await verifyOtp(email.trim().toLowerCase(), codigo);
      // Após verificar, atualiza o perfil com nome, celular e whatsapp
      await updateProfile({ 
        nome: nome.trim(), 
        celular: celular.trim(),
        whatsapp: whatsapp.trim()
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

      case "cadastro-whatsapp":
        return (
          <>
            <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
              <CardTitle className="text-xl md:text-senior-2xl">Quase lá!</CardTitle>
              <CardDescription className="text-sm md:text-senior-base">
                Vamos enviar um convite para você receber diariamente os resultados no seu whatsapp.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-4 md:px-6">
              <form onSubmit={handleRegisterWhatsapp} className="space-y-4 md:space-y-6">
                <div className="space-y-1.5 md:space-y-2">
                  <Label htmlFor="reg-whatsapp" className="text-sm md:text-senior-base flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 md:h-5 md:w-5" />
                    Informe seu Whatsapp
                  </Label>
                  <Input
                    id="reg-whatsapp"
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                    autoFocus
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="h-11 md:h-14 px-4" onClick={() => setEtapa("cadastro-email")}>
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <Button type="submit" className="flex-1 h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : null}
                    Enviar Código de Acesso
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        );

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