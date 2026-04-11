import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuthContext } from "@/contexts/AuthContext";
import { Loader2, Mail, ArrowLeft, CheckCircle, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

type Etapa = "email" | "codigo" | "completar-perfil";

export function LoginWizard() {
  const [etapa, setEtapa] = useState<Etapa>("email");
  const [email, setEmail] = useState("");
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(0);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { signInWithOtp, verifyOtp, updateProfile, profile } = useAuthContext();

  const supportWhatsApp = "https://wa.me/5516997175392";

  const handleEnviarCodigo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const emailLimpo = email.trim().toLowerCase();
    if (!emailLimpo || !emailLimpo.includes("@")) {
      toast({
        title: "E-mail inválido",
        description: "Por favor, insira um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await signInWithOtp(emailLimpo);
      setEtapa("codigo");
      setTempoRestante(60);
      toast({
        title: "Código enviado!",
        description: "Verifique sua caixa de entrada (e o spam).",
      });

      // Iniciar timer
      const timer = setInterval(() => {
        setTempoRestante((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível enviar o código";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerificarCodigo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (codigo.length !== 6) return;

    setIsLoading(true);
    try {
      const { session } = await verifyOtp(email.trim().toLowerCase(), codigo);
      
      if (session) {
        toast({ title: "Sucesso!", description: "Você está logado." });
        
        // Se o perfil não tiver nome, pede para completar
        // Mas o hook useAuth leva um tempo para carregar o perfil
        // Vou verificar se o nome está vazio no objeto retornado se possível
        // No Supabase, se for novo usuário, o perfil pode demorar
        setEtapa("completar-perfil");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Código inválido ou expirado";
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompletarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    setIsLoading(true);
    try {
      await updateProfile({ nome: nome.trim() });
      toast({ title: "Perfil atualizado!", description: "Bem-vindo ao Palpite Tech." });
      navigate("/home", { replace: true });
    } catch (err) {
      toast({ title: "Erro", description: "Não foi possível salvar seu nome.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  // Se já tiver perfil com nome, redireciona
  if (etapa === "completar-perfil" && profile?.nome) {
    navigate("/home", { replace: true });
    return null;
  }

  return (
    <Card className="w-full max-w-lg shadow-none border-0 md:shadow-xl md:border">
      {etapa === "email" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Palpite Tech</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Digite seu e-mail para receber um código de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleEnviarCodigo} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="email" className="text-sm md:text-senior-base flex items-center gap-2">
                  <Mail className="h-4 w-4 md:h-5 md:w-5" />
                  Seu E-mail
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

              <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading || !email.trim()}>
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Enviando código...
                  </>
                ) : (
                  "Receber Código"
                )}
              </Button>

              <div className="flex flex-col gap-2 md:gap-3 pt-1 md:pt-2">
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

      {etapa === "codigo" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Digite o código</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Enviamos um código para <strong>{email}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6 space-y-6">
            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={codigo}
                onChange={setCodigo}
                onComplete={() => handleVerificarCodigo()}
                disabled={isLoading}
              >
                <InputOTPGroup className="gap-2">
                  {[0, 1, 2, 3, 4, 5].map((index) => (
                    <InputOTPSlot
                      key={index}
                      index={index}
                      className="w-10 h-12 md:w-14 md:h-16 text-xl md:text-3xl font-bold border-2 rounded-xl"
                    />
                  ))}
                </InputOTPGroup>
              </InputOTP>
            </div>

            <Button
              onClick={() => handleVerificarCodigo()}
              className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl"
              disabled={isLoading || codigo.length !== 6}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Verificando...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5 mr-2" />
                  Entrar
                </>
              )}
            </Button>

            <div className="flex flex-col gap-2">
              <Button
                variant="ghost"
                onClick={handleEnviarCodigo}
                disabled={isLoading || tempoRestante > 0}
                className="w-full h-10 md:h-12 text-sm md:text-senior-base"
              >
                {tempoRestante > 0 ? `Reenviar código em ${tempoRestante}s` : "Reenviar código"}
              </Button>
              <Button
                variant="ghost"
                onClick={() => setEtapa("email")}
                className="w-full h-10 md:h-12 text-sm md:text-senior-base"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Alterar e-mail
              </Button>
            </div>
          </CardContent>
        </>
      )}

      {etapa === "completar-perfil" && (
        <>
          <CardHeader className="text-center pb-4 md:pb-6 px-4 md:px-6">
            <CardTitle className="text-xl md:text-senior-2xl">Quase lá!</CardTitle>
            <CardDescription className="text-sm md:text-senior-base">
              Como podemos te chamar?
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 md:px-6">
            <form onSubmit={handleCompletarPerfil} className="space-y-4 md:space-y-6">
              <div className="space-y-1.5 md:space-y-2">
                <Label htmlFor="nome" className="text-sm md:text-senior-base">
                  Seu Nome
                </Label>
                <Input
                  id="nome"
                  type="text"
                  placeholder="Seu nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="h-11 md:h-14 text-sm md:text-lg px-3 md:px-4 rounded-lg md:rounded-xl border-2 focus:border-primary"
                  autoFocus
                  required
                />
              </div>

              <Button type="submit" className="w-full h-11 md:h-14 text-base md:text-lg font-semibold rounded-xl" disabled={isLoading || !nome.trim()}>
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Concluir Cadastro"
                )}
              </Button>
            </form>
          </CardContent>
        </>
      )}
    </Card>
  );
}
